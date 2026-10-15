---
outline: deep
---

# デプロイ {#deploy}

## `void deploy` {#void-deploy}

```
void deploy [--project <name>] [--dir <path>] [--spa] [--skip-build] [--debug]
void deploy [--platform <cloudflare|void>] [--require-email]
void deploy --platform cloudflare --atomic
void deploy --platform cloudflare --provision
```

プロジェクトの種類を自動的に検出し、適切なパイプラインを選択します。詳細は[サポートされるアプリの種類](../../guide/app-types.md)と[デプロイ](../../guide/deployment.md)を参照してください。

Void プラットフォームにデプロイするには、`void connect <url>` による明示的な接続が必要です。保存されたプロジェクトの URL や `VOID_API_URL` だけでは、接続は確立されません。新しい CI 環境では、先に `void connect "$VOID_API_URL" --no-login` を実行してください。

Void プラットフォームでは、受理されたデプロイは CLI が切断されても継続します。CLI は自動的に進行状況へ再接続します。Ctrl+C を押すと観察が停止します。キャンセルを要求するには `void project cancel`、結果を確認するには `void project status` を使用します。中断された実行で復旧が必要な場合は、その結果を待ってから再度デプロイしてください。

CLI は、進行の停滞と自動復旧を報告し、受理後は最大 30 分間待機します。タイムアウトした場合でもデプロイは継続できるため、別のデプロイを試す前に `void project status` を確認してください。

