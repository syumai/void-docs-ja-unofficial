---
outline: deep
---

<script setup>
function mdFileItems(ext) {
  return [
    {
      name: "pages/",
      children: [
        { name: `layout.island${ext}` },
        { name: `index.island${ext}` },
        {
          name: "docs/",
          children: [
            { name: `layout.island${ext}`, description: "docs のレイアウト（サイドバー、TOC）" },
            { name: "getting-started.md" },
            { name: "configuration.md" },
            {
              name: "guides/",
              children: [
                { name: "deployment.md" },
              ],
            },
          ],
        },
      ],
    },
  ]
}

</script>

# Markdown {#markdown}

`pages/` に `.md` ファイルを追加すると、Markdown のルートになります。ページはレイアウトを継承し、HTML としてレンダリングされます。JavaScript が使われるのは、[アイランド](./islands)、クライアントスクリプト、コードのコピーボタンのみです。

## セットアップ {#setup}

フレームワークアダプターと一緒に `@void/md` をインストールします。

::: code-group

```sh [React]
npm install @void/md @void/react
```

```sh [Vue]
npm install @void/md @void/vue
```

```sh [Svelte]
npm install @void/md @void/svelte
```

```sh [Solid]
npm install @void/md @void/solid
```

:::

Vite の設定で、フレームワークアダプターの**後ろ**にプラグインを追加します。

::: code-group

```ts [React]
import { voidMarkdown } from '@void/md/plugin';
import { voidReact } from '@void/react/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidReact(), voidMarkdown()],
});
```

```ts [Vue]
import { voidMarkdown } from '@void/md/plugin';
import { voidVue } from '@void/vue/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidVue(), voidMarkdown()],
});
```

```ts [Svelte]
import { voidMarkdown } from '@void/md/plugin';
import { voidSvelte } from '@void/svelte/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidSvelte(), voidMarkdown()],
});
```

```ts [Solid]
import { voidMarkdown } from '@void/md/plugin';
import { voidSolid } from '@void/solid/plugin';
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidSolid(), voidMarkdown()],
});
```

:::

## ページの構成 {#page-anatomy}

Markdown ページは、スクリプトブロック、フロントマター、本文の 3 つの省略可能な部分で構成されます。

```md
<script>
import Counter from "../components/Counter.vue" with { island: "visible" }
</script>

---

title: Getting Started
description: Learn how to use Void

---

# Getting Started

Welcome to Void. Here's an interactive demo:

<Counter />
```

