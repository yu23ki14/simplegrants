import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Construct } from "constructs"
import { getConfig } from "../config/config"
import { BackendAppRunner } from "../construct/apprunner"

interface AppProps {
  vpc: ec2.IVpc
  config: ReturnType<typeof getConfig>
  appRunnerSecurityGroup: ec2.SecurityGroup
}

export class BackendAppStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    appProps: AppProps
  ) {
    super(scope, id, props)

    const { vpc, appRunnerSecurityGroup, config } = appProps

    new BackendAppRunner(this, id, {
      vpc,
      appRunnerSecurityGroup,
      config,
    })
  }
}
