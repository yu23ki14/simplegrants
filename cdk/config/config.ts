import * as dotenv from "dotenv"

dotenv.config()

export function getConfig(stage: string) {
  dotenv.config({
    path: `.env.${stage}`,
  })

  return {
    appName: "web2qf",

    stage,

    aws: {
      account: process.env.AWS_ACCOUNT,
      region: process.env.AWS_REGION,
      vpcId: process.env.AWS_VPC_ID,
      bastionKeypairId: process.env.AWS_BASTION_KEYPAIR_ID,
      bastionKeypairName: process.env.AWS_BASTION_KEYPAIR_NAME,
    },

    database: {
      username: process.env.DATABASE_USERNAME!,
      secret_suffix: process.env.DATABASE_SECRET_SUFFIX!,
    },

    frontend: {
      url: process.env.FRONTEND_URL,
      nextauth_url: process.env.NEXTAUTH_URL,
    },

    github: {
      repository: process.env.GITHUB_REPOSITORY,
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
    },

    secrets: {
      github: process.env.GITHUB_TOKEN,
      google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
      stripe_sk: process.env.STRIPE_SK,
      stripe_pk: process.env.STRIPE_PK,
    },
  }
}
