---
outline: deep
---

# 型安全性 {#type-safety}

Void は、データベーススキーマ、ルートハンドラー、ページローダーから型を推論します。フィールドを変更すると、どのクエリ、リクエスト、コンポーネントを変更する必要があるかを TypeScript が示してくれます。

## 型のパイプライン {#the-type-pipeline}

<img src="./type-pipeline.svg" alt="Type pipeline: Drizzle schema flows to DB types, branching into route handlers (typed fetch), page loaders (component props), and page actions (useForm / action())" style="max-width: 720px; width: 100%;" />

1. **データベースの型**は、[Drizzle スキーマ](./database.md#schema-definition)から得られます。カラムの型はコンパイル時にわかります。
2. **ルートハンドラー:** 戻り値の型とバリデーターのスキーマから、生成された `RouteMap` が作られ、[型付き fetch](./typed-fetch) クライアントがそれを利用します。
3. **ページローダー:** 戻り値の型は、`InferProps` を介してページコンポーネントに props として渡されます。
4. **ページアクション:** バリデーターのスキーマは `useForm` と `action()` に渡され、型付きのデータ、エラー、URL の自動補完が得られます。

生成された型はすべて `.void/` に置かれ、ソースファイルやスキーマが変更されると自動的に更新されます。

## データベース → ハンドラー → クライアント {#database-handler-client}

型は、手動のアノテーションなしで、Drizzle スキーマからハンドラーを経てクライアントまで流れます。

```ts
// routes/api/users.ts
export const GET = defineHandler(async (c) => {
  return db.select({ name: users.name, email: users.email }).from(users);
  //     ↑ 戻り値の型はスキーマのカラムから推論される
});

export const POST = defineHandler.withValidator({
  body: insertUserSchema, // ← Drizzle スキーマから導出
})(async (c, { body }) => {
  return db.insert(users).values(body).returning();
});
```

```ts
// クライアント: 型は上記のハンドラーから推論される
const users = await fetch('/api/users');
//    ↑ { name: string; email: string }[]

await fetch('/api/users', {
  method: 'POST',
  body: { name: 'Alice', email: 'alice@example.com' }, // ← バリデーターから型付けされる
});
```

Drizzle スキーマは、データベースのカラム、実行時のバリデーション、ハンドラーの入力型、クライアント側の型チェックをすべて同時に定義します。テーブルに対応しないエンドポイントでは、任意の [Standard Schema](./server-routing.md#manual-validators) ライブラリを使用できます。

## ローダー → ページ props {#loader-page-props}

[Pages モード](./pages-routing/overview)では、ローダーの戻り値の型が `InferProps` を介してページコンポーネントに渡されます。

```ts
// pages/users/index.server.ts
export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  return { users: await db.select().from(users) };
});
```

```vue
<!-- pages/users/index.vue -->
<script setup lang="ts">
import type { Props } from './index.server';
defineProps<Props>(); // ← { users: { id: number; name: string; ... }[] }
</script>
```

手動でインターフェースを書く必要はありません。props は、ローダーが返す内容と常に同期します。

## アクション → useForm {#action-useform}

ページアクションが `withValidator()` を使用している場合、ボディのスキーマは `useForm` に渡されます。これにより、型付きの `data`、型付きの `errors` のキー、URL の自動補完が得られます。

```ts
// pages/users/create.server.ts
export const action = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c, { body }) => {
  await db.insert(users).values(body);
});
```

```ts
const form = useForm('/users/create', { name: '', email: '' });
//                    ^ 自動補完される     ^ ボディのスキーマに一致する必要がある

form.errors.email; // ✓ string | undefined
form.errors.foo; // ✗ TypeScript エラー
```

[名前付きアクション](./pages-routing/actions-and-forms#named-actions)も同じように動作します。`?actionName` サフィックスにより、そのアクションに対応する型が選択されます。

```ts
const updateForm = useForm('/users/:id?update', { name: '' }, { params: { id } });
const deleteForm = useForm('/users/:id?delete', { id: '' }, { params: { id } });
// 各フォームの data と errors は、それぞれのバリデーターから型付けされる
```

`action()` ヘルパーも同じ型チェックを受けられます。完全な API については、[アクションとフォーム](./pages-routing/actions-and-forms)を参照してください。

## チェックされる内容 {#what-gets-checked}

| レイヤー           | 型チェックされる内容                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| データベース       | Drizzle スキーマからのテーブルカラム、値の型、insert/update の形状               |
| ハンドラー         | `c.env` バインディング、バリデーターの入力、戻り値の型                           |
| fetch クライアント | ルートパス、HTTP メソッド、`body`/`query`/`params`、レスポンスの型               |
| `useForm`          | アクション URL、`data` のフィールド、`errors` のキー、`reset()` の引数、`params` |
| `action()`         | アクション URL、`data` のペイロード、`params`                                    |

## シリアライズ {#serialization}

クライアントの型には、`Serialize<T>` による JSON シリアライズが反映されます。

| ソースの型                        | シリアライズ後の型                                      |
| --------------------------------- | ------------------------------------------------------- |
| `string`, `number`, `boolean`     | 変更なし                                                |
| `Date`                            | `string`                                                |
| `Response`                        | 除外 (実行時にはそのまま渡される)                       |
| `bigint`, `Function`, `undefined` | 除外                                                    |
| `Array<T>` / `{ key: T }`         | 再帰的にシリアライズ (関数の値を持つキーは取り除かれる) |

## コンテキスト変数 {#context-variables}

ミドルウェアとハンドラーは、Hono のコンテキスト変数を通じて型付きのデータを共有します。独自の変数を定義するには、`CloudContextVariables` を拡張します。

```ts
// middleware/01.auth.ts
declare module 'void' {
  interface CloudContextVariables {
    requestId: string;
  }
}

export default defineMiddleware(async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});
```

これで `c.get("requestId")` は、型アサーションなしでどこでも `string` を返します。複数のファイルにまたがる拡張は[マージ](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)されます。

## セットアップ {#setup}

プロジェクトで、生成された tsconfig を継承します。

```json
{
  "extends": "./.void/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "types": ["void/env"]
  },
  "include": ["src", "routes", "middleware", "crons", "queues"]
}
```

すでに TypeScript の設定がある場合は、`void init --tsconfig` を実行すると、既存の設定を維持したまま Void の型を追加できます。

CI や新たにクローンした直後には `void prepare` を実行してください。または、通常のアプリのワークフローの中で `vite dev` / `vite build` に `.void/` ファイルを生成させることもできます。
