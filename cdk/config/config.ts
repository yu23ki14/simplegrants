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
      bastionKeypairId: process.env.AWS_BASTION_KEYPAIR_ID,
      bastionKeypairName: process.env.AWS_BASTION_KEYPAIR_NAME,
      bastionSshPort: Number(process.env.AWS_BASTION_SSH_PORT || 22),
    },

    database: {
      username: process.env.DATABASE_USERNAME!,
      secret_suffix: process.env.DATABASE_SECRET_SUFFIX!,
    },

    frontend: {
      url: process.env.FRONTEND_URL,
      nextauth_url: process.env.NEXTAUTH_URL,
      nextauth_secret: process.env.NEXTAUTH_SECRET,
      fingerprint_key: process.env.FINGERPRINT_KEY,
      cookie_domain: process.env.COOKIE_DOMAIN,
      api_url: process.env.API_URL,
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
    },

    secrets: {
      google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
      stripe_sk: process.env.STRIPE_SK,
      stripe_pk: process.env.STRIPE_PK,
    },
  }
}
