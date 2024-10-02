import Joi from 'joi'
import { ddbDocClient } from './lib/db-client'
import {
  GetItemCommand,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { getClient, insertDocument } from './lib/es-client'

export function validateEnvVars(schema: Joi.ObjectSchema) {
  const { error } = schema.validate(process.env)

  if (error) {
    throw new Error(`Env Var Validation Error: ${error}`)
  }
}

const envVarsSchema = Joi.object({
  REWARDS_TABLE: Joi.string().required(),
  AWS_REGION: Joi.string().required(),
  DOMAIN_ENDPOINT: Joi.string().required(),
  AWS_NODEJS_CONNECTION_REUSE_ENABLED: Joi.number().required(),
}).unknown()

async function getAccount(userId: string) {
  const command = new GetItemCommand({
    TableName: process.env.REWARDS_TABLE!,
    Key: {
      _ph: {
        S: `ACCOUNT#${userId}`,
      },
      _ps: {
        S: `ACCOUNT#${userId}`,
      },
    },
  })
  const { Item: account } = await ddbDocClient.send(command)
  return unmarshall(account!)
}
async function main() {
  validateEnvVars(envVarsSchema)

  const client = getClient()

  const queryOptions: ScanCommandInput = {
    TableName: process.env.REWARDS_TABLE!,
    FilterExpression: '#type = :type',
    ExpressionAttributeNames: {
      '#type': '_type',
    },
    ExpressionAttributeValues: {
      ':type': { S: 'REWARD' },
    },
  }

  let items
  do {
    items = await ddbDocClient.send(new ScanCommand(queryOptions))

    if (!items.Items) {
      return
    }

    for (const item of items.Items) {
      try {
        const reward = unmarshall(item)
        if (reward.userId) {
          const account = await getAccount(reward.userId)
          await insertDocument(
            `rewards-${reward.timestamp.split('-')[0]}-${
              reward.timestamp.split('-')[1]
            }`,
            reward.id,
            {
              id: reward.id,
              userId: reward.userId,
              username: account.username ? account.username : account.userName,
              reward: reward.reward,
              timestamp: reward.timestamp,
              reason: reward.details,
            },
            client
          )
        }
      } catch (error) {
        console.error(`error`, {
          item,
          error,
        })
      }
    }

    queryOptions.ExclusiveStartKey = items.LastEvaluatedKey
  } while (typeof items.LastEvaluatedKey !== 'undefined')
}

main().catch(console.error)
