---
outline: deep
---

# Typed Fetch {#typed-fetch}

`void/client` から `fetch` をインポートすると、ルートのオートコンプリート、リクエストボディのチェック、レスポンス型の推論が利用できます。

## 基本的な使い方 {#basic-usage}

```ts
import { fetch } from 'void/client';

// GET: 戻り値の型はハンドラーから推論される
const users = await fetch('/api/users');

// POST: ボディの型はハンドラーのバリデーターに照らしてチェックされる
await fetch('/api/users', {
  method: 'POST',
  body: { name: 'Alice', email: 'alice@example.com' },
});

// 動的パラメーターはルートパターンに埋め込まれる
const user = await fetch('/api/users/:id', {
  params: { id: '42' },
});
```

## 型チェックの対象 {#what-gets-type-checked}

クライアントは、リクエストのあらゆる部分に制約をかけます。

- **パス:** `routes/` に定義されたルートだけが受け付けられます。タイプミスはコンパイル時に失敗します。
- **メソッド:** ルートファイルからエクスポートされたメソッドだけが許可されます。ファイルが `GET` だけをエクスポートしている場合、`method: "POST"` を渡すとエラーになります。
- **ボディ、クエリ、パラメーター:** ハンドラーが [`defineHandler.withValidator()`](./server-routing.md#validation) を使っている場合、バリデータースキーマが入力の型になり、クライアントは呼び出し箇所でそれを強制します。
- **レスポンスの型:** 戻り値の型は、ハンドラーが返す値を [JSON シリアライズ](./type-safety.md#serialization)した結果と一致します。

## クエリパラメーター {#query-parameters}

検索パラメーター付きの GET リクエストには `query` を渡します。

```ts
// routes/api/search.ts
export const GET = defineHandler.withValidator({
  query: z.object({ q: z.string(), page: z.string().optional() }),
})((c, { query }) => {
  return { results: [], term: query.q };
});

// クライアント: query は型チェックされる
const data = await fetch('/api/search', {
  query: { q: 'hello' },
});
// data: { results: never[]; term: string }
```

## エラーハンドリング {#error-handling}

2xx 以外のレスポンスは `FetchError` をスローします。

```ts
import { fetch, FetchError } from 'void/client';

try {
  await fetch('/api/users/:id', { params: { id: '999' } });
} catch (e) {
  if (e instanceof FetchError) {
    console.log(e.status); // 404
    console.log(e.data); // パース済みのレスポンスボディ
    console.log(e.response); // 生の Response
  }
}
```

## オプション {#options}

| オプション | 型                       | 説明                                                         |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `method`   | `string`                 | HTTP メソッド。デフォルトは `"GET"` です。                   |
| `body`     | `object`                 | リクエストボディ(JSON として自動的にシリアライズされます)。  |
| `query`    | `Record<string, string>` | クエリ文字列のパラメーター。                                 |
| `params`   | `Record<string, string>` | URL パスのパラメーター(`:id` セグメント)。                   |
| `headers`  | `HeadersInit`            | 追加のリクエストヘッダー。                                   |
| `signal`   | `AbortSignal`            | 中止用のシグナル。                                           |
| `baseURL`  | `string`                 | パスの前に付加されるベース URL。外部への呼び出しに便利です。 |
| `retry`    | `number`                 | リトライ回数(デフォルト: GET では 1)。                       |
| `timeout`  | `number`                 | リクエストのタイムアウト(ミリ秒)。                           |

## SSR 中のアイソモーフィックな fetch {#isomorphic-fetch-during-ssr}

`fetch()` は、サーバーサイドレンダリングやルートハンドラーでも動作します。アプリ自身への呼び出しは、HTTP のラウンドトリップなしで実行されます。

```ts
// src/main.ssr.tsx
import { fetch } from "void/client";
import { defineRender } from "void";

export default defineRender(async (c, assetTags) => {
  // API ルートを HTTP リクエストなしで直接呼び出す
  const data = await fetch("/api/users");

  const html = renderToString(<App users={data} />);
  return new Response(html, {
    headers: { "content-type": "text/html" },
  });
});
```

サーバー側の呼び出しは、受信したリクエストの `cookie` ヘッダーと `authorization` ヘッダーを転送します。明示的に指定したヘッダーが優先されます。
