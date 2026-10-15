---
outline: deep
---

# ローダーと Props {#loaders-props}

ローダーは、ページが必要とするデータを取得します。[サーバールート](../server-routing.md)と同じ `defineHandler` API を使って、対応する `.server.ts` ファイルに定義します。

## ローダーを定義する {#defining-a-loader}

`loader` は GET リクエストで実行され、ページの props となるオブジェクトを返します。

```ts
import { users } from '@schema';
// pages/users/index.server.ts
import { defineHandler } from 'void';
import type { InferProps } from 'void';
import { db } from 'void/db';

export type Props = InferProps<typeof loader>; // [!code highlight]

export const loader = defineHandler(async (c) => {
  return { users: await db.select().from(users) };
});
```

`InferProps` はローダーの戻り値の型を推論するため、ページの props は、ローダーが返すデータと常に同期します。

## ページコンポーネントでデータを使う {#using-the-data-in-page-components}

ページコンポーネントは、ローダーの結果を props として受け取ります。サーバーファイルから推論された型をエクスポートしておくと、コンポーネントとの同期が保たれます。

::: code-group

```tsx [React]
// pages/users/index.tsx
import type { Props } from './index.server';

export default function UsersPage({ users }: Props) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

```vue [Vue]
<!-- pages/users/index.vue -->
<script setup lang="ts">
import type { Props } from './index.server';
defineProps<Props>();
</script>

<template>
  <h1>Users</h1>
  <ul>
    <li v-for="u in users" :key="u.id">{{ u.name }}</li>
  </ul>
</template>
```

```svelte [Svelte]
<!-- pages/users/index.svelte -->
<script lang="ts">
  import type { Props } from "./index.server";

  let { users }: Props = $props();
</script>

<h1>Users</h1>
<ul>
  {#each users as u (u.id)}
    <li>{u.name}</li>
  {/each}
</ul>
```

```tsx [Solid]
import { For } from 'solid-js';
// pages/users/index.tsx
import type { Props } from './index.server';

export default function UsersPage(props: Props) {
  return (
    <>
      <h1>Users</h1>
      <ul>
        <For each={props.users}>{(u) => <li>{u.name}</li>}</For>
      </ul>
    </>
  );
}
```

:::

## 遅延 Props {#deferred-props}

時間のかかるデータには `defer()` を使います。ページはすぐにレンダリングされ、結果の準備ができた時点で受け取ります。

```ts
import { projects } from '@schema';
// pages/dashboard.server.ts
import { defineHandler, defer } from 'void';
import type { InferProps } from 'void';
import { db } from 'void/db';

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const allProjects = await db.select().from(projects); // 高速、すぐに返される
  return {
    projects: allProjects,
    usage: defer(async () => {
      return await fetchUsageMetrics(); // 低速、準備ができたらストリーミングされる
    }),
  };
});
```

ページは、`usage` を読み込み中のまま、`projects` をレンダリングできます。React では、Suspense 内で `use()` を使って `usage` を読み取ります。その他のアダプターでは、`{ loading, value, error }` として公開されます。

### 遅延状態を扱う {#handling-deferred-state}

React では、`Deferred<T>` は Promise として扱います。遅延した値の読み取りを `<Suspense>` 境界の内側に置き、値が必要な箇所で `use()` を呼び出します。

::: code-group

```tsx [React]
import { Suspense, use } from 'react';
import type { Props } from './dashboard.server';

function Usage({ usage }: Pick<Props, 'usage'>) {
  const resolved = use(usage);
  return <p>{resolved.requests} requests</p>;
}

export default function Dashboard({ projects, usage }: Props) {
  return (
    <div>
      <h1>Projects ({projects.length})</h1>
      <Suspense fallback={<p>Loading usage...</p>}>
        <Usage usage={usage} />
      </Suspense>
    </div>
  );
}
```

:::

拒否された遅延 props は、`use()` からスローされます。ページでカスタムの失敗状態を表示したい場合は、Suspense 境界を通常の React のエラーバウンダリーで囲んでください。React の props に明示的に型注釈を付ける場合は、`@void/react` から `Deferred` をインポートします。アダプターのエクスポートは `Promise<T>` として型付けされています。

本番環境では、遅延 props で発生した予期しないエラーは `Internal Server Error` としてページに届きます。独自のメッセージを表示するには、[`HTTPException`](../../integrations/hono.md#utilities) をスローしてください。

Vue、Svelte、Solid では、`Deferred<T>` は 3 つの状態を持つ[判別可能なユニオン型](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)として動作します。

```ts
type Deferred<T> =
  | { loading: true; value: null; error: null } // 保留中
  | { loading: false; value: T; error: null } // 解決済み
  | { loading: false; value: null; error: Error }; // 拒否済み
```

最初に `loading` を、次に `error` を確認します。解決済みの分岐では、TypeScript が `value` を `T` に絞り込みます。

::: code-group

```vue [Vue]
<script setup lang="ts">
import type { Props } from './dashboard.server';
defineProps<Props>();
</script>

<template>
  <div>
    <h1>Projects ({{ projects.length }})</h1>
    <p v-if="usage.loading">Loading usage...</p>
    <p v-else-if="usage.error">Failed: {{ usage.error.message }}</p>
    <p v-else>{{ usage.value.requests }} requests</p>
  </div>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import type { Props } from "./dashboard.server";
  let { projects, usage }: Props = $props();
</script>

<div>
  <h1>Projects ({projects.length})</h1>
  {#if usage.loading}
    <p>Loading usage...</p>
  {:else if usage.error}
    <p>Failed: {usage.error.message}</p>
  {:else}
    <p>{usage.value.requests} requests</p>
  {/if}
</div>
```

```tsx [Solid]
import type { Props } from './dashboard.server';

export default function Dashboard(props: Props) {
  return (
    <div>
      <h1>Projects ({props.projects.length})</h1>
      {props.usage.loading ? (
        <p>Loading usage...</p>
      ) : props.usage.error ? (
        <p>Failed: {props.usage.error.message}</p>
      ) : (
        <p>{props.usage.value.requests} requests</p>
      )}
    </div>
  );
}
```

:::

### ミューテーション後の遅延 Props {#deferred-props-after-mutations}

::: info
アクションの後、遅延 props は、次のページ読み込みまたはクライアントサイドナビゲーションまで、最後に解決された値を保持します。それ以外のローダーの props はすぐに更新されます。
:::

### グループ化した遅延 Props {#grouped-deferred-props}

複数の props が同じ低速な処理に依存している場合は、名前付きグループを使うと、1 回の関数呼び出しでまとめて解決できます。

```ts
export const loader = defineHandler<Props>(async (c) => {
  const analyticsResolver = async () => {
    const data = await fetchAnalytics(); // 低速な呼び出しは 1 回だけ
    return { metrics: data.metrics, chart: data.chart };
  };

  return {
    projects: await db.select().from(projects),
    metrics: defer('analytics', analyticsResolver),
    chart: defer('analytics', analyticsResolver),
  };
});
```

`metrics` と `chart` はどちらも、analytics リゾルバーの 1 回の呼び出しから解決されます。コンポーネントは、それらを別々の `Deferred<T>` の props として受け取ります。
