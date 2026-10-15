---
outline: deep
---

# ランタイムとソースビルド {#runtime-and-source-builds}

## ランタイムのデプロイ {#deploying-your-runtime}

ランタイムをビルドします。Git のチェックアウトからビルドすると、現在のコミットがランタイムのマニフェストに自動的に記録されます。コミットされていない変更があるチェックアウトは、`-dirty` サフィックス付きで記録されます。

```sh
vp run build:core
```

自動検出を別の不変なリビジョンで上書きする必要がある場合、ビルドシステムは `VOID_PLATFORM_SOURCE_REVISION` を設定できます。Git のメタデータがないソースアーカイブも通常どおりビルドできますが、リビジョンは記録されません。

ランタイムは `packages/platform/dist/runtime` に出力されます。ビルドした CLI を使って、これらのファイルから新規インストールをプレビューします。

```sh
void-dev platform install \
  --name my-team \
  --application-domain example.app \
  --zone example.app \
  --runtime packages/platform/dist/runtime \
  --plan
```

プランを適用する前に、[インストールガイド](/ja/guide/self-hosted-platform)を完了してください。インストールするには、`--plan` を付けずにコマンドを実行します。ドメインの準備ができる前にテストする場合は、`--application-domain` と `--zone` を `--workers-dev` に置き換えます。その場合も、PostgreSQL と、ランタイム、ログインプロバイダー、R2 の認証情報は必要です。`void` の代わりに `void-dev` を使用し、install コマンドと resume コマンドでは `--runtime packages/platform/dist/runtime` を指定したままにしてください。インストールが中断された場合は、完了するまでそのランタイムビルドを保持してください。

後から `void-dev platform domain set example.app` を実行します。ドメインのセットアップは既存のインストール済みランタイムを使用するため、`--runtime`、再ビルド、アプリの再デプロイは不要です。プラットフォームの API URL と元の workers.dev のアプリ URL は引き続き利用できます。

既存のインストールでは、その接続 ID を使ってアップグレードをプレビューします。

```sh
void-dev platform upgrade <installation-id> \
  --runtime packages/platform/dist/runtime --plan
```

その後、`--plan` を付けずに実行してアップグレードを適用します。ソースからビルドしたランタイムは、リリース版のランタイムと同じアーティファクト、データベース、所有権、ヘルスのチェックを通過します。CLI は無効化されたインストールの状態を保持し、ソースのリビジョンをインストールのチェックポイントに記録します。

## Access で保護された API 向けのオプションの GitHub Webhook 受信 {#optional-github-webhook-ingress-for-access-protected-apis}

コアのインストーラーは、ダッシュボード、GitHub App、ビルド用 Containers、Webhook 受信をデプロイしません。`--runtime` でソースビルドを渡しても、それらのインフラストラクチャ、バインディング、認証情報、プラットフォームの機能はプロビジョニングされません。リポジトリのホスト型デプロイスクリプトは Void Cloud を対象としており、セルフホストのプラットフォームにこれらのサービスを追加するための汎用的なセットアップ手順ではありません。フォークがそのオプションの連携を提供し、保守している場合を除き、コアの CLI のデプロイワークフローを使用してください。

フォークでマネージド GitHub ビルドを追加していて、Cloudflare Access が API のホスト名を保護している場合、GitHub は `/webhooks/github` に直接配信できません。GitHub は Access の認証情報を提示しないためです。API アプリケーションに Everyone やバイパスのポリシーを追加しないでください。

オプションの Webhook 受信は、別の公開ホスト名にデプロイします。これは `POST /github` で署名付きの GitHub 配信を受け付け、サービスバインディングを通じて API に転送します。Access による保護がない場合は、API の `/webhooks/github` エンドポイントを直接使用してください。

オプションの受信をデプロイするには、次の手順に従います。

