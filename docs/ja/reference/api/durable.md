---
outline: deep
---

# Durable State と WebSocket {#durable-state}

`"void/durable"` からインポートします。ファイル規約とデプロイのサポートについては、[Durable State](../../guide/durable-state.md) を参照してください。

## `defineDurableState(definition)` {#definedurablestate-definition}

型付きで永続化される Durable Object のステートマシンを定義します。返されたオブジェクトは、`durable-objects/` 配下のモジュールのデフォルトエクスポートである必要があります。アプリ内の他の場所から型付き RPC を呼び出すには、同じオブジェクトを名前付きエクスポートします。

```ts
function defineDurableState<TState, TEnv, TMethods>(definition: {
  name?: string;
  initialState: TState | ((env: TEnv) => TState | Promise<TState>);
  version?: number;
  migrations?: Array<{
    version: number;
    migrate(state: unknown): TState | Promise<TState>;
  }>;
  methods: TMethods;
  fetch?: (context, request: Request) => Response | Promise<Response>;
  alarm?: (context) => void | Promise<void>;
  storageKey?: string;
}): DurableStateApi<TMethods>;
```

`DurableStateApi` は、`class`、`get(name)`、`get(namespace, name)`、`getById(id)`、`getById(namespace, id)` を公開します。ルックアップヘルパーが返すスタブは、定義のメソッドを引数の型を保ったまま持ち、戻り値は `Promise` でラップされます。

`name` は、ファイル名から導出する代わりに、永続的なリソースの識別子を明示的に固定します。デプロイ済みの定義の名前を変更する前に、`void info` を実行し、表示された名前を固定してください。`get()` に渡すインスタンス名は変更しないでください。[移行の流れ](../../guide/durable-state.md#rename-a-file-while-keeping-its-state)を参照してください。

## WebSocket {#websockets}

`"void/ws"` からインポートします。`defineRoom()` は共有ルームのヘルパーをフックのコンテキストに追加し、`defineWebSocket()` は接続のソケットヘルパーを提供します。どちらも `messages.client` と `messages.server` の Standard Schema バリデーターを必要とし、[WebSocket ガイド](../../guide/websockets.md)で説明されているフックをサポートします。

どちらのヘルパーも、次のオプションのリソース設定を受け付けます。

```ts
name?: string;
key?: (context: { params: Record<string, string> }) => string;
```

`name` は、Worker クラスとバインディングの識別子を固定します。指定しない場合、Void はルートファイルから識別子を導出します。デプロイ済みのルートを移動する前に `void info` を実行し、表示された名前を固定してください。

`key` は、ルートのインスタンスとその `ctx.id` を選択します。指定しない場合、ルートはルート順のパラメーター名と値を使用します(`room=general`、パラメーターがない場合は `default`)。コールバックは、安定した文字列を同期的に返す必要があります。パラメーターの名前を変更する場合は、状態を保持するために古いキーをそのまま維持してください。[ルートの移動](../../guide/websockets.md#move-a-route-while-keeping-its-state)と[パラメーターの名前変更](../../guide/websockets.md#rename-a-route-parameter)を参照してください。
