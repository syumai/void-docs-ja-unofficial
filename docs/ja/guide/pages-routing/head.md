---
outline: deep
---

# Head の管理 {#head-management}

`head()`、ミドルウェア、サイト全体のデフォルトを使って、ページタイトルとメタデータを設定します。ページの値は、ミドルウェアや設定の値より優先されます。

## ページタイトルとメタデータ {#page-titles-and-metadata}

`.server.ts` ファイルから `head()` 関数をエクスポートします。この関数は Hono のコンテキストと解決済みのローダーの props を受け取り、`HeadDescriptor` を返します。

```ts
// pages/posts/[slug].server.ts
import { defineHandler, defineHead } from 'void';

export interface Props {
  post: { title: string; excerpt: string; slug: string };
}

export const loader = defineHandler<Props>(async (c) => {
  const post = await getPost(c.req.param('slug'));
  return { post };
});

export const head = defineHead<Props>((c, props) => {
  // [!code highlight]
  return {
    title: props.post.title,
    meta: [
      { name: 'description', content: props.post.excerpt },
      { property: 'og:title', content: props.post.title },
    ],
  };
});
```

`head()` はローダーの解決後に、サーバーサイドでのみ実行されます。

## サイトのデフォルト {#site-defaults}

サイト全体の head のデフォルトは、`void.config.ts` で設定します。

```json
{
  "head": {
    "titleTemplate": "%s | My Site",
    "htmlAttrs": { "lang": "en" },
    "meta": [
      { "charset": "utf-8" },
      { "name": "viewport", "content": "width=device-width, initial-scale=1" }
    ]
  }
}
```

`titleTemplate` はページタイトルを包みます。`%s` は、`head()` が `title` として返した値に置き換えられます。上記のテンプレートで `{ title: "About" }` を返すページは、`<title>About | My Site</title>` を生成します。

## ミドルウェアのデフォルト {#middleware-defaults}

ミドルウェアで `headDefaults` を設定すると、すべてのページにデフォルトを適用できます。たとえば、最初の描画前にテーマ用のスクリプトを実行できます。

```ts
// middleware/01.head.ts
import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  c.set('headDefaults', {
    script: [
      {
        innerHTML: `const t = localStorage.getItem("theme");
        if (t) document.documentElement.dataset.theme = t;`,
      },
    ],
  });
  await next();
});
```

## 優先順位 {#precedence}

複数のレイヤーが head のデータを提供する場合、次の優先順位でマージされます。

| フィールド  | 動作                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `title`     | ページが優先されます。設定の `titleTemplate` が、優先されたタイトルを包みます。                                           |
| `meta`      | `name` または `property` で重複を排除します。ページのエントリが一致するキーを上書きし、競合しないエントリは追加されます。 |
| `link`      | 連結されます。設定、ミドルウェア、ページの順です。                                                                        |
| `script`    | 連結されます。設定、ミドルウェア、ページの順です。                                                                        |
| `htmlAttrs` | 浅いマージで、競合時はページが優先されます。                                                                              |
| `bodyAttrs` | 浅いマージで、競合時はページが優先されます。                                                                              |

## HeadDescriptor {#headdescriptor}

```ts
interface HeadDescriptor {
  title?: string;
  meta?: Array<{
    name?: string;
    property?: string;
    content?: string;
    charset?: string;
  }>;
  link?: Array<{ rel: string; href: string; [key: string]: string | undefined }>;
  script?: Array<{ src?: string; innerHTML?: string; [key: string]: string | undefined }>;
  htmlAttrs?: Record<string, string>;
  bodyAttrs?: Record<string, string>;
}
```

## Markdown ページ {#markdown-pages}

Markdown ページ（`.md` ファイル）では、フロントマターから head タグが自動的に生成されます。`.server.ts` ファイルは不要です。

```md
---
title: Getting Started
description: Learn how to use Void
---

Your content here...
```

これにより `<title>Getting Started</title>` と `<meta name="description" content="Learn how to use Void">` が生成され、設定されている場合は `titleTemplate` が適用されます。

## クライアントサイドでの更新 {#client-side-updates}

タイトル、メタタグ、リンクは、クライアントサイドのナビゲーション時に自動的に更新されます。

`script`、`htmlAttrs`、`bodyAttrs` は SSR 専用です。クライアントサイドのナビゲーション時には再適用されません。
