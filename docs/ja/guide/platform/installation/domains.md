---
outline: deep
---

# ドメインとリソース {#domains-and-resources}

## ドメインを追加する {#adding-a-domain}

ドメインの準備ができたら、次を実行します。

```sh
void platform domain set example.app --plan
void platform domain set example.app
```

このコマンドは、インストール済みのプラットフォームを選択し（または選択画面を表示し）、そのゾーンを検索または作成し、DNS とルーティングを設定したうえで、HTTPS を検証してから新しいアプリケーション URL を公開します。DNS やゾーンを作成する場合は、[インストールのセットアップ](/ja/guide/platform/installation/setup)で説明されているとおりに管理トークンを設定してください。既存のランタイムトークンには、新しいゾーンに対する **Cache Purge: Purge** を付与します。Void は、実行中のプラットフォームを通じてその権限を確認するため、トークンを再度貼り付ける必要はありません。

ネームサーバー、証明書、またはプロジェクトの Zero Trust 保護が保留中の場合は、表示されるガイダンスに従って、同じコマンドを再実行してください。Void は、新しい URL を利用可能にする前に、各プロジェクトの公開または保護の設定を維持します。workers.dev のアプリ URL は、セットアップ中もその後も引き続き動作します。プロジェクト、デプロイ、シークレット、プラットフォームの API URL は変わらないため、開発者が再接続する必要はなく、設定済みのログインコールバックも変更されません。DNS や設定の変更が反映されるまでには時間がかかる場合があります。

インストールを明示的に選択するには `--installation <id>` を、`apps.example.com` のようなアプリドメインには `--zone example.com` を、専用ゾーンでのキャッチオールルーティングには `--dedicated-zone` を使います。ネストされたドメインでも、後述のワイルドカード証明書が必要です。このコマンドは最初のドメインを追加するもので、既存のアプリケーションドメインの置き換えは現在サポートされていません。インストール済みのランタイムを使用するため、`--runtime` やアプリの再デプロイは不要です。

既存の Worker カスタムドメインに引き続き到達できるように、ワイルドカードがそれらと競合しないアプリケーションドメインを選んでください。すべてのリクエストを対象とする、より限定的な既存のルートがあれば、それらのホスト名を維持できます。Void が競合を報告した場合は、別のアプリケーションドメインを選んでください。新規インストールでは、`void platform install --workers-dev` で開始し、適切なドメインを後から追加できます。

ブラウザーのログインセッションは、オリジンごとに固有です。独自の OAuth プロバイダーを使用するアプリは、新しいコールバック URL の登録が必要になる場合があります。Void の組み込み認証は、アプリがその設定を上書きしない限り、リクエストのオリジンを自動的に使用します。

