---
outline: deep
---

# Void プラットフォームのインストール {#install-a-void-platform}

Void プラットフォームを使うと、チームで共有の Cloudflare アカウントにアプリをデプロイできます。管理者がプラットフォームをインストールして保守します。開発者は Void CLI をそのプラットフォームの URL に接続し、有効なログイン方法でサインインして、アプリをデプロイします。

自分自身のためにアプリをデプロイする場合は、[Cloudflare に直接デプロイ](/ja/integrations/cloudflare#deploy-to-your-own-cloudflare-account)してください。先にプラットフォームをインストールする必要はありません。

コアのプラットフォームは、GitHub、Google、汎用 OIDC、Cloudflare Access によるログイン、CLI からのデプロイ、D1、KV、R2、Queues、cron ジョブ、Workers AI、WebSockets、SSE、ISR、ルーティング、ログ、ロールバックをサポートします。

コアのインストールには、マネージドな Sandboxes とメールゲートウェイが含まれます。メールは、共有メールドメインとゾーンを設定すると有効になります。ユーザーダッシュボード、GitHub のビルドと Webhook、ビルド用 Containers、カスタムのプロジェクトドメインは、コアのインストールには含まれません。オプションの GitHub サービスを追加するソースビルドのプラットフォームで、Access が API を保護している場合は、[分離された Webhook 受信のセットアップ](/ja/guide/platform/development/runtime#optional-github-webhook-ingress-for-access-protected-apis)に従ってください。

## デプロイの機能 {#deployment-features}

どちらのターゲットも同じアプリケーション API を使用します。コアのプラットフォームでは、共有アクセスと保持されるデプロイ履歴が追加されます。

| 機能                                                  | Cloudflare に直接デプロイ        | コアのセルフホストプラットフォーム                 |
| ----------------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| 静的サイト、SPA、ネイティブの Pages SSR               | サポート                         | サポート                                           |
| ルーティングルール、WebSockets、Queues、cron、ISR     | サポート                         | サポート                                           |
| D1、KV、R2、Hyperdrive 経由の外部 SQL                 | サポート                         | サポート                                           |
| Workers AI とプロバイダーへのリクエスト               | お使いのアカウントとゲートウェイ | インストールのゲートウェイとプロキシ               |
| ランタイムログ                                        | Cloudflare のライブテール        | プラットフォームが保持するログ                     |
| アプリケーションのロールバック                        | Worker のバージョン              | プラットフォームが保持するデプロイ                 |
| 型付きの Durable State とネイティブの Durable Objects | サポート                         | サポート                                           |
| Sandboxes                                             | Workers Paid と Docker が必要    | プラットフォームのアカウントで Workers Paid が必要 |
| カスタムのアプリケーションドメイン                    | サポート                         | コアのインストールでは利用不可                     |
| 生成される GitHub デプロイワークフロー                | サポート                         | スコープ付きの開発者トークンで自分の CI を使用     |
| ユーザーダッシュボードとマネージドな GitHub ビルド    | 不要                             | 標準のインストールには含まれない                   |

チームのプラットフォームには、Workers for Platforms と[ドキュメント化されたインフラストラクチャ](/ja/guide/platform/installation/domains#cloudflare-footprint)が必要です。利用できる機能は、インストールの構成によって異なります。

## インストールガイド {#installation-guides}

- [前提条件](/ja/guide/platform/installation/prerequisites)
- [認証情報](/ja/guide/platform/installation/credentials)
- [インストールとログインの設定](/ja/guide/platform/installation/setup)
- [最初のデプロイ](/ja/guide/platform/installation/first-deployment)
- [ドメインとリソース](/ja/guide/platform/installation/domains)
- [メンテナンスと復旧](/ja/guide/platform/installation/maintenance)
- [CI からのインストール](/ja/guide/platform/installation/ci)
- [無効化とアンインストール](/ja/guide/platform/installation/uninstall)
