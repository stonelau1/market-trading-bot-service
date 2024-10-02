import {
  GenericContainer,
  Network,
  StartedNetwork,
  StartedTestContainer,
  Wait,
} from 'testcontainers'
import { redisClientMap } from './src/lib/redis'

jest.setTimeout(60_000)

let container: StartedTestContainer
let network: StartedNetwork

beforeEach(async () => {
  require('uuid').__reset()
  for (const [, redis] of Object.entries(redisClientMap)) {
    await redis?.flushall()
  }
})
afterAll(async () => {
  for (const [, redis] of Object.entries(redisClientMap)) {
    await redis?.disconnect()
    await redis?.quit()
  }
  await container?.stop()
  await network?.stop()
})

beforeAll(async () => {
  const [urls, natMap] = await setupRedis({
    withCluster: process.env.REDIS_CLUSTER_MODE_ENABLED === 'true',
  })

  process.env.REDIS_URLS = urls
  process.env.REDIS_CONFIG_NATMAP = JSON.stringify(natMap)
})

async function setupRedis(
  opts: { withCluster: boolean } = { withCluster: false }
) {
  // "grokzen/redis-cluster" exposes 6 Redis nodes
  // on ports 7000 - 7005
  const ports = opts.withCluster ? [7000, 7001, 7002, 7003, 7004, 7005] : [6379]

  // we create a new Docker network so that we have a consistent way
  // to retrieve the internal addresses of the Redis nodes to build
  // the NAT map
  network = await new Network().start()

  container = await new GenericContainer(
    opts.withCluster
      ? 'public.ecr.aws/j6k8m8j1/grokzen/redis-cluster:7.0.6'
      : 'public.ecr.aws/docker/library/redis:7.2.1-alpine'
  )
    // exposes each of the internal Docker ports listed
    // in `ports` to the host machine
    .withExposedPorts(...ports)
    .withNetworkMode(network.getName())
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start()

  const networkIpAddress = container.getIpAddress(network.getName())

  const dockerHost = container.getHost()
  const hosts = ports.map((port) => {
    return { host: dockerHost, port: container.getMappedPort(port) }
  })

  /**
   * {
   *   "192.168.16.2:7000": { host: "127.0.0.1", port: 55305 },
   *   "192.168.16.2:7001": { host: "127.0.0.1", port: 55306 },
   *   ...
   * }
   */
  const natMap = ports.reduce((map, port) => {
    const hostPort = container.getMappedPort(port)
    const internalAddress = `${networkIpAddress}:${port}`
    map[internalAddress] = { host: dockerHost, port: hostPort }
    return map
  }, <any>{})

  const urls = hosts.map(({ host, port }) => `${host}:${port}`).join(',')
  return [urls, natMap]
}
