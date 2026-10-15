---
outline: deep
---

# インストールとログインの設定 {#install-and-configure-login}

推奨されるゾーンや表示名を受け入れるには Enter を押し、置き換えるには入力します。インストール名とアプリケーションドメインには、ご自身のものを入力してください。`company` や `example.com` などの例はプレースホルダーです。

workers.dev でのテストでは、対話型のインストールを開始し、以下からログイン方法を選択します。

```sh
void platform install --workers-dev
```

ドメインへのインストールや Access のセットアップでは、Void が管理用 API トークンの作成を案内し、マスクされたプロンプトに貼り付けるよう求めます。ブラウザーログインでは DNS のプレビューはできますが、変更や Access の設定はできません。トークン作成のリンクでは、選択内容に応じた権限があらかじめ選択されています。既存のドメインを使う場合は、CLI のプロンプトの説明に従って、ゾーンのポリシーを **All Domains** から **Specified Domains** に変更し、対象のゾーンを選択してください。対話型のインストールでは、シェルの環境変数は必要ありません。

::: details シェルから既存の管理トークンを使う

プロンプトの代わりに既存のトークンを使うには、`CLOUDFLARE_API_TOKEN` を設定します。Bash や zsh では、値を表示したりコマンド履歴に残したりせずに読み取ります。

```sh
printf 'Cloudflare management API token: '
read -rs CLOUDFLARE_API_TOKEN
printf '\n'
export CLOUDFLARE_API_TOKEN
void platform install
```

PowerShell の場合:

```powershell
$env:CLOUDFLARE_API_TOKEN = [System.Net.NetworkCredential]::new('', (Read-Host 'Cloudflare management API token' -AsSecureString)).Password
void platform install
```

:::

`--plan` の内容を確認したら、`void platform install` を実行して保存済みのプランを選択するか、**Next, run this command to install the platform** の下に表示されたコマンドを実行します。どちらの方法でも、選択内容がインストールに引き継がれ、Cloudflare の現在の状態が確認されます。更新されたプランを確認してください。**Apply this plan?** では **Yes** が選択されています。Enter を押すと認証情報のプロンプトに進み、**No** を選ぶと中止します。Void は、関連するセットアップページを開き、ターミナルにフォールバックのリンクを表示します。すでに入力した値は再利用されます。

保存されたプランには、認証設定やカスタムランタイムへのパスを含む、インストールの選択内容が含まれます。シークレットやインストールの承認は含まれません。プランを辞退した場合や、管理トークンのセットアップをキャンセルした場合も、選択内容は次回の試行のために保持されます。

## ログイン方法を選択する {#choose-login-methods}

インストーラーでは、GitHub、Google、汎用 OIDC、Cloudflare Access ログインを選択できます。有効にしたい方法をすべて選択してください。初期状態では、どれも選択されていません。Cloudflare Access の保護は、Access ログインとは別の選択です。以下の GitHub OAuth の手順は、GitHub ログインを選択した場合に適用されます。

## アプリにアクセスできるユーザーを選択する {#choose-who-can-access-apps}

インストーラーは、**Who should be able to access deployed apps?** と尋ねます。

- **Same people allowed by the platform’s Access policy** は、選択済みの会社のアイデンティティとポリシーを再利用します。プラットフォームの Access 保護が有効な場合は、これを推奨します。
- **Anyone — public apps** は、公開アクセスを許可します。
- **Choose a different Access policy** は、アプリに別の会社のルールを選択します。プラットフォームの保護がない場合、このオプションは **Set up Cloudflare Access protection** になります。

プランには、デフォルトのアプリアクセスが表示されます。Void は、アプリケーショントラフィックを開放する前に、アプリのアクセスを完了して検証します。新しいプロジェクトは、選択したデフォルトを自動的に継承します。セットアップが停止した場合は、表示された再開用のコマンドを使います。既存のインストールは、アップグレード時も管理者の設定を維持します。

アプリの保護には、プラットフォームをホストしているアカウントが使われます。プラットフォームのログインや保護が別のアカウントを使用している場合は、プロンプトに従って、ホスト側のアカウントで同等のアイデンティティプロバイダーとポリシーを選択してください。API には、アプリのドメインのアペックス、または workers.dev のホスト名を使うと、アプリのワイルドカードの対象外になります。

