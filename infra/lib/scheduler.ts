import { Duration } from 'aws-cdk-lib'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Construct } from 'constructs'
import { addAlertingOnErrors } from './alerting'

export interface ISchedulerProps {
  architecture?: Architecture
  entry: string
  timeout?: Duration
  memorySize?: number
  environment?: Record<string, string>
  alarmsTopic: Topic
  schedule: Schedule
}

export class Scheduler extends Construct {
  public readonly handler: NodejsFunction
  public readonly rule: Rule

  constructor(scope: Construct, id: string, props: ISchedulerProps) {
    super(scope, id)

    if (!props.environment) {
      props.environment = {}
    }
    props.environment.POWERTOOLS_SERVICE_NAME = id
    props.environment.NODE_OPTIONS = '--enable-source-maps'

    const handler = (this.handler = new NodejsFunction(this, `${id}Lambda`, {
      runtime: Runtime.NODEJS_20_X,
      architecture: props.architecture || Architecture.ARM_64,
      entry: props.entry,
      awsSdkConnectionReuse: true,
      handler: 'handler',
      bundling: {
        sourceMap: true,
        sourceMapMode: SourceMapMode.DEFAULT,
      },
      timeout: props.timeout || Duration.seconds(360),
      memorySize: props.memorySize || 128,
      environment: props.environment,
    }))

    const rule = (this.rule = new Rule(this, `${id}Rule`, {
      schedule: props.schedule,
    }))

    rule.addTarget(new LambdaFunction(handler))
    addAlertingOnErrors(this, `${id}Lambda`, handler, props.alarmsTopic)
  }
}
