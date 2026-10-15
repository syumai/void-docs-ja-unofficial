---
outline: deep
---

# Pages アダプター {#framework-adaptors}

[Pages ルーティング](../../guide/pages-routing/overview)向けのフレームワークアダプターです。各アダプターは、Vite プラグインとクライアントサイドのランタイムを提供します。

## `@void/vue` {#void-vue}

### `voidVue(options?)` {#voidvue-options}

`"@void/vue/plugin"` からインポートします。Vue SFC のコンパイルと、SSR またはハイドレーションのエントリー生成を扱う Vite プラグインの配列を返します。`@vitejs/plugin-vue` はすでに含まれているため、別途インストールや設定をする必要はありません。

```ts
import { voidVue } from '@void/vue/plugin';

export default defineConfig({
  plugins: [voidPlugin(), voidVue()],
});
```

**シグネチャ:**

```ts
function voidVue(options?: VoidVueOptions): Plugin[];
```

**オプション:**

```ts
interface VoidVueOptions {
  vue?: VuePluginOptions; // passed through to @vitejs/plugin-vue
  viewTransitions?: boolean; // enable View Transitions API for navigations
  prefetch?: {
    hoverDelay?: number;
    cacheFor?: number | string | [string, string];
  };
}
```

### Vue ランタイム {#vue-runtime}

`"@void/vue"` からインポートします。

| エクスポート                       | 説明                                                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Link`                             | SPA ナビゲーション用の Vue コンポーネントです。GET では `<a>`、GET 以外のメソッドでは `<button>` をレンダリングします。props: `href`、`method`、`data`、`prefetch`、`cacheFor`、`preserveScroll`、`preserveState`、`replace`、`reloadDocument`、`viewTransition`、`onNavigate`。 |
| `useRouter()`                      | 現在のルートの状態(`url`、`path`、`query`、`params`)と、ナビゲーションメソッド(`visit`、`refresh`、await 可能な `prefetch`、`flush`、`flushAll`)を持つ Void Router を返します。                                                                                                  |
| `useParams()`                      | 現在レンダリング中のページの動的ルートパラメーターを返します。                                                                                                                                                                                                                   |
| `useNavigation()`                  | 保留中のナビゲーションの状態 `{ state, location, method }` を返します。`state` は `"idle"`、`"loading"`、`"submitting"` のいずれかで、`location` は保留中の宛先です。                                                                                                            |
| `useForm(url, defaults, options?)` | ページアクションの URL に紐づく、型付きのリアクティブなフォームヘルパーです。`{ data, post, put, patch, delete, pending, errors, error, hasChanges, wasSuccessful, recentlySuccessful, reset, clearErrors, clearError }` を返します。                                            |
| `useIslandForm(defaults)`          | アイランドコンポーネント用のフォームヘルパーです。`useForm()` と同じフォーム状態に加えて、`submit(url, method)` を持ちます。`post(url)`、`put(url)`、`patch(url)`、`delete(url)` はアクションの URL を受け取り、`fetch()` で送信します。                                         |
| `action(url, options?)`            | await 可能な、1 回限りのページアクションヘルパーです。既定では `POST` を使用し、`{ data, method, params }` を受け付けます。`method` には `"PUT"`、`"PATCH"`、`"DELETE"` を指定できます。`ActionResult` を返します。                                                              |
| `useShared()`                      | ミドルウェアが `c.set("shared", {...})` で注入した共有データを返します。                                                                                                                                                                                                         |

Vue の `Link` の GET の `data` は、レンダリングされる `href` のクエリ文字列にマージされます。プリミティブ値は `String(value)` でシリアライズされ、配列は繰り返しのキーになり、`null` と `undefined` は省略され、ネストされたオブジェクトはスローされます。`prefetch` と `reloadDocument` は GET 専用で、変更系のリンクではスローされます。

Vue の GET ナビゲーションはページを再マウントするため、`useForm()` は宛先レコードの URL とデフォルト値を取得します。レイアウトは維持されます。変更系の操作と `router.refresh()` は、既定でページの状態を保持します。同じレコード内のナビゲーションで既定の動作を上書きするには、`preserveState` を明示的に設定します。

## `@void/react` {#void-react}

### `voidReact(options?)` {#voidreact-options}

`"@void/react/plugin"` からインポートします。SSR とハイドレーションのエントリー生成を扱う Vite プラグインの配列を返します。`@vitejs/plugin-react` はすでに含まれているため、別途インストールや設定をする必要はありません。

```ts
import { voidReact } from '@void/react/plugin';

