import Joi from 'joi'
import { ddbDocClient } from './lib/db-client'
import {
  GetItemCommand,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { insertDocument } from './lib/es-client'

export function validateEnvVars(schema: Joi.ObjectSchema) {
  const { error } = schema.validate(process.env)

  if (error) {
    throw new Error(`Env Var Validation Error: ${error}`)
  }
}

const envVarsSchema = Joi.object({
  REWARDS_TABLE: Joi.string().required(),
  USERS_TABLE: Joi.string().required(),
  AWS_REGION: Joi.string().required(),
  DOMAIN_ENDPOINT: Joi.string().required(),
  AWS_NODEJS_CONNECTION_REUSE_ENABLED: Joi.number().required(),
}).unknown()

async function getUser(userId: string) {
  const command = new GetItemCommand({
    TableName: process.env.USERS_TABLE!,
    Key: {
      id: {
        S: userId,
      },
    },
  })
  const { Item: account } = await ddbDocClient.send(command)
  return unmarshall(account!)
}

async function main() {
  validateEnvVars(envVarsSchema)

  const queryOptions: ScanCommandInput = {
    TableName: process.env.REWARDS_TABLE!,
    FilterExpression: '#type = :type',
    ExpressionAttributeNames: {
      '#type': '_type',
    },
    ExpressionAttributeValues: {
      ':type': { S: 'ACCOUNT' },
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
        const account = unmarshall(item)
        const user = await getUser(account.id)

        if (!user) {
          throw new Error(`User not found: ${account.id}`)
        }
        const data = {
          totalXP: account.xp,
          userId: account.id,
          username: user.username,
          deactivated: user.deactivated,
        }

        await insertDocument(`accounts-xp`, account.id, data)
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
