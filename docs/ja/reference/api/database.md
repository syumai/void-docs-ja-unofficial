---
outline: deep
---

# データベースとシーディング {#database}

`"void/db"` からインポートします。`db` エクスポートは、設定されたデータベースダイアレクト向けの [Drizzle ORM](https://orm.drizzle.team) インスタンスです。デフォルトは [Cloudflare D1](https://developers.cloudflare.com/d1/) で、`"database": "pg"` では PostgreSQL、`"database": "mysql"` では MySQL になります。

## `db` {#db}

`db/schema.ts` のスキーマがあらかじめ組み込まれた、デフォルトの Drizzle インスタンスです。

```ts
import { users } from '@schema';
import { db } from 'void/db';

const allUsers = await db.select().from(users).all();
```

`db` は、設定されたダイアレクトとスキーマを使用します。

- D1 プロジェクトでは `DB` バインディングを解決し、`DrizzleD1Database<Schema>` を公開します。
- PostgreSQL プロジェクトでは、ローカル開発中は `DATABASE_URL` を、本番では Hyperdrive の `connectionString` を使用し、`NodePgDatabase<Schema>` を公開します。
- MySQL プロジェクトでは同じ接続元を使用し、`MySql2Database<Schema>` を公開します。

## `createDb(database)` {#createdb-database}

アクティブなダイアレクト向けの Drizzle インスタンスを作成します。

D1 プロジェクトでは、特定の D1 バインディングを渡します。複数の D1 データベースがある場合や、デフォルト以外のバインディングが必要な場合に使用します。

```ts
import { env } from 'cloudflare:workers';
import { createDb } from 'void/db';

const db = createDb(env.MY_OTHER_DB);
```

PostgreSQL と MySQL のプロジェクトでは、接続文字列を渡します。

```ts
import { createDb } from 'void/db';

const db = createDb('postgres://user:password@host:5432/app');
```

**シグネチャ:**

```ts
// D1
function createDb(d1: D1Database): DrizzleD1Database<Schema>;

// PostgreSQL
function createDb(connectionString: string): NodePgDatabase<Schema>;

// MySQL
function createDb(connectionString: string): MySql2Database<Schema>;
```

## クエリ演算子 {#query-operators}

`void/db` はよく使われる [Drizzle の演算子](https://orm.drizzle.team/docs/operators)を再エクスポートしているため、`drizzle-orm` に直接依存する必要はありません。

```ts
import { db, eq, and, or, desc, like, inArray, sql } from 'void/db';
```

**完全な一覧:** `sql`、`eq`、`ne`、`gt`、`gte`、`lt`、`lte`、`and`、`or`、`not`、`desc`、`asc`、`like`、`ilike`、`notLike`、`inArray`、`notInArray`、`isNull`、`isNotNull`、`between`、`notBetween`、`exists`、`notExists`、`count`、`sum`、`avg`、`min`、`max`。

## シーディング {#seeding}

`"void/seed"` からインポートします。

### `defineSeed(fn)` {#defineseed-fn}

`void db seed` が使用するプログラマティックなシードモジュール向けの恒等ヘルパーです。

```ts
import { defineSeed } from 'void/seed';

export default defineSeed<typeof import('./schema')>(async ({ db, schema }) => {
  await db.insert(schema.users).values([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ]);
});
```

コールバックは次の値を受け取ります。

- `dialect`: `"sqlite"`、`"postgresql"`、`"mysql"` のいずれか
- `db`: アクティブなダイアレクト向けのローカルな Drizzle インスタンス
- `schema`: `db/schema.ts` または `db/schema/` からのエクスポート

シードモジュールは、`default` または名前付きの `seed` 関数のいずれかをエクスポートできます。
