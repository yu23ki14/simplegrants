import { Stack, StackProps } from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import { Construct } from "constructs"
import { getConfig } from "../config/config"

interface AppProps {
  vpc: ec2.IVpc
  config: ReturnType<typeof getConfig>
  ec2BastionSecurityGroup: ec2.ISecurityGroup
}

export class RdsStack extends Stack {
  readonly dbSG: ec2.SecurityGroup
  readonly backendAppRunnerSG: ec2.SecurityGroup
  readonly frontendAppRunnerSG: ec2.SecurityGroup
  readonly rdsCredentials: rds.Credentials

  constructor(
    scope: Construct,
    id: string,
    stackProps: StackProps,
    appProps: AppProps
  ) {
    super(scope, id, stackProps)

    const { vpc, ec2BastionSecurityGroup, config } = appProps

    this.dbSG = new ec2.SecurityGroup(this, `${id}-db-sg`, {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${id}-db-sg`,
    })

    this.dbSG.addIngressRule(
      ec2BastionSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL from bastion"
    )

    this.backendAppRunnerSG = new ec2.SecurityGroup(
      this,
      `${config.stage}-${config.appName}-backendAppRunner-SG`,
      {
        allowAllOutbound: true,
        securityGroupName: `${config.stage}-${config.appName}-backendAppRunner-SG`,
        vpc: vpc,
      }
    )

    this.dbSG.addIngressRule(
      this.backendAppRunnerSG,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL from backend App Runner"
    )

    this.frontendAppRunnerSG = new ec2.SecurityGroup(
      this,
      `${config.stage}-${config.appName}-frontendAppRunner-SG`,
      {
        allowAllOutbound: true,
        securityGroupName: `${config.stage}-${config.appName}-frontendAppRunner-SG`,
        vpc: vpc,
      }
    )

    this.dbSG.addIngressRule(
      this.frontendAppRunnerSG,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL from frontend App Runner"
    )

    this.rdsCredentials = rds.Credentials.fromUsername(
      config.database.username,
      {
        secretName: `${id}-db-secret`,
      }
    )

    const instanceParameterGroup = new rds.ParameterGroup(
      this,
      `${id}-DB-InstanceParameterGroup`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_3,
        }),
        description: `${id} DB Instance Parameter Group`,
      }
    )

    new rds.DatabaseInstance(this, `${id}-DB`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      multiAz: false,
      allocatedStorage: 8,
      maxAllocatedStorage: 16,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      credentials: this.rdsCredentials,
      securityGroups: [this.dbSG],
      parameterGroup: instanceParameterGroup,
      databaseName: config.appName.toLocaleLowerCase(),
    })
  }
}
