import Redis, { Cluster } from 'ioredis'
import { pick } from 'effect/Struct'
import { pipe } from 'effect/Function'

type RedisContext_ = Parameters<typeof createClient>[0]
export interface RedisContext extends RedisContext_ {}

export const redisClientMap = new Map<string, Redis | Cluster>()
/**
 * Get a singleton Redis client
 * @param context  Redis context object (see below)
 * @param context.redisUrls  Redis URLS (comma-separated) e.g redis://localhost:6379,rediss://localhost:6380,localhost:6381
 * @param context.tls  Whether to use TLS
 * @param context.cluster  Whether to use cluster
 * @param context.redisNatMap  Redis NAT map
 * @returns Redis client
 */
export function getClient(context: RedisContext) {
  const key = JSON.stringify(pipe(context, pick('redisUrls', 'tls', 'cluster')))
  return (
    redisClientMap.get(key) ??
    redisClientMap.set(key, createClient(context)).get(key)!
  )
}

function createClient(context: {
  redisUrls: string
  tls?: boolean
  cluster?: boolean
}) {
  // For testing purposes e.g when using Docker Compose
  const natMap = JSON.parse(process.env.REDIS_CONFIG_NATMAP ?? null!)
  if (context.cluster) {
    return new Cluster(splitUrls(context.redisUrls), {
      natMap,
      enableAutoPipelining: true,
      slotsRefreshTimeout: 30_000,
      redisOptions: {
        tls: context.tls
          ? {
              checkServerIdentity: (/* host, cert */) => {
                // skip certificate hostname validation
                return undefined
              },
            }
          : undefined,
      },
    })
  } else {
    const [{ host, port }] = splitUrls(context.redisUrls)
    return new Redis(port, host, {
      tls: context.tls
        ? {
            checkServerIdentity: (/* host, cert */) => {
              // skip certificate hostname validation
              return undefined
            },
          }
        : undefined,
    })
  }
}

function splitUrls(redisUrls: string) {
  return redisUrls.split(',').map((url) => {
    const noProtocolUrl = url.split('//').pop() || ''
    const [host, port] = noProtocolUrl.split(':')
    return {
      host,
      port: Number(port) || 6379,
    }
  })
}
