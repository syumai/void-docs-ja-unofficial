---
outline: deep
---

# クイックスタート {#quickstart}

Void アプリを作成し、ローカルで実行して、デプロイします。[既存の Vite アプリに Void を追加する](#adding-to-an-existing-vite-app)こともできます。

## アプリを作成する {#create-an-app}

空のディレクトリで、Void をインストールしてセットアップを実行します。

::: code-group

```sh [npm]
npm install -D void
npx void init
```

```sh [pnpm]
pnpm add -D void
pnpm void init
```

```sh [yarn]
yarn add -D void
yarn void init
```

```sh [bun]
bun add -D void
bunx void init
```

:::

UI フレームワーク、スターター、デプロイ先を選択します。ビルドツールの既定は Vite+ です。D1 は、別途データベースサーバーを用意せずにローカルで動作するため、最初のデータベースとして適しています。自分のアカウントにデプロイするには Cloudflare を選択します。デプロイの設定は、今はスキップすることもできます。

Vite+ をグローバルにインストールする必要はありません。セットアップは、既存のパッケージマネージャーのバージョンとロックファイルを維持します。

pnpm では、`pnpm create void my-app` でプロジェクトディレクトリも作成され、ネイティブビルドの権限も設定されます。

## ローカルで実行する {#run-locally}

```sh
npm run dev
```

`http://localhost:5173` を開きます。Pages スターターでは、`pages/` に UI が、コンパニオンの `.server.ts` ファイルにサーバーのローダーとアクションが置かれます。ローダーは、型付きの props としてページコンポーネントにデータを返します。

## サーバールートを呼び出す {#call-a-server-route}

`routes/api/hello.ts` を編集します。スターターに含まれていない場合は作成してください。

```ts
import { defineHandler } from 'void';

export const GET = defineHandler(() => {
  return { message: 'Hello from Void' };
});
```

`http://localhost:5173/api/hello` にアクセスすると、レスポンスを確認できます。クライアントコードからは、Void の型付き fetch で呼び出せます。

```ts
import { fetch } from 'void/client';

const { message } = await fetch('/api/hello');
```

ファイルパスが URL を定義し、ハンドラーがレスポンスの型を定義します。ハンドラー内の `message` を変更すると、TypeScript が新しい形に対してクライアントをチェックします。

データベーススターターには `db/schema.ts` も含まれます。この Drizzle スキーマがテーブルとクエリの型を定義します。Void はローカルデータベースを実行し、デプロイ時に本番用のデータベースをプロビジョニングします。

## デプロイする {#deploy}

セットアップ中にデプロイ先を選択した場合は、次のとおりです。

```sh
npx void deploy
```

セットアップをスキップした場合は、Cloudflare アカウントを選択します。

```sh
npx void deploy --platform cloudflare
```

Void は、必要に応じてブラウザーを開いてサインインを求め、アプリをビルドし、リソースをプロビジョニングし、マイグレーションを適用して、デプロイされた URL を表示します。以降のデプロイでは、保存されたデプロイ先が使用されます。チームのプラットフォーム、CI、ロールバックについては、[デプロイ](./deployment.md)を参照してください。

## 既存の Vite アプリに追加する {#adding-to-an-existing-vite-app}

[上記](#create-an-app)のとおり、パッケージマネージャーで Void をインストールし、`void init` を実行します。セットアップは Vite の設定に `voidPlugin()` を追加し、残りのプロジェクトファイルを作成します。設定の手動編集が必要な場合は、CLI が行うべき変更を表示します。

TanStack Start、React Router、SvelteKit などのメタフレームワークでは、その[統合ガイド](../integrations/frameworks/overview.md)に従ってください。

## 次のステップ {#next-steps}

- [Pages ルーティング](./pages-routing/overview.md): ローダー、レイアウト、フォーム
- [サーバールーティング](./server-routing.md): パラメーター、ミドルウェア、バリデーション
- [データベース](./database.md): クエリとマイグレーション
- [環境変数](./env-vars.md): ローカルの値と本番のシークレット
- [コーディングエージェント](../integrations/agents.md): Void に同梱のドキュメントとスキルを使用する

手動で行った pnpm のインストールでブロックされたビルドスクリプトが報告された場合は、`esbuild`、`sharp`、`workerd` に対して `pnpm approve-builds` を実行してください。`pnpm-workspace.yaml` の `allowBuilds` で `better-sqlite3: false` を設定します。Void は同梱のバイナリーを使用します。
