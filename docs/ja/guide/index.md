---
outline: deep
---

# Void とは? {#what-is-void}

Void は、Vite を基盤とした Cloudflare Workers 向けのフルスタックフレームワークです。UI は React、Vue、Svelte、Solid のいずれかで構築し、サーバーコードも同じプロジェクト内に書けます。Void はルーティング、データアクセス、デプロイをつなぎ、アプリ全体で型を共有します。

まずは[クイックスタート](./quickstart.md)で、アプリを作成してデプロイしてみてください。すでにメタフレームワークを使っている場合は、そのフレームワークの[統合ガイド](../integrations/frameworks/overview.md)に従ってください。

## サーバールートとページ {#server-routes-and-pages}

ルートはファイルで定義します。`routes/api/users.ts` のハンドラーは `/api/users` を処理し、`pages/users/index.tsx` のコンポーネントは `/users` を描画します。

各ページには、対応する `.server.ts` ファイルを置けます。**loader** はデータを読み取り、型付きの props をコンポーネントに返します。**action** はフォームなどの更新処理を扱い、ページを更新します。サーバーコードはサーバー上にとどまります。コンポーネントは最初にサーバーで描画され、ナビゲーションやインタラクションのためにブラウザでも実行されます。

フルスタックの UI には [Pages ルーティング](./pages-routing/overview.md)を使います。独自のクライアントサイドルーターを使い続けて、[typed fetch](./typed-fetch.md) で[サーバールート](./server-routing.md)を呼び出すこともできます。フロントエンドなしで API だけを構築することも可能です。

## コードから使えるリソース {#resources-from-your-code}

`void/db` から `db` をインポートすると、データベースにクエリできます。Void は開発中にローカルデータベースを提供し、デプロイ時にデータベースをプロビジョニングします。インポートにより、[KV](./kv.md)、[オブジェクトストレージ](./storage.md)、[キュー](./queues.md)などのリソースも有効になります。既存のリソースに接続したい場合は、設定を使用します。

Drizzle スキーマがデータベースの型を定義します。ハンドラーはレスポンスの型を推論し、typed fetch が呼び出し側をチェックします。ページの loader と action は、同じ型をコンポーネントやフォームに引き継ぎます。フィールドを変更すると、アプリ内のどこを修正すべきかがわかります。

## ローカル開発から本番環境まで {#from-local-development-to-production}

Vite は Cloudflare のランタイムを使ってアプリをローカルで実行します。`void deploy` はアプリをビルドし、リソースをプロビジョニングし、データベースマイグレーションを適用して公開します。[環境変数](./env-vars.md)は、スキーマ、ローカル値、本番シークレットで管理します。

[ご自身の Cloudflare アカウント](./deployment.md#deploy-to-cloudflare)にデプロイすることも、チームが運用する [Void プラットフォーム](./self-hosted-platform.md)に接続することもできます。どちらも同じアプリケーション API を使用します。プラットフォームを使うと、共有アクセス、デプロイ履歴、管理機能が加わります。

Void は[既存のフレームワークや静的サイト](./app-types.md)もデプロイできます。ルーティングとレンダリングはフレームワークがそのまま担当し、Void はリソースとデプロイを担当します。

## 次のステップ {#next-steps}

- [クイックスタート](./quickstart.md): 最初のアプリを作成する
- [Pages ルーティング](./pages-routing/overview.md): loader、レイアウト、フォーム
- [データベース](./database.md): スキーマ、クエリ、マイグレーション
- [デプロイ](./deployment.md): Cloudflare、チームプラットフォーム、CI
