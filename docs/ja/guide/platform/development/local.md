---
outline: deep
---

# ローカル開発 {#local-development}

## リポジトリのセットアップ {#setting-up-the-repository}

フォークをクローンし、Vite+ でワークスペースの依存関係をインストールします。

```sh
git clone https://github.com/your-org/void.git
cd void
vp install
vpr install:void-dev
void-dev --help
```

`.node-version` に記載されている Node.js のバージョンを使用してください。

`install:void-dev` は、CLI、共有パッケージ、プラットフォームランタイムをビルドし、このチェックアウトのビルド済み CLI を `void-dev` としてグローバルに使えるようにします。公開パッケージはビルド済みファイルをエクスポートするため、以降にソースを変更した後は `vp run build:core` を実行してエイリアスを更新してください。インストーラーは、無関係なグローバルコマンドを置き換えることを拒否します。このチェックアウトのエイリアスだけを削除するには `vpr uninstall:void-dev` を使用します。これらの開発ページのコマンドは、リポジトリのルートから実行します。

## 実装の場所を探す {#finding-the-implementation}

| ディレクトリ                                         | 用途                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/void`                                      | フレームワーク、アプリケーションランタイム、CLI                                     |
| `packages/platform`                                  | インストーラーの契約、パッケージ化された Worker、プラットフォームのマイグレーション |
| `packages/deploy-core`, `packages/deploy-cloudflare` | 共有のデプロイ契約と Cloudflare のアップロードコード                                |
| `platform/packages/api`                              | ユーザー、プロジェクト、デプロイ、プロビジョニング、管理者 API/UI                   |
| `platform/packages/dispatch`                         | アプリケーションのルーティングと静的アセット                                        |
| `platform/packages/proxy`                            | AI、リモートバインディング、再検証                                                  |
| `platform/packages/email-gateway`                    | 受信メールのルーティングとテナントへの配信                                          |
| `platform/packages/tail`                             | ランタイムログの取り込み                                                            |
| `platform/packages/dashboard`                        | ダッシュボードのソースと、`ui/` 内のローカル UI コンポーネント                      |

`@voidcloud/*` という名前は、ワークスペースの実装パッケージを示します。これらの `private: true` フラグにより、それらのパッケージが npm に公開されることを防いでいます。デプロイ可能なコア Worker は、公開パッケージ `@void/platform` にバンドルされます。

コアのインストーラーは、API、dispatch、proxy、tail、メールゲートウェイの各 Worker を作成します。ダッシュボードと、管理された GitHub ビルドサービスはソースツリーに含まれていますが、そのインストールには含まれません。オプションのサービスを追加するには、そのインフラ、バインディング、認証、ケイパビリティの設定をまとめて行う必要があります。

## API をローカルで実行する {#running-the-api-locally}

ローカルの PostgreSQL サーバーを起動し、`psql` と `pg_isready` をパスから利用できるようにします。その後、開発用データベースを作成し、マイグレーションを適用して、管理者をシードします。

```sh
vp run --filter @voidcloud/api setup --admin-email dev@example.com
vp run --filter @voidcloud/api dev:admin
```

このコマンドはオプションのビルド用コンテナを無効にするため、基本的な API と管理画面の作業に
Docker は不要です。管理されたビルドを開発するには、Docker をインストールし、
コンテナを有効にして API を実行してください。

`http://localhost:8787/admin/` を開きます。セットアップでは、API のローカルデータベース接続と開発用の認証バイパスが `platform/packages/api/.dev.vars` に書き込まれます。別途動かすダッシュボード用には `platform/packages/dashboard/.env` が設定されます。どちらのファイルも Git では無視されます。本番インストールでは、インストーラーによって別の認証情報が発行されます。

API の開発用バイパスにより、OAuth を設定せずにブラウザの管理 UI の開発ができます。オペレーター用 CLI のセッションでは引き続き管理者認証が必要で、ブラウザ用のバイパスは使用されません。

`dev:admin` はソースファイルを監視し、編集後にブラウザを自動的にリロードします。管理ダッシュボードの React コンポーネントやスタイルの作業中は、起動したままにしてください。プラットフォームのデプロイは不要です。セットアップには、各ビューをローカルで試せるサンプルのユーザー、プロジェクト、デプロイが含まれています。

## ダッシュボードをローカルで実行する {#running-the-dashboard-locally}

ダッシュボードは、独立したソースアプリです。API のセットアップ後、別のターミナルで起動します。

```sh
vp run --filter @voidcloud/dashboard dev
```

セットアップにより、ダッシュボードのローカルの `.env` は、起動した API を指すように設定されます。

```dotenv
API_URL=http://localhost:8787
SITE_DOMAIN=apps.example.com
```

Vite の URL を開き、**Dev login (local API)** を選択します。このボタンは localhost の API に対して表示され、ローカルの開発用サインインエンドポイントを使用します。

自分で運用している API をダッシュボードから指すこともできます。その API が Cloudflare Access で保護されている場合は、`cloudflared` をインストールし、オリジンを一致させたうえで、ダッシュボードのローカルトークンヘルパーを有効にします。

```dotenv
API_URL=https://platform.example.com
CF_ACCESS_APP_URL=https://platform.example.com
SITE_DOMAIN=apps.example.com
```

このヘルパーは、開発サーバーの起動前に Access セッションを更新します。人間によるダッシュボードへの
リクエストには、ユーザーの Void ログインに加えて Access セッションが必要です。
サービストークンはそのユーザーを表しません。サービストークンのペアは、スコープを絞った
マシン操作用です。これはダッシュボード開発用の設定です。Access の
認証情報は、プラットフォームのログイン認証情報とは別のものです。

デプロイ済みのダッシュボードでは、その `API` サービスをプラットフォームの API にバインドし、
ダッシュボードと API の両方で `DASHBOARD_URL` を設定し、そのダッシュボードのオリジンを正確に
プラットフォームの Access 保護アプリケーションに含めます。ダッシュボードは、そのサービスバインディングを使って、
ブラウザの会社 ID を API に渡します。ログインページには、プラットフォームで現在有効なログイン方法が表示され、
**Account** では追加のログイン ID を登録できます。

## 変更のテスト {#testing-changes}

開発中は、変更した領域のテストを実行します。

```sh
vp test run platform/packages/api/test/integration/operator-auth.test.ts
vp run check
```

リリースの準備をする前に、パッケージをビルドし、すべてのチェックを実行します。

```sh
vp run build:all
vp run check
vp lint
vp run lint:platform
vp fmt --check
vp test run
vp run build:docs
```

プラットフォームの統合テストは、デフォルトでローカルのテスト用データベースを使用します。PostgreSQL でテストするには、`VOID_TEST_DATABASE_URL` に使い捨てのデータベースを設定してください。これらのテストはケースごとにテーブルをクリアします。

デプロイ済みのアプリケーションを検証するには、`playground/kitchen-sink` の使い捨てコピーをデプロイし、その URL を `SMOKE_URL` として、`platform/scripts/kitchen-sink-smoke-test.md` に記載されているスモークテストに渡します。このテストはアプリケーションデータを作成し、削除します。
