import { Duration } from 'aws-cdk-lib'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

export function createQueue(
  construct: Construct,
  id: string,
  maxReceiveCount = 5
) {
  const deadLetterQueue = new Queue(construct, `${id}Dead`)

  return new Queue(construct, id, {
    visibilityTimeout: Duration.minutes(5),
    deadLetterQueue: {
      queue: deadLetterQueue,
      maxReceiveCount,
    },
  })
}