既存の Void Worker では、`void deploy` がその Worker をリンクし、ルートの Cloudflare 設定を移行できます。最初のデプロイは、既存のアプリに集中してください。要件と ISR キャッシュの選択については、[既存の Worker をデプロイする](../../integrations/cloudflare.md#deploy-an-existing-worker)を参照してください。

Drizzle プロジェクトでは、デプロイ時に読み取り専用のスキーマドリフトチェックが実行されます。新しいマイグレーションが生成される場合、デプロイは停止し、`void db generate` を実行してマイグレーションを確認し、自分でコミットしてから `void deploy` を再実行するよう案内します。

| フラグ                          | 用途                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--platform <cloudflare\|void>` | `.void/project.json` に保存されているプラットフォームを上書きします                                                                                                                                      |
| `--project <name>`              | スラッグで特定の Void プロジェクトを対象にします。`--platform cloudflare` ではサポートされません                                                                                                         |
| `--dir <path>`                  | ビルド済みの静的ディレクトリをデプロイします（ビルドをスキップ）                                                                                                                                         |
| `--spa`                         | 静的デプロイで、SSG の代わりに SPA モードを使用します                                                                                                                                                    |
| `--skip-build`                  | ビルド手順をスキップします。Cloudflare では、静的 / SPA / SSG のデプロイのみサポートされます                                                                                                             |
| `--require-email`               | メールをセットアップできない場合に、メールなしでデプロイせず失敗させます。`--platform cloudflare` が必要です                                                                                             |
| `--provision`                   | すべてのリソースが存在していても、リソースのプロビジョニングを再度実行します。たとえば、既存のデータベースで D1 のリードレプリケーションを有効にする場合に使用します。`--platform cloudflare` が必要です |
| `--atomic`                      | 既存の Durable Object Worker を直接公開します。準備状況はトラフィックの切り替え後に確認されます                                                                                                          |
| `--debug`                       | 構造化されたデプロイログを stderr にも出力します（`~/.void/logs/` にも書き込まれます）                                                                                                                   |

`--atomic` は 1 回のデプロイにのみ適用されます。ステージングが常にできない既存の Durable Object Worker では、`void.config.ts` に `deploy: { cloudflare: { mode: 'atomic' } }` を設定すると、通常の `void deploy` でアトミックな公開が使用されます。既定値は `staged` です。

すべてのデプロイは、`~/.void/logs/` に JSONL 形式のログを書き込みます。失敗時には、ログのパスと関連する詳細が表示されます。`--debug` または `VOID_DEPLOY_DEBUG=1` を使用すると、stderr にも出力できます。

認証情報はビルドコマンドに含めず、CI のシークレットとして登録して、CI プロバイダーがログ内でマスクできるようにしてください。

プラットフォームの解決の優先順位:

1. `--platform <cloudflare|void>`
2. `.void/project.json` の `platform`
3. プラットフォームが保存されていない、古い SDK で初期化されたプロジェクトでは Void

Skip deployment setup を選択すると `"platform": "none"` が保存されます。その後の `void deploy` は、プラットフォームの上書きが指定されるまで、案内を表示して停止します。

Void プラットフォームでの、プロジェクトの解決の優先順位:

1. `--project <name>`
2. `VOID_PROJECT`
3. `.void/project.json` にリンクされたプロジェクト

プロジェクトがリンクされておらず、上書きも指定されていない場合、CLI はリンクまたは作成を促します。CI（非 TTY）では、`void deploy` は代わりにエラーで終了します。`VOID_PROJECT` を設定するか、`--project <slug>` を渡してください。

1 回の実行だけ、接続済みの別の Void プラットフォームにデプロイするには、次のようにします。

```sh
void connect second.example.com
VOID_API_URL=https://second.example.com void deploy --platform void --project my-app
```

`VOID_API_URL` がプラットフォームを選択し、`--project` がそのプロジェクトを選択します。別のプラットフォームの保存済みリンクを上書きする場合は、プロジェクトを指定する必要があります。ターゲットのプロジェクトが作成される場合でも、既存のプロジェクトのリンクとデプロイの設定は変更されません。`VOID_PROJECT` や、現在のプラットフォーム上の別のプロジェクトでも同様です。デプロイ先が設定されていない場合、最初のデプロイではプロジェクトがリンクされます。[別の Void プラットフォームにデプロイする](../../guide/deployment.md#deploy-to-another-void-platform)を参照してください。

## `void deploy --platform cloudflare` {#void-deploy-platform-cloudflare}

`void.config.ts` を使用して、お使いの Cloudflare アカウントにビルドしてデプロイします。

```sh
void deploy --platform cloudflare
void deploy --platform cloudflare --require-email   # メールなしでデプロイせず、失敗させる
```

Void は必要に応じてブラウザーでサインインを行い、選択したアカウントを保存します。CI では、`CLOUDFLARE_API_TOKEN` を設定し、トークンが複数のアカウントにアクセスできる場合は `CLOUDFLARE_ACCOUNT_ID` も設定してください。

| オプションまたは設定           | Cloudflare での動作                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `--dir`, `--spa`               | 小さな Worker と Workers Assets を通じて静的な出力をデプロイします                              |
| `--skip-build`                 | 既存の静的、SPA、SSG の出力を再利用します。Worker アプリでは利用できません                      |
| `--project`                    | 利用できません。Worker とアカウントは `void.config.ts` と `void.lock.json` から決まります       |
| 名前付き環境                   | 利用できません。トップレベルの `cloudflare` 設定を使用してください                              |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | バージョンにプレビュー URL がない新しい CI で必要です。デプロイ後はローカルにキャッシュされます |
| `--require-email`              | CI のようにメールの手順を実行できない場合に、メールなしでデプロイせず失敗させます               |
| `DATABASE_URL`                 | PostgreSQL または MySQL のプロビジョニングとマイグレーションのため、デプロイ環境で必要です      |

トークンには、Workers Scripts: Edit、バインドされたリソースへの読み取りアクセス、Void がプロビジョニングする製品への編集アクセスが必要です。他のマシンや CI を使用する前に、最初のデプロイの後で `void.lock.json` をコミットしてください。

本番のサーバー側の値には `void secret put <NAME>` を使用します。ローカルの `.env` の値は決してデプロイされません。デプロイの前に `void db generate` を実行して、スキーマの変更をコミットしてください。

Sandbox には、[Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans)、Docker、Containers へのアクセスが必要です。API トークンには、Account / Containers: Edit と Account / Cloudchamber: Edit が必要です。

メールを使う場合は、`email.from` を設定し、ローカルで `void email setup --platform cloudflare` を実行します。ロックファイルをコミットし、CI では `--require-email` を渡します。[メールのセットアップ](../../guide/email/domains.md#your-own-cloudflare-account)を参照してください。

Access の認証情報、Hyperdrive の権限、準備状況、ロールバックについては、[Cloudflare へのデプロイ](../../integrations/cloudflare.md#deploy-to-your-own-cloudflare-account)を参照してください。
