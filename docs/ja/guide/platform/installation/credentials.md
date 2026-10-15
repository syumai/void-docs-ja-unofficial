---
outline: deep
---

# 認証情報 {#credentials}

このプラットフォーム用に、パスワードマネージャーのエントリーを 1 つ用意しておいてください。インストーラーから求められたときに、保存した値を貼り付けます。ほとんどの値はシェルの環境変数を必要としません。

| 認証情報                                             | 作成者                                      | プラットフォームが必要とする理由                                                                                |
| ---------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Management API トークン                              | あなた(Cloudflare 上)                       | ドメインのインストールまたは Access のセットアップで、CLI が DNS と Access を変更できるようにします。           |
| Runtime API トークン                                 | あなた(Cloudflare 上)                       | Worker シークレットとして保存され、ターミナルを閉じた後もプラットフォームがアプリをデプロイできるようにします。 |
| PostgreSQL URL                                       | あなた(データベースプロバイダー上)          | プラットフォームのユーザー、プロジェクト、デプロイを保存します。                                                |
| ログインプロバイダーのクライアント ID とシークレット | あなた、または Access ログインの場合は Void | プラットフォームへのサインインに使用します。                                                                    |
| R2 Access Key ID と Secret Access Key                | あなた(Cloudflare 上)                       | プラットフォームがアップロードリンクに署名し、`void deploy` が静的ファイルを R2 に直接送信できるようにします。  |
| Access セットアップトークンとアプリアクセストークン  | あなた(Cloudflare 上)                       | Cloudflare Access を使用する場合のみ: Access アプリケーションを作成・管理します。                               |
| JWT 署名鍵                                           | Void(対話型インストール時)                  | プラットフォームのログイントークンに署名します。                                                                |
| プロジェクト暗号化鍵                                 | Void(対話型インストール時)                  | プラットフォームが保存するアプリのシークレットを暗号化します。                                                  |
| メール署名鍵                                         | Void(メールが有効な場合)                    | 確認リンクとメールリクエストに署名します。                                                                      |

## Cloudflare API トークン {#runtime-token-permissions}

ドメインのインストールまたは Cloudflare Access のセットアップでは、インストーラーが Cloudflare の [API トークンのセットアップ](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)を使って、Management トークンと Runtime トークンを個別に作成する手順を案内します。インストーラーのリンクは権限をあらかじめ選択し、プラットフォームの表示名に基づく名前を提案しますが、Cloudflare のフォームではゾーンをあらかじめ選択できません。ドメインのインストールでは、ゾーンポリシーを **All Domains** から **Specified Domains** に変更し、対象のゾーンを選択してください。Void がゾーンを作成する場合は、両方のトークンで **All Domains** のままにしてください。ゾーンはまだ存在せず、Runtime トークンはキャッシュのパージにそれを必要とします。トークンはパスワードマネージャーに保存し、マスクされた CLI プロンプトに貼り付けます。

既定の API ホスト名での workers.dev でのテストでは、ブラウザーログインでインフラストラクチャーのセットアップを認可できます。Void はアカウント全体の Access 要件も確認します。現在の認証情報でそれらを読み取れない場合、インストーラーはスコープ付きの Access トークンを要求します。保護されたアプリと、Default-Deny 配下の公開アプリには、継続的なアプリ管理トークンが必要で、暗号化して保存されます。Access のセットアップには、workers.dev でも Management トークンが必要です。ドメインを追加するまでは、ゾーン権限は不要です。

ブラウザーログインでは AI Gateway へのアクセスは付与されません。Void がそのリソースを検証・作成できるように、Runtime トークンに **Account → AI Gateway → Edit** を含めてください。

Management トークンは、CLI がプラットフォームをインストールし保守するためのものです。Runtime トークンは Worker シークレットとして保存され、ターミナルを閉じた後もプラットフォームがアプリをデプロイできるようにします。この 2 つは別々の認証情報です。

