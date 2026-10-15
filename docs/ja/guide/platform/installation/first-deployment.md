---
outline: deep
---

# 最初のデプロイ {#first-deployment}

ブラウザーでプラットフォームの API URL を開くと、ウェルカムページ、CLI の接続手順、管理者ダッシュボードへのリンクが表示されます。チームメンバーがプラットフォームに接続できるように、この URL を共有してください。

まず、新しいプラットフォームを確認し、セットアップ時に選択した管理者のログイン方法でサインインします。

```sh
void platform status
void platform auth login
void platform system health
```

管理者のログインは、アプリのデプロイに使う認証情報とは別のものです。新規またはリンクされていない Void アプリのディレクトリで、インストール済みの API URL を使って接続し、最初のプロジェクトをデプロイします。

```sh
void connect void-company-api.example.workers.dev
void deploy --platform void --project my-first-app
```

`void connect` はプラットフォームを検証し、必要に応じてサインインします。デプロイ時にプロジェクトの作成を確認されたら、承認してください。すでに存在するプロジェクトを使うには、代わりに `void project link` を実行します。すでに別のプラットフォームにリンクされているアプリは、既存の接続先を維持します。最初のテストには、新しいアプリのディレクトリを使ってください。

プラットフォームに受け付けられたデプロイは、CLI の接続とは独立して続行されます。CLI は、接続の失敗後に自動的に再接続します。CLI を閉じた後でデプロイを確認するには `void project status` を、キャンセルを要求するには `void project cancel` を使います。

CLI は、ログインの認証情報をシステムのキーチェーンに、プラットフォームの URL ごとに別々に保存します。URL を指定しない場合、`void connect` は Cloudflare または Void プラットフォームを選択肢として提示します。`void connect --platform void` は、保存済みのプラットフォームと、別の URL を入力するオプションを提示します。

CI では、プロジェクトのオーナーとしてサインインした状態で、期限付きでプロジェクトにスコープされたデプロイ用の認証情報を作成します。

```sh
void project token create --name ci --expires-in 30
```

表示された `VOID_TOKEN` と `VOID_API_URL` を CI のシークレットマネージャーに保存し、新しい CI 環境でデプロイする前に、毎回 `void connect "$VOID_API_URL" --no-login` を実行します。プロジェクトファイルは、この接続のステップの代わりにはなりません。CI ではプロジェクトの確認プロンプトに答えられないため、`void deploy` の前にプロジェクトを選択しておきます。`VOID_PROJECT` を設定するか、`--project <slug>` を渡すか、`void project link` で作成した `.void/project.json` をコミットします。新しいアプリは `.gitignore` で `.void` を無視します。リンクをコミットするには、その行を `.void/*` と `!.void/project.json` に置き換えてください。ローテーションは `void project token renew <id>` で、失効は `void project token revoke <id>` で行います。人間のログイントークンは、CI の認証情報ではありません。

Cloudflare Access でプラットフォームを保護している場合は、Access の証明と、プロジェクトの認証情報の両方が必要です。サービストークンは、Void のユーザーやオペレーターの権限を付与しません。プリレンダリングやリモートバインディングを使うデプロイでは、API とプロキシの両方を呼び出すため、`VOID_ACCESS_CREDENTIALS` を、正確な HTTPS オリジンの両方のエントリーとともに、CI のシークレットマネージャーに保存します。両方のオリジンで、承認済みの同じサービストークンのペアを使う場合でも、両方のエントリーを含めてください。

```json
{
  "https://void-company-api.example.workers.dev": {
    "CF_ACCESS_CLIENT_ID": "<service-token client ID>",
    "CF_ACCESS_CLIENT_SECRET": "<service-token client secret>"
  },
  "https://void-company-proxy.example.workers.dev": {
    "CF_ACCESS_CLIENT_ID": "<service-token client ID>",
    "CF_ACCESS_CLIENT_SECRET": "<service-token client secret>"
  }
}
```

`VOID_ACCESS_ORIGIN` を使うと、認証情報を 1 つのオリジンのみに限定できます。これを API のオリジンに設定しても、プロキシへのリクエストは認可されません。

接続とインストールを確認するには、次のコマンドを使います。

```sh
void platform list
void platform use [id]
void platform status [id]
```

## アクセスを管理する {#managing-access}

インストール後、最初の管理者としてサインインします。GitHub を使うチームメンバーには、そのログインをサインアップの許可リストに追加します。

```sh
void platform auth login
void platform signup allow github teammate
```

Void は、提案されたアクセスの変更を表示し、確認を求めます。承認されると、`teammate` はプラットフォームの API URL に接続して、GitHub でサインインできるようになります。

メールアドレス、ドメイン、OIDC アイデンティティを許可する場合や、サインアップを開放する場合は、[ユーザーにアクセスを付与する](/ja/guide/platform/administration/access#giving-people-access)を参照してください。

管理者のセッションは 1 時間続きます。このセッションを使って、ユーザー、プロジェクト、ログ、プラットフォームの状態を確認できます。[プラットフォーム管理ガイド](/ja/guide/platform-administration)では、これらのワークフロー、プレビュー、自動化について説明しています。`<API origin>/admin/login` を開いて、ブラウザーの管理 UI を使うこともできます。

### Zero Trust でプロジェクトのホスト名を保護する {#protect-project-hostnames-with-zero-trust}

インストール後、管理者は、新しいプロジェクトのホスト名に Cloudflare Access を必須にでき、各プロジェクトのオーナーやプロジェクト管理者がオプトアウトすることも許可できます。これは、プラットフォーム API 自体の Access ログインや保護とは独立しており、専用の Cloudflare API トークンが必要です。要件、セットアップコマンド、リカバリーについては、[プロジェクトの Zero Trust](/ja/guide/platform/administration/zero-trust) を参照してください。