Void は、セットアップ中にアカウント全体の Default-Deny を確認します。Access ルールを必要とするアカウントで公開アプリを使う場合は、各アプリと、検証済みのカスタムドメインに対するルールを作成します。それ以外のサブドメインは、既存のアクセスルールを維持します。アカウント全体の Default-Deny は有効なままで、プラットフォームの API やプロキシはバイパスされません。

アプリのルールには、**Access: Apps and Policies Edit** と **Organizations, Identity Providers, and Groups Read** が必要です。Void は、この管理トークンを暗号化して保存し、今後のアプリやドメインの変更に使用します。インストーラーは、セットアップ専用のトークンをその目的で保持してよいかを確認するか、専用のトークンの作成を案内します。Default-Deny のない公開アプリには、継続的な Access 管理用の認証情報は必要ありません。

スクリプトでは、`--app-access public|platform|custom` を使います。アプリのルールが必要な場合は `VOID_PLATFORM_APP_ACCESS_TOKEN` を指定するか、`--auth-config` ファイルに `appAccess` セクションを追加します。

```json
{
  "appAccess": {
    "mode": "custom",
    "identityProviderIds": ["hosting-account-identity-provider-id"],
    "policyIds": ["hosting-account-company-policy-id"],
    "tokenEnv": "APP_ACCESS_API_TOKEN"
  }
}
```

ファイル内の既存の `connections` の設定は維持してください。`mode: "platform"` では、同じアカウントのアイデンティティとポリシーの選択が再利用されます。ヘッドレスのセットアップでは、アプリ管理用のトークンを明示的に指定する必要があります。インストーラー専用のトークンが暗黙のうちに保持されることはありません。

## ログイン設定を完了する {#finish-login-configuration}

Google の場合は、OAuth クライアントを作成し、表示されたコールバック URL を登録します。指定した Google Workspace のドメインに制限することもできます。OIDC や Access ログインの場合は、発行者の URL、クライアント ID、クライアントシークレットを指定します。設定済みの会社のポリシーに基づいて、同僚が個別の招待なしに自動的にアカウントを作成できるようにするには、**Company-approved users** を選択します。

構成可能なセットアップを使うと、インストールの際に、ワンタイムのセットアップコードと `/setup` の URL が表示されます。コードを入力し、選択した管理者の方法で認証し、管理者ロールを確認する前にアイデンティティを確認してください。その方法が有効になり、選択した追加の方法は、保留中の設定として保存され、設定画面でテストして有効にできます。Google のみ、または OIDC のみのインストールでは、GitHub アカウントは必要ありません。

スクリプトでは、機密ではない設定と、シークレットの環境変数への参照を含む `--auth-config <path>` を渡します。例:

```json
{
  "connections": [
    {
      "configuration": {
        "id": "google",
        "kind": "google",
        "label": "Company Google",
        "clientId": "your-google-client-id",
        "allowedDomains": ["example.com"]
      },
      "clientSecretEnv": "GOOGLE_CLIENT_SECRET"
    }
  ],
  "administratorConnectionId": "google",
  "admission": {
    "mode": "company",
    "connections": ["google"],
    "access": false
  }
}
```

`--plan` は、参照されたシークレットを必要とせずに、この設定を読み取ります。インストールを適用するときに、シークレットマネージャーを通じてシークレットを指定してください。

### Cloudflare Access {#cloudflare-access}

Access ログイン、プラットフォームの保護、またはその両方を選択します。保護は、GitHub やその他のログイン方法と組み合わせて使うこともできます。会社承認のサインアップでは、会社のゲートを通過した同僚は、GitHub のメールアドレスが会社のメールアドレスと異なる場合でも、GitHub を使って通常のアカウントを作成できます。

従業員のサインイン方法（Okta や Google Workspace を通じたものなど）は、アイデンティティプロバイダーによって決まります。プラットフォームにアクセスできるユーザーや、必要な MFA やデバイスの要件は、Access ポリシーによって決まります。

自動セットアップでは、既存の Zero Trust 組織、選択したアイデンティティプロバイダー、既存の会社のポリシーを使用します。Void は、保護されたインストールの確認のために、専用のアプリケーションと、スコープが限定されたサービストークンを作成します。デバイスや MFA の要件を含む会社のポリシーは維持されます。

