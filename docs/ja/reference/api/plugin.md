---
outline: deep
---

# プラグインと設定 {#plugin}

## `voidPlugin(options?)` {#voidplugin-options}

`"void"` からの名前付きエクスポートです。ファイルベースルーティング、マイグレーションのサポート、Cloudflare Workers ランタイムをセットアップする Vite プラグインの配列を返します。アプリケーションレベルの設定は [`void.config.ts`](../config.md) から読み込まれ、省略可能な `options` オブジェクトは Vite/Cloudflare プラグインの動作を制御します。

```ts
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin()],
});
```

| オプション         | 型                        | 説明                                                                                                                                                                                                                                 |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `persistTo`        | `string`                  | ローカル開発の状態 (D1、KV、R2) を永続化するディレクトリのパス。デフォルトはプロジェクトルートの `.void/` です。                                                                                                                     |
| `auxiliaryWorkers` | `AuxiliaryWorkerConfig[]` | 開発中に同じ Miniflare インスタンス内で実行する追加の Worker。`@cloudflare/vite-plugin` にそのまま渡されます。バインディングを共有する複数の Worker (例: ダッシュボードと並行して動作する別の API Worker) を実行する場合に便利です。 |

## プロジェクト設定 {#project-configuration}

### `defineConfig(config)` {#defineconfig-config}

ルートの `void.config.ts` で `void/config` からインポートします。エディターの補完と TypeScript のチェックが効いた状態で設定を返します。Void は、実行時に計算された値を含め、読み込み時に結果を検証します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: { name: 'my-app' },
  routing: { revalidate: 60 },
});
```

すべてのフィールドについては、[設定リファレンス](../config.md)を参照してください。
