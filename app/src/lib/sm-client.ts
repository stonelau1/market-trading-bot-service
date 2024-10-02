import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'

let smClient: SecretsManagerClient

function getSmClient() {
  if (smClient) {
    return smClient
  }

  smClient = new SecretsManagerClient({
    region: process.env.AWS_REGION,
  })

  return smClient
}

const cache = new Map<string, unknown>()

export async function getSecretValue<T>(secretId: string) {
  if (cache.has(secretId)) {
    return cache.get(secretId) as T
  }

  const { SecretString } = await getSmClient().send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  )

  if (!SecretString) {
    throw new Error(`No value for id (${secretId})`)
  }

  const value = SecretString

  cache.set(secretId, value)

  return value
}
