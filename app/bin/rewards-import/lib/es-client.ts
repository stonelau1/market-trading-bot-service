import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

export const getClient = () => {
  return new Client({
    ...AwsSigv4Signer({
      region: process.env.AWS_REGION!,
      service: 'es',
      getCredentials: () => {
        const credentialsProvider = defaultProvider()
        return credentialsProvider()
      },
    }),
    node: `https://${process.env.DOMAIN_ENDPOINT}`,
  })
}

export const insertDocument = async (
  index: string,
  id: string,
  document: object,
  client?: Client
) => {
  if (!client) {
    client = getClient()
  }

  if (!(await client.indices.exists({ index }))) {
    await client.indices.create({ index })
  }

  await client.index({
    index,
    id,
    body: document,
    refresh: true,
  })
}
