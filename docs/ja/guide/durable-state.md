---
outline: deep
---

# Durable State {#durable-state}

ショッピングカート、ルーム、レートリミッターなど、複数のリクエストが 1 つの名前のもとで状態を共有する必要がある場合は、Durable Object を使用します。Void は型付きのメソッドを提供し、呼び出しの間でオブジェクトの状態を保存します。

`durable-objects/` に、`defineDurableState()` を使ったモジュールを作成します。Void がそのための SQLite ベースの Cloudflare Durable Object を提供します。この機能は、Void プラットフォーム上のネイティブな Void アプリと、Cloudflare への直接デプロイをサポートしています。

Void がリソースを追加したときは `void.lock.json` をコミットしてください。デプロイ済みのマイグレーションエントリは、元の順序のまま維持してください。

## 状態とメソッドを定義する {#define-state-and-methods}

```ts
// durable-objects/counter.ts
import { defineDurableState } from 'void/durable';

export const Counter = defineDurableState({
  initialState: { count: 0 },
  methods: {
    increment(context, amount: number) {
      context.state.count += amount;
      return context.state.count;
    },
    read(context) {
      return context.state.count;
    },
  },
});

export default Counter;
```

`defineDurableState()` が返すオブジェクトを default export してください。

## ルートから呼び出す {#call-it-from-a-route}

定義をインポートし、名前を指定して `get()` を呼び出すとオブジェクトを選択できます。メソッドの引数と戻り値には型が付きます。

```ts
// routes/api/counter.ts
import { defineHandler } from 'void';
import { Counter } from '../../durable-objects/counter';

export const POST = defineHandler(async () => {
  const counter = Counter.get('global');
  const count = await counter.increment(1);
  return { count };
});
```

同じ名前は常に同じ Durable Object に解決されます。すでに `DurableObjectId` を持っている場合は `getById(id)` を使います。高度なケースでは、どちらのヘルパーも最初の引数に明示的な `DurableObjectNamespace` を受け取れます。

## 実行と永続化 {#execution-and-persistence}

Void は最初の操作の前に状態を読み込み、RPC メソッドを 1 つずつ実行します。メソッド、`fetch`、`alarm` ハンドラーが成功すると、更新後の状態を保存します。

ハンドラーまたは保存が失敗した場合、Void は `context.state` を以前の値に戻します。`context.storage` への直接の書き込みは、このロールバックの対象に含まれません。

各メソッドは次を受け取ります。

- `context.state`: 変更または置き換えが可能です
- `context.env`: Durable Object の環境
- `context.id` と `context.storage`
- `context.setAlarm()` と `context.deleteAlarm()`

`fetch`、`alarm`、`constructor` という名前のメソッドは予約されています。`fetch` と `alarm` は、代わりにトップレベルのフックとして定義してください。

```ts
export const Room = defineDurableState({
  initialState: { wakeups: 0 },
  methods: {},
  fetch(context) {
    return Response.json(context.state);
  },
  async alarm(context) {
    context.state.wakeups += 1;
    await context.setAlarm(Date.now() + 60_000);
  },
});

export default Room;
```

## 状態のマイグレーション {#state-migrations}

永続化された値の形が変わる場合は、その値にバージョンを付けます。バージョンは `1` から始まり、連続している必要があり、操作がマイグレーション済みの状態を扱う前に順番に実行されます。

```ts
export const Counter = defineDurableState({
  initialState: { count: 0, label: 'Counter' },
  version: 2,
  migrations: [
    {
      version: 1,
      migrate(old) {
        return { count: (old as { count: number }).count, label: 'Counter' };
      },
    },
    {
      version: 2,
      migrate(old) {
        return { ...(old as { count: number; label: string }), label: 'Total' };
      },
    },
  ],
  methods: {
    read(context) {
      return context.state;
    },
  },
});

export default Counter;
```

状態のマイグレーションは保存済みの値を更新します。Cloudflare の別個のクラスマイグレーションは、Void が `void.lock.json` で管理します。