適したポリシーがない場合は、ポリシーの一覧で **Allow my company’s email domain** を選択してドメインを入力します。Void はその Allow ポリシーをアカウントに作成し、再利用のために保持します。MFA やデバイスのルールは、後から Cloudflare で追加できます。アイデンティティプロバイダーのグループやその他のルールを使う場合は、**Create in Cloudflare** を選択し、表示される手順に従ってください。

Allow ポリシーでは、サインインできるユーザーを指定する必要があります。メールアドレス、メールドメインまたはリスト、アイデンティティプロバイダーのグループ（Okta、Microsoft Entra ID、Google Workspace、GitHub の Organization、SAML）、認証コンテキスト、Cloudflare アカウントのメンバー、またはそれらから構築された Access グループが使えます。Microsoft Entra ID のグループと認証コンテキストは、選択したアイデンティティプロバイダーから取得された場合にのみ有効です。ログイン方法も、選択したアイデンティティプロバイダーの 1 つであり、会社のディレクトリ用の Cloudflare のコネクター（Microsoft Entra ID、Okta、OneLogin、PingOne、Centrify、Google Workspace、または **Restrict to account members** を有効にした Cloudflare ログイン）を使用している場合は有効です。全員を許可するポリシー、任意のサービストークンを許可するポリシー、Access をバイパスするポリシーは拒否されます。One-time PIN のみ、GitHub のような公開ログインのみ、汎用の **OpenID Connect** や **SAML** オプションで追加されたログインのみに依存するポリシーも拒否されます。会社のディレクトリの前段にあるものでも同様です。Void は、汎用ログインを通じてサインインできるユーザーを判別できません。そのポリシーに、会社のドメインを指定した **Emails ending in** などの Require ルールを追加してください。

セットアップ用の認証情報には、アイデンティティのアカウントで **Access: Apps and Policies Write** と **Access: Organizations, Identity Providers, and Groups Read** が必要です。保護を作成するには、**Access: Service Tokens Write** も必要です。インストールのアカウントでのセットアップでは、最初の管理トークンのリンクにこれらの権限が含まれています。Void はプロビジョニングの前に Access の読み取りを確認し、Access のセットアップ中にその管理トークンを再利用するため、2 つ目の API トークンは必要ありません。別のアカウントのアプリケーションでは、求められたときに、そのアイデンティティアカウントにスコープされたトークンを指定してください。スクリプトでは、`VOID_PLATFORM_ACCESS_SETUP_TOKEN` で明示的に上書きできます。プラットフォームのランタイムトークンには、Access の管理権限は必要ありません。Cloudflare の [Access API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/) と[サービストークンの権限](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/service_tokens/methods/create/)を参照してください。

Access のセットアップを自動化するには、認証設定ファイルに次を追加します。

```json
{
  "protection": true,
  "cloudflareAccess": {
    "mode": "create",
    "identityProviderIds": ["your-company-identity-provider-id"],
    "policyIds": ["your-company-allow-policy-id"]
  }
}
```

上の例のファイルの `connections` のリストは維持するか、`{"id":"access","kind":"cloudflare-access","label":"Company Access"}` を持つ接続を使って、Access ログインも作成します。ログインのみのセットアップでは、`protection` を省略します。

別の場所で管理されているアプリケーションに接続するには、**Use Access applications your company already manages** を選択します。Access アプリケーションを所有するアカウントを入力します。これは、Void をホストするアカウントと異なっていても構いません。スクリプトでは、`mode: "existing"`、省略可能な `accountId`、そして `loginApplicationId` や `protectionApplicationId` のいずれか（または両方）を使います。ログインには `loginClientSecretEnv` を設定します。保護には、アプリケーションですでに承認されているトークンについて、`id`、`clientIdEnv`、`clientSecretEnv` を持つ `serviceToken` を指定します。選択したポリシーは、表示された API とプロキシの両方のオリジンをカバーしている必要があります。既存のリソースに接続するには、それらのアプリケーション、ポリシー、組織、アイデンティティプロバイダー、グループ、サービストークンへの読み取りアクセスが必要です。Void は、それらのポリシーを変更しません。

