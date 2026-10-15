---
outline: deep
---

# Pages ルーティング {#pages-routing}

UI コンポーネントを `pages/` に置くと、ルートになります。ページのサーバーローダーがデータを返し、コンポーネントはそれを props として受け取ります。このパターンは [Inertia.js](https://inertiajs.com/) に着想を得ており、React、Vue、Svelte、Solid で動作します。

Pages モードは、`pages/` ディレクトリが存在すると開始されます。`routes/` と共存でき、UI には pages を、API には routes を使います。ページコンポーネントは通常、最初のレンダリングではサーバー上で、ナビゲーションやインタラクションではブラウザー上で実行されます。

独自のクライアントサイドルーターを使い、[型付き fetch](../typed-fetch.md) で Void の API を呼び出すこともできます。Pages モードは任意です。

## セットアップ {#setup}

空のプロジェクトでは、`void init` が Pages をセットアップできます。Vite+ またはプレーンな Vite を選び、続いて React、Vue、Svelte、Solid のいずれかと、データベース付きまたは静的なスターターを選択します。生成されるアプリには、対応する Vite の設定とページファイルが含まれます。

Pages モードを手動で追加する場合は、`void` と一緒にフレームワークアダプターをインストールします。

::: code-group

```sh [React]
npm install @void/react
```

```sh [Vue]
npm install @void/vue
```

```sh [Svelte]
npm install @void/svelte
```

```sh [Solid]
npm install @void/solid
```

:::

Vite の設定に両方のプラグインを追加します。

::: code-group

```ts [React]
import { voidReact } from '@void/react/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidReact()],
});
```

```ts [Vue]
import { voidVue } from '@void/vue/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidVue()],
});
```

```ts [Svelte]
import { voidSvelte } from '@void/svelte/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidSvelte()],
});
```

```ts [Solid]
import { voidSolid } from '@void/solid/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidSolid()],
});
```

:::

各アダプターには、そのフレームワークの Vite プラグインが含まれています。必要に応じて、`voidReact({ react: { ... } })`、`voidVue({ vue: { ... } })`、`voidSvelte({ svelte: { ... } })`、`voidSolid({ solid: { ... } })` を通じて、フレームワークプラグインのオプションを渡せます。

## ディレクトリ構造 {#directory-structure}

ページは、`about.vue` のようなフラットなファイルでも、`about/index.vue` のようなディレクトリベースのルートでも構いません。どちらも同じルートに対応します。

<PagesFileTree />

各ページには、サーバー上でのみ実行される対応する `.server.ts` ファイルを置けます。次のものをエクスポートできます。

- [**ローダー**](./loaders): `GET` で実行され、ページコンポーネントの props となるデータを返します
- [**アクション**](./actions-and-forms): フォームやプログラムからの呼び出しによるミューテーションを処理します。単一の `action` をエクスポートするか、ページに複数のミューテーションがある場合は複数の[名前付きアクション](./actions-and-forms#named-actions)をエクスポートします
- `ssr = false`: サーバーローダーとクライアントサイドルーティングを維持したまま、ルートをサーバーレンダリングされたコンポーネント HTML から除外します

ファイルベースのルーティングのルールは[サーバールーティング](../server-routing.md)と同じです。動的セグメントには `[param]`、キャッチオールには `[...param]`、ルートグループには `(group)/` を使います。

## ナビゲーションの仕組み {#how-navigation-works}

最初のリクエストでは、レンダリング済みの HTML を受け取ります。以降のナビゲーションでは、ドキュメントを再読み込みせずにローダーを実行してページを更新します。フォームの送信ではアクションを実行し、その後ページの props を更新するかリダイレクトします。

特定のルートをサーバーレンダリングされたコンポーネント HTML から除外するには、対応する `.server.ts` ファイルから `ssr = false` をエクスポートします。

```ts
// pages/dashboard.server.ts
import { defineHandler } from 'void';

export const ssr = false;

export const loader = defineHandler(async () => {
  return { title: 'Dashboard' };
});
```

ローダーは最初のリクエストでも引き続き実行され、その props は HTML シェルに埋め込まれます。ページコンポーネントは、サーバーレンダリングされたマークアップをハイドレートするのではなく、ブラウザー上でマウントされます。

レンダリングとプリレンダリングのフラグは、次のように組み合わさります。

| ページのエクスポート                      | 動作                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ssr` が未設定または `true`               | リクエスト時にコンポーネント HTML をサーバーレンダリングします。                               |
| `ssr = false`                             | リクエスト時に、クライアントでマウントされるシェルを返します。                                 |
| `ssr = false` + `prerender = true`        | ローダーデータを埋め込んだ、クライアントでマウントされるシェルをプリレンダリングします。       |
| `ssr = false` + `prerender = false`       | リクエスト時にのみ、クライアントでマウントされるシェルを返します。プリレンダリングはしません。 |
| アイランドページ + `ssr = false`          | 無効です。アイランドページはすでにアイランドレンダラーを使用しています。                       |
| `output: "static"` + `prerender` が未設定 | パスが判明しているページを自動的にプリレンダリングします。クライアント専用のシェルも含みます。 |

ページ間の SPA ナビゲーションには `Link` コンポーネントを使います。クリックをインターセプトし、ページ全体を再読み込みせずに遷移する `<a>` タグをレンダリングします。

::: code-group

```tsx [React]
import { Link } from "@void/react";

<Link href="/users">Users</Link>
<Link href={`/users/${id}`}>View</Link>
```

```vue [Vue]
<script setup lang="ts">
import { Link } from '@void/vue';
</script>

<template>
  <Link href="/users">Users</Link>
  <Link :href="`/users/${id}`">View</Link>
</template>
```

```svelte [Svelte]
<script>
  import { Link } from "@void/svelte";
</script>

<Link href="/users">Users</Link>
<Link href={`/users/${id}`}>View</Link>
```

```tsx [Solid]
import { Link } from "@void/solid";

<Link href="/users">Users</Link>
<Link href={`/users/${id}`}>View</Link>
```

:::

`Link` は、クエリデータ、履歴の置換、ページ全体のナビゲーション、キャンセルにも対応しています。

```tsx
<Link href="/users" data={{ page: 2, tag: ['active', 'new'] }}>
  Filtered users
</Link>

<Link href="/users" replace>
  Users
</Link>

<Link href="/logout" reloadDocument>
  Sign out
</Link>

<Link
  href="/settings"
  onNavigate={(event) => {
    if (!confirm('Leave this page?')) {
      event.preventDefault();
    }
  }}
>
  Settings
</Link>
```

`prefetch` と `reloadDocument` は、GET リンクでのみ機能します。GET の `data` はクエリパラメーターになります。スカラー値または配列を使ってください。

プログラムによるナビゲーションには、`useRouter()` を使います。

```ts
import { useRouter } from '@void/vue'; // or "@void/react", "@void/svelte", "@void/solid"

const router = useRouter();
router.visit('/users');
router.refresh(); // 現在のページの props を再取得
router.visit('/logout', { method: 'POST' }); // GET 以外のナビゲーション
```

`router.visit()` は、同一オリジンの URL ではページをその場で更新します。別のオリジンの `http(s)` URL ではページ全体が読み込まれ、`javascript:` などのその他のスキームは拒否されます。

動的なルートパラメーターには、同じアダプターパッケージの `useParams()` を使います。

```tsx
import { useParams } from '@void/react';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  return <h1>Post {id}</h1>;
}
```

## スクロール位置の復元 {#scroll-restoration}

Void は、Pages のスクロール位置を自動的に管理します。

- **戻る / 進むナビゲーションとリロード**では、保存されたスクロール位置を復元します。
- **新しいナビゲーション**では、ページの先頭にスクロールします。
- **ハッシュリンク**（`/docs#api`）は、対象の要素までスクロールします。同一ページ内のハッシュリンク（`#section`）では、サーバーへのフェッチ自体をスキップします。

現在のスクロール位置を維持するには、`preserveScroll: true` を渡します。

```ts
router.visit('/users', { preserveScroll: true });
```

`Link` も `preserveScroll` を受け付けます。

::: code-group

```tsx [React]
<Link href="/users" preserveScroll>
  Users
</Link>
```

```vue [Vue]
<Link href="/users" preserve-scroll>Users</Link>
```

```svelte [Svelte]
<Link href="/users" preserveScroll>Users</Link>
```

```tsx [Solid]
<Link href="/users" preserveScroll>
  Users
</Link>
```

:::