Cloudflare への直接デプロイでは、デプロイ後に `void.lock.json` 内の生成された Durable Object マイグレーションを削除したり並べ替えたりしないでください。既存の Worker でクラスの追加、名前変更、削除を行う場合は、マイグレーションを確認して `void deploy --platform cloudflare --atomic` を実行してください。この Worker で毎回のデプロイにアトミックな公開が必要な場合は、`void.config.ts` に `deploy: { cloudflare: { mode: 'atomic' } }` を設定します。Cloudflare はクラスのライフサイクルの変更を 1 回のデプロイで適用します。Void が準備完了を確認する前に Worker はトラフィックを受け取り、そのマイグレーションの境界をまたいだロールバックはできません。段階的なデプロイでは、トラフィック受信前の準備完了の検証が維持されます。

## ファイルの名前を変更しつつ状態を維持する {#rename-a-file-while-keeping-its-state}

デプロイ済みの定義の名前を変更する前に、次を実行します。

```sh
void info
```

`durable-objects/counter.ts` の場合、Void は次のように出力します。

```text
To preserve this resource when moving its code, add this to 'defineDurableState':
  name: "counter",
```

そのプロパティを既存の定義に追加します。

```ts
export const Counter = defineDurableState({
  name: 'counter',
  initialState: { count: 0 },
  methods: {
    read(context) {
      return context.state.count;
    },
  },
});

export default Counter;
```

`durable-objects/` 内でファイルの名前を変更し、インポートを更新してデプロイします。保存された状態を維持するには、`name: 'counter'` と `Counter.get()` に渡す名前を変更しないでください。

`name` は省略可能です。静的な文字列を、インラインまたはローカルの `const` で指定してください。文字で始まる単語を含む `'shopping-cart'` のような文字列にします。名前は、それぞれ別の Worker クラスとバインディングになるようにしてください。既存リソースの `name` を変更すると、別のリソースが選択されます。

すでにファイルを移動してしまった場合、`void info` は、`void.lock.json` に記録されているものの対応する定義がないリソースも表示します。元のリソースを特定し、提案された名前を使用してください。名前を提案できない場合は、ソース履歴から元のファイルを復元し、再度移動する前に `void info` を実行してください。既存のロックファイルとマイグレーション履歴は維持してください。

## デプロイのサポート {#deployment-support}

型付きの状態は、ローカル開発、Void プラットフォーム、ネイティブ Void アプリの Cloudflare への直接デプロイで動作します。Void プラットフォームには `void deploy`、ご自身の Cloudflare アカウントには `void deploy --platform cloudflare` を使用します。

Void プラットフォームでは、各クラスのストレージはデプロイやロールバックをまたいで維持されます。ロールバックではクラスのコードが復元され、現在保存されているデータは維持されます。定義を削除するとクラスは非アクティブになり、同じリソース名で再び追加するとそのデータへのアクセスが復元されます。プロジェクトを削除すると、その Durable Object のストレージも削除されます。

1 つのプロジェクトでは、ストレージが保持されている削除済みのクラスを含め、最大 32 個の異なるカスタムクラスをサポートします。データを維持するには、リソース名とインスタンス名を安定させてください。カスタム Durable Object を使用するアプリをデプロイする前に、古い Void のインストールをアップグレードしてください。

カスタム Durable Object モジュールは、メタフレームワークおよび Node.js、Bun、Deno ではサポートされていません。

これは、同じく SQLite ベースの Durable Object を使用し、Cloudflare への直接デプロイとホスト型の Void デプロイの両方で動作する[型付き WebSocket ルート](./websockets.md)とは別のものです。

## ネイティブの Durable Object クラス {#native-durable-object-classes}

Cloudflare Agents を拡張するクラスを含む、ネイティブな Cloudflare クラスを維持するには `defineDurableObject` を使用します。Void はそのバインディングを検出し、コンストラクター、ライフサイクル、RPC メソッドを置き換えることなくクラスをエクスポートします。Durable State と同様に、Void プラットフォームと Cloudflare への直接デプロイをサポートします。

```ts
// durable-objects/workspace.ts
import { DurableObject } from 'cloudflare:workers';
import { defineDurableObject } from 'void/durable';

class WorkspaceObject extends DurableObject {
  async fetch() {
    return new Response('Workspace');
  }
}

export const Workspace = defineDurableObject({
  name: 'workspace',
  class: WorkspaceObject,
});
export default Workspace;
```

サーバーハンドラーから `Workspace.get('project-id')` を呼び出すと、型付きのスタブを取得できます。ストレージを維持するには、デプロイをまたいでリソース名とインスタンス名を安定させてください。