export default defineConfig({
  plugins: [voidPlugin(), voidReact()],
});
```

**シグネチャ:**

```ts
function voidReact(options?: VoidReactOptions): Plugin[];
```

**オプション:**

```ts
interface VoidReactOptions {
  react?: ReactPluginOptions; // passed through to @vitejs/plugin-react
  viewTransitions?: boolean; // enable View Transitions API for navigations
  prefetch?: {
    hoverDelay?: number;
    cacheFor?: number | string | [string, string];
  };
}
```

### React ランタイム {#react-runtime}

`"@void/react"` からインポートします。

| エクスポート                       | 説明                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Link`                             | SPA ナビゲーション用の React コンポーネントです。GET では `<a>`、GET 以外のメソッドでは `<button>` をレンダリングします。props: `href`、`method`、`data`、`prefetch`、`cacheFor`、`preserveScroll`、`preserveState`、`replace`、`reloadDocument`、`viewTransition`、`onNavigate`。 |
| `useRouter()`                      | 現在のルートの状態(`url`、`path`、`query`、`params`)と、ナビゲーションメソッド(`visit`、`refresh`、await 可能な `prefetch`、`flush`、`flushAll`)を持つ Void Router を返します。React のナビゲーションはトランジションとしてスケジュールされます。                                  |
| `useParams()`                      | 現在レンダリング中のページの動的ルートパラメーターを返します。                                                                                                                                                                                                                     |
| `useNavigation()`                  | 保留中のナビゲーションの状態 `{ state, location, method }` を返します。`state` は `"idle"`、`"loading"`、`"submitting"` のいずれかで、`location` は保留中の宛先です。                                                                                                              |
| `useForm(url, defaults, options?)` | フォームヘルパーフックです。`{ data, setData, post, put, patch, delete, pending, errors, error, hasChanges, wasSuccessful, recentlySuccessful, reset, clearErrors, clearError }` を返します。                                                                                      |
| `useIslandForm(defaults)`          | アイランドコンポーネント用のフォームヘルパーフックです。`useForm()` と同じフォーム状態を持ちます。`post(url)`、`put(url)`、`patch(url)`、`delete(url)` はアクションの URL を受け取り、`fetch()` で送信します。                                                                     |
| `action(url, options?)`            | await 可能な、1 回限りのページアクションヘルパーです。既定では `POST` を使用し、`{ data, method, params }` を受け付けます。`method` には `"PUT"`、`"PATCH"`、`"DELETE"` を指定できます。`ActionResult` を返します。                                                                |
| `useShared()`                      | ミドルウェアが `c.set("shared", {...})` で注入した共有データを返します。                                                                                                                                                                                                           |
| `Deferred<T>`                      | `defer()` の結果に対する、React 専用の props 型です。`Promise<T>` であり、React の `use()` で読み取ります。                                                                                                                                                                        |

React の `Link` の GET の `data` は、レンダリングされる `href` のクエリ文字列にマージされます。プリミティブ値は `String(value)` でシリアライズされ、配列は繰り返しのキーになり、`null` と `undefined` は省略され、ネストされたオブジェクトはスローされます。`prefetch` と `reloadDocument` は GET 専用で、変更系のリンクではスローされます。

`defer()` が返す React の遅延 props は Suspense リソースです。`<Suspense>` 境界の内側で、React の `use()` で読み取ってください。React Pages は React 19 を必要とし、最初の遅延シェルにストリーミング SSR を使用します。拒否(rejection)は `use()` からスローされるため、遅延のエラー UI をカスタマイズするには、通常の React のエラーバウンダリーを使用してください。Vue、Svelte、Solid は、`{ loading, value, error }` の遅延状態オブジェクトを維持します。props に明示的に型注釈を付ける場合は、型がそのアダプターのクライアントランタイムの形と一致するように、フレームワークアダプターのパッケージ(`@void/react`、`@void/vue`、`@void/svelte`、`@void/solid`)から `Deferred` をインポートしてください。

## `@void/svelte` {#void-svelte}

### `voidSvelte(options?)` {#voidsvelte-options}

`"@void/svelte/plugin"` からインポートします。Svelte 5 向けの、SSR とハイドレーションのエントリー生成を扱う Vite プラグインの配列を返します。`@sveltejs/vite-plugin-svelte` はすでに含まれているため、別途インストールや設定をする必要はありません。

