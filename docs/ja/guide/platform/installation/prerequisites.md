---
outline: deep
---

# 前提条件 {#prerequisites}

Void プラットフォームを運用するには、次のものが必要です。

- Workers for Platforms、R2、Analytics Engine が有効な Cloudflare アカウント。
- 空のホスト型 PostgreSQL データベース。
- 選択したログインプロバイダー(GitHub、Google、OIDC、Cloudflare Access)のアカウント。
- アプリ用のドメイン、またはテスト用の `workers.dev`。[ドメインは後から追加](/ja/guide/platform/installation/domains#adding-a-domain)できます。

Void は、CLI を通じて Workers、ストレージ、キュー、ルーティング、データベースのテーブルを作成します。

Workers for Platforms には有料プランが必要です。データベースと Cloudflare の利用料金は別途請求されます。

## Cloudflare アカウントとドメインを準備する {#prepare-your-cloudflare-account-and-domain}

[Cloudflare ダッシュボード](https://dash.cloudflare.com/)で、プラットフォームを置くアカウントを選択します。

1. **Workers & Pages** を一度開いて、Cloudflare にアカウントの Workers をプロビジョニングさせます。
2. **Workers for Platforms** を開いて、そのプランを有効にします。確定する前に [Workers for Platforms の料金](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/platform/pricing/)を確認してください。
3. **R2 Object Storage** を開いて、有効化を完了します。バケットは後で Void が作成します。
4. ドメインでのインストールの場合は、`example.app` のように自分が所有するドメインを選びます。必要であれば、お好みのレジストラで登録してください。使っていないドメインのルートを使用します。アプリは `my-app.example.app` で配信されます。workers.dev でテストする場合は、この手順と後述の DNS 設定をスキップしてください。

そのドメインがすでにこの Cloudflare アカウントにある場合は、既存のゾーンを使用します。そうでなければ、[ドメインを Cloudflare に追加](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)し、ゾーンが有効になるまでネームサーバーの手順に従ってください。ゾーンとは、ドメインに対する Cloudflare の DNS 設定のことです。ゾーンを作成してもドメインを購入したことにはなりません。

インストール中に Void にゾーンを作成させることもできます。あらかじめ設定しておけば、API トークンをそのゾーンにスコープでき、DNS の待ち時間なしにインストールを完了できます。プラットフォーム API はデフォルトで `workers.dev` を使うため、追加のドメインは不要です。

### Cloudflare が Analytics Engine を拒否する場合 {#if-cloudflare-rejects-analytics-engine}

プラットフォームは、リクエストのメトリクスとログを Analytics Engine に保存します。インストールが「You need to enable Analytics Engine」(コード 10089)で停止した場合は、プラットフォームに含まれない Worker の **Settings** > **Bindings** で Analytics Engine バインディングを追加し、ダッシュボードから一度デプロイしてください。新しい Hello World Worker で構いません。プラットフォーム自身の Workers は編集しないでください。その後、表示された `void platform install --resume` コマンドを実行します。

## CLI をインストールしてプレビューする {#install-the-cli-and-preview}

Node.js 24.21.0 以降で、CLI をインストールします。

```sh
pnpm add --global void
void platform install --plan
```

プロンプトが表示されたら Cloudflare にサインインし、インストール名とアカウントを選択します。`--plan` は、リソースを変更したりランタイムシークレットを要求したりせずに、作成されるリソースをプレビューします。完了したプランは、選択内容がローカルに保存されます。`void platform install` を再度実行すると、保存済みのプランを選択できます。適用を求める前に、Void は現在の Cloudflare の状態を確認します。

ドメインでのインストールでは、次の内容で回答します。テストモードでは、アプリケーションドメイン、ゾーン、キャッチオールに関する質問はスキップされます。

| プロンプト                              | 回答                                                   |
| --------------------------------------- | ------------------------------------------------------ |
| Installation name                       | `team` のような短い名前                                |
| Application base domain                 | `example.app` のような自分のドメイン                   |
| Cloudflare zone                         | 同じドメイン                                           |
| Platform display name                   | チームが認識しやすい任意の名前                         |
| Optional custom API hostname            | `workers.dev` を使う場合は空のままにする               |
| Dedicate all unmatched traffic to Void? | ゾーン全体がプラットフォームのものである場合にのみ Yes |

アカウント内で未使用のインストール名を選んでください。たとえば `team` を指定すると、`void-team-api` や `void-team-proxy` といったリソースが作成されます。

プレビューには、必要になる認証情報が一覧表示されます。[認証情報](/ja/guide/platform/installation/credentials)を確認してから、最後に表示されるインストールコマンドを実行してください。ガイド付きインストールでは、必要に応じてセットアップ用のリンクとログインのコールバックが提示されます。

どちらの方法も直接指定できます。

```sh
void platform install --application-domain example.app --plan
void platform install --workers-dev --plan
```

`--workers-dev` は、`--application-domain`、`--zone`、`--dedicated-zone` と組み合わせられません。

## プラットフォームのデータベースを作成する {#platform-database}

このプラットフォーム専用の、空の PostgreSQL データベースを使用します。ユーザー、プロジェクト、デプロイが保存されます。個々のアプリは引き続き D1 を使用できます。Void はテーブルと Hyperdrive 接続を作成しますが、PostgreSQL サーバー自体はプロビジョニングしません。

お使いのコンピューターと Cloudflare の両方からの接続を受け付ける PostgreSQL プロバイダーであれば、どれでも使用できます。

1. プラットフォーム専用の新しいデータベースまたはプロジェクトを作成します。既存のアプリケーションのテーブルがあってはいけません。テーブルとスキーマを作成・管理できるデータベースロールを使用してください。
2. プロバイダーの接続情報を開いて、プライマリデータベースを選択します。直接接続またはセッションモードのプーラーを使用し、トランザクションプーリングは使用しないでください。接続は、お使いのコンピューターと Cloudflare の両方から機能する必要があります。
3. パスワードと SSL 設定を含む PostgreSQL の接続 URL を、パスワードマネージャーにコピーします。Void の `PostgreSQL DATABASE_URL` プロンプトには、`psql` コマンドで囲まずに URL だけを、`sslmode=verify-full` などの SSL 設定を含めてプロバイダーが提示したとおりに貼り付けます。Void が作成する Hyperdrive は公的な認証局のみを信頼するため、データベースがプライベート認証局を使用している場合は、後述のとおり別途管理する Hyperdrive を使用してください。

| プロバイダー                                                             | 接続の設定                                                                                                                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PlanetScale Postgres](https://planetscale.com/docs/postgres/connecting) | Vitess/MySQL ではなく **Postgres** を選択します。**Connect** を開いてロールの認証情報を作成し、`6432` 番ポートの PgBouncer ではなく、`5432` 番ポートの直接のプライマリ接続を使用します。 |
| [Neon](https://neon.com/docs/get-started-with-neon/connect-neon)         | **Connect** を開き、データベースとオーナーロールを選択して、**connection pooling をオフ**にします。                                                                                      |

インストールがデータベースを確保した後は、再開やメンテナンスのコマンドでも同じデータベースを使い続けてください。データベースが空でないなどの理由で、インストールがデータベースを使用できずに停止した場合は、再開する前に `VOID_PLATFORM_DATABASE_URL` を別のデータベースの URL に設定してください。アンインストールしても、外部の PostgreSQL が削除されることはありません。

### プロバイダーの CLI を使う {#use-a-provider-cli}

ダッシュボードの代わりに、どちらのプロバイダーの CLI でもデータベースの作成と接続 URL の取得ができます。

::: details PlanetScale Postgres

最新の [PlanetScale CLI](https://planetscale.com/docs/cli/planetscale-environment-setup) をインストールします。macOS では `brew install pscale` を使用します。Linux と Windows については、インストールガイドを参照してください。

サインインして、組織とリージョンを一覧表示します。

```sh
pscale auth login
pscale org list
pscale region list --org <organization>
```

`<organization>` を自分の組織のスラッグに置き換えて、リージョンを選択します。そのリージョンで利用できる Postgres のクラスターサイズと料金を一覧表示します。

```sh
pscale size cluster list --org <organization> --engine postgresql --region <region>
```

選択したクラスターサイズで専用の Postgres データベースを作成し、Void のテーブルを作成・マイグレーションできる権限を持つロールを作成します。

```sh
pscale database create void-platform \
  --org <organization> \
  --engine postgresql \
  --region <region> \
  --cluster-size <cluster-size> \
  --wait

pscale role create void-platform main void_owner \
  --org <organization> \
  --inherited-roles postgres
```

ロール作成コマンドが出力する **DATABASE URL** をパスワードマネージャーに保存し、Void の `PostgreSQL DATABASE_URL` プロンプトに貼り付けます。`5432` 番ポートの直接のプライマリ接続を `sslmode=verify-full` で使用してください。ロールのパスワードは作成時にのみ表示されるため、ターミナルを閉じる前に保存してください。

その他のオプションについては、PlanetScale の[データベースコマンド](https://planetscale.com/docs/cli/database)と[ロールコマンド](https://planetscale.com/docs/cli/role)を参照してください。

:::

::: details Neon

最新の [Neon CLI](https://neon.com/docs/cli/install) をインストールして、サインインします。

```sh
pnpm add --global neon@latest
neon login
```

専用のプロジェクト、データベース、オーナーロールを作成します。`<region-id>` は、`aws-us-east-2` など Neon の[サポート対象リージョン](https://neon.com/docs/cli/projects#create)のいずれかに置き換えてください。

```sh
neon projects create --name void-platform \
  --database void_platform \
  --role void_owner \
  --region-id <region-id>
```

出力されたプロジェクト ID を使って、TLS 証明書の検証付きで直接のプライマリ接続 URL を取得します。

```sh
neon connection-string --project-id <project-id> \
  --database-name void_platform \
  --role-name void_owner \
  --endpoint-type read_write \
  --ssl verify-full
```

出力された URL をパスワードマネージャーに保存し、Void の `PostgreSQL DATABASE_URL` プロンプトに貼り付けます。この接続はプーリングなしのままにしてください。その他のオプションについては、Neon の [connection-string コマンド](https://neon.com/docs/cli/connection-string)を参照してください。

:::

### 既存の Hyperdrive を使う {#use-an-existing-hyperdrive}

インストーラーは、Hyperdrive を作成することも、別途管理している Hyperdrive を使用することもできます。既存の構成を使う場合は、次のようにします。

1. ランタイムユーザーを使って、プラットフォーム専用のデータベースを指すように設定し、SQL 結果のキャッシュを無効にします。
2. インストーラーでそれを選択し、データベース、ホスト、ポート、ランタイムユーザーを確認します。
3. Void がマイグレーションを適用できるよう、PostgreSQL URL のプロンプトにデータベースオーナーの接続を指定します。

先に作成する場合は、**Set up a separately managed Hyperdrive** を選択し、表示される手順または [Cloudflare のセットアップガイド](https://developers.cloudflare.com/hyperdrive/get-started/)に従ってください。準備ができたら、インストーラーを再実行します。Void はその構成をユーザーの管理下に置いたままにします。無人セットアップでは、[CI からインストールする](/ja/guide/platform/installation/ci)の Hyperdrive 変数を使用してください。
