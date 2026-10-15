---
outline: deep
---

# 認証 {#auth}

`"void/auth"` からインポートします。クライアント側のヘルパーは `"void/client"` からインポートします。

## `defineAuth(config)` {#defineauth-config}

Void の Better Auth 設定をカスタマイズするための、高度なエスケープハッチです。

```ts
import { defineAuth } from 'void/auth';

export default defineAuth(({ defaults }) => ({
  ...defaults,
  trustedOrigins: ['https://example.com'],
}));
```

**シグネチャ:**

```ts
function defineAuth(config: VoidAuthConfig): VoidAuthConfig;
```

## `getUser()` {#getuser}

現在の認証済みユーザーを返します。ユーザーが存在しない場合は `null` を返します。

```ts
import { getUser } from 'void/auth';

const user = getUser();
```

**シグネチャ:**

```ts
function getUser(): AuthUser | null;
```

## `getSession()` {#getsession}

現在の Better Auth のリクエスト状態を返します。存在しない場合は `null` を返します。

```ts
import { getSession } from 'void/auth';

const state = getSession();
```

**シグネチャ:**

```ts
function getSession(): AuthState | null;
```

## `requireAuth(c)` {#requireauth-c}

リクエストコンテキストから認証済みユーザーを取り出します。セッションが存在しない場合は、401 の `HTTPException` をスローします。

```ts
import { defineHandler } from 'void';
import { requireAuth } from 'void/auth';

export const GET = defineHandler((c) => {
  const user = requireAuth(c);
  return { email: user.email };
});
```

**シグネチャ:**

```ts
function requireAuth(c: CloudContext): AuthUser;
```

## `AuthUser` {#authuser}

Void が再エクスポートする、Better Auth のユーザーの型です。

```ts
interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## `AuthSession` {#authsession}

Void が再エクスポートする、Better Auth のセッションの型です。

```ts
interface AuthSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}
```

## `AuthState` {#authstate}

認証済みリクエストの状態をまとめたものです。

```ts
interface AuthState {
  user: AuthUser;
  session: AuthSession;
}
```

## `auth` {#auth-1}

`"void/client"` からインポートします。`basePath: "/api/auth"` があらかじめ設定された、すぐに使える Better Auth のクライアントインスタンスです。

```ts
import { auth } from 'void/client';

await auth.signIn.email({ email, password });
await auth.signOut();
```

クライアントの具体的なメソッドは Better Auth のものです。Pages アプリでは、利用可能な場合、Void がフレームワーク固有の Better Auth クライアントパッケージを自動的に選択します。

Void Pages モードを使わず、API / ファイルルートに Void を使用する通常の SPA アプリでは、フレームワーク固有のクライアントを明示的にインポートします。

```ts
import { auth } from 'void/client/react';
// or: 'void/client/vue'
// or: 'void/client/svelte'
// or: 'void/client/solid'
```

これらのサブパスは `void/client` と同じ `fetch`、`fetchStream`、認証関連のエクスポートを維持しつつ、`auth` と `createAuthClient` を Better Auth のフレームワークパッケージに結び付けます。

## `createAuthClient` {#createauthclient}

`"void/client"` からインポートします。高度な用途のために、Better Auth の `createAuthClient` を再エクスポートしたものです。

```ts
import { createAuthClient } from 'void/client';

const auth = createAuthClient({ basePath: '/api/auth' });
```