1. フォークで GitHub App、ビルドエグゼキューター、API バインディング、認証情報、マネージドビルドの機能をプロビジョニングし、内部オペレーションでソースの API ランタイムをデプロイします。コアのインストールやアップグレードだけでは、マネージドビルドは追加されません。
2. `platform/packages/api/wrangler.github-webhook-ingress.jsonc` を編集します。受信にはインストールごとに一意の名前を付け、その `API` サービスバインディングには、インストールされている API Worker の正確な名前を設定します。公開ホスト名は、Access の対象となっているすべての人間向け / API 用のホスト名とは別にしてください。
3. リポジトリのルートからデプロイします。

   ```sh
   vp run --filter @voidcloud/api deploy:github-webhook-ingress --env production
   ```

   同じ設定内のステージング用のエントリには、`--env staging` を使用します。

4. Cloudflare ダッシュボードで、暗号化された Worker シークレットを追加します。GitHub App の既存の `GITHUB_WEBHOOK_SECRET` を、API と受信の両方の Worker に設定します。`openssl rand -base64 32` などで別の高エントロピーな値を生成し、両方の Worker に `GITHUB_WEBHOOK_INGRESS_SECRET` として設定します。この値には、プラットフォーム管理、JWT、Access、GitHub Webhook の認証情報を再利用しないでください。
5. GitHub App の設定で、**Content type** を `application/json` のままにし、同じ Webhook シークレットを維持して、**Webhook URL** を末尾が `/github` の分離された受信 URL に変更します。push ビルドを利用する前に、GitHub のテスト配信を使用して 2xx のレスポンスを確認してください。

受信は最大 25 MiB のペイロードを受け付けます。[GitHub のペイロード上限](https://docs.github.com/en/webhooks/webhook-events-and-payloads#payload-cap)を参照してください。

## CI からのソースビルドのデプロイ {#deploying-source-builds-from-ci}

チェックアウトから `@void/platform` をビルドし、そのランタイムディレクトリを `--runtime` で `install`、`upgrade`、`repair`、`enable`、`rollback` に渡します。カスタムランタイムにも、パッケージ化されたリリースと同じ整合性、マイグレーション、ヘルス、ロールバックのチェックが適用されます。

クリーンな Git のチェックアウトを使用するか、`VOID_PLATFORM_SOURCE_REVISION` を設定して、デプロイするリビジョンを識別できるようにしてください。

新しい CI ランナーは、毎回インストールを検出できます。保護された環境で `CLOUDFLARE_API_TOKEN` と `VOID_PLATFORM_DATABASE_URL` を設定してから、次を実行します。

::: details CI のコマンドと復旧用の入力

```sh
vp run build:core

export VOID_PLATFORM_REGISTRY_DIR="$RUNNER_TEMP/void-platform-registry"
export VOID_PLATFORM_RECOVERY_KEY="$(openssl rand -base64 32)"
node packages/void/dist/cli/cli.mjs platform discover --account "$CLOUDFLARE_ACCOUNT_ID" \
  --installation "$VOID_PLATFORM_INSTALLATION"
node packages/void/dist/cli/cli.mjs platform upgrade "$VOID_PLATFORM_INSTALLATION" \
  --runtime packages/platform/dist/runtime --plan
node packages/void/dist/cli/cli.mjs platform upgrade "$VOID_PLATFORM_INSTALLATION" \
  --runtime packages/platform/dist/runtime --yes
```

インストールの指定を省略できるのは、アカウントに検出可能なインストールが 1 つだけの場合に限ります。デプロイはインストールごとに一度に 1 つだけ実行し、次を開始する前に完了させてください。マイグレーションや Worker のロールアウト中にキャンセルすると、インストールが復旧待ちの状態になることがあります。

管理トークン、データベース URL、JWT 署名シークレット、メールが有効なインストールではメール署名シークレット、および完全なプロジェクト暗号化キーリングは、保護された CI 環境に保管してください。アップグレードでは、デプロイ済みの Worker のシークレットが引き継がれます。元の値は、失われた Worker を再作成するときに必要です。設定用の認証情報は、明示的にローテーションするときにも必要です。

:::
