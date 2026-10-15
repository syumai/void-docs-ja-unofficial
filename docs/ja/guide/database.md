---
outline: deep
---

<script setup>
const dbFileItems = [
  {
    name: "db/",
    children: [
      { name: "schema.ts", description: "テーブル定義（信頼できる唯一の情報源）" },
      {
        name: "schema/",
        description: "分割したスキーマファイル（任意）",
        children: [
          { name: "users.ts" },
          { name: "posts.ts" },
        ],
      },
      {
        name: "migrations/",
        description: "生成された SQL マイグレーションファイル",
        children: [
          { name: "20260410161500_create_users.sql" },
          { name: "20260410161501_add_posts.sql" },
        ],
      },
      { name: "seed.ts", description: "プログラムによるシードスクリプト（任意）" },
      { name: "seed.sql", description: "生の SQL シードファイル（代替手段、任意）" },
    ],
  },
]
</script>

# データベース {#database}

テーブルを TypeScript で定義し、`void/db` の `db` でクエリを実行します。Void は [Drizzle ORM](https://orm.drizzle.team) を同梱し、接続も設定するため、D1、PostgreSQL、MySQL のいずれでも同じスキーマとクエリのワークフローを使えます。

<FileTree :items="dbFileItems" default-expanded />

## ダイアレクトの選択 {#choosing-a-dialect}

`void init` の実行時にデータベースを選択するか、`void.config.ts` の `database` を設定します。

|      | [D1 (SQLite)](./database/d1) | [PostgreSQL](./database/postgresql) | [MySQL](./database/mysql) |
| ---- | ---------------------------- | ----------------------------------- | ------------------------- |
| 設定 | デフォルト                   | `"database": "pg"`                  | `"database": "mysql"`     |
| 管理 | Void                         | 自前のデータベースを用意            | 自前のデータベースを用意  |
| 接続 | D1 バインディングを自動設定  | Hyperdrive                          | Hyperdrive                |

Void プラットフォームでは、データベース接続の Hyperdrive クエリキャッシュはオフのままになるため、読み取りには完了した書き込みが反映されます。既存の接続は、プロジェクトの次回のデプロイ時に更新されます。

## スキーマ定義 {#schema-definition}

`db/schema.ts` に、`void/schema-d1`、`void/schema-pg`、`void/schema-mysql` のカラムヘルパーを使ってテーブルを定義します。

::: code-group

```ts [SQLite (D1)]
import { sql } from 'void/db';
// db/schema.ts
import { sqliteTable, text, integer } from 'void/schema-d1';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
```

```ts [PostgreSQL]
// db/schema.ts
import { pgTable, serial, text, timestamp } from 'void/schema-pg';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

```ts [MySQL]
// db/schema.ts
import { int, mysqlTable, text, timestamp } from 'void/schema-mysql';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

:::

スキーマヘルパーは `void` に含まれています。テーブルを自分で書くことも、`void gen model` で出発点を生成することもできます。

`db/schema/` 配下に複数のファイルとしてスキーマを分割し、バレルファイルから再エクスポートすることもできます。

```ts
// db/schema/users.ts
export const users = ...;

// db/schema/posts.ts
export const posts = ...;

// db/schema.ts (barrel)
export * from "./schema/users";
export * from "./schema/posts";
```

## クエリ {#querying}

Void は一般的な [Drizzle のクエリ演算子](https://orm.drizzle.team/docs/select)をすべて `void/db` から再エクスポートしているため、`drizzle-orm` を別途インストールする必要はありません。`db` は `void/db` から、テーブルは `@schema` からインポートします。

```ts
import { users } from '@schema';
import { db } from 'void/db';
```

::: info `@schema` とは？
`@schema` は、Void プラグインが自動的に設定する Vite のパスエイリアスです。`db/schema.ts` を指し、テーブルを複数ファイルに分割している場合は `db/schema/` を指します。テーブル定義をインポートするためにそのまま使えます。
:::

### 行を一覧取得する {#list-rows}

```ts
const allUsers = await db.select().from(users);
```

### `where` で絞り込む {#filter-with-where}

```ts
import { users } from '@schema';
import { db, eq, and, or } from 'void/db';

// 単一の条件
const user = await db.select().from(users).where(eq(users.id, 1));

// 複数の条件
const admins = await db
  .select()
  .from(users)
  .where(and(eq(users.role, 'admin'), eq(users.name, 'Alice')));

// OR 条件
const result = await db
  .select()
  .from(users)
  .where(or(eq(users.role, 'admin'), eq(users.role, 'editor')));
```

### 挿入 {#insert}

```ts
// 単一の行
await db.insert(users).values({
  name: 'Alice',
  email: 'alice@example.com',
});

// 挿入して作成された行を返す
const [created] = await db
  .insert(users)
  .values({ name: 'Bob', email: 'bob@example.com' })
  .returning();

// 複数の行
await db.insert(users).values([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]);
```

### 更新 {#update}

```ts
await db.update(users).set({ role: 'admin' }).where(eq(users.id, 1));

// 更新して変更後の行を返す
const [updated] = await db.update(users).set({ role: 'admin' }).where(eq(users.id, 1)).returning();
```

### 削除 {#delete}

```ts
await db.delete(users).where(eq(users.id, 1));
```

### カラムの選択 {#column-selection}

```ts
const names = await db.select({ name: users.name, email: users.email }).from(users);
// names: { name: string; email: string }[]
```

### 並び替えとページネーション {#ordering-and-pagination}

```ts
import { users } from '@schema';
import { db, desc } from 'void/db';

const page = await db.select().from(users).orderBy(desc(users.createdAt)).limit(10).offset(20);
```

### 結合 {#joins}

```ts
import { users, posts } from '@schema';
import { db, eq } from 'void/db';

const results = await db
  .select({
    id: posts.id,
    title: posts.title,
    author: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.userId, users.id));
```

### リレーショナルクエリ {#relational-queries}

スキーマに[リレーション](https://orm.drizzle.team/docs/relations)を定義している場合は、Drizzle のリレーショナルクエリ API を使えます。

```ts
const usersWithPosts = await db.query.users.findMany({
  with: { posts: true },
});
```

## シード {#seeding}

`void db seed` を使うと、ローカルデータベースをリセットし、マイグレーションを再適用してから、シードファイルを実行します。

プログラムによるシードには `db/seed.ts` を、SQL には `db/seed.sql` を使います。JavaScript や `.mts` / `.mjs` ファイルも使えます。シードファイルが複数ある場合は、`--file <path>` で 1 つを選択します。

### プログラムによるシード {#programmatic-seeding}

コードでシードデータを生成したい場合は `db/seed.ts` を使います。デフォルトエクスポートの関数、または名前付きの `seed` 関数をエクスポートします。

```ts
// db/seed.ts
import { defineSeed } from 'void/seed';

export default defineSeed<typeof import('./schema')>(async ({ db, schema }) => {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    text: `Seed message ${i + 1}`,
  }));

  await db.insert(schema.messages).values(rows);
});
```

シードのコンテキストには次の値が含まれます。

- `dialect`: `"sqlite"`、`"postgresql"`、または `"mysql"`
- `db`: ローカルデータベース用の Drizzle インスタンス
- `schema`: `db/schema.ts` または `db/schema/` のモジュールからのエクスポート

### SQL によるシード {#sql-seeding}

生の SQL を使いたい場合は、引き続き `db/seed.sql` を使えます。

```sql
INSERT INTO messages (text) VALUES ('Hello from SQL');
```

## スキーマから導出するバリデーター {#schema-derived-validators}

`void/drizzle-zod`、`void/drizzle-valibot`、`void/drizzle-arktype` を使って、テーブルからリクエストのバリデーターを導出できます。テーブル定義の後にバリデーターを追加します。

::: code-group

```ts [Zod]
// db/schema.ts
import { createInsertSchema } from 'void/drizzle-zod';

export const insertUserSchema = createInsertSchema(users, {
  name: (schema) => schema.min(1),
  email: (schema) => schema.email(),
});
```

```ts [Valibot]
import { pipe, minLength, email } from 'valibot';
// db/schema.ts
import { createInsertSchema } from 'void/drizzle-valibot';

export const insertUserSchema = createInsertSchema(users, {
  name: (schema) => pipe(schema, minLength(1)),
  email: (schema) => pipe(schema, email()),
});
```

```ts [ArkType]
import { type } from 'arktype';
// db/schema.ts
import { createInsertSchema } from 'void/drizzle-arktype';

export const insertUserSchema = createInsertSchema(users, {
  name: type('string > 0'),
  email: type('string.email'),
});
```

:::

`createInsertSchema` は `$inferInsert` に一致するバリデーターを生成します。デフォルト値や自動採番を持つカラムは任意になり、`NOT NULL` のカラムは必須のままです。省略可能な 2 番目の引数では、生成されたスキーマを受け取るコールバックを渡すか、型を直接渡してフィールドを上書きすることで、個々のカラムを調整できます。

導出したスキーマは、ルートハンドラーで [`withValidator()`](./server-routing.md#validation) とともに使います。

```ts
import { users, insertUserSchema } from '@schema';
// routes/api/users/index.ts
import { defineHandler } from 'void';
import { db } from 'void/db';

export const POST = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c, { body }) => {
  const [created] = await db.insert(users).values(body).returning();
  return created;
});
```

次の 3 つの関数を使えます。

| 関数                 | 用途                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `createInsertSchema` | 挿入データを検証します。自動生成されるカラムを除外し、デフォルト値を適用します |
| `createSelectSchema` | 取得した行の形状に一致します                                                   |
| `createUpdateSchema` | 挿入用と似ていますが、すべてのフィールドが任意です（部分更新）                 |

Void には Drizzle アダプターがすでにバンドルされています。スキーマファイルでバリデーターライブラリの API を直接使う場合は、ライブラリ自体をインストールしてください。

```bash
npm install zod
# or
npm install valibot
# or
npm install arktype
```

## CLI コマンド {#cli-commands}

| コマンド           | 用途                                                       |
| ------------------ | ---------------------------------------------------------- |
| `void db push`     | マイグレーションファイルなしでスキーマ変更をローカルに適用 |
| `void db generate` | SQL マイグレーションを生成                                 |
| `void db migrate`  | 未適用のマイグレーションをローカルに適用                   |
| `void db status`   | スキーマのずれと未適用のマイグレーションを確認             |
| `void db seed`     | ローカルデータベースをリセットし、シードファイルを実行     |

接続のセットアップ、SQL の実行、Studio、エクスポートなどのコマンドについては、[CLI リファレンス](../reference/cli/database.md#database)を参照してください。

## 手書きのマイグレーション {#hand-written-migrations}

デプロイでは、Drizzle スキーマを `db/migrations/meta/` のスナップショットと比較します。このメタデータのない SQL マイグレーションがある場合、`void db generate` を実行すると同じテーブルに対する別のマイグレーションが作成されてしまいます。

既存のマイグレーション履歴を維持するには、次の手順を実行します。

1. SQL マイグレーションが作成するテーブルに、Drizzle スキーマを一致させます。
2. プロジェクトの作業用コピーで `db/migrations/` を削除し、`void db generate` を実行します。
3. 生成された `meta/` フォルダーを元のマイグレーションディレクトリにコピーします。`_journal.json` では、`entries` を既存の各 SQL ファイルに対応するエントリーに順番に置き換えます。`idx` は `0` から始まる連続した値、`tag` は `.sql` を除いたファイル名、`when` は増加するタイムスタンプ、`version` は生成されたエントリーの値を使います。`breakpoints` には、そのファイルが `--> statement-breakpoint` 行を使っているかどうかを設定します。
4. 生成されたスナップショットを `<prefix>_snapshot.json` にリネームします。`<prefix>` は、最後のマイグレーションのタグのうち最初の `_` より前の部分です。`001_create_users.sql` の場合は、`001_snapshot.json` を使います。

メタデータを確認してコミットしたら、もう一度 `void deploy` を実行します。まだどのデータベースにも SQL が適用されていない場合は、代わりに `void db generate` で生成したマイグレーションに置き換えることもできます。

トリガーを含む D1 のマイグレーション、およびトリガー、プロシージャ、関数、イベントを含む MySQL のマイグレーションでは、トリガーの末尾の `END;` を含め、完結した各 SQL 文の後に `--> statement-breakpoint` の行を追加してください。トリガーの本体は 1 つにまとめたままにします。

## スキャフォールディング {#scaffolding}

`void gen model` コマンドは、ダイアレクトに合った `sqliteTable`、`pgTable`、または `mysqlTable` の定義を生成します。

```bash
void gen model posts title:string body:text published:boolean
```

これにより、次のものが作成されます。

1. `db/schema/posts.ts`: `id`、`createdAt`、`updatedAt` と指定したカラムを持つ Drizzle のテーブル定義
2. `db/schema.ts` を更新し、`export * from "./schema/posts"` を追加
3. `routes/api/posts/index.ts`: 一覧取得用の `GET` と、バリデーション付きの挿入用 `POST`
4. `routes/api/posts/[id].ts`: `404` の処理を含む、ID による `GET`

ジェネレーターの全一覧については、[CLI リファレンス](../reference/cli/generate.md#code-generation)を参照してください。