各トークンのフォームを、以下の権限チェックリストと照らし合わせてください。インストーラーは、プロンプトで入力された Management トークンを、このインストールの暗号化されたローカルチェックポイントに保存し、再開時に再利用します。アップグレード、修復、その他のライフサイクルメンテナンスでも、この保存済みの Management トークンが使用されます。インストール中に拒否されたトークンは、プロンプトで置き換えられます。明示的に指定した `CLOUDFLARE_API_TOKEN` または `CF_API_TOKEN` が優先されます。メンテナンスや別のマシンで使えるよう、パスワードマネージャーのコピーを保管しておいてください。スクリプトでは `CLOUDFLARE_API_TOKEN` を通じて渡します。

::: details 各トークンで選択する権限

コアプラットフォームには、次の権限を使用します。Cloudflare は、トークンの画面に応じて書き込みアクセスを **Edit** または **Write** と表記する場合があります。[権限リファレンス](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)を参照してください。

| スコープ | 権限               | Management | Runtime                                         |
| -------- | ------------------ | ---------- | ----------------------------------------------- |
| Account  | Account Settings   | Read       | Read                                            |
| Account  | Workers Scripts    | Edit       | Edit                                            |
| Account  | Workers Tail       | Read       | Read                                            |
| Account  | D1                 | Edit       | Edit                                            |
| Account  | Workers KV Storage | Edit       | Edit                                            |
| Account  | Workers R2 Storage | Edit       | Edit                                            |
| Account  | Queues             | Edit       | Edit                                            |
| Account  | Hyperdrive         | Write      | Write                                           |
| Account  | Account Analytics  | Read       | Read                                            |
| Account  | AI Gateway         | Edit       | ブラウザーログインでインストールする場合は Edit |
| Account  | Containers         | —          | Edit                                            |
| Account  | Cloudchamber       | —          | Edit                                            |
| Zone     | Zone               | Read       | —                                               |
| Zone     | DNS                | Edit       | —                                               |
| Zone     | Workers Routes     | Edit       | —                                               |
| Zone     | Cache Purge        | —          | Purge                                           |

Void がインストール先アカウントで Access を構成する場合、最初の Management トークンのリンクは、**Account → Access: Apps and Policies → Edit** と **Account → Access: Organizations, Identity Providers, and Groups → Read** も選択します。保護を有効にすると、**Account → Access: Service Tokens → Edit** が追加されます。認証設定または保存済みのセットアップで既存のアプリケーションを選択する場合、リンクは Edit ではなく Read アクセスを要求します。これらの権限は Management トークンに属し、Runtime トークンには不要です。

Void にゾーンの作成を依頼する場合、Management トークンには、ゾーンを作成する権限を持つ **Zone Edit** も必要です。ゾーンがすでに存在する場合は、選択したゾーンに対して Zone Read と DNS Edit を使用します。ネストされたアプリケーションドメインでは、Management トークンに **SSL and Certificates: Read** も必要です。カスタムプロジェクトドメインを有効にするカスタムランタイムでは、Runtime トークンに **SSL and Certificates: Edit** が必要です。コアランタイムはこの機能を有効にしません。

Void はプロビジョニングの前にアクセス権を確認します。権限の不足が報告された場合は、選択したアカウントまたはゾーンに対してトークンの権限を更新し、再試行してください。

:::

## メールを有効にする {#enable-email}

共有送信元ドメインと、その Cloudflare ゾーン ID を選択します。メール用のゾーンはアプリケーション用のゾーンと異なっていてもかまいませんが、プラットフォームの Cloudflare アカウントに属している必要があります。既存のインストールでメールを有効にするには、次を実行します。

```sh
VOID_EMAIL_SENDER_DOMAIN=mail.example.com \
VOID_EMAIL_SHARED_ZONE_ID=your-zone-id \
void platform upgrade your-installation-id
```

新規インストールでメールを有効にするには、`void platform install` の前に同じ 2 つの変数を設定します。Void はこのペアを記録し、以降のアップグレードで使用します。通常のアップグレードでは置き換えられません。

インストールの前に、正確な共有送信元ドメインに対して [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/) を有効にし、その MX レコードが Cloudflare を指していることを確認してください。サブドメインの場合は、ゾーンの **Email Routing → Settings → Subdomains** にその名前を追加します。Cloudflare が必要な MX レコードと SPF レコードを追加します。インストーラーの共有メールのブートストラップはそれらのレコードを検証しますが、追加はしません。他のドメイン名にある既存のメールプロバイダーのレコードは、そのまま残してください。

