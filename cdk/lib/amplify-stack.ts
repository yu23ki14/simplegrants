import * as cdk from "aws-cdk-lib"
import { CfnApp, CfnBranch } from "aws-cdk-lib/aws-amplify"
import { BuildSpec } from "aws-cdk-lib/aws-codebuild"
import { Construct } from "constructs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import { randomUUID } from "crypto"
import { getConfig } from "../config/config"

interface AppProps {
  vpc: ec2.IVpc
  dbSecurityGroup: ec2.ISecurityGroup
  config: ReturnType<typeof getConfig>
}

export class AmplifyStack extends cdk.Stack {
  readonly appRunnerSG: ec2.SecurityGroup

  constructor(
    scope: Construct,
    id: string,
    stackProps: cdk.StackProps,
    appProps: AppProps
  ) {
    super(scope, id, stackProps)

    const { vpc, dbSecurityGroup, config } = appProps

    this.appRunnerSG = new ec2.SecurityGroup(this, `${id}-sg`, {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${id}-sg`,
    })

    dbSecurityGroup.addIngressRule(
      this.appRunnerSG,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL from App Runner"
    )

    const dbSecrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      "rdsCredential.secretName!",
      "rdsCredential.secretName!"
    )

    const amplify = new CfnApp(this, id, {
      name: id,
      repository: config.github.repository,
      oauthToken: config.secrets.github,
      environmentVariables: [
        {
          name: "GOOGLE_CLIENT_ID",
          value: config.google.clientId!,
        },
        {
          name: "GOOGLE_CLIENT_SECRET",
          value: config.secrets.google_client_secret!,
        },
        {
          name: "NEXTAUTH_SECRET",
          value: randomUUID(),
        },
        {
          name: "DATABASE_URL",
          // prettier-ignore
          value: `postgresql://${dbSecrets.secretValueFromJson("username").unsafeUnwrap().toString()}:${dbSecrets.secretValueFromJson("password").unsafeUnwrap().toString()}@${dbSecrets.secretValueFromJson("host").unsafeUnwrap().toString()}:5432/${dbSecrets.secretValueFromJson("dbname").unsafeUnwrap().toString()}?schema=public&connect_timeout=300`,
        },
        {
          name: "NEXT_PUBLIC_API_URL",
          value: "",
        },
        {
          name: "NEXT_PUBLIC_FINGERPRINT_KEY",
          value: randomUUID(),
        },
      ],
      buildSpec: BuildSpec.fromObject({
        appRoot: "frontend",
      }).toBuildSpec(),
    })

    new CfnBranch(this, "MainBranch", {
      appId: amplify.attrAppId,
      branchName: "main",
      enableAutoBuild: true,
    })

    // new cdk.CfnOutput(this, id, {
    //   value: amplify.attrDefaultDomain,
    //   exportName: "NEXTAUTH_URL",
    // })
  }
}
