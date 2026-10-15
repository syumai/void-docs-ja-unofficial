---
outline: deep
---

# CI からインストールする {#install-from-ci}

初回のインストールでは、[対話式セットアップ](/ja/guide/platform/installation/setup)に従ってください。このページは、設定済みのインストールを自動化する場合に使用します。

::: details 非対話式の入力

次の値は、保護された CI シークレットから注入してください。ワークフローやプレーンテキストのシークレットファイルにコミットしないでください。

| 環境変数                                     | 対話式セットアップでの値                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`                       | 管理用 API トークン                                                                                  |
| `VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN` | ランタイム用 API トークン                                                                            |
| `VOID_PLATFORM_DATABASE_URL`                 | 専用の PostgreSQL URL                                                                                |
| `VOID_PLATFORM_HYPERDRIVE_ID`                | 外部で管理されている既存の Hyperdrive ID(該当する場合)                                               |
| `VOID_PLATFORM_HYPERDRIVE_ORIGIN_HOST`       | その Hyperdrive のオリジンホスト。ID およびユーザーと併せて設定します                                |
| `VOID_PLATFORM_HYPERDRIVE_ORIGIN_USER`       | その Hyperdrive のランタイム用データベースユーザー。ID およびホストと併せて設定します                |
| `VOID_PLATFORM_R2_ACCESS_KEY_ID`             | R2 アクセスキー ID                                                                                   |
| `VOID_PLATFORM_R2_SECRET_ACCESS_KEY`         | R2 シークレットアクセスキー                                                                          |
| `VOID_PLATFORM_JWT_SECRET`                   | 元の JWT 署名シークレット                                                                            |
| `VOID_PLATFORM_EMAIL_SIGNING_SECRET`         | メールを有効にする場合の、専用のメール署名シークレット                                               |
| `VOID_PLATFORM_PROJECT_SECRET_KEY`           | 元の Base64 エンコードされたプロジェクト暗号化キー                                                   |
| `VOID_PLATFORM_RECOVERY_KEY`                 | キーチェーンが使えない場合に、ローカルの暗号化された復旧状態に使う Base64 エンコードの 32 バイトキー |
| `VOID_EMAIL_SENDER_DOMAIN`                   | 任意の共有メールドメイン。`VOID_EMAIL_SHARED_ZONE_ID` が必要です                                     |
| `VOID_EMAIL_SHARED_ZONE_ID`                  | そのメールドメインの Cloudflare ゾーン ID。`VOID_EMAIL_SENDER_DOMAIN` が必要です                     |

デフォルトの GitHub のみのログインでは、`VOID_PLATFORM_GITHUB_CLIENT_ID`、
`VOID_PLATFORM_GITHUB_CLIENT_SECRET`、`VOID_PLATFORM_ADMIN_GITHUB_LOGIN` も設定してください。
Google、OIDC、Access によるログインでは、[設定フォーマット](/ja/guide/platform/installation/setup#choose-login-methods)に従って
`--auth-config <path>` を指定します。
そのファイルで指定した各 `clientSecretEnv` は、CI のシークレットマネージャーから注入してください。
Access 保護を自動で行う場合は、[セットアップに必要な権限](/ja/guide/platform/installation/setup#cloudflare-access)を持つ
`VOID_PLATFORM_ACCESS_SETUP_TOKEN` も必要になることがあります。

再開や修復でそれらが必要になるたびに、そのインストールで保存された署名キーと暗号化キーを使用してください。キーリングをローテーションした後は、[キーリング復旧に必要な入力一式](/ja/guide/platform/installation/maintenance#manage-an-installation-from-another-machine)を使用します。アンインストール後もデータベースのクレームとテーブルは残ります。別のインストールには新しいデータベースを使用してください。

インストールまたはアップグレード時にメールを有効にするには、2 つのメール関連の値を両方設定します。以降のアップグレードでは、記録済みの値が再利用されます。メールが有効なインストールに記録済みの値がない場合は、アップグレード前に両方を指定してください。

```sh
void platform install \
  --name team \
  --display-name "Team Void" \
  --account <account-id> \
  --application-domain example.app \
  --zone example.app \
  --yes
```

CI では、変更を伴う操作に `--yes` が必要です。読み取り専用の `--plan` には必要ありません。カスタムランタイムでは `--runtime <directory>` も必要です。新規インストールの場合は、無人インストールと同じアカウント、名前、ドメインのオプションを指定して `--plan` を実行してください。`--auth-config` を使う場合は、両方のコマンドに同じファイルを渡します。ログインプロバイダーの OAuth または OIDC クライアントを手動で作成する際は、`<platform-api-url>/auth/callback` を登録してください。Access の自動セットアップでは、アプリケーションが自動で管理されます。カスタムの API ホスト名は任意です。

:::

## プラットフォームをカスタマイズする {#customize-the-platform}

プラットフォームの実装を変更したり、独自のビルドをデプロイしたりするには、[プラットフォーム開発](/ja/guide/platform-development)に従ってください。ローカル開発、ソースからのビルド、フォーク向けの CI について説明しています。
