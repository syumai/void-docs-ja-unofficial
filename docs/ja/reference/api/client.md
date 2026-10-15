---
outline: deep
---

# Fetch クライアント {#fetch-client}

`"void/client"` からインポートします。

## `fetch(path, options?)` {#fetch-path-options}

クライアントコードから API ルートを呼び出すための、型安全な fetch クライアントです。[ofetch](https://github.com/unjs/ofetch) をベースに構築されています。ルートのパスと戻り値の型は、生成された `RouteMap` から推論されます。

```ts
import { fetch } from 'void/client';

// Types are fully inferred from your route handlers
const users = await fetch('/api/users');
const user = await fetch('/api/users/:id', {
  params: { id: '1' },
});
```

**シグネチャ:**

```ts
function fetch<P extends keyof RouteMap, M extends MethodsOf<P>>(
  path: P,
  options?: FetchOptions<P, M>,
): Promise<OutputOf<P, M>>;
```

**オプション:**

| オプション | 型                       | 説明                                                         |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `method`   | `string`                 | HTTP メソッド。デフォルトは `"GET"` です。                   |
| `body`     | `unknown`                | リクエストボディ(JSON として自動的にシリアライズされます)。  |
| `query`    | `Record<string, string>` | クエリ文字列のパラメーター。                                 |
| `params`   | `Record<string, string>` | URL パスのパラメーター(`:id` セグメント)。                   |
| `headers`  | `HeadersInit`            | 追加のリクエストヘッダー。                                   |
| `signal`   | `AbortSignal`            | 中止シグナル。                                               |
| `baseURL`  | `string`                 | パスの前に付加されるベース URL。外部への呼び出しに便利です。 |
| `retry`    | `number`                 | リトライの回数(ofetch のデフォルト: GET では 1)。            |
| `timeout`  | `number`                 | リクエストのタイムアウト(ミリ秒)。                           |

パースされた JSON のレスポンスボディを返します。204 レスポンスの場合は `undefined` を返します。2xx 以外のレスポンスでは `FetchError` をスローします。

## `FetchError` {#fetcherror}

`fetch` が 2xx 以外のレスポンスでスローするエラークラスです。

```ts
import { fetch, FetchError } from 'void/client';

try {
  await fetch('/api/users/:id', { params: { id: '999' } });
} catch (e) {
  if (e instanceof FetchError) {
    console.log(e.status); // 404
    console.log(e.response); // raw Response
  }
}
```

**プロパティ:**

| プロパティ | 型         | 説明                                           |
| ---------- | ---------- | ---------------------------------------------- |
| `status`   | `number`   | HTTP ステータスコード。                        |
| `response` | `Response` | 生の `Response` オブジェクト。                 |
| `data`     | `unknown`  | パースされたレスポンスボディ(利用可能な場合)。 |

## ネイティブの `fetch` との違い {#differences-from-native-fetch}

型付きクライアントは [ofetch](https://github.com/unjs/ofetch) をベースに、型付きのルート層を重ねたものです。ネイティブの `fetch` との主な違いは次のとおりです。

| 動作                     | ネイティブの `fetch`                                                 | `void/client` の `fetch`                                                                                                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **戻り値の型**           | `Promise<Response>`。`.json()` は自分で呼び出します                  | `Promise<T>`。JSON を自動でパースし、型付きの結果を直接返します(`204` では `undefined`)                                  |
| **エラー処理**           | どの HTTP ステータスでも解決される。`response.ok` を自分で確認します | 2xx 以外のレスポンスでは `FetchError` をスローします                                                                     |
| **URL の構築**           | 生の URL 文字列                                                      | ルートパスに対する `options.params` からの `:param` 補間と、`options.query` からのクエリ文字列                           |
| **ボディのシリアライズ** | 手動の `JSON.stringify()` と `Content-Type` ヘッダー                 | `options.body` を JSON として自動的にシリアライズし、`Content-Type: application/json` を設定します                       |
| **型安全性**             | 任意の URL とメソッドを受け付けます                                  | パスを `RouteMap` のキーに、メソッドをルートごとに定義されたものに制限します。無効な組み合わせはコンパイル時に失敗します |
| **リトライ**             | なし                                                                 | 408、429、5xx で自動的にリトライします(`retry` オプションで設定可能)                                                     |
| **タイムアウト**         | なし                                                                 | `timeout` オプションで設定可能                                                                                           |

`headers` と `signal` は、変更されずにそのまま内部の fetch に渡されます。
