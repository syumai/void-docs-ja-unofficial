---
outline: deep
---

# 環境変数 {#environment}

`"void/env"` からインポートします。

## `defineEnv(schema)` {#defineenv-schema}

環境変数のスキーマを登録し、型付きの [`env`](#env) プロキシを返します。Void は `env.ts` を自動的に検出し、dev / build / deploy の際にインポートして `.void/env.d.ts` を生成し、デプロイ前に本番のシークレットを検証し、Worker の起動時に値を検証します。

```ts
import { defineEnv, string, number, oneOf, url } from 'void/env';

export default defineEnv({
  STRIPE_KEY: string(),
  PORT: number().default(3000),
  NODE_ENV: oneOf(['development', 'production']),
  VITE_PUBLIC_URL: url(),
});
```

## `env` {#env}

宣言された環境変数のキーに対する、型付きのランタイムプロキシです。未知のキーとバインディングは `unknown` として通過します。

```ts
import { env } from 'void/env';

const port = env.PORT;
```

## スキーマヘルパー {#schema-helpers}

`void/env` には、Standard Schema 互換のヘルパーとして `string()`、`number()`、`boolean()`、`url()`、`email()`、`oneOf([...])`、`json<T>()` が含まれます。各ヘルパーは `.optional()` と `.default(value)` をサポートします。

クライアント用ではないキーはサーバー側の値であり、本番ではリモートのシークレットストレージを使用します。`VITE_*` キーは、ビルド時に埋め込まれる公開のクライアント側の値です。無効な入力は一様にマスクされます。ストレージは、スキーマの修飾子では選択されません。

## 型 {#types-1}

`void/env` は、グローバルな Cloudflare 環境の型も提供します。

```ts
/// <reference types="void/env" />
```

`DB`、`KV`、`STORAGE`、`AI`、`SANDBOX` のバインディングの型を持つ `Cloudflare.Env` 名前空間を宣言します。

`c.set()` や `c.get()` のようなハンドラーコンテキストの変数には、[`CloudContextVariables`](./types.md#cloudcontextvariables) を拡張します。これは Worker のバインディングを型付けする `Cloudflare.Env` とは別のものです。`@void/vue`、`@void/react`、`@void/svelte` などのフレームワークアダプターも `CloudContextVariables` を拡張し、`useShared()` が使用する `shared` キーを追加します。
