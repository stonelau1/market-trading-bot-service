import nock from 'nock'

process.env.AWS_REGION = 'eu-central-1'
process.env.AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID'
process.env.AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY'
process.env.AWS_SESSION_TOKEN = 'AWS_SESSION_TOKEN'

process.env.FIREBLOCKS_API_KEY_NAME = 'FIREBLOCKS_API_KEY_NAME'
process.env.FIREBLOCKS_API_SECRET_NAME = 'FIREBLOCKS_API_SECRET_NAME'

jest.setTimeout(60_000)

beforeEach(async () => {
  require('uuid').__reset()
  nock.cleanAll()
  nock('https://monitoring.eu-central-1.amazonaws.com:443').post('/').reply(200)
})

beforeAll(async () => {
  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)
})
