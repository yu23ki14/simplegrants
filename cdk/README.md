# デプロイ方法

## 初期設定 & Preinstall

1. AWS の CLI コマンドを使えるようにしておく。

2. web2qf の AWS 環境に接続するために、Profile として web2qf を設定する。

3. npm モジュールのインストール

```
$ yarn
```

## 環境変数設定

example.json を環境にあわせてコピー

```
$ cp ./.env.example ./.env.stg
```

中身をそれぞれ書き換える。

- dbSecretSuffix については InitStack をつくってから設定するので後で OK

## InitStack のデプロイとその他

InitStack は VPC、DB、踏み台サーバーなどなど

### 踏み台サーバーの pem をつくる

コンソールから作成する。web2qf_bastion のような

### コマンド実行

```
$ yarn deploy -c stage=stg stgweb2qfVpc
```

### dbSecretSuffix を設定

DB のシークレット情報を secret manager に保存しているが、ARN の Suffix6 文字が必要なのでコンソールから持ってきて、`.env`にある`dbSecretSuffix`にいれる。

### Docker Image を push

#### Frontend

1. `aws ecr get-login-password --region ap-northeast-1 --profile cfj_pgf | docker login --username AWS --password-stdin 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com`
2. `docker build -t card-frame:latest -f ./Dockerfile .`
3. `docker tag card-frame:latest 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com/stg-web2qf-frontend:latest`
4. `docker push 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com/stg-web2qf-frontend:latest`

### Backend

1. `aws ecr get-login-password --region ap-northeast-1 --profile cfj_pgf | docker login --username AWS --password-stdin 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com`
2. `docker build -t web2qf-backend:latest -f ./Dockerfile .`
3. `docker tag web2qf-backend:latest 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com/stg-web2qf-backend:latest`
4. `docker push 905418185537.dkr.ecr.ap-northeast-1.amazonaws.com/stg-web2qf-backend:latest`

## AppStack のデプロイ

```
$ yarn deploy -c stage=stg stgweb2qfBackendApp
```
