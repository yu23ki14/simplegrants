import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as iam from "aws-cdk-lib/aws-iam"
import * as apprunner from "aws-cdk-lib/aws-apprunner"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import { Construct } from "constructs"
import { getConfig } from "../config/config"
import { S3 } from "./s3"

interface AppRunnerProps {
  vpc: ec2.IVpc
  appRunnerSecurityGroup: ec2.SecurityGroup
  config: ReturnType<typeof getConfig>
}

export class BackendAppRunner extends Construct {
  constructor(scope: Construct, id: string, props: AppRunnerProps) {
    super(scope, id)

    const { vpc, appRunnerSecurityGroup, config } = props

    const instanceRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.appName}-AppRunner-Role`,
      {
        roleName: `${props.config.stage}-${props.config.appName}-AppRunner-Role`,
        assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
      }
    )

    const accessRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.appName}-AppRunner-AccessRole`,
      {
        roleName: `${props.config.stage}-${props.config.appName}-AppRunner-AccessRole`,
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      }
    )
    accessRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppRunnerServicePolicyForECRAccess"
      )
    )

    const secretsDB = secretsmanager.Secret.fromSecretNameV2(
      scope,
      `${
        props.config.stage
      }${props.config.appName.toLowerCase()}Rds-db-secret-${
        props.config.database.secret_suffix
      }`,
      `${
        props.config.stage
      }${props.config.appName.toLowerCase()}Rds-db-secret-${
        props.config.database.secret_suffix
      }`
    )

    const vpcConnector = new apprunner.CfnVpcConnector(
      scope,
      `${props.config.stage}-${props.config.appName}-AppRunner-VpcConnector`,
      {
        subnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
        }).subnetIds,
        securityGroups: [appRunnerSecurityGroup.securityGroupId],
        vpcConnectorName: `${
          props.config.stage
        }-${props.config.appName.toLowerCase()}-apprunner-vpc-connector`,
      }
    )

    const DATABASE_URL = `postgresql://${secretsDB
      .secretValueFromJson("username")
      .unsafeUnwrap()
      .toString()}:${secretsDB
      .secretValueFromJson("password")
      .unsafeUnwrap()
      .toString()}@${secretsDB
      .secretValueFromJson("host")
      .unsafeUnwrap()
      .toString()}:${secretsDB
      .secretValueFromJson("port")
      .unsafeUnwrap()
      .toString()}/${secretsDB
      .secretValueFromJson("dbname")
      .unsafeUnwrap()
      .toString()}?schema=public&connect_timeout=300`

    const s3 = new S3(
      scope,
      `${props.config.stage}-${props.config.appName}-S3`,
      {
        bucketName: `${
          props.config.stage
        }-${props.config.appName.toLowerCase()}`,
      }
    )

    new apprunner.CfnService(
      scope,
      `${props.config.stage}-${props.config.appName}-AppRunner`,
      {
        sourceConfiguration: {
          authenticationConfiguration: {
            accessRoleArn: accessRole.roleArn,
          },
          autoDeploymentsEnabled: true,
          imageRepository: {
            imageRepositoryType: "ECR",
            imageIdentifier: `${props.config.aws.account}.dkr.ecr.${
              props.config.aws.region
            }.amazonaws.com/${
              props.config.stage
            }-${props.config.appName.toLowerCase()}-backend:latest`,
            imageConfiguration: {
              port: "3000",
              runtimeEnvironmentVariables: [
                {
                  name: "FRONTEND_URL",
                  value: config.frontend.url,
                },
                {
                  name: "DATABASE_URL",
                  value: DATABASE_URL,
                },
                {
                  name: "NEXTAUTH_URL",
                  value: config.frontend.nextauth_url,
                },
                {
                  name: "PAYMENT_KEY",
                  value: config.secrets.stripe_sk,
                },
                {
                  name: "AWS_REGION",
                  value: process.env.AWS_REGION || "",
                },
                {
                  name: "AWS_ACCESS_KEY",
                  value: s3.accessKey.ref || "",
                },
                {
                  name: "AWS_SECRET_KEY",
                  value: s3.accessKey.attrSecretAccessKey || "",
                },
                {
                  name: "AWS_BUCKET_NAME",
                  value: s3.bucket.bucketName || "",
                },
                {
                  name: "AWS_ARN",
                  value: s3.bucket.bucketArn || "",
                },
              ],
            },
          },
        },
        healthCheckConfiguration: {
          path: "/",
          interval: 20,
        },
        instanceConfiguration: {
          instanceRoleArn: instanceRole.roleArn,
          cpu: props.config.stage === "main" ? "1024" : "256",
          memory: props.config.stage === "main" ? "2048" : "512",
        },
        networkConfiguration: {
          egressConfiguration: {
            egressType: "VPC",
            vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
          },
        },

        serviceName: `${
          props.config.stage
        }-${props.config.appName.toLowerCase()}-apprunner`,
      }
    )
  }
}

