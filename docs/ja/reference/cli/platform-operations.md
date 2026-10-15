---
outline: deep
---

# プラットフォームの運用 {#operator-deployments}

これらのコマンドには、管理者セッションを使用します。プラットフォームの選択、プレビュー、確認については、[プラットフォーム管理](./platform.md#operator-commands)を参照してください。

デプロイの検索、マニフェストの確認、キャンセルの要求は、次のコマンドで行います。

```sh
void platform deployment list [--project <id-or-slug>] [--status <status>] [--search <text>] [--page <n>] [--limit <n>]
void platform deployment show <id>
void platform deployment cancel <id>
void platform deployment migrate-assets <id> [--cursor <cursor>] [--plan|--yes]
```

キャンセルは、デプロイが保留中、アップロード中、マイグレーション中、プリレンダリング中の間に適用でき、キャンセル中の間は再度要求できます。トラフィックの切り替えを開始したデプロイ、失敗に対する補償処理中のデプロイ、完了したデプロイは、このコマンドではキャンセルできません。

`migrate-assets` は、アプリケーションのトラフィックを変更せずに、デプロイのレガシーなアセットをスコープ付きの R2 ストレージにコピーします。`--plan` でプレビューし、`--cursor` で成功したバッチから再開できます。元のアセットはそのまま残ります。

ランタイムログは、次のコマンドで読み取ります。

```sh
void platform deployment logs <id> [--since <time>] [--cursor <cursor>] [--limit <n>] [--follow]
```

既定では直近 1 時間を古い順に、最大 100 件のレコードを返します。`--since` には、`10m`、`2h`、`1d` のような期間、ISO 形式の日付、またはエポックミリ秒を指定できます。`--limit` は 1 から 500 の範囲で設定し、レスポンスの `nextCursor` を `--cursor` に渡すと次のページを読み取れます。

`--follow` は、残りのページを読み取った後、Ctrl+C を押すまで 2 秒ごとに新しいログを確認します。遅れて届いたレコードのために 5 分間のオーバーラップを確認し、再生された行は表示しません。それより後に届いたレコードは、後から過去ログを問い合わせる必要がある場合があります。ウィンドウが 10,000 件を超えると、追跡はエラーで停止します。その場合は、より範囲の狭い過去ログのクエリを使用してください。

## ビルド {#operator-builds}

ビルドの確認や出力の読み取りは、次のコマンドで行います。

```sh
void platform build show <id>
void platform build logs <id> [--since <sequence>] [--limit <n>] [--follow]
```

ビルドログはシーケンス `0` から始まり、最大 500 行を返します。続きを読み取るには、返された `lastSeq` を `--since` に指定します。`--limit` は 1 から 500 の範囲で指定できます。コンテナーのログを取得するには、マネージドビルドが有効になっている必要があります。GitHub Actions のビルドでは、外部のログ URL が返されます。

追跡は、ビルドが終了状態になった後、最終的なログを待ちます。2 分以内に完了を確認できない場合、コマンドはエラーで終了します。

## システム {#operator-system}

アクティビティの確認、サービスのヘルスチェック、管理上の変更の確認は、次のコマンドで行います。

```sh
void platform system overview
void platform system health
void platform system cli-versions
void platform system asset-migrations [--page <n>] [--limit <n>]
void platform system events [--page <n>] [--limit <n>]
void platform system backfill-queue-tokens
void platform system sandbox-drain [--cursor <opaque-cursor>]
void platform system rotate-proxy-tokens [--project <id> | --all]
```

`overview` は、プラットフォームの合計と最近のアクティビティを表示します。`health` は、設定済みのサービスとデータベースを確認し、チェックに失敗した場合は 0 以外のステータスで終了します。`cli-versions` は、デプロイで使用された CLI のバージョンを報告します。

`asset-migrations` は、保存されているデプロイのアセットを一覧化し、`needsMigration` と `invalid` の件数を報告します。すべてのエントリを読み取るには、レスポンスのページネーションのフィールドを使用します。

`events` は、変更を行った管理者、対象、結果を表示します。保留中のイベントは、結果がまだ記録されていないことを意味します。プレビューやセッションのログイン / ログアウトは、これらのイベントを作成しません。`backfill-queue-tokens` は、認証トークンが欠落している古いキューのエントリを修復し、修復を適用する前に `--plan` を使用できます。

`sandbox-drain` は、レガシーなテナント所有の Sandbox リソースを削除します。`--plan` でプレビューし、`--yes` で適用します。続行するには、`nextCursor` を `--cursor` に渡します。クリーンアップの間、アプリケーションのトラフィックは一時停止したままです。

`rotate-proxy-tokens` は、再デプロイを行わずに、プロジェクトの稼働中の Worker とロールバック用に保持されている Worker に、新しいプラットフォームの認証情報を与えます。作成者がもうデプロイできない、ロールバック用に保持されている Worker では、古い認証情報が維持されます。1 つのプロジェクトには `--project <id>`、すべてのプロジェクトには `--all` を使用し、`--plan` でプレビュー、`--yes` で適用します。`--plan` だけを指定すると、まだ実行中のすべてのローテーションが表示されます。各実行では上限付きのバッチを処理し、残りはプラットフォームがバックグラウンドで完了します。ローテーションは 1 プロジェクトあたり約 6 分かかり、デプロイの実行中はそれより長くなります。保留中や失敗したものがなくなるまで、`--plan` で進行状況を確認してください。ローテーションがまだ実行中の間に `--project` または `--all` を付けて再度 `--yes` を実行すると、そのプロジェクトに対してもう 1 つローテーションが開始されます。ローテーションが完了すると、以前の認証情報は使用できなくなります。各ローテーションはプロジェクトの稼働中の Worker の新しいバージョンを開始するため、WebSocket 接続は 1 回再接続されます。

インストールの Worker を保守するには、[プラットフォームのライフサイクルコマンド](./platform-installation.md#lifecycle-commands)を使用します。

## ホスト型 Worker {#operator-workers}

次のコマンドは、ホスト型の Void Cloud プラットフォームの Worker を管理します。セルフホストのインストールでは利用できません。そちらでは、代わりに[ライフサイクルコマンド](./platform-installation.md#lifecycle-commands)を使用してください。

```sh
void platform worker list [--environment <production|staging>]
void platform worker show <worker-name> [--environment <production|staging>]
void platform worker rollback <worker-name> <version-id> [--environment <production|staging>]
void platform worker rollback-all [--environment <production|staging>]
void platform worker events [batch-id] [--environment <production|staging>]
```

`api` や `proxy` のような、`worker list` に表示される名前を使用します。`show` は、そのバージョンと現在のデプロイを一覧表示します。どちらのロールバックも `--plan` でプレビューしてから、対話的に、またはスクリプトでは `--yes` を付けて適用します。`events` は、Worker の操作イベントを一覧表示するか、ID で 1 つのバッチを確認します。
