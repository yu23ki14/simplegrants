import { Stack, StackProps } from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Construct } from "constructs"
import { getConfig } from "../config/config"

interface AppProps {
  config: ReturnType<typeof getConfig>
}

export class VpcStack extends Stack {
  readonly vpc: ec2.IVpc
  readonly ec2BastionSecurityGroup: ec2.ISecurityGroup

  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    appProps: AppProps
  ) {
    super(scope, id, props)

    const { config } = appProps

    this.vpc = ec2.Vpc.fromLookup(this, "Default", {
      vpcId: config.aws.vpcId,
    })

    this.ec2BastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `${id}-bastion-sg`,
      {
        vpc: this.vpc,
        allowAllOutbound: true,
        securityGroupName: "bastion-sg",
      }
    )

    this.ec2BastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH from anywhere"
    )

    new ec2.Instance(this, `${config.appName}Bastion`, {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: this.ec2BastionSecurityGroup,
      keyPair: ec2.KeyPair.fromKeyPairName(
        this,
        config.aws.bastionKeypairId!,
        config.aws.bastionKeypairName!
      ),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true,
    })
  }
}