```ts
import { voidSvelte } from '@void/svelte/plugin';

export default defineConfig({
  plugins: [voidPlugin(), voidSvelte()],
});
```

**シグネチャ:**

```ts
function voidSvelte(options?: VoidSvelteOptions): Plugin[];
```

**オプション:**

```ts
interface VoidSvelteOptions {
  svelte?: SveltePluginOptions; // passed through to @sveltejs/vite-plugin-svelte
  viewTransitions?: boolean; // enable View Transitions API
  prefetch?: {
    hoverDelay?: number;
    cacheFor?: number | string | [string, string];
  };
}
```

### Svelte ランタイム {#svelte-runtime}

`"@void/svelte"` からインポートします。

| エクスポート                       | 説明                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Link`                             | SPA ナビゲーション用の Svelte コンポーネントです。GET では `<a>`、GET 以外のメソッドでは `<button>` をレンダリングします。props: `href`、`method`、`data`、`prefetch`、`cacheFor`、`preserveScroll`、`preserveState`、`replace`、`reloadDocument`、`viewTransition`、`onNavigate`。 |
| `useForm(url, defaults, options?)` | Svelte 5 の runes を使用するフォームヘルパーです。`{ data, post, put, patch, delete, pending, errors, error, hasChanges, wasSuccessful, recentlySuccessful, reset, clearErrors, clearError }` を返します。                                                                          |
| `useIslandForm(defaults)`          | アイランドコンポーネント用のフォームヘルパーです。`useForm()` と同じフォーム状態に加えて、`submit(url, method)` を持ちます。`post(url)`、`put(url)`、`patch(url)`、`delete(url)` はアクションの URL を受け取り、`fetch()` で送信します。                                            |
| `action(url, options?)`            | await 可能な、1 回限りのページアクションヘルパーです。既定では `POST` を使用し、`{ data, method, params }` を受け付けます。`method` には `"PUT"`、`"PATCH"`、`"DELETE"` を指定できます。`ActionResult` を返します。                                                                 |
| `useShared()`                      | ミドルウェアが `c.set("shared", {...})` で注入した共有データを返します。                                                                                                                                                                                                            |
| `useRouter()`                      | 現在のルートの状態(`url`、`path`、`query`、`params`)と、ナビゲーションメソッド(`visit`、`refresh`、await 可能な `prefetch`、`flush`、`flushAll`)を持つ Void Router を返します。                                                                                                     |
| `useParams()`                      | 現在レンダリング中のページの動的ルートパラメーターを返します。                                                                                                                                                                                                                      |
| `useNavigation()`                  | 保留中のナビゲーションの状態 `{ state, location, method }` を返します。`state` は `"idle"`、`"loading"`、`"submitting"` のいずれかで、`location` は保留中の宛先です。                                                                                                               |

Svelte の `Link` の GET の `data` は、レンダリングされる `href` のクエリ文字列にマージされます。プリミティブ値は `String(value)` でシリアライズされ、配列は繰り返しのキーになり、`null` と `undefined` は省略され、ネストされたオブジェクトはスローされます。`prefetch` と `reloadDocument` は GET 専用で、変更系のリンクではスローされます。

## `@void/solid` {#void-solid}

### `voidSolid(options?)` {#voidsolid-options}

`"@void/solid/plugin"` からインポートします。Solid 向けの、SSR とハイドレーションのエントリー生成を扱う Vite プラグインの配列を返します。`vite-plugin-solid` はすでに含まれているため、別途インストールや設定をする必要はありません。

```ts
import { voidSolid } from '@void/solid/plugin';

