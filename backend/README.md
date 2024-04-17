# Backend 📡 <!-- omit from toc -->

> ⚠️ **重要な注意**:
> Node のバージョンは 17.5 以上を使用する必要があります！これは、認証システムが NextAuth を使用しており、fetch が必要であるためです（v17.5 以上で利用可能です）。

## 目次 📒 <!-- omit from toc -->

- [必要条件 📝](#requirements-%F0%9F%93%9D)
- [インストールとセットアップ 🧪](#installation--setup-%F0%9F%A7%AA)
  - [支払いプロバイダの選択](#choosing-your-payment-provider)
  - [環境変数の設定](#setting-up-environment-variables)
- [アプリの実行 🚀](#running-the-app-%F0%9F%9A%80)
  - [ローカル開発 👨🏻‍💻](#local-development-%F0%9F%91%A8%F0%9F%8F%BB%E2%80%8D%F0%9F%92%BB)
  - [本番環境へのデプロイ 🔥](#production-deployment-%F0%9F%94%A5)
- [テスト ✅](#test-%E2%9C%85)
  - [単体テスト](#unit-tests)
  - [統合テスト](#integration-tests)
  - [エンドツーエンド（E2E）テスト](#end-to-end-e2e-tests)
  - [テストカバレッジ](#test-coverage)
- [追加の注意点 🧠](#additional-notes-%F0%9F%A7%A0)
  - [Prisma スキーマ](#prisma-schema)
  - [管理者の作成](#creating-admins)
  - [支払いプロバイダ](#payment-providers)
    - [Stripe](#stripe)

## 必要条件 📝

- Docker & `docker compose`
- NodeJS（v17.5 以上）
- Prisma CLI
- Stripe CLI

バックエンドは設定とデプロイの簡素化のために Docker を使用しています。ローカルで実行する予定であれば、Docker がマシンに設定されていることが理想的です。

## インストールとセットアップ 🧪

### Stripe の環境変数の設定

現時点では、Stripe のみが支払いプロバイダとして受け入れられています。

backend 側の.env ファイルに`PAYMENT_KEY`という環境変数がある。
stripe の secret key を入力する必要がある

https://docs.stripe.com/keys

- Stripe の API は Test mode, Live mode がある。両方に secret key, public key があるが、env に使うのは secret のみ
  - <img width="1712" alt="image" src="https://github.com/dig-dao/simplegrants/assets/45249410/76332cb9-c4ed-492d-815d-b4c50fc584f6">
  - <img width="1144" alt="image" src="https://github.com/dig-dao/simplegrants/assets/45249410/7708390f-4b5c-4e6f-ba8e-26ff3ae7331f">
  - 自分が test mode で作ってみたけど、チェックアウト画面はこんな感じ
  - test 用のクレジットカードで決済フローは確認できる: https://docs.stripe.com/testing#cards

利用可能な支払いプロバイダはバックエンドの[adapter](./src/provider/adapter/)フォルダにあります。将来的には、より多くの支払いプロバイダが追加される予定です。
支払いプロバイダを設定するには、[`provider.service.ts`](./src/provider/provider.service.ts#L15)で使用したいプロバイダを変更するだけです。

その後、以下のように必要なコンストラクタ値を渡します：

```typescript
{
    prisma: PrismaService,
    secret: String, // Stripeの場合はあなたの秘密キー
    country: String, // ISO国コード。これは必要に応じて支払いプロバイダの手数料を計算するために必要です。日本の場合は`JP`
}
```

### 環境変数の設定

```bash
# セットアップするには
$ npm install

# .envをコピーする
$ cp .env.example .env
```

**⚠️ .env ファイルをあなたの値で更新してください！**

## アプリの実行 🚀

このアプリケーションを実行する方法は複数あり、それぞれ少し異なる設定方法があります。

### ローカル開発 👨🏻‍💻

ローカルで開発用に実行する場合、いくつか注意すべき点があります：

1. Docker のネットワーキングの仕組みにより、`prisma migrate`や`prisma db seed`のようなコマンドを実行する必要がある場合、`DATABASE_CONTAINER`環境変数を`localhost`に変更する必要があります。幸いなことに、それを助ける簡単なスクリプトが`prisma-helper.sh`にあります。`npm run migrate:dev`や`npm run setup`を実行すると、自動的に.env 変数が交換されます。
2. このアプリケーションの実行方法によっては、`FRONTEND_URL`および`NEXTAUTH_URL`を適切に更新する必要がある場合があります。重要なのは、Docker でローカルですべてを実行している場合、`NEXTAUTH_URL`は`http://host.docker.internal:3001`である必要があり、**`http://localhost:3001`ではない**という点です。
3. Stripe を使用している場合、**Webhook を設定することを忘れないでください**！

```bash
# Stripeを使用している場合、Stripe経由でのWebhookを受信する
$ stripe listen --forward-to localhost:3000/checkout/webhook
```

実行は[README](../README.md)を参照

**⚠️ 接続エラーが発生した場合 👉 エラー: P1001: データベースサーバーに到達できません `simplegrants-database`:`5432`, 必要なのは一時的に`.env`で`DATABASE_CONTAINER=localhost`に変更し、コマンドを再実行することです。完了したら元に戻すことを忘れないでください！**

### 本番環境へのデプロイ 🔥

このアプリケーションを本番環境にデプロイする場合、設定は少し簡単ですが、注意すべき点がいくつかあります：

1. 現在の`docker-compose.yml`は、データベースをローカルで実行している可能性があると想定しています。しかし、これはほとんどの場合ではなく、別途デプロイされたデータベースに接続することになるでしょう。この設定を実現するために、`docker-compose.yml`から`simplegrants-database`エントリを削除し、`.env`の`DATABASE_CONTAINER`をデータベースの URL に変更します。
2. `FRONTEND_URL`および`NEXTAUTH_URL`は、OAuth プロバイダーで設定したコールバック URL と一致する登録済みドメインを指すべきです。
3. Stripe を使用している場合、**Webhook を設定することを忘れないでください**！

```bash
# 本番モード
$ npm run docker:up

# シードとマイグレーションを実行
$ npm run setup
```

## テスト ✅

テストはソフトウェア開発の不可欠な部分であり、このプロジェクトにはアプリケーションが期待通りに動作していることを確認するための複数のテストタイプが含まれています。

### 単体テスト

単体テストは、アプリケーションの個々のコンポーネントと機能をテストするために使用されます。これらのテストはコードの実装詳細に焦点を当て、コードが期待通りに機能していることを保証します。

単体テストを実行するには、次のコマンドを使用します：

```bash
$ npm run test
```

### 統合テスト

統合テストは、アプリケーションの異なるコンポーネントと機能がどのように連携して動作するかをテストするために使用されます。これらのテストは、異なる部分がすべて組み合わされたときにアプリケーションが期待通りに動作していることを保証します。

統合テストを実行するには、次のコマンドを使用します：

```bash
$ npm run test:integration
```

### エンドツーエンド（E2E）テスト

E2E テストは、アプリケーション全体をテストし、ユーザーがアプリケーションとどのように対話するかをシミュレートするために使用されます。これらのテストは、ユーザーの視点からアプリケーションが期待通りに動作していることを保証します。

e2e テストを実行するには、次のコマンドを使用します：

```bash
$ npm run test:e2e
```

### テストカバレッジ

テストカバレッジは、コードのどの程度がテストされているかを測定する指標です。これは、テストされていないコードの領域を特定し、より多くのカバレッジが必要であることを明らかにするのに役立ちます。

テストカバレッジを確認するには、次のコマンドを使用します：

```bash
$ npm run test:cov
```

## 追加の注意点 🧠

### Prisma スキーマ

バックエンドは NextAuth を利用しており、これはフロントエンドに依存しています。Prisma スキーマを常に同期状態に保つために（ローカルで）、`npm run generate`を実行する必要があります。これにより、スキーマがフロントエンドフォルダにコピーされ、そこで Prisma generate が実行されます。**これはローカル開発でのみ必要です。**

### 管理者の作成

認証は NextAuth に依存しているため、ユーザーはプラットフォームにログインした人が初めて作成されます。したがって、最初の管理者を作成する最良の方法は、プラットフォームに初めてログインし、特定のユーザーの`Role`を`Admin`に手動で変更することです。
その後の管理者変更は API を使用して行うことができ、Swagger で文書化されています。
http://localhost:3000/api#/

### 支払いプロバイダ

#### Stripe

Stripe を使用している場合、**Webhook を設定することを忘れないでください**！そうしないと、バックエンドはユーザーによる成功した支払いを検出できません。
