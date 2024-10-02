import {
  BuildSpec,
  EventAction,
  FilterGroup,
  LinuxBuildImage,
  Project,
  Source,
} from 'aws-cdk-lib/aws-codebuild'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface IMarketTradingBotServiceBuildStackProps extends StackProps {
  stage: string
}

export class MarketTradingBotServiceBuildStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: IMarketTradingBotServiceBuildStackProps
  ) {
    super(scope, id, props)

    const owner = this.node.tryGetContext('github_alias')
    const repo = this.node.tryGetContext('github_repo')
    const branch = this.node.tryGetContext('github_branch')

    const source = Source.gitHub({
      owner,
      repo,
      webhook: true,
      webhookFilters: [
        FilterGroup.inEventOf(
          EventAction.PULL_REQUEST_CREATED,
          EventAction.PULL_REQUEST_UPDATED
        ).andBaseBranchIs(branch),
      ],
    })

    // eslint-disable-next-line no-new
    new Project(this, 'MarketTradingBotServiceBuildProject', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'yarn',
              'export NODE_OPTIONS="--max-old-space-size=4096"',
              'yarn workspace app test',
              'yarn workspace infra cdk synth',
            ],
          },
        },
      }),
      source,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
    })
  }
}
