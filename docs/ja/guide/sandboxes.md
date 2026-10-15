---
outline: deep
---

# Sandboxes {#sandboxes}

Cloudflare Sandbox を使うと、サーバーコードからコマンドの実行、ファイルの操作、サーバーへの接続ができます。Sandbox ID ごとに、分離されたコンテナが選択されます。

## 要件 {#requirements}

Cloudflare へのデプロイには、[Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans) と Containers へのアクセスが必要です。ローカル開発と、イメージをビルドする直接デプロイでは Docker を実行してください。チームプラットフォームのランタイムトークンには、Account / Containers: Edit と Account / Cloudchamber: Edit が必要です。

## コマンドを実行する {#run-a-command}

```ts
import { defineHandler } from 'void';
import { getSandbox } from 'void/sandbox';

export const POST = defineHandler(async (c) => {
  const sandbox = await getSandbox('default');
  const result = await sandbox.run(['node', '--version']);
  return c.json({
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout),
  });
});
```

`void/sandbox` からインポートすると、必要なリソースが有効になります。ローカル開発、Cloudflare への直接デプロイ、チームプラットフォームでは、同じランタイム API を共有します。

## ランタイム API {#runtime-api}

`getSandbox(id, options)` は、Sandbox を起動せずに解決します。最初のコマンド、ファイル操作、ポートへのリクエストでコンテナが起動します。ID は 1〜63 文字で、デフォルトでは小文字に変換されます。大文字小文字を保持するには `normalizeId: false` を渡します。

```ts
import { getSandbox } from 'void/sandbox';

const sandbox = await getSandbox(`user-${user.id}`, {
  inactivityTimeoutMs: 10 * 60 * 1000,
  enableInternet: false,
});
const result = await sandbox.run(['node', '--version'], {
  signal: AbortSignal.timeout(5_000),
});
```

コマンドは、実行ファイルと引数を配列で受け取ります。シェル構文を使うには、`['sh', '-c', command]` を明示的に実行してください。実行オプションには、`cwd`(デフォルトは `/workspace`)、`env`、`user`、`signal`、`pty`、`stdin`、`stdout`、`stderr` があります。

