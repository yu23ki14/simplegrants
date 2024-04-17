# SimpleGrants Frontend 📱 <!-- omit from toc -->

## 目次 📒 <!-- omit from toc -->

- [要件 📝](#requirements-%F0%9F%93%9D)
- [インストールとセットアップ 🧪](#installation--setup-%F0%9F%A7%AA)
- [アプリの実行 🚀](#running-the-app-%F0%9F%9A%80)
  - [ローカル開発 👨🏻‍💻](#local-development-%F0%9F%91%A8%F0%9F%8F%BB%E2%80%8D%F0%9F%92%BB)
  - [本番環境へのデプロイ 🔥](#production-deployment-%F0%9F%94%A5)
- [追加のノート 🧠](#additional-notes-%F0%9F%A7%A0)
  - [Prisma Schema](#prisma-schema)
- [デプロイ 🚀](#deployment-%F0%9F%9A%80)

## 要件 📝

- NodeJS (v17.5+)
- yarn
- Prisma CLI

## インストールとセットアップ 🧪

フロントエンドは認証のために NextAuth を利用しています。プラットフォームの要件に基づいて [認証プロバイダー](./pages/api/auth/[...nextauth].ts) を更新してください。

```bash
# セットアップのために
$ yarn install

# .envをコピーする
$ cp .env.example .env.local

# 本番用に実行する場合、.env.productionを使用
$ cp .env.example .env.production

```

⚠️ **.env.local ファイルを自分の値で更新してください！**

## アプリの実行 🚀

> 💡 フロントエンドを実行する前に、バックエンドが既に動作していることを確認してください！

### ローカル開発 👨🏻‍💻

これらのコマンドを実行する必要はありません。詳細は [このセクション](../README.md#deployment-configuration-%F0%9F%9A%80) を参照してください。
開発用にローカルで実行する場合、注意すべきいくつかの点があります：

1. Prismaスキーマがバックエンドと**常に同期**していることを確認してください。これを行うには、`npm run generate` を実行してください。
2. 以下のコマンドを実行して開始します。

```bash
# 開発モード
$ yarn dev -p 3001
```

### 本番環境へのデプロイ 🔥

これらのコマンドを実行する必要はありません。詳細は [このセクション](../README.md#deployment-configuration-%F0%9F%9A%80) を参照してください。
このアプリケーションを本番環境にデプロイする場合、セットアップは少し簡単ですが、注意すべきいくつかの点があります：

1. `.env.production`がセットアップされていることを確認してください。これは `docker-compose.yml` ファイルによって使用されます。
2. `next.config.js`は画像ファイルがホストされているドメインとホスト名を含むべきです。

```bash
# 本番モード
$ yarn build && yarn start
```

## 追加のノート 🧠

### Prisma Schema

フロントエンドは NextAuth を利用して

おり、バックエンドとスキーマ依存関係を共有しています。Prismaスキーマがローカルで常に同期していることを確実にするために、バックエンドで `npm run generate` を実行してください。これにより、ここにスキーマがコピーされ、Prisma generateが実行されます。**これはローカル開発のためだけに必要です。本番環境のセットアップが最新のスキーマを使用するように、これをコミットしてください。**

## デプロイ 🚀

このアプリをデプロイする最も簡単な方法は、Next.js の創設者が提供する [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使用することです。

詳細については、[Next.js のデプロイメントドキュメント](https://nextjs.org/docs/deployment)を確認してください。ただし、バックエンドとの連携を確実にするためには、もっと多くのセットアップが必要です。
