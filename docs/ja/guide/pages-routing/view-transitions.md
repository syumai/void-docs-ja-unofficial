---
outline: deep
---

# View Transitions {#view-transitions}

ブラウザーの [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) を使って、アニメーション付きのページ遷移を追加します。ページはデフォルトでクロスフェードします。アニメーションは CSS でカスタマイズできます。

## View Transitions を有効にする {#enabling-view-transitions}

アダプタープラグインに `viewTransitions: true` を渡します。

::: code-group

```ts [React]
// vite.config.ts
export default defineConfig({
  plugins: [voidPlugin(), voidReact({ viewTransitions: true })],
});
```

```ts [Vue]
// vite.config.ts
export default defineConfig({
  plugins: [voidPlugin(), voidVue({ viewTransitions: true })],
});
```

```ts [Svelte]
// vite.config.ts
export default defineConfig({
  plugins: [voidPlugin(), voidSvelte({ viewTransitions: true })],
});
```

```ts [Solid]
// vite.config.ts
export default defineConfig({
  plugins: [voidPlugin(), voidSolid({ viewTransitions: true })],
});
```

:::

これにより、`Link` のクリック、プログラムによる `router.visit()` の呼び出し、ブラウザーの戻る・進む操作を含むすべてのナビゲーションで View Transitions が有効になります。

## リンクごとの上書き {#per-link-override}

個々のリンクで、グローバル設定を上書きできます。

::: code-group

```tsx [React]
{
  /* Disable transition for this link */
}
<Link href="/settings" viewTransition={false}>
  Settings
</Link>;

{
  /* Enable for just this link (even if globally disabled) */
}
<Link href="/about" viewTransition>
  About
</Link>;
```

```vue [Vue]
<!-- Disable transition for this link -->
<Link href="/settings" :view-transition="false">Settings</Link>

<!-- Enable for just this link (even if globally disabled) -->
<Link href="/about" view-transition>About</Link>
```

```svelte [Svelte]
<!-- Disable transition for this link -->
<Link href="/settings" viewTransition={false}>Settings</Link>

<!-- Enable for just this link (even if globally disabled) -->
<Link href="/about" viewTransition>About</Link>
```

```tsx [Solid]
{
  /* Disable transition for this link */
}
<Link href="/settings" viewTransition={false}>
  Settings
</Link>;

{
  /* Enable for just this link (even if globally disabled) */
}
<Link href="/about" viewTransition>
  About
</Link>;
```

:::

プログラムから指定することもできます。

```ts
router.visit('/about', { viewTransition: true });
router.visit('/settings', { viewTransition: false });
```

## CSS でカスタマイズする {#customizing-with-css}

デフォルトの遷移はクロスフェードです。`::view-transition-old` と `::view-transition-new` 疑似要素を使ってカスタマイズします。

```css
/* Faster transition */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.2s;
}

/* Slide instead of fade */
::view-transition-old(root) {
  animation: slide-out 0.3s ease-in;
}
::view-transition-new(root) {
  animation: slide-in 0.3s ease-out;
}
```

独立してアニメーションさせたい要素（たとえば、ページ間でモーフィングするヒーロー画像）には、`view-transition-name` を割り当てます。

```css
.hero-image {
  view-transition-name: hero;
}
```

::: tip
View Transitions はプログレッシブエンハンスメントです。この API をサポートしないブラウザーでは、エラーなく即座にナビゲーションされます。
:::