Sandbox の操作は Promise を返します。`run()` は、`ArrayBuffer` としての `stdout` と `stderr`、およびコマンドの終了コードで解決されます。使用量の制限に達すると [`UsageLimit`](#usage-limits) で reject されます。それ以外の失敗は通常どおり reject されます。

`exec()` はプロセスで解決されます。`process.output()` を await して出力と終了コードを収集するか、ストリームを読み取って `process.exitCode` を await します。完了を待つことで、出力が途切れている間も長時間のコマンドがアクティブに保たれます。待機していないバックグラウンドのコマンドは、Sandbox がアイドル状態になると停止することがあります。コマンドが正常に開始された後でも、ランタイムの制限によって完了が reject される場合があります。

書き込み可能な入力ストリームには `stdin: 'pipe'` を使用します。`kill(signal?)` はプロセスを停止し、`resize(cols, rows)` はそのターミナルのサイズを変更します。

ファイル操作は `sandbox.files` にあります。`readFile`、`writeFile`、`stat`、`lstat`、`readDirectory`、`mkdir`、`rename`、`remove` です。`readFile()` を await するとストリーミングの `Response` が得られるので、`.text()`、`.arrayBuffer()`、`.body` を使用します。`writeFile()` は、テキスト、バイナリデータ、バイトストリームを受け付けます。相対ファイルパスを使う場合は、`cwd` オプションを明示する必要があります。

コンテナ内のサーバーにアクセスするには、`sandbox.fetch(port, new Request(url))` を await します。`sandbox.running()` はコンテナが実行中かどうかを確認し、`sandbox.destroy()` はコンテナを停止します。

ネイティブな Cloudflare デプロイでは、`sandbox.fetch()` は WebSocket のアップグレードリクエストにも対応します。そのレスポンスを Worker のハンドラーから返すと、クライアントがコンテナに接続されます。WebSocket のアップグレードは、現時点ではマネージドな Void デプロイでは利用できません。

`getSandbox()` のオプションには、`inactivityTimeoutMs`(デフォルトは 10 分、最大 6 時間)、`enableInternet`(デフォルトは `false`)、文字列の `labels` があります。インターネットアクセスとラベルは、次回のコンテナ起動時に反映されます。`binding` はカスタムのネイティブバインディングを選択します。マネージドなプラットフォームでは、設定済みのバインディングが使用されます。

両方のデプロイ先で動作させるコードには、`getSandbox()` を使用してください。`c.env.SANDBOX` による直接アクセスは、ローカルとネイティブな Cloudflare デプロイでのみ利用できます。

## 使用量の制限 {#usage-limits}

Sandbox の制限は、`void/limits` の `UsageLimit` を継承した `SandboxLimitError` で reject されます。このエラーには `resource: 'sandbox'` と、`concurrency` または `runtime_budget` の `reason` が含まれます。このエラーがキャッチされなかった場合、Void のルートハンドラーと Pages の action は、構造化された HTTP 429 を自動的に返します。

AI と Sandbox の両方の制限を処理したい場合は `instanceof UsageLimit` を、Sandbox 固有の処理には `instanceof SandboxLimitError` を使用します。

```ts
import { defineHandler } from 'void';
import { UsageLimit } from 'void/limits';
import { getSandbox } from 'void/sandbox';

export const POST = defineHandler(async (c) => {
  const sandbox = await getSandbox('default');
  try {
    const result = await sandbox.run(['node', 'task.mjs']);
    return c.json({ exitCode: result.exitCode });
  } catch (error) {
    if (error instanceof UsageLimit) {
      return error.response({
        message: 'Execution is temporarily unavailable. Try again shortly.',
      });
    }
    throw error;
  }
});
```

再試行できるように、ユーザーの入力は保持しておいてください。使用量の制限に達した後も、`running()` の確認、プロセスの停止、`destroy()` は引き続き利用できます。

## 状態の永続化 {#state-persistence}

`getSandbox(id)` は、デプロイ内でその ID に対して同じ Durable Object を選択します。ネイティブな Cloudflare デプロイでは、その名前空間が Worker のバージョンをまたいで保持されます。マネージドなプラットフォームでは、デプロイごとに独自の名前空間があります。保持されているデプロイにロールバックすると、そのデプロイの名前空間に再接続されます。

ファイル、実行中のプロセス、待ち受け中のサーバーは、コンテナが存在する間だけ保持されます。コンテナは、非アクティブ状態、クラッシュ、再起動によって停止することがあります。保持したいものは、データベース、KV、R2 に保存してください。Void プラットフォーム上でプロジェクトを削除すると、その Durable Objects とコンテナの両方が削除されます。

## 設定 {#configuration}

デフォルトの環境では、Debian Trixie 上の Node.js 26 が提供されます。マネージドなプラットフォームへのデプロイでは、Cloudflare のマネージドな Node.js イメージが使用されます。

カスタムのイメージやコンテナサイズが必要な場合は、`void.config.ts` を使用します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  sandbox: {
    image: './Dockerfile.sandbox',
    platformImage: 'registry.cloudflare.com/<account-id>/sandbox@sha256:<digest>',
    instanceType: 'standard-1',
  },
});
```

バインディング名、イメージの設定、コンテナのサイズについては、[設定リファレンス](../reference/config.md#sandbox)を参照してください。

カスタムイメージには、Void にインストールされている Sandbox SDK のバージョンに対応するヘルパーを含める必要があります。このバイナリは SDK のイメージから取得しますが、SDK のイメージ自体は実行可能な環境ではありません。

```dockerfile
FROM node:26.10.0-trixie-slim
COPY --from=docker.io/cloudflare/sandbox:1.0.1 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim
WORKDIR /workspace
CMD ["sleep", "infinity"]
```

マネージドなプラットフォームでは、カスタムイメージをそのプラットフォームアカウントの Cloudflare レジストリにプッシュし、`platformImage` にダイジェストで固定した参照を設定します。`image` がすでに Cloudflare レジストリへの参照である場合は、それがデフォルトの `platformImage` にもなります。外部レジストリと可変タグはサポートされていません。[Cloudflare のイメージ管理ガイド](https://developers.cloudflare.com/containers/guides/image-management/#push-images-to-the-cloudflare-registry)を参照してください。

## デプロイ {#deployment}

`void deploy --platform cloudflare` は、ネイティブイメージをビルドし、アプリケーションと一緒に Sandbox をデプロイします。接続済みの Void Platform に対する `void deploy` では、そのプラットフォームの Sandbox の同時実行数とランタイムの制限が適用されます。