export default defineConfig({
  plugins: [voidPlugin(), voidSolid()],
});
```

**シグネチャ:**

```ts
function voidSolid(options?: VoidSolidOptions): Plugin[];
```

**オプション:**

```ts
interface VoidSolidOptions {
  solid?: SolidPluginOptions; // passed through to vite-plugin-solid
  viewTransitions?: boolean; // enable View Transitions API
  prefetch?: {
    hoverDelay?: number;
    cacheFor?: number | string | [string, string];
  };
}
```

### Solid ランタイム {#solid-runtime}

`"@void/solid"` からインポートします。

| エクスポート                       | 説明                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Link`                             | SPA ナビゲーション用の Solid コンポーネントです。GET では `<a>`、GET 以外のメソッドでは `<button>` をレンダリングします。props: `href`、`method`、`data`、`prefetch`、`cacheFor`、`preserveScroll`、`preserveState`、`replace`、`reloadDocument`、`viewTransition`、`onNavigate`。 |
| `useForm(url, defaults, options?)` | Solid のストアを使用するフォームヘルパーです。`{ data, setData, post, put, patch, delete, pending, errors, error, hasChanges, wasSuccessful, recentlySuccessful, reset, clearErrors, clearError }` を返します。                                                                    |
| `useIslandForm(defaults)`          | アイランドコンポーネント用のフォームヘルパーです。`useForm()` と同じフォーム状態を持ちます。`post(url)`、`put(url)`、`patch(url)`、`delete(url)` はアクションの URL を受け取り、`fetch()` で送信します。                                                                           |
| `action(url, options?)`            | await 可能な、1 回限りのページアクションヘルパーです。既定では `POST` を使用し、`{ data, method, params }` を受け付けます。`method` には `"PUT"`、`"PATCH"`、`"DELETE"` を指定できます。`ActionResult` を返します。                                                                |
| `useShared()`                      | ミドルウェアが `c.set("shared", {...})` で注入した共有データを返します。                                                                                                                                                                                                           |
| `useRouter()`                      | 現在のルートの状態(`url`、`path`、`query`、`params`)と、ナビゲーションメソッド(`visit`、`refresh`、await 可能な `prefetch`、`flush`、`flushAll`)を持つ Void Router を返します。                                                                                                    |
| `useParams()`                      | 現在レンダリング中のページの動的ルートパラメーターを返します。                                                                                                                                                                                                                     |
| `useNavigation()`                  | 保留中のナビゲーションの状態 `{ state, location, method }` を返します。`state` は `"idle"`、`"loading"`、`"submitting"` のいずれかで、`location` は保留中の宛先です。                                                                                                              |

Solid の `Link` の GET の `data` は、レンダリングされる `href` のクエリ文字列にマージされます。プリミティブ値は `String(value)` でシリアライズされ、配列は繰り返しのキーになり、`null` と `undefined` は省略され、ネストされたオブジェクトはスローされます。`prefetch` と `reloadDocument` は GET 専用で、変更系のリンクではスローされます。

Solid は、GET ナビゲーションのとき、およびルートまたはそのパラメーターが変更されるたびにページを再作成するため、`useForm()` は宛先レコードの URL とデフォルト値を取得します。レイアウトは維持されます。同じレコード内では、戻る/進む、変更系の操作、`router.refresh()` はページを維持して props をその場で更新します。解決された遅延 props も同様です。そのため、props はコンポーネント本体にコピーせず、JSX またはメモの内側で読み取ってください。同じレコード内のナビゲーションで既定の動作を上書きするには、`preserveState` を明示的に設定します。

## Markdown パッケージ {#markdown-package}

オプションの `@void/md` パッケージは、Pages ルーティングに Markdown ページを追加します。Pages アダプターと一緒にインストールし、Vite プラグインに `voidMarkdown()` を追加します。

```ts
import { voidMarkdown } from '@void/md/plugin';

export default defineConfig({
  plugins: [voidPlugin(), voidReact(), voidMarkdown()],
});
```

| インポートパス               | 内容                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `@void/md/plugin`            | `voidMarkdown(options?)`、`MarkdownOptions`、`MdPage`                                               |
| `@void/md`                   | `useFrontmatter()`、`MdPage`                                                                        |
| `@void/md/pages`             | Markdown ページ用に生成されるメタデータ。ナビゲーション、サイドバー、検索インデックスに使用されます |
| `@void/md/theme.css`         | Markdown テーマの完全なスタイル                                                                     |
| `@void/md/theme-content.css` | 独自のシェル/レイアウトを提供するアプリ向けの、コンテンツのみの Markdown スタイル                   |

`FrontmatterContext` と `setFrontmatter()` は非推奨です。`useFrontmatter()` を使用してください。

セットアップとフレームワーク別の例については、[Markdown ページ](../../guide/pages-routing/markdown.md)を参照してください。

## Form {#form}

各 Pages アダプターは `Form` をエクスポートします。`useForm()` が返すオブジェクトを `form` として渡します。`method` の既定値は `post` です。バリデーションエラーとアクションエラーを表示し、制御された入力を維持し、既知のクォータの再試行期限を、自動的には送信せずに尊重します。`renderError` はアクションエラーの表示方法をカスタマイズします。Svelte ではスニペットを使用します。[アクションとフォーム](../../guide/pages-routing/actions-and-forms.md)を参照してください。