メールを有効にすると、管理者は[プロジェクトのメールドメインを登録](/ja/guide/platform/administration/email#registering-email-domains-for-projects)でき、プロジェクトは Runtime トークンを通じて宛先アドレスを登録できるようになります。そのためには、アカウントに対する **Email Routing Addresses: Edit** と **Email Sending: Edit**、およびメールを扱うゾーンに対する **Zone: Read**、**Zone Settings: Edit**、**Email Routing Rules: Edit** が必要です。メールが有効な場合、Runtime トークンのリンクはこれらをあらかじめ選択します。任意の受信者に対する Email Sending のオンボーディングには Workers Paid が必要です。

インストーラーは、メールゲートウェイをデプロイし、共有メールルートを準備し、プラットフォームのトラフィックを開放する前に受信の準備状況を検証します。セットアップが失敗した場合は、報告された権限、完全一致ドメインの MX レコード、またはルーティングの競合を修正してから、同じインストールまたはアップグレードのコマンドを再実行してください。新規インストールは `void platform install --resume --name <installation-id>` で再開します。設定を修正すると、記録されたメール操作が続行されます。

## R2 アップロード認証情報 {#r2-upload-credentials}

`void deploy --platform void` は、アプリの静的ファイルをプラットフォーム API 経由ではなく、R2 に直接アップロードします。API は R2 のキーペアを使って、そのための有効期間の短いアップロードリンクに署名します。

インストーラーは **R2 token creation** フォームを開きます。このフォームでは、プラットフォームの表示名に基づくトークン名、**Object Read & Write**、**Apply to all buckets in this account (including newly created buckets)** があらかじめ選択されています。設定を確認し、アカウントトークンを作成します。ロールによって必要な場合は、ユーザートークンを作成します。**Access Key ID** と **Secret Access Key** をパスワードマネージャーに保存し、両方をインストーラーに貼り付けます。これらは Management API トークンや Runtime API トークンとは別のものです。[R2 のトークンに関する手順](https://developers.cloudflare.com/r2/api/tokens/)を参照してください。

## 署名鍵と暗号化鍵 {#signing-and-encryption-keys}

**JWT 署名鍵**は、プラットフォームのログイントークンに署名します。**プロジェクト暗号化鍵**は、プラットフォームが保存するアプリのシークレットを暗号化します。対話型インストールでは両方が生成され、このマシンの暗号化された復旧データに保存されます。このマシン上のライフサイクルコマンドは、そこから読み取ります。

CI や別のマシンからプラットフォームを修復する場合など、自分でコピーを保管したいときは、インストールの前に両方の鍵を作成し、`VOID_PLATFORM_JWT_SECRET` と `VOID_PLATFORM_PROJECT_SECRET_KEY` を設定します。非対話型インストールでは、両方を設定する必要があります。次のコマンドを 2 回実行して、それぞれ別の鍵を生成します。

```sh
openssl rand -base64 32
```

それぞれの結果をパスワードマネージャーに保存してください。このコマンドは、base64 でエンコードされた 32 バイトのランダムなバイト列を生成します。どちらのフィールドにも使用できます。復旧のために 2 つの元の鍵を保管しておき、再開やアップグレードの際に再生成しないでください。

::: details ターミナルに表示せずに鍵を生成する

macOS では、次のコマンドで適切なランダム値がクリップボードにコピーされます。

```sh
openssl rand -base64 32 | pbcopy
```

これをパスワードマネージャーに **JWT signing key** として貼り付けます。コマンドをもう一度実行し、2 つ目の値を **Project encryption key** として保存します。PowerShell では、`pbcopy` の代わりに `Set-Clipboard` を使用します。OpenSSL が使えない場合は、シークレットマネージャーの、base64 形式の 32 バイトのランダム値を生成する安全なジェネレーターを使用するか、`node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64"))'` を使用します。

:::

メールが有効な場合、Void は確認リンクとサービス間のメールリクエスト用に、独立した**メール署名鍵**も作成します。インストーラーはこれを暗号化された復旧状態に保存します。外部で管理するコピーが必要な場合(ローカルの復旧ファイルが残らないヘッドレスインストールを含む)は、`VOID_PLATFORM_EMAIL_SIGNING_SECRET` に、32 バイト以上のランダム値からなる別の値を設定してください。