Access ログインのみの場合は、`cloudflareAccess` ブロックや Cloudflare の管理トークンなしで、発行者、クライアント ID、シークレットだけで別のアカウントに接続できます。Cloudflare の [OIDC アプリケーションガイド](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/saas-apps/generic-oidc-saas/)に従い、Void が表示する正確なコールバックを登録してください。

### GitHub {#github}

GitHub ログインの場合:

1. OAuth の認証情報が必要になると、インストーラーが [GitHub の新しい OAuth App のフォーム](https://github.com/settings/applications/new)を開きます。ログイン連携を所有するアカウントでサインインしてください。
2. **Application name** にはプラットフォームの表示名を、**Homepage URL** には Void が表示した API URL を設定します。
3. **Redirect URI**（**Authorization callback URL** とも呼ばれます）には、`/auth/callback` で終わる、表示された正確な URL を設定し、アプリケーションを登録します。この URL は、保存されたドラフトに固定されており、認証情報のセットアップが中断されても同じままです。
4. **Client ID** を保存し、**Client Secret** を生成して、それも保存します。このフォームについては、GitHub の[登録ガイド](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)を参照してください。

この OAuth App は、サインインを処理します。

## インストールを完了する {#finish-installation}

インストーラーは、ランタイムトークン、PostgreSQL の URL、ログインプロバイダーの認証情報、R2 の認証情報を収集し、[署名鍵と暗号鍵](/ja/guide/platform/installation/credentials#signing-and-encryption-keys)を生成します。シークレットの値はマスクされ、セットアップの進行状況はシステムのキーチェーンを通じて暗号化されて保存されます。別のマシンでのリカバリーに備えて、パスワードマネージャーにもコピーを保管してください。

インストールが完了したら、表示された管理ダッシュボードのリンクを開きます。GitHub のみのセットアップでは、インストール時に選択した管理者としてサインインします。構成可能なログインでは、ワンタイムの `/setup` コードを使って、管理者のアイデンティティを確認します。表示された API URL を使って、[アプリに接続してデプロイ](/ja/guide/platform/installation/first-deployment)します。

シェルから管理トークンを指定した場合は、終わったら削除してください。

```sh
unset CLOUDFLARE_API_TOKEN
```

PowerShell では、`Remove-Item Env:CLOUDFLARE_API_TOKEN` を使います。保存されたトークンは、今後のメンテナンスのために維持してください。

::: details セットアップが DNS で一時停止した場合、または中断された場合

Void がゾーンを作成した場合は、`waiting-for-dns` で停止し、ネームサーバーを表示します。それらをレジストラーで設定し、ゾーンがアクティブになるまで待ってから、Void が表示したインストール ID を使って再開します。

```sh
void platform install --resume --name <installation-id>
```

再開すると、保存済みの管理トークンが再利用され、トークンがない場合や Cloudflare に拒否された場合は入力を求められます。`CLOUDFLARE_API_TOKEN` で上書きすることもできます。ソースビルドを使う場合は、同じ `--runtime` ディレクトリも渡してください。再開では、保存されたチェックポイントと元のシークレットが使われます。2 つ目のインストールを開始したり、置き換え用の鍵を生成したりしないでください。チェックポイントが保存される前にセットアップが停止した場合は、`void platform install` を再実行して保存済みのプランを選択するか、元のコマンドを再実行します。

`void platform install` を再実行し、未完了のインストールに対して **Continue setup** を選択することもできます。非対話型でのリカバリーには、`--resume --name <id>` を使います。完了したプラットフォームは、`platform status`、`repair`、`upgrade` で管理します。

再開すると、選択した Hyperdrive が復元されます。保存されたチェックポイントにその選択が含まれていない場合は、最初に選択したのと同じ設定を使って、再開時に `--hyperdrive <existing-id>` を追加してください。

認証情報のセットアップを続行している間に、Cloudflare が保存済みのランタイムトークンを拒否した場合、Void はトークンのページを開き、同じ実行の中で置き換えのトークンを求めます。ネットワークやサービスの障害では、保存済みのトークンは破棄されません。環境変数で指定したトークンは、そちらで修正する必要があります。

:::