export class FrameAppRunner extends Construct {
  constructor(scope: Construct, id: string, props: AppRunnerProps) {
    super(scope, id)

    const { vpc, appRunnerSecurityGroup } = props

    const instanceRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.appName}-Frame-AppRunner-Role`,
      {
        roleName: `${props.config.stage}-${props.config.appName}-Frame-AppRunner-Role`,
        assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
      }
    )

    const accessRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.appName}-Frame-AppRunner-AccessRole`,
      {
        roleName: `${props.config.stage}-${props.config.appName}-Frame-AppRunner-AccessRole`,
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      }
    )
    accessRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppRunnerServicePolicyForECRAccess"
      )
    )

    const vpcConnector = new apprunner.CfnVpcConnector(
      scope,
      `${props.config.stage}-${props.config.appName}-Frame-AppRunner-VpcConnector`,
      {
        subnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
        securityGroups: [appRunnerSecurityGroup.securityGroupId],
        vpcConnectorName: `${
          props.config.stage
        }-${props.config.appName.toLowerCase()}-frame-apprunner-vpc-connector`,
      }
    )

    const secretsDB = secretsmanager.Secret.fromSecretNameV2(
      scope,
      `${props.config.stage}-${props.config.appName.toLowerCase()}-db-secret-${
        props.config.database.secret_suffix
      }`,
      `${props.config.stage}-${props.config.appName.toLowerCase()}-db-secret-${
        props.config.database.secret_suffix
      }`
    )

    new apprunner.CfnService(
      scope,
      `${props.config.stage}-${props.config.appName}-Frame-AppRunner`,
      {
        sourceConfiguration: {
          authenticationConfiguration: {
            accessRoleArn: accessRole.roleArn,
          },
          autoDeploymentsEnabled: true,
          imageRepository: {
            imageRepositoryType: "ECR",
            imageIdentifier: `${props.config.aws.account}.dkr.ecr.${
              props.config.aws.region
            }.amazonaws.com/${
              props.config.stage
            }-${props.config.appName.toLowerCase()}-frame:latest`,
            imageConfiguration: {
              port: "3000",
              runtimeEnvironmentVariables: [
                {
                  name: "DB_HOST",
                  value: secretsDB
                    .secretValueFromJson("host")
                    .unsafeUnwrap()
                    .toString(),
                },
                {
                  name: "DB_PORT",
                  value: secretsDB
                    .secretValueFromJson("port")
                    .unsafeUnwrap()
                    .toString(),
                },
                {
                  name: "DB_USER",
                  value: secretsDB
                    .secretValueFromJson("username")
                    .unsafeUnwrap()
                    .toString(),
                },
                {
                  name: "DB_PASSWORD",
                  value: secretsDB
                    .secretValueFromJson("password")
                    .unsafeUnwrap()
                    .toString(),
                },
                {
                  name: "DB_DATABASE",
                  value: "card_frame",
                },
                {
                  name: "PORT",
                  value: "3000",
                },
              ],
            },
          },
        },
        healthCheckConfiguration: {
          path: "/",
          interval: 20,
        },
        instanceConfiguration: {
          instanceRoleArn: instanceRole.roleArn,
          cpu: props.config.stage === "main" ? "1024" : "256",
          memory: props.config.stage === "main" ? "2048" : "512",
        },
        networkConfiguration: {
          egressConfiguration: {
            egressType: "VPC",
            vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
          },
        },

        serviceName: `${
          props.config.stage
        }-${props.config.appName.toLowerCase()}-frame-apprunner`,
      }
    )
  }
}
