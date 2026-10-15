---
outline: deep
---

# プロジェクトのセットアップ {#setup}

## `void info` {#void-info}

```sh
void info
void info --json
```

各 Durable State と WebSocket 定義について、ソースファイル、推論された名前または明示的な名前、Worker クラス、バインディングを表示します。WebSocket のエントリには、JSON 出力にそのルートも含まれます。認証、ネットワークリクエスト、ファイル生成なしで、ローカルで実行されます。

デプロイ済みの定義を移動する前に、提案された `name` を `defineDurableState()`、`defineRoom()`、`defineWebSocket()` にコピーしてください。リソースを保持するには、ファイルの移動後もその名前を維持します。WebSocket のパラメーター名の変更を含む移行フローについては、[Durable State](../../guide/durable-state.md#rename-a-file-while-keeping-its-state) と [WebSocket](../../guide/websockets.md#move-a-route-while-keeping-its-state) を参照してください。

`void.lock.json` に記録されているが、対応する定義のないリソースは、別に表示されます。提案された名前は、移動したリソースを特定した後にのみ採用してください。Void が名前を提案できない場合は、元のソースを復元し、再度移動する前にその内容を確認してください。

`--json` は `resources` と `recordedResources` を返します。現在のエントリには、`file`、`definition`、`name`、`nameSource`（`inferred` または `explicit`）、`className`、`bindingName`、および任意の `route` が含まれます。記録済みのエントリには `className` と `bindingName` が含まれ、対応する名前が利用できる場合は `name` と `definition` も含まれます。

## `void migrate` {#void-migrate}

`void migrate` は、従来の `void.json` と、ルートの `wrangler.jsonc` または `wrangler.json` ファイルを `void.config.ts` に変換します。サポートされているフレームワークアダプターから参照されている、ルートの `wrangler*.json(c)` ファイル 1 つも受け付けます。Void はバックアップを `.void/config-migration/` に保存し、リソース ID を `void.lock.json` に記録し、サポートされているアダプターが生成された Cloudflare 設定を使うように更新します。

`.void-wrangler.jsonc` は Cloudflare のツール向けに生成されるもので、`.gitignore` に含める必要があります。マイグレーションがそのエントリを追加します。`void.config.ts`、`void.lock.json`、`.gitignore` を確認してコミットしてください。`void init` と `void deploy` は、従来のファイルを自動的にマイグレーションします。プロジェクトに競合する、または複数の Cloudflare 設定がある場合は、先にそれらを解消してください。Cloudflare にデプロイする前に、プロジェクトにインストールされている `void` パッケージが CLI のバージョンと一致している必要があります。

## `void init` {#void-init}

```sh
void init [--tsconfig] [--github] [--git | --no-git]
```

新規または既存の Void プロジェクトをセットアップします。空のディレクトリでは、Vite+ か Vite、フレームワーク、D1、PostgreSQL、MySQL、または Static Pages のスターターを選択します。

Vite+ プロジェクトでは、依存関係は `vp install` でインストールされます。Vite+ のグローバルインストールは必要ありません。Void は、既存のパッケージマネージャーのバージョンとロックファイルを保持します。パッケージマネージャーの設定がない新しい Vite+ プロジェクトでは、バージョンを固定せずに pnpm が使用されます。

既存のアプリでは、Void は不足している依存関係とスクリプトを追加し、Vite の設定を更新します。設定を編集できない場合は、追加するスニペットを表示します。

ウィザードでは、TypeScript、エージェント向けの指示、環境変数の宣言、デプロイターゲットもセットアップします。Cloudflare、Void プラットフォーム、またはデプロイのセットアップのスキップを選択します。サインインをスキップした場合は、準備ができたときに `void connect` を実行してください。[クイックスタート](../../guide/quickstart.md)を参照してください。

`init` を実行するたびに、コーディングエージェントがセットアップされます。新しいプロジェクトには、
`node_modules/void/docs/` を指す最小限の `AGENTS.md` が作成されます。既存のプロジェクトでは、ファイルの
作成、追記、更新の前に確認が求められます。CI と非対話型の実行では、既存の
プロジェクトの指示は変更されません。スキルは、検出されたエージェント向けにリンクされます。
[コーディングエージェント](../../integrations/agents.md)を参照してください。

既存のリポジトリまたはワークスペースパッケージの外では、Void が Git の初期化を提案します。プロンプトなしで初期化するには `--git` を、スキップするには `--no-git` を使用します。CI で初期化するには `--git` が必要です。ワークスペースパッケージは、これらのフラグを受け付けません。

選択したセットアップのステップだけを実行するには、次のフラグを使用します。

| フラグ       | 目的                                                      |
| ------------ | --------------------------------------------------------- |
| `--tsconfig` | 既存の設定を保持しながら、TypeScript の設定を更新します。 |
| `--github`   | GitHub Actions のデプロイワークフローを作成します。       |

これらのフラグは組み合わせることができ、ウィザードの他のステップをスキップします。コーディングエージェントの
セットアップは引き続き実行されます。Git の初期化も行いたい場合は、`--git` を追加してください。

Cloudflare のワークフローでは、`CLOUDFLARE_API_TOKEN` リポジトリシークレットを追加します。PostgreSQL と MySQL のアプリには、`DATABASE_URL` も必要です。

GitHub Actions をサポートする Void プラットフォームでは、有効期間の短い OIDC 認証情報が使用されます。`void github connect <project> --repo <owner/repo> --executor github_actions` でリポジトリを承認してください。コアのセルフホスト型プラットフォームは、この統合をサポートしていません。[デプロイ](../../guide/deployment.md#github)を参照してください。

## `void prepare` {#void-prepare}

```
void prepare
```

開発サーバーの起動やアプリのビルドを行わずに、Void の型と TypeScript 設定を生成します。新しくクローンした後や、CI で型チェックを行う前に実行してください。
