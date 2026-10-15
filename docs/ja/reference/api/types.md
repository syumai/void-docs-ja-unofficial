---
outline: deep
---

# 型 {#types}

## `CloudContext` {#cloudcontext}

[`CloudEnv`](#cloudenv) で型付けされた Hono の `Context` です。すべてのルートハンドラーとミドルウェアにおける、パラメーター `c` の型です。

```ts
import type { CloudContext } from 'void';
```

## `CloudEnv` {#cloudenv}

Void の Worker 用の Hono の環境型です。Hono の `Env` を拡張し、Cloudflare のバインディングとコンテキスト変数を持ちます。

```ts
interface CloudEnv extends Env {
  Bindings: {
    DB: D1Database;
    KV: KVNamespace;
    STORAGE: R2Bucket;
    AI: Ai;
    SANDBOX: DurableObjectNamespace<import('void/sandbox').VoidPlatformSandbox>;
    [key: string]: unknown;
  };
  Variables: CloudContextVariables;
}
```

## `CloudContextVariables` {#cloudcontextvariables}

`c.set()` / `c.get()` で使用されるコンテキスト変数の型です。このインターフェースを拡張すると、すべてのミドルウェアとハンドラーを通じて引き継がれる型付きの変数を追加できます。

```ts
interface CloudContextVariables {
  user: AuthUser | null;
  session: AuthSession | null;
  [key: string]: unknown;
}
```

**拡張の例:**

```ts
declare module 'void' {
  interface CloudContextVariables {
    requestId: string;
  }
}

// c.get("requestId") → string
```

詳細は[型安全性](../../guide/type-safety.md#context-variables)を参照してください。

## `TypedHandler<V, R>` {#typedhandler-v-r}

`defineHandler` の戻り値の型です。バリデーターの型(`V`)とハンドラーの戻り値の型(`R`)を持ちます。

```ts
interface TypedHandler<V extends ValidatorSlots = {}, R = unknown> {
  (c: CloudContext): Promise<Response> | Response | unknown;
  readonly __validators: V; // type-level only
  readonly __output: R; // type-level only
}
```

## `HeadDescriptor` {#headdescriptor}

`defineHead` が返す、ページの head メタデータの形です。すべてのフィールドは省略可能です。

```ts
interface HeadDescriptor {
  title?: string;
  meta?: Array<{ name?: string; property?: string; content?: string; charset?: string }>;
  link?: Array<{ rel: string; href: string; [key: string]: string | undefined }>;
  script?: Array<{ src?: string; innerHTML?: string; [key: string]: string | undefined }>;
  htmlAttrs?: Record<string, string>;
  bodyAttrs?: Record<string, string>;
}
```

## `RouteMap` {#routemap}

型付きの `fetch` クライアントが使用する、生成されたルートの型です。各ルートのメソッド、入力、出力を含みます。

```ts
import type { RouteMap } from 'void/routes';
```
