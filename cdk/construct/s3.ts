import { Construct } from "constructs"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as iam from "aws-cdk-lib/aws-iam"

interface S3Props {
  bucketName: string
}

export class S3 extends Construct {
  bucket: s3.Bucket
  user: iam.User
  accessKey: iam.CfnAccessKey

  constructor(scope: Construct, id: string, props: S3Props) {
    super(scope, id)

    const { bucketName } = props

    this.bucket = new s3.Bucket(this, `${id}-bucket`, {
      bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      publicReadAccess: true,
    })

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
        effect: iam.Effect.ALLOW,
      })
    )

    this.user = new iam.User(this, `${id}-s3`, {
      userName: `${id}-s3`,
    })
    this.user.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject"],
        resources: [`${this.bucket.bucketArn}/*`],
      })
    )

    this.accessKey = new iam.CfnAccessKey(this, `${id}-s3-access-key`, {
      userName: this.user.userName,
    })
  }
}
