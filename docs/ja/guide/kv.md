---
outline: deep
---

# Key-Value ストレージ {#key-value-storage}

`void/kv` の `kv` を使って、[Cloudflare Workers KV](https://developers.cloudflare.com/kv/) のデータを読み書きします。値は JSON として保存され、`kv.map()` はコレクションに専用のキープレフィックスと値の型を与えます。

## 基本操作 {#basic-operations}

### 取得 {#get}

```ts
import { kv } from 'void/kv';

const user = await kv.get<User>('user:123');
// User | null
```

値は自動的に JSON としてパースされます。保存された値が有効な JSON でない場合は、生の文字列が返されます。

### 書き込み {#put}

```ts
await kv.put('user:123', { name: 'Alice', role: 'admin' });
```

文字列を含むすべての値は JSON にシリアライズされます。読み取り時には型が保持されるため、`"123"` や `"null"` のような文字列は文字列として返されます。

TTL（秒単位）または絶対的な有効期限（Unix タイムスタンプ）を追加できます。

```ts
await kv.put('session:abc', sessionData, { ttl: 3600 });
await kv.put('token:xyz', tokenData, { expiration: 1700000000 });
```

キーにメタデータを付与できます。

```ts
await kv.put('user:123', userData, {
  metadata: { updatedBy: 'admin' },
});
```

### 削除 {#delete}

```ts
await kv.delete('user:123');
```

### 一覧取得 {#list}

```ts
const result = await kv.list({ prefix: 'user:' });
// { keys: [{ name: "user:1" }, { name: "user:2" }], list_complete: true }
```

`limit` と `cursor` でページネーションできます。

```ts
const page = await kv.list({ prefix: 'user:', limit: 100 });
if (!page.list_complete) {
  const next = await kv.list({ prefix: 'user:', limit: 100, cursor: page.cursor });
}
```

### メタデータ付きで取得 {#get-with-metadata}

```ts
const result = await kv.getWithMetadata<User, { updatedBy: string }>('user:123');
// { value: User | null, metadata: { updatedBy: string } | null }
```

## 型付きマップ {#typed-maps}

同じ型のコレクションには、`kv.map()` を使って、キーのプレフィックスが自動的に付く、スコープ付きの型付きクライアントを作成できます。

```ts
const sessions = kv.map<Session>('sessions');

await sessions.put('abc', { userId: 1, token: '...' }, { ttl: 3600 });
// KV key: "sessions:abc"

const session = await sessions.get('abc');
// Session | null

await sessions.delete('abc');
```

マップは、すべてのキーに自動的に `"sessions:"` のプレフィックスを付け、一覧取得時にはそのプレフィックスを取り除きます。

```ts
const result = await sessions.list();
// keys: [{ name: "abc" }, { name: "def" }]  (プレフィックスは取り除かれます)
```

マップには、基本クライアントと同じメソッド（`get`、`put`、`delete`、`list`、`getWithMetadata`）がありますが、値は型付きで、プレフィックスも自動的に付きます。

このクライアントで足りない操作には、ルートハンドラー内で `c.env.KV` から生の `KVNamespace` にアクセスします。