1 つのアプリケーションドメイン上のアプリは、そこにある他のアプリが受け取る Cookie を設定できます。`apps.example.com` のようなネストされたドメインでは、アプリは `example.com` とその他のサブドメイン向けの Cookie も設定できます。`workers.dev` のテスト用 URL 上のアプリは、アカウントの `workers.dev` サブドメイン上のすべての Worker が受け取る Cookie を設定できます。チーム外の人がデプロイできる場合は、Void のアプリのみを配信するドメインを使用してください。何千もの独立した開発者にサービスを提供するプラットフォームは、そのアプリケーションドメインを [Public Suffix List](https://github.com/publicsuffix/list/wiki/Guidelines) に掲載申請することもできます。

### テストモードでは何が変わるか {#what-changes-in-testing-mode}

テストモードでは、各アプリに `workers.dev` の URL が割り当てられます。これらの URL は、ドメインを追加した後も引き続き動作し、新しいアプリはそのドメインを使用します。

テスト用 URL は、WebSocket、SSE、共有 ISR ストレージをサポートしますが、追加のエッジレスポンスキャッシュは使用しません。転送用の Worker は、アンインストール後に手動でのクリーンアップ用に残ります。プラットフォームの無効化とプロジェクトの停止は、引き続きそれらのトラフィックをブロックします。

## その他のドメインオプション {#other-domain-options}

::: details カスタム API ホスト名

インストール時に `--control-plane-domain platform.example.net` を渡します。ホスト名は、選択したアカウントと管理トークンが管理できるゾーンに属している必要があります。省略すると、API は `workers.dev` に残ります。

:::

### ネストされたアプリケーションドメインを使う {#using-a-nested-application-domain}

::: details 既存の会社のゾーン内で apps.example.com を使う

`my-app.apps.example.com` のアプリには、`*.apps.example.com` の証明書が必要です。`example.com` の Universal SSL は、第 1 レベルのホスト名のみを対象とします。インストールの前に、有料アドオンの [Advanced Certificate Manager](https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/) でアクティブなワイルドカード証明書を設定するか、既存のカスタムワイルドカード証明書を使用してください。

```sh
void platform install --application-domain apps.example.com --zone example.com --plan
```

管理トークンには、証明書の確認のために、そのゾーンに対する **SSL and Certificates: Read**（または Edit）が必要です。Void は、証明書を注文したり、有料プロダクトを自動的に有効にしたりしません。`--dedicated-zone` は指定しないでください。このフラグは、アプリケーションドメインがゾーン全体であるインストール専用で、他のどこにも一致しないトラフィック向けにキャッチオールのルートを追加します。

:::

## オプションのダッシュボード {#optional-dashboard}

API の `/admin/` ページは、コアのインストールに含まれています。オプションのユーザーダッシュボードは別途デプロイでき、インストール時に `--dashboard-url https://dash.example.com` でその HTTPS オリジンを設定できます。

既存のインストールでは、次のコマンドで設定をプレビューして適用します。

```sh
void platform repair <installation-id> --dashboard-url https://dash.example.com --plan
void platform repair <installation-id> --dashboard-url https://dash.example.com --yes
```

オリジンには、認証情報、パス、クエリ、フラグメントを含めることはできません。Void はこれをログインコールバック用に保存し、アップグレードや修復後も保持します。このコマンドは、ダッシュボード用の Worker や DNS レコードを作成しません。ソースアプリの[スタンドアロンダッシュボードの準備](https://github.com/voidzero-dev/void/tree/main/platform/packages/dashboard#standalone-deployment)に従って、未使用の Worker 名、ダッシュボードのホスト名、インストール済みの API Worker のサービスバインディングを使い、独自のコピーをデプロイしてください。`API_URL` には公開 API のオリジンを、`DASHBOARD_URL` にはダッシュボードのオリジンを、`SITE_DOMAIN` にはインストールのアプリケーションドメインを設定します。保存済みのオリジンを維持するには、このオプションを省略します。ダッシュボードで提供されるのは、サインイン、連携したログイン方法、サインアウトです。ユーザーのプロジェクトやチームの管理には、CLI を使ってください。

Access でプラットフォームを保護している場合は、その Access アプリケーションがこのダッシュボードのオリジンも対象に含める必要があります。保護をインストールするときに、オリジンを設定してください。すでに保護されているプラットフォームでこれを変更するには、認証設定を通じて意図的に保護を削除し、オリジンを適用してから、再度保護を有効にします。サインアップが Access のゲートに依存している場合は、先に別の承認ルールを選択してください。設定されたオリジンが有効な保護の範囲外にある場合、メンテナンスは停止します。

## Cloudflare のフットプリント {#cloudflare-footprint}

新しいプラットフォームのリソースには、Cloudflare が許容する範囲で、`void-team-api` のような、決定的な `void-<installation-name>-<role>` 形式の名前が使われます。アカウント内で未使用のインストール名を選んでください。所有していない名前と競合した場合、Void はそのリソースを置き換えずに停止します。既存のインストールは、サフィックス付きの古い名前も含め、記録された名前を維持します。

| リソース                                  |                                         数 | 用途                                                                                                            |
| ----------------------------------------- | -----------------------------------------: | --------------------------------------------------------------------------------------------------------------- |
| Workers                                   | 5、および workers.dev を使うアプリごとに 1 | API / コントロールプレーン、プロキシ、tail の取り込み、ディスパッチ、メールゲートウェイ、テストオリジンへの転送 |
| KV namespaces                             |                                          3 | ルーティング、ISR キャッシュ、静的アセットのストレージ                                                          |
| R2 buckets                                |                                          1 | 静的アセットとデプロイのアセット                                                                                |
| Queues                                    |                                          3 | 使用量イベント、cron の起動、デプロイ                                                                           |
| Workers for Platforms dispatch namespaces |                                          1 | ユーザーアプリケーションの Worker                                                                               |
| Hyperdrive configurations                 |                                          1 | 外部のプラットフォーム用 PostgreSQL                                                                             |
| AI Gateways                               |                                          1 | インストールごとに分離された AI のルーティングと計測                                                            |
| プロキシ経由のワイルドカード DNS レコード |                                 0 または 1 | アプリケーションドメインが設定されている場合にのみ作成                                                          |
| Zones                                     |                                 0 または 1 | 要求されたアプリケーションゾーンが存在しない場合にのみ作成                                                      |

API Worker は、使用量、cron のスケジューリング、エラー監視、同時実行制御のために、4 つの Durable Object クラスを使用します。Worker のバインディングは、Analytics Engine にリクエストおよびログのデータセットを作成します。Analytics Engine は[アカウントで有効化](/ja/guide/platform/installation/prerequisites#if-cloudflare-rejects-analytics-engine)されている必要があります。コアのインストールでは、Container アプリケーション、GitHub App、ダッシュボード用 Worker、ビルド用 Worker は作成されません。
