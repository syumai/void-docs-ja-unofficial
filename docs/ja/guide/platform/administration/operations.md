---
outline: deep
---

# 運用 {#operations}

## 変更のプレビュー {#previewing-changes}

プラットフォームを変更するコマンドは、確認を求める前に影響を受けるオブジェクトを表示します。変更を適用せずに確認するには、`--plan` を追加します。

```sh
void platform user suspend <user-id> --reason "Investigating unexpected traffic" --plan
```

プレビューには、停止されるアカウントと、そのプロジェクトへの影響が表示されます。対話的に確認するには `--plan` を付けずにもう一度コマンドを実行し、変更を適用する準備ができている場合は `--yes` を使用します。

```sh
void platform user suspend <user-id> --reason "Investigating unexpected traffic" --yes
```

スクリプトでこれらの変更を適用するには `--yes` を使用する必要があります。`void platform auth` のセッションコマンドは直接実行され、`--plan` や `--yes` は使用しません。`void platform config auth` 配下の変更では、プレビューと確認が使用されます。変更後は `void platform system events` で、管理者、影響を受けたオブジェクト、記録された結果を確認できます。

アカウントが多くのリソースを所有している場合、変更に時間がかかることがあります。プラットフォームを変更するリクエストは既定で 5 分まで待機します。別の上限を秒単位で設定するには `--timeout` を使用します。

```sh
void platform user delete <user-id> --timeout 600 --plan
```

リクエストがタイムアウトしたり接続が失われたりした場合でも、一部の処理はすでに完了している可能性があります。再試行する前に、影響を受けるオブジェクトと `system events` を確認してください。Void は可能な場合は部分的な結果を報告し、変更を自動的に再実行することはありません。

## ログの追跡 {#following-logs}

デプロイを調査するには、その ID を調べて、ランタイムログを追跡します。

```sh
void platform deployment list --project <project-id>
void platform deployment logs <deployment-id> --since 10m --follow
```

ランタイムログには、アプリケーションのメッセージ、例外、HTTP ステータスコードが含まれます。`--follow` を付けない場合、コマンドは過去のログを 1 ページ分読み取ります。`--since` には、期間、ISO 形式の日付、またはミリ秒単位のタイムスタンプを指定できます。

ログは、リクエストの完了後に利用可能になることがあります。追跡中は 5 分間のオーバーラップを確認することで、遅れて届いたレコードを重複して出力することなく取得します。それ以上遅れたレコードは、後から過去ログを問い合わせる必要がある場合があります。

ビルドログには、ビルドの ID を使用します。

```sh
void platform build logs <build-id> --follow
```

追跡は、ビルドのステータスが変わった後に書き込まれる診断情報も含め、最終的なログを待ってから停止します。GitHub Actions のビルドでは、コマンドがそのログの URL を表示します。

## プラットフォームの確認 {#checking-the-platform}

### ヘルスチェック {#health-checks}

概要で最近のアクティビティを確認するか、ヘルスチェックを実行してプラットフォームのサービスとデータベースをテストします。

```sh
void platform system overview
void platform system health
```

ヘルスチェックは、選択したプラットフォームに設定されているサービスを使用します。異常な結果の場合は 0 以外のステータスで終了するため、同じコマンドをスクリプトでも使用できます。

ダッシュボードの **System Status** ページは、ヘルスチェックを 30 秒ごとに更新し、影響を受けたサービスの横にエラーを表示します。

プラットフォームを保守するには、`void platform upgrade`、`repair`、`disable`、`enable` を使用します。[プラットフォームのメンテナンス](/ja/guide/platform/installation/maintenance#resume-repair-recover-and-upgrade)を参照してください。

アップグレードやロールバックの間、管理 UI は `/admin/status` で進行状況を表示します。[アップグレードとロールバックの進行状況を追跡する](/ja/guide/platform/installation/maintenance#follow-upgrade-and-rollback-progress)を参照してください。

バックアップとリストアについては、[ディザスタリカバリーの準備](/ja/guide/platform/installation/maintenance#prepare-for-disaster-recovery)を参照してください。

## スクリプトの使用 {#using-scripts}

コマンドの結果を別のプログラムから読み取るには、`--json` を追加します。

```sh
void platform user list --page 1 --limit 50 --json
void platform system health --json
```

結果は標準出力に出力されます。コマンドのエラーは JSON として標準エラーに出力され、0 以外のステータスで終了します。`--follow` を使うと、各ログのレスポンスは個別の JSON 行になります。

オペレータートークンは 1 時間で期限切れになります。CI では、アクティブな管理者に属する有効なフル API ログインセッションから、ジョブの開始時に新しいオペレータートークンを発行してください。プラットフォームを明示的に選択し、シークレットマネージャーからフルセッションを `VOID_TOKEN` として注入して、交換の出力を保護されたジョブ環境に直接取り込みます。

```sh
export VOID_API_URL=https://platform.example.com
VOID_OPERATOR_TOKEN="$(
  printf '%s' "$VOID_TOKEN" | void platform auth token --token-stdin
)" || exit 1
export VOID_OPERATOR_TOKEN
unset VOID_TOKEN
void platform system health --json
unset VOID_OPERATOR_TOKEN
```

交換の間はシェルのトレースを無効にし、どちらのトークンもログや平文のファイルに書き込まないでください。フル API ログインセッションは 30 日で期限切れになり、それより前に失効させることもできます。通常の認証済みログインフローで更新し、保護された CI のシークレットを更新してください。1 時間を超えて実行されるジョブは、フル API セッションが有効なうちに交換を繰り返す必要があります。期限切れのオペレータートークンは自分自身を更新できません。また、Void は管理者の自動化のための永続的なサービストークンを発行しません。

`auth login --token-stdin` は同じ昇格を実行し、1 時間有効なオペレータートークンを対話的な利用のためにシステムのキーチェーンに保存します。コマンドの完全な構文については、[オペレーター認証](../../../reference/cli/platform.md#operator-authentication)を参照してください。
