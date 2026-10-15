---
outline: deep
---

# 認証 {#authentication}

::: warning ⚠️ Void アプリ限定
Void が管理する認証には、Cloudflare 上のネイティブな Void アプリが必要です。メタフレームワークや Node.js、Bun、Deno の場合は、Better Auth を直接使用してください。
:::

Void は、データベース接続、API ルート、クライアントを含めて [Better Auth](https://www.better-auth.com/) をアプリ向けに構成します。まずはメールアドレスとパスワードによる認証から始め、必要に応じてソーシャルログインプロバイダーを追加できます。

## クイックスタート {#quick-start}

### 1. 認証を有効にする {#1-enable-auth}

`void/client` から `auth` をインポートすると、メール/パスワード認証が自動的に有効になります。ソーシャルプロバイダーを追加するには、[設定](#config)を使用します。

### 2. サインアップとサインイン {#2-sign-up-and-sign-in}

`void/client` で事前に構成された認証クライアントを使用します。

```tsx
import { auth } from 'void/client';

// sign up
await auth.signUp.email({
  email: 'alice@example.com',
  password: 'example-password-123',
  name: 'Alice',
});

// sign in
await auth.signIn.email({
  email: 'alice@example.com',
  password: 'example-password-123',
});
```

### 3. サーバールートを保護する {#3-protect-a-server-route}

サインイン済みのユーザーが必要なルートハンドラーやページローダーで `requireAuth` を呼び出します。そのユーザーを返します。リクエストが認証されていない場合は `401` をスローします。

```ts
// routes/api/profile.ts
import { defineHandler } from 'void';
import { requireAuth } from 'void/auth';

export const GET = defineHandler((c) => {
  const user = requireAuth(c);
  return { email: user.email };
});
```

pages モードのローダーで未認証のアクセスを許可したい場合は、`getUser` または `getSession` を使用します。

```ts
// pages/dashboard.server.ts
import { defineHandler, type InferProps } from 'void';
import { getUser } from 'void/auth';

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(() => {
  const user = getUser();
  return { user };
});
```

### 4. サインアウトする {#4-sign-out}

```tsx
await auth.signOut();
```

## 設定 {#config}

認証は、次のいずれかを行うと自動的に有効になります。

- `void/auth` から何かをインポートする
- `void/client` から `auth` をインポートする
- `void.config.ts` に `auth` を追加する
- ルート直下に `auth.ts` ファイルを追加する

メール/パスワードはデフォルトで有効です。ソーシャルプロバイダーを追加するには、次のようにします。

```json
{
  "auth": {
    "providers": ["email", "google", "github"]
  }
}
```

プロバイダーの認証情報は `AUTH_<PROVIDER>_CLIENT_ID` と `AUTH_<PROVIDER>_CLIENT_SECRET` から読み込まれます。`cognito` ではさらにドメイン、リージョン、ユーザープール ID が必要です。`AUTH_COGNITO_DOMAIN`、`AUTH_COGNITO_REGION`、`AUTH_COGNITO_USER_POOL_ID` を設定するか、`auth.ts` で設定してください。

プロバイダーの完全な一覧は、[設定リファレンス](../reference/config.md#auth)を参照してください。

たとえば `github` では次を使用します。

- `AUTH_GITHUB_CLIENT_ID`
- `AUTH_GITHUB_CLIENT_SECRET`

## クライアントでの使い方 {#client-usage}

`auth` クライアントは、`/api/auth` に対して [Better Auth のクライアント API](https://www.better-auth.com/docs/concepts/client) を使用します。Void は使用しているフレームワークに合ったクライアントを自動的に選択します。

カスタムクライアントを使う場合は、`void/client` から `createAuthClient` をインポートします。

## サーバーでの使い方 {#server-usage}

`void/auth` はサーバーサイドのヘルパーを提供します。

```ts
import { getSession, getUser, requireAuth } from 'void/auth';
```

- `getUser()` は現在の `AuthUser | null` を返します
- `getSession()` は `{ user, session } | null` を返します
- `requireAuth(c)` は認証済みのユーザーを返すか、`401` をスローします

型注釈には `void/auth` から `AuthUser` と `AuthSession` をインポートします。それらのフィールドについては、[API リファレンス](../reference/api/auth.md#authuser)を参照してください。

## 動作 {#behavior}

認証セッションは、アプリと同じデータベースを使用します。Void は、`BETTER_AUTH_SECRET` がない場合はデプロイ時に作成し、以降のデプロイでも再利用します。

ローカル開発ではシークレットの設定は不要です。本番ビルドをローカルでプレビューする場合は、`BETTER_AUTH_SECRET` を指定してください。

サインイン済みのリクエストへのレスポンスには `Cache-Control: no-store` が付与されるため、ブラウザキャッシュにも共有キャッシュにもユーザーのデータは保持されません。ルートが `no-store`、または `private` と `no-cache` の組み合わせを設定している場合は、そのルート独自のポリシーが維持されます。繰り返しのリクエストに `304` で応答するには、`private, no-cache` を Hono の [`etag()`](https://hono.dev/docs/middleware/builtin/etag) ミドルウェアと併用します。`ETag` を自分で設定する場合は、`304` が別のアカウントのページを再利用しないよう、ユーザーごとに異なる値にしてください。ブラウザキャッシュは `private, no-cache` のページのコピーを保持するため、ユーザーがサインアウトした後に「戻る」ボタンでそのページが再表示されることがあります。ブラウザキャッシュに残してはならないページでは、デフォルトの `no-store` を維持してください。

別のオリジンからの `POST`、`PUT`、`PATCH`、`DELETE` リクエストおよび WebSocket 接続は、そのオリジンが `trustedOrigins` に含まれていない限り、サインイン済みのセッションを使用しません。別のフロントエンドからアプリを呼び出す場合は、そのオリジンをここに追加してください（[カスタマイズ](#customization)を参照）。ルートが独自の Cookie を使用する場合は、たとえば Hono の [`csrf()`](https://hono.dev/docs/middleware/builtin/csrf) ミドルウェアなどで、リクエストの `Origin` を自分で確認してください。

Cloudflare 上にデプロイされたアプリでは、Better Auth のデフォルト設定（たとえば 10 秒あたり 3 回のサインイン試行）で、クライアント IP ごとに認証リクエストが制限されます。カウントは Worker インスタンスごとに保持されます。制限を変更または無効にするには、`auth.ts` の `rateLimit` を使用します。インスタンス間で 1 つのカウントを共有するには、`rateLimit: { storage: 'database' }` を設定し、Cloudflare への直接デプロイの場合は `void db generate` を実行してください。

### プロキシとエンドツーエンドテスト {#proxies-and-end-to-end-tests}

同じ IP からのすべてのリクエストは、1 つのカウントを共有します。次の 2 つのよくある構成で制限に達します。

- バックエンド・フォー・フロントエンド、Vercel や nginx からのリライト、別の Worker の `fetch` など、サーバーがユーザーの代わりに認証エンドポイントを呼び出す場合。これらすべてのユーザーが、そのサーバーの IP を共有します。
- エンドツーエンドテストが、デプロイ済みのアプリに対してサインアップやサインインを何度も行う場合。

代わりに `x-forwarded-for` からクライアント IP を読み取ることはしないでください。このヘッダーはどのクライアントでも送信できます。信頼できる呼び出し元にシークレットヘッダーを渡し、それを持つリクエストに限って制限をスキップします。

```ts
import { defineAuth } from 'void/auth';

export default defineAuth(({ defaults, env }) => ({
  ...defaults,
  rateLimit: {
    customRules: {
      '/**': (request, rule) =>
        env.AUTH_TRUSTED_KEY && request.headers.get('x-auth-trusted-key') === env.AUTH_TRUSTED_KEY
          ? false
          : rule,
    },
  },
}));
```

`'/**'` はすべての認証エンドポイントにマッチします。`false` を返すと制限をスキップし、`rule` を返すとそれ以外のすべての呼び出し元にデフォルトの制限が維持されます。`env.ts` で `AUTH_TRUSTED_KEY: string().optional()` を宣言し、`void secret put AUTH_TRUSTED_KEY` で設定してください（[環境変数](./env-vars.md#production-server-values)を参照）。

キーを持つリクエストはアプリ側で制限されなくなるため、次の点に注意してください。

- キーを送信するプロキシは、サインアップ、パスワードリセット、確認メールを含め、各ユーザーの代わりに転送するすべての認証リクエストを制限する必要があります。
- テストランナーは、アプリにのみキーを送信してください。ユーザーのブラウザで実行されるコードにキーを含めないでください。

## カスタマイズ {#customization}

高度な設定を行うには、プロジェクトのルートに `auth.ts` を作成し、`defineAuth(...)` をエクスポートします。

```ts
import { defineAuth } from 'void/auth';

export default defineAuth(({ defaults }) => ({
  ...defaults,
  trustedOrigins: ['https://example.com'],
}));
```

`defaults` には Void の規約がすでに含まれています。ディープマージを期待せず、明示的に拡張してください。

利用可能なオプションの全体については、公式の [Better Auth オプションリファレンス](https://www.better-auth.com/docs/reference/options)を参照してください。

## データベースとマイグレーション {#database-and-migrations}

認証用のテーブルは、アプリのテーブルと同じ場所に置かれます。ローカル開発中は、Void がそれらを自動的に作成します。

Void プラットフォームでは、認証用のテーブルが自動的に作成されます。Cloudflare への直接デプロイでは、チェックイン済みのマイグレーションに含めてください。

```sh
void db generate
```

デプロイする前に、SQL を確認してコミットしてください。Void は、認証の設定とプラグインのテーブルを含めます。それらを `db/schema.ts` に重複して記述したり、Better Auth CLI を実行したりする必要はありません。
