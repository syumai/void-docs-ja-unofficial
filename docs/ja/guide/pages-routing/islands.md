---
outline: deep
---

<script setup>
function islandItems(ext) {
  return [
    {
      name: "pages/",
      children: [
        {
          name: "blog/",
          children: [
            { name: `index.island${ext}`, description: "← アイランドページ" },
            { name: "index.server.ts" },
            { name: `_Counter${ext}`, description: "通常のコンポーネント。アイランドとして使用" },
            { name: `_PostForm${ext}` },
          ],
        },
      ],
    },
  ]
}

function mixedItems(ext) {
  return [
    {
      name: "pages/",
      children: [
        { name: `index${ext}`, description: "通常のページ(完全なハイドレーション、Void Router)" },
        { name: `about${ext}`, description: "通常のページ" },
        {
          name: "blog/",
          children: [
            { name: `index.island${ext}`, description: "アイランドページ(部分的なハイドレーション、静的 HTML)" },
            { name: `[slug].island${ext}`, description: "アイランドページ" },
          ],
        },
      ],
    },
  ]
}

</script>

# アイランド {#islands}

アイランドを使うと、本来は静的なページにインタラクティブなコンポーネントを追加できます。サーバーはページを HTML としてレンダリングし、アイランドとしてマークされたコンポーネントだけがブラウザーに JavaScript を送信します。このアプローチは [Astro](https://docs.astro.build/en/concepts/islands/) に着想を得ています。

たとえば、ブログ記事では本文を静的なままにして、コメントフォームやオーディオプレーヤーのためだけに JavaScript を読み込むことができます。

::: tip 前提条件
アイランドモードは [Pages ルーティング](./overview)の上に構築されています。アイランドを使う前に、動作する Pages のセットアップ(フレームワークアダプターのインストール、`pages/` ディレクトリ、Vite の設定)が必要です。
:::

## アイランドを使う場面 {#when-to-use-islands}

ブログ、マーケティングページ、少数のインタラクティブなコンポーネントを含むドキュメントにはアイランドを使用します。ダッシュボードや、クライアント状態を共有するアプリには、通常の [Pages ルーティング](./overview)を使用してください。

## アイランドページを作成する {#creating-an-island-page}

ページファイルに `.island` サフィックスを付けて名前を付けます。

<FileTree :items="islandItems" adapter-tabs default-expanded />

アイランドページは HTML としてレンダリングされ、アイランドとしてマークしたコンポーネントだけがハイドレートされます。ナビゲーションにはフルページロードが使われます。

ローダーや動的パラメーターを持たないページは、自動的に[プリレンダリング](/ja/guide/edge/prerendering)されます。これを無効にするには、対応する `.server.ts` ファイルで `export const prerender = false` を指定します。

## コンポーネントをアイランドとしてマークする {#marking-components-as-islands}

[import attributes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with) を使って、クライアントでインタラクティブにするコンポーネントをマークします。

::: code-group

```tsx [React]
// pages/blog/index.island.tsx
import Counter from './_Counter' with { island: 'load' };
import PostForm from './_PostForm' with { island: 'visible' };

export default function BlogIndex({ posts }) {
  return (
    <div>
      <h1>Blog</h1>
      <Counter />
      {posts.map((post) => (
        <a key={post.slug} href={`/blog/${post.slug}`}>
          {post.title}
        </a>
      ))}
      <PostForm />
    </div>
  );
}
```

```vue [Vue]
<!-- pages/blog/index.island.vue -->
<script setup>
import Counter from './_Counter.vue' with { island: 'load' };
import PostForm from './_PostForm.vue' with { island: 'visible' };

defineProps({ posts: Array });
</script>

<template>
  <div>
    <h1>Blog</h1>
    <Counter />
    <a v-for="post in posts" :key="post.slug" :href="`/blog/${post.slug}`">
      {{ post.title }}
    </a>
    <PostForm />
  </div>
</template>
```

```svelte [Svelte]
<!-- pages/blog/index.island.svelte -->
<script>
import Counter from "./_Counter.svelte" with { island: "load" };
import PostForm from "./_PostForm.svelte" with { island: "visible" };

let { posts } = $props();
</script>

<div>
  <h1>Blog</h1>
  <Counter />
  {#each posts as post}
    <a href="/blog/{post.slug}">{post.title}</a>
  {/each}
  <PostForm />
</div>
```

```tsx [Solid]
import { For } from 'solid-js';
// pages/blog/index.island.tsx
import Counter from './_Counter' with { island: 'load' };
import PostForm from './_PostForm' with { island: 'visible' };

export default function BlogIndex(props) {
  return (
    <div>
      <h1>Blog</h1>
      <Counter />
      <For each={props.posts}>{(post) => <a href={`/blog/${post.slug}`}>{post.title}</a>}</For>
      <PostForm />
    </div>
  );
}
```

:::

`island` 属性を付けずにインポートされたコンポーネントは、静的な HTML としてのみレンダリングされます。それらのコンポーネントのために JavaScript がブラウザーに送信されることはありません。

::: warning TypeScript の設定
import attributes を使うには、`tsconfig.json` で `"module": "ESNext"` が必要です。

```json
{
  "compilerOptions": {
    "module": "ESNext"
  }
}
```

:::

## ハイドレーション戦略 {#hydration-strategies}

`island` 属性の値によって、コンポーネントが_いつ_ハイドレートされるかが決まります。

| 戦略              | ハイドレートされるタイミング     | 用途                                              |
| ----------------- | -------------------------------- | ------------------------------------------------- |
| `"load"`          | ページの読み込み時               | 重要なインタラクティブ UI(フォーム、ナビメニュー) |
| `"visible"`       | 要素がビューポートに入ったとき   | スクロールしないと見えないコンテンツ              |
| `"idle"`          | ブラウザーがアイドル状態のとき   | 重要度の低い機能拡張                              |
| `"media:(query)"` | CSS メディアクエリに一致したとき | レスポンシブなコンポーネント(例: モバイル専用)    |

```tsx
import Comments from './_Comments' with { island: 'visible' };
import CookieBanner from './_CookieBanner' with { island: 'idle' };
import MobileMenu from './_MobileMenu' with { island: 'media:(max-width: 768px)' };
```

## サーバーハンドラー {#server-handlers}

アイランドページでは、通常のページと同じ `loader` と `action` のパターンを使用します。対応する `.server.ts` ファイルも同じように動作します。

```ts
// pages/blog/index.server.ts
import { defineHandler } from 'void';

export const loader = defineHandler((c) => {
  return c.json({ posts: getAllPosts() });
});

export const action = defineHandler(async (c) => {
  const body = await c.req.json();
  // validate, create post...
  return c.json({ success: true });
});
```

アクションが成功すると、アイランドページは `window.location` を通じてリロードまたはリダイレクトします。通常の Pages ルートでは、代わりに Void Router を使って最新の props を取得します。

## フォーム {#forms}

アイランドページでは、`useForm` が Void Router に依存しているため使用できません。代わりに `useIslandForm` を使用してください。フォームの状態は同じですが、送信ヘルパーはアクションの URL を受け取り、`fetch()` を直接使用します。

::: code-group

```tsx [React]
import { useIslandForm } from '@void/react';

export default function PostForm() {
  const form = useIslandForm({ title: '', body: '' });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        return form.post('/blog');
      }}
    >
      <label htmlFor="title">Title:</label>
      <input
        id="title"
        value={form.data.title}
        onChange={(e) => form.setData('title', e.target.value)}
      />
      {form.errors.title && <span>{form.errors.title}</span>}

      <label htmlFor="body">Body:</label>
      <textarea
        id="body"
        value={form.data.body}
        onChange={(e) => form.setData('body', e.target.value)}
      />
      {form.errors.body && <span>{form.errors.body}</span>}

      <button disabled={form.pending}>{form.pending ? 'Saving...' : 'Add Post'}</button>
    </form>
  );
}
```

```vue [Vue]
<script setup>
import { useIslandForm } from '@void/vue';

const form = useIslandForm({ title: '', body: '' });

function submit() {
  return form.post('/blog');
}
</script>

<template>
  <form @submit.prevent="submit">
    <label for="title">Title:</label>
    <input id="title" v-model="form.data.title" />
    <span v-if="form.errors.title">{{ form.errors.title }}</span>

    <label for="body">Body:</label>
    <textarea id="body" v-model="form.data.body" />
    <span v-if="form.errors.body">{{ form.errors.body }}</span>

    <button :disabled="form.pending">
      {{ form.pending ? 'Saving...' : 'Add Post' }}
    </button>
  </form>
</template>
```

```svelte [Svelte]
<script>
import { useIslandForm } from "@void/svelte";

const form = useIslandForm({ title: "", body: "" });

function submit() {
  return form.post("/blog");
}
</script>

<form on:submit|preventDefault={submit}>
  <label for="title">Title:</label>
  <input id="title" bind:value={form.data.title} />
  {#if form.errors.title}<span>{form.errors.title}</span>{/if}

  <label for="body">Body:</label>
  <textarea id="body" bind:value={form.data.body} />
  {#if form.errors.body}<span>{form.errors.body}</span>{/if}

  <button disabled={form.pending}>
    {form.pending ? "Saving..." : "Add Post"}
  </button>
</form>
```

```tsx [Solid]
import { useIslandForm } from '@void/solid';
import { Show } from 'solid-js';

export default function PostForm() {
  const form = useIslandForm({ title: '', body: '' });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        return form.post('/blog');
      }}
    >
      <label for="title">Title:</label>
      <input
        id="title"
        value={form.data.title}
        onInput={(e) => form.setData('title', e.target.value)}
      />
      <Show when={form.errors.title}>
        <span>{form.errors.title}</span>
      </Show>

      <label for="body">Body:</label>
      <textarea
        id="body"
        value={form.data.body}
        onInput={(e) => form.setData('body', e.target.value)}
      />
      <Show when={form.errors.body}>
        <span>{form.errors.body}</span>
      </Show>

      <button disabled={form.pending}>{form.pending ? 'Saving...' : 'Add Post'}</button>
    </form>
  );
}
```

:::

`useIslandForm` は、[`useForm`](./actions-and-forms#useform) と同じフォームの状態を提供します。送信するには、アクションの URL を `post`、`put`、`patch`、`delete` のいずれかに渡します。

送信に成功するとページがリロードされ、リダイレクトの場合はリダイレクト先へ移動します。`422` レスポンスでは、`{ errors: { field: "message" } }` から `errors` が設定されます。送信ヘルパーは `Promise<void>` を返します。

## ナビゲーション {#navigation}

アイランドページには Void Router がありません。ナビゲーションには通常の `<a>` タグを使用してください。

```tsx
// ✅ アイランドページでは通常のリンクを使用する
<a href="/blog/my-post">Read more</a>

// ❌ <Link> は使わない。処理する Void Router が存在しないため
<Link href="/blog/my-post">Read more</Link>
```

通常のページからアイランドページへ(たとえば `<Link>` で)ナビゲートする場合、ルーターは移動先がアイランドページであることを検出し、自動的にフルページナビゲーションにフォールバックします。

## レイアウト {#layouts}

アイランドページは、通常のページと同様に[レイアウト](./layouts)をサポートします。レイアウトはサーバーレンダリング中にページをラップします。アイランドページ内のレイアウトコンポーネントは**静的のみ**であり、クライアントではハイドレートされません。

## アイランドページと通常のページを混在させる {#mixing-island-and-regular-pages}

アイランドページと通常のページは、同じアプリ内に共存できます。

<FileTree :items="mixedItems" adapter-tabs default-expanded />

通常のページ間のナビゲーションは Void Router が処理します。アイランドページへの移動、またはアイランドページからの移動では、フルページロードが発生します。
