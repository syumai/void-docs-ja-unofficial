---
outline: deep
---

# デプロイ {#deployment}

`void deploy` は、アプリをビルドし、リソースをプロビジョニングし、マイグレーションを適用してデプロイします。デプロイ先には、ご自身の Cloudflare アカウント、またはチームが運用する Void プラットフォームを選べます。

デプロイが成功すると、Void はデプロイ先から報告された詳細とともに、デプロイ URL をサマリーボックスに表示します。

## Cloudflare にデプロイする {#deploy-to-cloudflare}

`void init` の際に Cloudflare を選択するか、後から接続します。

```sh
void connect --platform cloudflare
void deploy --platform cloudflare
```

Void がブラウザーを開いてサインインを求め、使用するアカウントを尋ねます。以降のデプロイでは保存済みのターゲットが使われるため、`void deploy` を実行するだけで済みます。

ネイティブアプリは Workers Free のクォータ内で動作します。[サンドボックス](./sandboxes.md#requirements)には Workers Paid と Containers へのアクセスが必要です。設定、トークンの権限、追加要件のある機能については [Cloudflare ガイド](../integrations/cloudflare.md)を参照してください。

すでに Worker とルートの `wrangler.jsonc` または `wrangler.json` がある場合、`void deploy` はそれをリンクし、リソースを維持できます。[既存の Worker をデプロイする](../integrations/cloudflare.md#deploy-an-existing-worker)を参照してください。

## アプリを準備する {#prepare-your-app}

### マイグレーション {#migrations}

デプロイでは `db/migrations/` にある未適用の SQL マイグレーションが適用されます。スキーマに変更があるのにマイグレーションがない場合、デプロイは停止します。

```sh
void db generate
```

SQL を確認してコミットし、もう一度デプロイしてください。ロールバックではデータベースのマイグレーションは元に戻りません。ローカルでのワークフローについては[データベース](./database.md)を参照してください。

### 環境変数 {#environment-variables}

値は `env.ts` で宣言し、本番用のサーバーシークレットは `void secret put` で設定します。デプロイでローカルの `.env` がアップロードされることはありません。公開用の `VITE_*` の値はビルド環境から渡してください。[環境変数](./env-vars.md)を参照してください。

CLI とフレームワークアダプターのバージョンは揃えておき、`void.config.ts` と `void.lock.json` は生成されたらコミットしてください。

## GitHub からデプロイする {#github}

保存済みのターゲットとパッケージマネージャー向けにワークフローを生成します。

```sh
void init --github
```

Cloudflare の場合は、リポジトリのシークレットに `CLOUDFLARE_API_TOKEN` を追加します。トークンには、アプリが使用するアカウントとプロダクトへのアクセス権が必要です。PostgreSQL と MySQL のアプリでは `DATABASE_URL` も必要です。

Worker のプレビュー URL と Cloudflare Access の認証情報については、[Cloudflare の CI セットアップ](../integrations/cloudflare.md#deploying-from-ci)に従ってください。

### チームプラットフォームの CI {#team-platform-ci}

コアのセルフホストプラットフォームでは、[プロジェクトのデプロイトークン](./platform/installation/first-deployment.md)を使って独自のワークフローを用意します。`VOID_TOKEN`、`VOID_API_URL`、プロジェクトのスラッグを設定し、新しい CI 環境ごとに接続してください。

```sh
void connect "$VOID_API_URL" --no-login
void deploy --platform void --project "$VOID_PROJECT"
```

オプションの GitHub Actions インテグレーションを備えたプラットフォームでは、短期間有効な OIDC 認証情報が使われます。`void github connect <project> --repo <owner/repo> --executor github_actions` でリポジトリを認可し、リポジトリの `VOID_API_URL` を設定して、生成されたワークフローの `permissions: id-token: write` を維持してください。

プラットフォームがマネージドな GitHub ビルドをサポートしている場合は、ワークフローファイルなしで GitHub App がプッシュ時にデプロイできます。App のインストールとリポジトリの接続については、[GitHub コマンド](../reference/cli/github.md#github)を参照してください。

デプロイ前に CI で型チェックを実行する場合は、依存関係のインストール後に `void prepare` を実行して `.void/` の型を生成してください。

## チームプラットフォームにデプロイする {#deploy-to-a-team-platform}

管理者から提供された API URL を使います。新規またはリンクされていないアプリでは次のようにします。

```sh
void connect platform.example.com
void deploy --platform void --project my-app
```

求められたらサインインし、プロジェクトの作成を確認してください。既存のプロジェクトを使うには `void project link` を実行します。以降のデプロイでは保存済みのデプロイ先が使われます。

プロジェクトのオーナーは[アクセスを共有](./project-collaboration.md)できます。チーム向けにプラットフォームをインストールするには、まず [Void プラットフォームをインストールする](./self-hosted-platform.md)を参照してください。そこでは両方のターゲットのデプロイ機能も比較しています。

### 別の Void プラットフォームにデプロイする {#deploy-to-another-void-platform}

別のプラットフォームに 1 回だけデプロイする場合は、接続してそのプロジェクトを指定します。

```sh
void connect second.example.com
VOID_API_URL=https://second.example.com void deploy --platform void --project my-app
```

この方法では保存済みのデプロイ先は変更されません。各プラットフォームには、それぞれ独自のプロジェクト、シークレット、データがあります。ターゲットの選択方法やその他のフラグについては [CLI リファレンス](../reference/cli/deploy.md)を参照してください。

## ログとロールバック {#logs-and-rollback}

デプロイの確認、ランタイムログの閲覧、以前のデプロイの選択ができます。

```sh
void project status
void project logs
void project rollback
```

Cloudflare のログはライブテールを使用し、チームプラットフォームではログ履歴が保持されます。ロールバックする前に、以前のコードが現在のデータベーススキーマで動作することを確認してください。[プロジェクトコマンド](../reference/cli/project.md)を参照してください。

## その他のランタイム {#other-runtimes}

`target` 設定を使って、[Node.js、Bun、Deno](../integrations/nodejs-bun-deno.md) 向けのスタンドアロンサーバーをビルドできます。`dist/ssr` と `dist/client` を一緒に、ご自身のホスティングにデプロイしてください。D1、KV、R2、Workers AI などの Cloudflare バインディングは、これらのターゲットでは利用できません。

## 使用量制限ページと実行制限ページ {#usage-and-execution-limit-pages}

チームプラットフォームは、アプリがリクエスト数または CPU の許容量を超えた場合、API および Pages アクションのリクエストに対して構造化された HTTP 429 を返します。ブラウザーのリクエストにはエラーページが返されます。

これをカスタマイズするには、リクエスト制限用に `public/usage-limit.html`、実行制限用に `public/execution-limit.html` を追加します。インライン CSS とデータ URL の画像を使った、単体で完結する HTML を使用してください。スクリプト、外部アセット、フォーム送信は無効化されます。カスタムページがない場合は組み込みのページが使われます。

レスポンスはキャッシュされません。すでに開始されたストリーミングレスポンスをエラーページに置き換えることはできません。ストリームの失敗は UI 側で処理してください。
