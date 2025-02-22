#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { AmplifyStack } from "../lib/amplify-stack"
import { getConfig } from "../config/config"
import { VpcStack } from "../lib/vpc-stack"
import { RdsStack } from "../lib/rds-stack"
import { BackendAppStack, FrontendAppStack } from "../lib/app-stack"

const app = new cdk.App()

const stages = ["prd", "stg"]
const stage = app.node.tryGetContext("stage")

if (!stages.includes(stage)) {
  throw new Error(`stage must be one of ${stages.join(", ")}`)
}

const config = getConfig(stage)

const vpc = new VpcStack(
  app,
  `${config.appName}Vpc`,
  {
    description: "VPC for the application",
    env: {
      account: config.aws.account,
      region: config.aws.region,
    },
  },
  { config }
)

const rds = new RdsStack(
  app,
  `${stage}${config.appName}Rds`,
  {
    description: "RDS for the application",
    env: {
      account: config.aws.account,
      region: config.aws.region,
    },
  },
  {
    vpc: vpc.vpc,
    ec2BastionSecurityGroup: vpc.ec2BastionSecurityGroup,
    config,
  }
)

new BackendAppStack(
  app,
  `${stage}${config.appName}BackendApp`,
  {
    description: "Backend App Runner for the application",
    env: {
      account: config.aws.account,
      region: config.aws.region,
    },
  },
  {
    vpc: vpc.vpc,
    config,
    appRunnerSecurityGroup: rds.backendAppRunnerSG,
  }
)

new FrontendAppStack(
  app,
  `${stage}${config.appName}FrontendApp`,
  {
    description: "Frontend App Runner for the application",
    env: {
      account: config.aws.account,
      region: config.aws.region,
    },
  },
  {
    vpc: vpc.vpc,
    config,
    appRunnerSecurityGroup: rds.frontendAppRunnerSG,
  }
)

// new AmplifyStack(
//   app,
//   `${stage}${config.appName}Amplify`,
//   {
//     description: "Amplify for the application",
//     env: {
//       account: config.aws.account,
//       region: config.aws.region,
//     },
//   },
//   {
//     vpc: vpc.vpc,
//     dbSecurityGroup: rds.dbSG,
//   }
// )