- **`<script>` ブロック:** Markdown のコンパイル前に抽出されます。アイランドのインポートには `with { island: "..." }` 構文を使用します（[アイランド](./islands)を参照）。ブロック内のそれ以外のコードは、ブラウザで実行される[クライアントスクリプト](#client-scripts)になります。
- **フロントマター:** `---` で囲まれた YAML メタデータです。レイアウトからは [`useFrontmatter()`](#frontmatter-access) で読み取れます。
- **本文:** 標準の Markdown と GFM です。`<Counter />` のような大文字で始まるタグはインポートしたコンポーネントを参照し、アイランドとしてレンダリングされます。

## クライアントスクリプト {#client-scripts}

`<script>` ブロックは、アイランドのインポートと、ページの読み込み時に実行される JavaScript に使用します。

```md
<script>
import Counter from "./Counter.vue" with { island: "visible" }
import { format } from "date-fns"

document.querySelector('.date').textContent = format(new Date(), 'PPP')
</script>

# My Post

<Counter />

Published: <span class="date"></span>
```

読み込まれるのは、現在のページのクライアントスクリプトだけです。クライアントコードのないページには、追加のスクリプトは不要です。

## ファイル構成 {#file-structure}

Markdown ページは `pages/` 内の通常のページと同じ場所に置き、同じようにルーティングされます。

<FileTree :items="mdFileItems" adapter-tabs default-expanded />

`.md` ファイルはレイアウトを継承し、動的データ用のコンパニオン `.server.ts` ファイルをサポートし、静的な場合は[自動的にプリレンダリング](/ja/guide/edge/prerendering)されます。ルールは他のページと同じです。

## フロントマターへのアクセス {#frontmatter-access}

レイアウトコンポーネントで `useFrontmatter()` を使うと、現在のページのフロントマターを読み取れます。

::: code-group

```tsx [React]
import { useFrontmatter } from '@void/md';

export default function DocsLayout({ children }) {
  const fm = useFrontmatter();
  return (
    <div>
      <h1>{fm.title}</h1>
      {children}
    </div>
  );
}
```

```vue [Vue]
<script setup>
import { useFrontmatter } from '@void/md';

const fm = useFrontmatter();
// fm.title, fm.description, etc.
</script>

<template>
  <h1>{{ fm.title }}</h1>
  <slot />
</template>
```

```svelte [Svelte]
<script>
import { useFrontmatter } from "@void/md";

const fm = useFrontmatter();
</script>

<h1>{fm.title}</h1>
<slot />
```

```tsx [Solid]
import { useFrontmatter } from '@void/md';

export default function DocsLayout(props) {
  const fm = useFrontmatter();
  return (
    <div>
      <h1>{fm.title}</h1>
      {props.children}
    </div>
  );
}
```

:::

## Pages 仮想モジュール {#pages-virtual-module}

`@void/md/pages` をインポートすると、ビルド時にすべての Markdown ページのメタデータを取得できます。サイドバー、ナビゲーション、検索インデックスの構築に使用できます。

```ts
import pages from '@void/md/pages';
// [{ path: "/docs/getting-started", title: "Getting Started", frontmatter: {...}, headings: [...] }, ...]
```

各エントリは次の形をしています。

```ts
interface MdPage {
  path: string; // route path
  title: string; // from frontmatter.title or first h1
  frontmatter: Record<string, unknown>; // full parsed frontmatter
  headings: { depth: number; slug: string; text: string }[]; // extracted headings
}
```

配列はパス順にソートされ、開発中に `.md` ファイルが追加、削除、変更されると HMR で更新されます。

## デフォルトの CSS テーマ {#default-css-theme}

Markdown プラグインは、2 つのエントリポイントを持つ最小限の CSS テーマを提供します。

### フルテーマ（リセット + ベースライン + コンテンツ） {#full-theme-reset-baseline-content}

完全なスタイルシートが必要なスタンドアロンの Markdown サイトには、このパッケージを使用します。モダンな CSS リセット、ベースのボディスタイル、Markdown コンテンツのすべてのスタイルが含まれます。

```css
@import '@void/md/theme.css';
```

### コンテンツのみ（`.void-md` にスコープ） {#content-only-scoped-to-void-md}

すでに独自のリセットやグローバルスタイルを持つ既存のアプリに Markdown を埋め込む場合は、こちらを使用します。`.void-md` にスコープされたコンテンツのスタイルだけが含まれます。

```css
@import '@void/md/theme-content.css';
```

### 使い方 {#usage}

スタイルをスコープするため、Markdown コンテンツを `.void-md` 要素で囲みます。

```html
<main class="void-md">
  <slot />
</main>
```

テーマが対象とする要素は次のとおりです。

- **本文:** 見出し、段落、リスト、引用、テーブル、インラインコード、リンク、水平線、タスクリスト、`<kbd>`、`<mark>`、定義リスト、脚注。ダークモードは `prefers-color-scheme` と `data-theme` 属性で動作します。
- **コードブロック:** CSS で切り替わる Shiki のデュアルテーマハイライト。JS は不要です。
- **コンテナ:** `:::tip`、`:::warning`、`:::danger`、`:::info`、`:::details` のスタイル。
- **GitHub アラート:** `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]` などの構文のサポート。

### CSS 変数 {#css-variables}

すべてのスタイルは、`.void-md` に設定する CSS 変数でカスタマイズできます。ブランドに合わせて上書きしてください。

```css
.void-md {
  --vmd-link: #8b5cf6;
  --vmd-link-hover: #7c3aed;
}
```

| 変数                | ライトのデフォルト                                                             | ダークのデフォルト | 説明                                                                        |
| ------------------- | ------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------- |
| `--vmd-font-body`   | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`                     | デフォルト         | 本文のフォントスタック                                                      |
| `--vmd-font-mono`   | `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace` | デフォルト         | 等幅フォントスタック                                                        |
| `--vmd-text`        | `#1a1a2e`                                                                      | `#e2e8f0`          | 主要なテキストの色                                                          |
| `--vmd-text-muted`  | `#64748b`                                                                      | `#94a3b8`          | 補助的な（控えめな）テキスト（引用、行番号、脚注）                          |
| `--vmd-link`        | `#2563eb`                                                                      | `#60a5fa`          | リンクの色                                                                  |
| `--vmd-link-hover`  | `#1d4ed8`                                                                      | `#93bbfd`          | リンクのホバー時の色                                                        |
| `--vmd-border`      | `#e2e8f0`                                                                      | `#334155`          | 罫線（h2 の下線、テーブル、インラインコード、`<kbd>`、水平線）              |
| `--vmd-bg-soft`     | `#f8fafc`                                                                      | `#1e293b`          | 控えめな背景（テーブルヘッダー、インラインコード、コードブロック、`<kbd>`） |
| `--vmd-line-height` | `1.75`                                                                         | デフォルト         | 本文の行の高さ                                                              |

ダークモードの値は、`prefers-color-scheme: dark`（自動モード）と `[data-theme="dark"]`（明示的な切り替え）によって自動的に適用されます。ダークを好む設定のシステムでライトモードを強制するには、`<html>` に `data-theme="light"` を設定します。

完全に制御したい場合は、このインポートを使わずに独自の CSS を書くこともできます。

## Markdown の機能 {#markdown-features}

Markdown の機能は静的な HTML としてレンダリングされます。コードのコピーボタンのために、小さなクライアントスクリプトが追加されます。

### コンテナ {#containers}

```md
::: tip
Helpful advice here.
:::

::: warning
Watch out for this.
:::

::: danger
This will break things.
:::

::: info
Some context.
:::

::: details Click to expand
Hidden content here.
:::
```

`::: tip Pro Tip` のように、タイトルをカスタマイズすることもできます。

### GitHub アラート {#github-alerts}

```md
> [!NOTE]
> Useful information.

> [!TIP]
> Helpful advice.

> [!IMPORTANT]
> Key information.

> [!WARNING]
> Potential issues.

> [!CAUTION]
> Dangerous actions.
```

### シンタックスハイライト {#syntax-highlighting}

コードブロックには [Shiki](https://shiki.style) が使われ、デフォルトのテーマは `github-light` と `github-dark` です。

### 行のハイライト {#line-highlighting}

コードフェンスのメタ情報に `{lines}` を指定すると、特定の行をハイライトできます。

````md
```ts {1,3-5}
const a = 1; // highlighted
const b = 2;
const c = 3; // highlighted
const d = 4; // highlighted
const e = 5; // highlighted
```
````

### Diff、フォーカス、エラーレベル {#diff-focus-and-error-levels}

インラインコメントで行に注釈を付けます。

```ts
export function hello() {
  console.log('old'); // [!code --]
  console.log('new'); // [!code ++]
  console.log('look here'); // [!code focus]
  console.log('problem'); // [!code error]
  console.log('careful'); // [!code warning]
}
```

コードブロックにはコピーボタンが付きます。

### 行番号 {#line-numbers}

コードブロックごとに `:line-numbers` で有効にします。

````md
```ts :line-numbers
const a = 1;
const b = 2;
```
````

`:line-numbers=5` のように指定すると、特定の番号から始められます。

### 絵文字 {#emoji}

ショートコードは Unicode に変換されます。`:tada:` は :tada: に、`:rocket:` は :rocket: になります。

### 脚注 {#footnotes}

脚注への参照を文中に書き、定義は文書内の任意の場所に書きます。

```md
Here is a statement with a footnote.[^1]

[^1]: And here is the footnote body.
```

参照と定義は、コンテンツの末尾でリンク付きの脚注リストとしてレンダリングされます。

### 属性 {#attributes}

任意の要素にクラス、ID、属性を追加できます。

```md
# Heading {.custom-class #my-id}

Paragraph with attributes. {.note}
```

### ナビゲーションとメディア {#navigation-and-media}

見出しにはパーマリンクのアンカーが付きます。目次には `[[toc]]` を使用します。画像は遅延読み込みされ、`.md` へのリンクはページのルートに解決されます。

## プラグインオプション {#plugin-options}

```ts
voidMarkdown({
  shiki: {
    themes: { light: 'github-light', dark: 'github-dark' },
  },
});
```

| オプション     | 型                               | デフォルト                                       | 説明                 |
| -------------- | -------------------------------- | ------------------------------------------------ | -------------------- |
| `shiki.themes` | `{ light: string; dark: string}` | `{ light: "github-light", dark: "github-dark" }` | Shiki のカラーテーマ |

コードブロックの言語は、Shiki にバンドルされている言語からオンデマンドで読み込まれます。

## サイドバーの構築 {#building-a-sidebar}

`@void/md/pages` を使って、サイドバーに表示するページを選択します。

```ts
import pages from '@void/md/pages';

const docPages = pages.filter((page) => page.path.startsWith('/docs/'));
```

各エントリについて、`page.path` と `page.title` でリンクを描画します。レイアウトで `useFrontmatter()` を使うと現在のページのメタデータを表示でき、付属のテーマを使う場合はそのコンテンツを `.void-md` で囲みます。
