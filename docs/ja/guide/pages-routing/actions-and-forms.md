---
outline: deep
---

# アクションとフォーム {#actions-forms}

フォームやボタンからサーバーのデータを変更するには、アクションを使用します。[ローダー](./loaders)や[サーバールート](../server-routing.md)と同じように、ページの `.server.ts` ファイルで `defineHandler` を使って定義します。アクションは `POST`、`PUT`、`PATCH`、`DELETE` リクエストを処理します。

## アクションを定義する {#defining-an-action}

`.server.ts` ファイルから `action` をエクスポートします。リクエストボディを検証するには、[スキーマから導出したバリデーター](../database.md#schema-derived-validators)とともに `withValidator()` を使用します。

```ts
import { users, insertUserSchema } from '@schema';
// pages/users/index.server.ts
import { defineHandler } from 'void';
import { db } from 'void/db';

export const action = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c, { body }) => {
  await db.insert(users).values(body);
  // 戻り値なし → ローダーが再実行され、ページが最新のデータで再レンダリングされる
});
```

| アクションの戻り値    | 動作                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| なし (void)           | ローダーが再実行され、ページが最新の props で再レンダリングされます。 |
| `c.redirect('/path')` | 別のページに移動します。                                              |

## Form {#form}

値を送信し、バリデーションエラーとアクションエラーを表示するには、`Form` を `useForm` と組み合わせます。送信に失敗しても、入力欄は編集可能なままです。

`Form` はお使いのアダプターからインポートします。`form` を渡し、必要に応じて `method="put"`、`"patch"`、`"delete"` を指定します。デフォルトは `"post"` です。アクションエラーをカスタムレンダリングするには `renderError` を使用します (Svelte ではスニペットです)。

## `useForm` {#useform}

`useForm` は、送信、ローディング状態、バリデーションエラーを処理します。URL、フォームの値、エラーのフィールドは、アクションから型付けされます。

上で定義した `/users` アクションに送信します。

::: code-group

```tsx [React]
// pages/users/index.tsx
import { Form, useForm } from '@void/react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Create</button>;
}

export default function CreateUser() {
  const form = useForm('/users', { name: '', email: '' });

  return (
    <Form form={form}>
      <input
        name="name"
        value={form.data.name}
        onChange={(e) => form.setData('name', e.target.value)}
      />
      {form.errors.name && <span>{form.errors.name}</span>}

      <input
        name="email"
        value={form.data.email}
        onChange={(e) => form.setData('email', e.target.value)}
      />
      {form.errors.email && <span>{form.errors.email}</span>}

      <SubmitButton />
    </Form>
  );
}
```

```vue [Vue]
<!-- pages/users/index.vue -->
<script setup lang="ts">
import { Form, useForm } from '@void/vue';

const form = useForm('/users', { name: '', email: '' });
</script>

<template>
  <Form :form="form">
    <input v-model="form.data.name" />
    <span v-if="form.errors.name">{{ form.errors.name }}</span>

    <input v-model="form.data.email" />
    <span v-if="form.errors.email">{{ form.errors.email }}</span>

    <button :disabled="form.pending">Create</button>
  </Form>
</template>
```

```svelte [Svelte]
<!-- pages/users/index.svelte -->
<script>
  import { Form, useForm } from "@void/svelte";

  const form = useForm("/users", { name: "", email: "" });
</script>

<Form {form}>
  <input bind:value={form.data.name} />
  {#if form.errors.name}<span>{form.errors.name}</span>{/if}

  <input bind:value={form.data.email} />
  {#if form.errors.email}<span>{form.errors.email}</span>{/if}

  <button disabled={form.pending}>Create</button>
</Form>
```

```tsx [Solid]
// pages/users/index.tsx
import { Form, useForm } from '@void/solid';

export default function CreateUser() {
  const form = useForm('/users', { name: '', email: '' });

  return (
    <Form form={form}>
      <input value={form.data.name} onInput={(e) => form.setData('name', e.target.value)} />
      {form.errors.name && <span>{form.errors.name}</span>}

      <input value={form.data.email} onInput={(e) => form.setData('email', e.target.value)} />
      {form.errors.email && <span>{form.errors.email}</span>}

      <button disabled={form.pending}>Create</button>
    </Form>
  );
}
```

:::

型は、対応する `.server.ts` ファイル内のアクションの `withValidator()` スキーマから推論されます。バリデーターが定義されていない場合、ボディの型は `Record<string, unknown>` にフォールバックしますが、URL の自動補完は引き続き利用できます。

### `useForm` API {#useform-api}

`useForm` は、次のものを持つリアクティブなオブジェクトを返します。

| プロパティ / メソッド            | 用途                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `data` / `setData`               | 現在のフォームの値。アクションのボディスキーマに一致するよう型付けされます。                               |
| `errors`                         | フィールドレベルのバリデーションエラー。キーはボディのフィールド名として型付けされます。                   |
| `error`                          | アクションエラー、または `null`。                                                                          |
| `post`, `put`, `patch`, `delete` | そのメソッドでフォームを送信します。React では、これらはネイティブのフォームアクションのコールバックです。 |
| `pending`                        | 送信中は `true` です。                                                                                     |
| `hasChanges`                     | フォームのデータが初期値と異なる場合は `true` です。                                                       |
| `wasSuccessful`                  | 送信が成功した後は `true` です。次の送信まで `true` のままです。                                           |
| `recentlySuccessful`             | 送信が成功してから 2 秒間は `true` です。フラッシュメッセージに便利です。                                  |
| `reset(...fields)`               | フォームのデータを初期値に戻します。フィールド名は自動補完されます。                                       |
| `clearErrors(...fields)`         | バリデーションエラーをクリアします。フィールド名は自動補完されます。                                       |
| `clearError()`                   | `error` をクリアします。                                                                                   |

ネイティブの React フォームでは、`form.post`、`form.put`、`form.patch`、`form.delete` をネイティブのフォームアクションとして使用します。await 可能なミューテーションには `action()` を使用します。Vue、Svelte、Solid では、フォームの送信は `Promise<void>` を返します。スローされたエラーをキャッチするか、フレームワークのエラー処理を使用してください。

動的ルートでは、オプションで `params` を渡します。

```ts
// pages/users/[id].server.ts にアクションがある
const form = useForm('/users/:id', { name: '' }, { params: { id: '42' } });
<Form form={form} method="put">{/* /users/42 に送信される */}</Form>
```

## 名前付きアクション {#named-actions}

同じページでユーザーの更新と削除を行うなど、ページに複数のミューテーションが必要な場合は、`action` の代わりに `actions` (複数形) をエクスポートします。

```ts
import { users, updateUserSchema } from '@schema';
// pages/users/[id].server.ts
import { defineHandler } from 'void';
import { db, eq } from 'void/db';

export const actions = {
  update: defineHandler.withValidator({
    body: updateUserSchema,
  })(async (c, { body }) => {
    await db
      .update(users)
      .set(body)
      .where(eq(users.id, Number(c.req.param('id'))));
  }),

  delete: defineHandler(async (c) => {
    await db.delete(users).where(eq(users.id, Number(c.req.param('id'))));
  }),
};
```

名前付きアクションは、URL の `?actionName` サフィックス (例: `/users/42?update`) によってディスパッチされます。クライアントのプリミティブである `useForm` と `action()` が、これを自動的に処理します。

1 つのファイルでは、`action` と `actions` のどちらか一方のみを使用してください。

名前が指定されなかった場合 (つまり、ページの URL への単純な POST) に実行されるアクションとして、`actions.default` キーを定義することもできます。

```ts
export const actions = {
  default: defineHandler(async (c) => {
    // POST /users/edit (サフィックスなし) で実行される
  }),
  delete: defineHandler(async (c) => {
    // POST /users/edit?delete で実行される
  }),
};
```

### `useForm` での名前付きアクション {#named-actions-with-useform}

ページが名前付きアクションをエクスポートしている場合は、URL に `?actionName` を付加します。

```ts
const form = useForm('/users/:id?update', { name: '' }, { params: { id } });
<Form form={form} method="put">{/* /users/42?update に送信される */}</Form>
```

各名前付きアクションは独自のバリデータースキーマを持ち、それが URL、ボディ、エラーキーの型を提供します。例については、[型安全性](../type-safety#action-%E2%86%92-useform)を参照してください。

## `action()` ヘルパー {#action-helper}

フォームの状態を必要としないボタンやその他のミューテーションには、`action()` を使用します。リクエストが成功すると、ページが更新されます。

```ts
import { action } from '@void/react'; // または "@void/vue"、"@void/svelte"、"@void/solid"

const result = await action('/users/:id?delete', {
  params: { id: '42' },
  method: 'DELETE',
});
if (!result.ok) {
  showToast(result.error.message);
}
```

`action()` のデフォルトは `POST` です。ボディ、ルートパラメーター、HTTP メソッドを設定するには、`data`、`params`、`method` を渡します。

呼び出しが成功すると `{ ok: true, pageData }` が返されます。バリデーションの失敗や競合など、想定されるエラーは `{ ok: false, error }` を返します。

## バリデーションエラー {#validation-errors}

`withValidator()` と `ValidationError` は、`form.errors` を自動的に設定します。

`400`、`404`、`409`、`422`、`429` などの想定されるエラーは、フォームまたはアクションの呼び出しの中で扱われます。`useForm` はそれらを `form.errors` または `form.error` に格納し、`action()` は `{ ok: false, error }` を返します。

認証エラー (`401`、`403`)、サーバーエラー (`500`、`502`)、想定外の失敗はスローされます。フレームワークのエラーバウンダリまたはエラー処理で対応してください。

アクションは、独自のバリデーションロジックのために `ValidationError` をスローできます。

```ts
import { defineHandler, ValidationError } from 'void/handler';

export const action = defineHandler(async (c) => {
  const body = await c.req.json();
  if (await emailExists(body.email)) {
    throw new ValidationError({ email: 'Email already taken' });
  }
  // ...
});
```

### 利用制限 {#usage-limits}

[AI](../ai.md#usage-limits) と [Sandbox](../sandboxes.md#usage-limits) のアクションでは、キャッチされなかった `UsageLimit` は、構造化された HTTP 429 を自動的に生成します。メッセージをカスタマイズするには、`instanceof UsageLimit` でエラーをキャッチし、`error.response({ message: 'Try again shortly. Your draft is still editable.' })` を返します。`Form` はメッセージを表示し、再試行の期限がわかっている場合はその時刻まで再送信を待ちます。フィールドは編集可能なままで、自動的に再試行されることはありません。

## 認証とオリジンのチェック {#authentication-and-origin-checks}

ブラウザからの送信は、スキーム、ホスト名、ポートを含め、ページと同じオリジンから行われる必要があります。Void は、クロスオリジンのページアクションを `403 Forbidden` で拒否します。サーバークライアントは、ブラウザのオリジンヘッダーなしでアクションを呼び出せます。保護されたデータについては、アクションにも引き続き認証と認可が必要です。

## ファイルアップロード {#file-uploads}

フォームデータに `File`、`Blob`、または `FileList` を設定して送信します。`useForm` はそれを `multipart/form-data` として送信します。

::: code-group

```tsx [React]
import { Form, useForm } from '@void/react';

export default function Upload() {
  const form = useForm('/photos', { title: '', photo: null as File | null });

  return (
    <Form form={form}>
      <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
      <input type="file" onChange={(e) => form.setData('photo', e.target.files?.[0] ?? null)} />
      <button disabled={form.pending}>Upload</button>
    </Form>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { ref } from 'vue';
import { Form, useForm } from '@void/vue';

const form = useForm('/photos', { title: '', photo: null as File | null });
const fileInput = ref<HTMLInputElement>();

function onFileChange() {
  form.data.photo = fileInput.value?.files?.[0] ?? null;
}
</script>

<template>
  <Form :form="form">
    <input v-model="form.data.title" />
    <input type="file" ref="fileInput" @change="onFileChange" />
    <button :disabled="form.pending">Upload</button>
  </Form>
</template>
```

```svelte [Svelte]
<script>
  import { Form, useForm } from "@void/svelte";

  const form = useForm("/photos", { title: "", photo: null });
</script>

<Form {form}>
  <input bind:value={form.data.title} />
  <input type="file" onchange={(e) => { form.data.photo = e.target.files?.[0] ?? null; }} />
  <button disabled={form.pending}>Upload</button>
</Form>
```

```tsx [Solid]
import { Form, useForm } from '@void/solid';

export default function Upload() {
  const form = useForm('/photos', { title: '', photo: null as File | null });

  return (
    <Form form={form}>
      <input value={form.data.title} onInput={(e) => form.setData('title', e.target.value)} />
      <input type="file" onChange={(e) => form.setData('photo', e.target.files?.[0] ?? null)} />
      <button disabled={form.pending}>Upload</button>
    </Form>
  );
}
```

:::

サーバーでは、`c.req.parseBody()` を使用してアップロードされたファイルにアクセスします。

```ts
// pages/photos.server.ts
import { defineHandler, ValidationError } from 'void/handler';
import { storage } from 'void/storage';

// file.name と file.type はブラウザから送られる値です。キーとして使用したり、型を信頼したりしないでください。
const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const action = defineHandler(async (c) => {
  const body = await c.req.parseBody();
  const file = body['photo'];
  if (!(file instanceof File) || file.size === 0) return;
  const ext = imageTypes.get(file.type);
  if (!ext) {
    throw new ValidationError({ photo: 'Upload a JPEG, PNG, or WebP image.' });
  }
  await storage.put(`uploads/${crypto.randomUUID()}.${ext}`, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
});
```

ストレージキーはサーバー側で決定し、想定しているファイル形式のみを許可してください。ファイルを安全に返す方法については、[ファイルの配信](../storage.md#serving-files)を参照してください。

## プリミティブの選び方 {#choosing-a-primitive}

| プリミティブ           | ページの更新 | フォームの状態                    | フレームワーク固有 |
| ---------------------- | ------------ | --------------------------------- | ------------------ |
| `useForm`              | あり         | あり (エラー、変更有無、リセット) | あり               |
| `action()`             | あり         | なし                              | あり               |
| ネイティブの `fetch()` | なし         | なし                              | なし               |
