---
outline: deep
---

# リソースの推論 {#resource-inference}

Void は、起動時にソースファイルをスキャンして、プロジェクトが使用している Cloudflare リソースを自動的に検出します。ほとんどの場合、手動での設定は不要です。コードでリソースを使用すると、Void がローカル開発用に対応するバインディングをプロビジョニングします。

## 検出されるバインディング {#detected-bindings}

| バインディング         | 型                                 | インポートによる検出                                                                                                                                             | 環境変数アクセスによる検出                                                                         |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DB`                   | `D1Database`                       | `import { db } from "void/db"`                                                                                                                                   | `env.DB` または `c.env.DB`                                                                         |
| `KV`                   | `KVNamespace`                      | `import { kv } from "void/kv"`                                                                                                                                   | `env.KV` または `c.env.KV`                                                                         |
| `STORAGE`              | `R2Bucket`                         | `import { storage } from "void/storage"`                                                                                                                         | `env.STORAGE` または `c.env.STORAGE`                                                               |
| `AI`                   | `Ai`                               | `import { ai } from "void/ai"`                                                                                                                                   | `env.AI` または `c.env.AI`                                                                         |
| `SANDBOX`              | マネージド Sandbox 機能            | `import { getSandbox } from "void/sandbox"`                                                                                                                      | `getSandbox()`。ネイティブ Cloudflare では `env.SANDBOX` / `c.env.SANDBOX` も公開されます          |
| Auth                   | なし                               | `import { ... } from "void/auth"` または `import { auth } from "void/client"` / `void/client/react` / `void/client/vue` / `void/client/svelte` / `void/client/solid` | なし                                                                                               |
| `QUEUE_*`              | `Queue`                            | `import { queues } from "void/queues"`                                                                                                                           | `env.QUEUE_*`                                                                                      |
| `VOID_LIVE`            | `DurableObjectNamespace`           | `import { defineLiveStream } from "void/live"`                                                                                                                   | なし                                                                                               |
| ファイル名から導出     | `DurableObjectNamespace`           | `durable-objects/` 内の、`defineDurableState()` をデフォルトエクスポートするモジュール                                                                           | なし                                                                                               |

認証の検出は、`void/client` または `void/client/react` などのフレームワーク固有のクライアントサブパスから `auth` 指定子をインポートした場合にも発生します(`fetch` のみをインポートした場合は発生しません)。

Durable State は、`durable-objects/` 内のファイルから推論されます。たとえば、`durable-objects/shopping-cart.ts` は `SHOPPING_CART` バインディングを作成し、`ShoppingCartDurableObject` をエクスポートし、そのマイグレーションを記録します。[Durable State](../guide/durable-state.md) を参照してください。

## スキャンされるディレクトリ {#scanned-directories}

### 標準モード {#standard-mode}

ネイティブの Void アプリは、既定で次のディレクトリをスキャンします。[`sourceDir`](./config.md#sourcedir) が設定されている場合、Void は代わりにそのソースツリーをスキャンします。

| ディレクトリ  | 内容                                          |
| ------------- | --------------------------------------------- |
| `routes/`     | API ルートハンドラー                          |
| `middleware/` | Hono ミドルウェア                             |
| `queues/`     | キューのコンシューマー                        |
| `pages/`      | ページコンポーネントと `.server.ts` コンパニオン |
| `crons/`      | スケジュールジョブのハンドラー                |
| `email/`      | 受信メールのハンドラー                        |
| `src/`        | アプリケーションのソース                      |

### フレームワークモード {#framework-mode}

[サポートされているメタフレームワーク](../integrations/frameworks/overview.md)では、Void は次のディレクトリをスキャンします。

| ディレクトリ | 内容                             |
| ------------ | -------------------------------- |
| `src/`       | アプリケーションのソース         |
| `app/`       | フレームワークの app ディレクトリ |
| `routes/`    | フレームワークのルート           |
| `server/`    | サーバーサイドのコード           |
| `pages/`     | フレームワークのページ           |
| `crons/`     | スケジュールジョブのハンドラー   |
| `queues/`    | キューのコンシューマー           |

フレームワークの検出には、`package.json` の dependencies と devDependencies が使用されます。開発中に推論を有効にするには、フレームワークの Vite 設定に `voidPlugin()` を追加します。各フレームワークのセットアップは、統合ガイドに記載されています。

### 常にスキャンされるもの {#always-scanned}

モードに関係なく、次のものは常にチェックされます。

- **SSR エントリー**(`src/main.ssr.ts` など)。レンダリング中にバインディングにアクセスする SSR アプリ向けです。
- `src/` または設定した `sourceDir` 内の**アプリケーションのソース**。リソースと認証のインポートを含みます。
- **`durable-objects/`**。ネイティブの Void アプリで、型付き Durable Object の状態モジュールを検出するためにスキャンされます。

## カスタムのスキャンディレクトリ {#custom-scan-directories}

プロジェクトで標準的でないディレクトリにコードを配置している場合は、スキャンされるディレクトリを上書きできます。

```json
{
  "inference": {
    "scanDirs": ["src", "lib", "workers"]
  }
}
```

パスはプロジェクトのルートからの相対パスです。`inference.scanDirs` を設定すると、既定のディレクトリは完全に置き換えられます。SSR エントリーとアプリケーションのソースのスキャンは、引き続き適用されます。

## 明示的なバインディングの上書き {#explicit-binding-overrides}

推論がセットアップと一致しない場合は、[`inference.bindings`](./config.md#inference-bindings) を使用して、バインディングを有効化、無効化、または名前変更します。指定したバインディングだけが上書きされ、残りは引き続き推論されます。

## ファイルタイプ {#file-types}

推論は、`.ts`、`.tsx`、`.mts`、`.js`、`.jsx`、`.mjs`、および Astro のフロントマターをスキャンします。サーバーのリソースのインポートは、これらのファイルか、ページの `.server.ts` コンパニオンに置いてください。Vue と Svelte のコンポーネントファイルは、直接はスキャンされません。
