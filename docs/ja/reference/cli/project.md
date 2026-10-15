---
outline: deep
---

# プロジェクト {#project-commands}

## `void project status [name]` {#void-project-status-name}

設定されたターゲットのデプロイを表示します。

- Void ターゲットでは、最近のホスト型デプロイが表示されます。`[name]` でスラッグを指定してプロジェクトを検索でき、省略した場合はリンクされているプロジェクトが使用されます。
- Cloudflare ターゲットでは、Worker Version を一覧表示し、アクティブなバージョンを示し、記録されたマイグレーション数を表示します。Worker 名は `void.config.ts` の `cloudflare.name` から決まるため、プロジェクト名は受け付けられません。
- オーナーと管理者には、プラットフォームが[プロジェクトの認証情報の置き換え](../../guide/project-collaboration.md#change-or-remove-access)を完了できない場合にも、警告が表示されます。

## `void project link [name]` {#void-project-link-name}

現在のディレクトリを、既存のホスト型 Void プロジェクトにスラッグでリンクします。省略した場合は、対話的に選択します。状態は `.void/project.json` に保存されます。Cloudflare に直接デプロイするアプリは、`void.config.ts` の `cloudflare.name` を使用するため、リンクは不要です。

## `void project list` {#void-project-list}

アクセス可能なすべてのホスト型プロジェクト（スラッグ、ロール、種類、URL）を一覧表示します。共有されたプロジェクトも含まれ、ロール列で自分が所有するプロジェクトと区別できます。保存された Cloudflare ターゲットでは、Void のプロジェクトレジストリがないため、代わりに現在の Worker のバージョンが表示されます。

## `void project team` {#void-project-team}

Void プラットフォームでホストされているプロジェクトへのアクセスを管理します。

```sh
void project team list [--project <slug>]
void project team invite <email> --role <reader|collaborator|admin> [--project <slug>]
void project team invitations [--project <slug>]
void project team role <user-id> <reader|collaborator|admin> [--project <slug>]
void project team remove <user-id> [--project <slug>]
void project team revoke <invitation-id> [--project <slug>]
void project team leave [--project <slug>]
void project team pending
void project team accept <invitation-id>
void project team decline <invitation-id>
```

プロジェクトにスコープされたコマンドは、`--project`、`VOID_PROJECT`、リンクされているプロジェクトの順に使用します。招待できるのは、そのプラットフォームのユーザーとしてすでに登録されているメールアドレスのみです。アカウントの作成やサインアップアクセスの付与は行いません。招待されたアカウントだけが、その招待を承諾または辞退できます。`list` は、`void project status` と同じ認証情報の警告を表示します。

リーダーはプロジェクトを閲覧できますが、デプロイはできません。コラボレーターはデプロイし、デプロイの前提条件を管理できます。プロジェクト管理者はさらに、ドメイン、メール送信先、GitHub の設定、プロジェクトチームを管理できます。プロジェクトを削除できるのは、オーナーだけです。ロールの境界の詳細については、[プロジェクトのコラボレーション](../../guide/project-collaboration.md)を参照してください。

プロジェクトにスコープされたチーム管理コマンドは、Cloudflare に直接デプロイされたプロジェクトでは利用できません。アカウントにスコープされた `pending`、`accept`、`decline` コマンドは、現在のプロジェクトのリンクやデプロイターゲットに関係なく、`void connect <url>` で選択されたアクティブな接続を使用します。`VOID_API_URL` が優先されます。スコープのない `VOID_TOKEN` は Void Cloud を選択します。これらのコマンドは接続先のプラットフォームを表示し、招待を承諾してもディレクトリのリンクはそのまま維持されます。招待されたアプリケーションをリンクするには、そのアプリケーションのリンクされていないチェックアウトで `void project link` を実行します。

## `void project zero-trust` {#void-project-zero-trust}

Void プラットフォーム上のプロジェクトの保護を確認または上書きします。

```sh
void project zero-trust status [--project <slug>]
void project zero-trust protect [--project <slug>]
void project zero-trust public [--project <slug>]
void project zero-trust reconcile [--project <slug>]
```

プロジェクトの選択は、`--project`、`VOID_PROJECT`、リンクされているプロジェクトの順に従います。

リーダーは状態を確認できます。オーナーまたはプロジェクト管理者は、プロジェクトを保護したり、公開したり、ドリフトを修復したりできます。`public` は、今後のプロジェクトに対するプラットフォームのデフォルトを変更しません。デプロイとロールバックは、保護の変更が完了するまで待機します。拒否された場合は、再試行する前に、オーナーまたはプロジェクト管理者が `void project zero-trust reconcile` を実行できます。これらのコマンドは、Cloudflare への直接デプロイには適用されません。

## `void project token <create|list|renew|revoke>` {#void-project-token-create-list-renew-revoke}

1 つの Void プラットフォームのプロジェクトに対して、失効可能な `aud: deploy` 認証情報を管理します。この認証情報は、`void deploy` が使用するエンドポイントのみを呼び出せます。オペレーター、アカウント、シークレットの書き込み、プロジェクトの削除、または他のプロジェクトのルートにはアクセスできません。

```sh
void project token create --name github-actions --expires-in 30
void project token list
void project token renew <credential-id> --expires-in 30
void project token revoke <credential-id>
```

リンクされたプロジェクトの外では、`--project <name>` を渡してください。有効期限は 1 日から 90 日の範囲です。作成と更新ではベアラー値が 1 度だけ表示されます。更新と同じ操作で以前の認証情報が失効するため、更新後はすぐに保存済みのシークレットを置き換えてください。プロジェクトの削除とオーナーの停止によっても、使用できなくなります。ログイン方法の無効化では、これらの独立したデプロイ用認証情報は失効しません。

表示された `VOID_TOKEN` と `VOID_API_URL` を、CI のシークレットマネージャーに保存してください。Access のペアは境界を通過するためのもので、スコープが限定された Void の認証情報は、このプロジェクトのデプロイワークフローのみを認可します。Access で保護されたプラットフォームでプリレンダリングやリモートプロキシのバインディングを使用する場合は、両方に同じサービストークンのペアを使用していても、正確な HTTPS オリジンを両方含む、オリジンをキーとした JSON シークレットとして `VOID_ACCESS_CREDENTIALS` を保存してください。

```json
{
  "https://void-company-api.example.workers.dev": {
    "CF_ACCESS_CLIENT_ID": "<service-token client ID>",
    "CF_ACCESS_CLIENT_SECRET": "<service-token client secret>"
  },
  "https://void-company-proxy.example.workers.dev": {
    "CF_ACCESS_CLIENT_ID": "<service-token client ID>",
    "CF_ACCESS_CLIENT_SECRET": "<service-token client secret>"
  }
}
```

`VOID_ACCESS_ORIGIN` は、ペアを 1 つのオリジンにスコープします。そのため、API のオリジンだけを選択しても、プロキシを呼び出すワークフローには不十分です。Access のポリシーで必要な場合は、2 つのエントリーで異なるペアを使用してください。

## `void project logs` {#void-project-logs}

```
void project logs [--level <level>] [--filter <text>] [--range <duration>] [--deployment <id>]
```

デプロイされたターゲットのランタイムログを表示します。ホスト型の Void ターゲットでは、保持されているログ履歴を照会します。Cloudflare ターゲットでは、`void.config.ts` に指定された Worker のライブテイルを開きます。過去のログの保存は提供されません。

| フラグ               | 目的                                                                                                                                                                                                                                                 | デフォルト |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `--range <duration>` | どこまで遡るか。形式は `<number><unit>` (m/h/d)。最大 7d。                                                                                                                                                                                           | `1h`       |
| `--level <level>`    | ログレベルで絞り込みます。`error`、`warn`、`info`、`log`、`debug`、`all` のいずれかです。`error` には、キャッチされなかった例外、`ok` 以外の結果、およびすべての 5xx レスポンスも含まれます。Worker が例外をスローせずログも出力しなくても対象です。 | `all`      |
| `--filter <text>`    | ログメッセージのテキストと例外の名前・メッセージに対する、大文字小文字を区別しない**部分文字列**の一致です。レベルフィルターではありません。一致した場合は、リクエストのエントリー全体が表示されます。                                               | なし       |
| `--deployment <id>`  | ログを特定のデプロイ ID で絞り込みます。                                                                                                                                                                                                             | なし       |

出力には、リクエストごとに 1 行（`HH:MM:SS METHOD URL STATUS`）が表示され、その下にインデントされたコンソールログと例外の行が続きます。エラーと例外は赤、警告は黄色で表示されます。

例:

```
void project logs --level error --range 12h
void project logs --level error --filter websocket
```

ログには、トップレベルの `console.*` 呼び出しと、Cloudflare Tail によって捕捉されたキャッチされなかったエラーが含まれます。エラーをキャッチしてデータベースにのみ保存した場合、ここには表示されません。`void/log` の `console.error()` または `logger.error()` でもログに出力してください。ホスト型の Void ターゲットでは、`console.error('Save failed:', error)` のように `Error` オブジェクト自体を `console.error()` に渡すと、ログ行の下にスタックトレースが表示されます。`error.message` だけをログに出力した場合、スタックは表示されません。

エッジのルーティングエラーや静的サイトへのリクエストなど、Worker に到達しないエラーについては、`void project requests --status 5xx` を使用してください。

Cloudflare に直接デプロイしたターゲットでは、`--filter` は Cloudflare のライブ検索になり、`--deployment` は Worker Version を選択し、`--level error` はエラーの呼び出しを選択します。それ以外の個別のコンソールレベルでは絞り込めず、`--range` で履歴を選択することはできません。`void project requests` はホスト型専用です。

## `void project requests` {#void-project-requests}

```
void project requests [--status <filter>] [--range <duration>]
```

リンクされているプロジェクトのリクエストトラフィックを表示します。Worker のログに表示されない静的アセットやエッジのエラーも含まれます。

| フラグ               | 目的                                                                                                       | デフォルト |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| `--status <filter>`  | ステータスで絞り込みます。クラス（`2xx`、`3xx`、`4xx`、`5xx`）または正確な 3 桁のコード（例: `500`）です。 | なし       |
| `--range <duration>` | どこまで遡るか。形式は `<number><unit>` (m/h/d)。最大 7d。                                                 | `1h`       |

出力には、リクエストごとに 1 行（`HH:MM:SS METHOD STATUS TYPE DURATION`）が表示されます。5xx は赤、4xx は黄色で表示されます。注意: リクエストのパスは記録されないため、このビューには URL ではなく、ステータスと種類が表示されます。Worker に到達したリクエストの URL ごと、ログごとの詳細については、`void project logs` を使用してください。

例:

```
void project requests --status 5xx
void project requests --range 24h
```

## `void project rollback [deployId]` {#void-project-rollback-deployid}

```
void project rollback [deployId]
```

以前のデプロイまたは Worker Version にロールバックします。

- `[deployId]` を省略すると、保持されているデプロイの対話的な選択メニューが表示されます
- 対象のデプロイの適用済みマイグレーションが現在のデプロイより少ない場合は、確認の前に、マイグレーションの差分を一覧にした警告が表示されます

Void プラットフォームでは、保持されているデプロイを選択できます。Cloudflare では、完全な Worker Version ID、または曖昧でないプレフィックスを使用します。Void は、そのバージョンを 100% でアクティブにします。両方のバージョンに完全なトリガーのスナップショットがある場合は、選択したバージョンのスケジュール、キュー、ワークフロー、ルート、カスタムドメインも復元します。そうでない場合、ロールバックは現在のトリガーを維持してコードを復元します。これには、もともと Void の外でデプロイされたバージョンも含まれます。

ロールバックでは、データベースのマイグレーションは元に戻りません。古いコードが新しいスキーマに対して実行される可能性がある場合や、マイグレーションのメタデータが不足している場合は、Void がリスクを説明し、確認を求めます。

## `void project cancel [deployId]` {#void-project-cancel-deployid}

```
void project cancel [deployId]
```

アクティブなデプロイをキャンセルします。

- `[deployId]` を省略すると、リンクされているプロジェクトのアクティブなデプロイが対象になります
- `[deployId]` を指定すると、そのデプロイが対象になります。そのデプロイはまだアクティブである必要があります

Void は、キャンセルを要求する前に確認を求めます。

このコマンドはホスト型専用です。Cloudflare への直接デプロイはローカルでの操作であり、キャンセルできるリモートビルドはありません。

## `void project delete [name]` {#void-project-delete-name}

ホスト型の Void プロジェクトと、そのすべてのリソース（データベース、KV 名前空間、R2 バケット、デプロイ）を完全に削除します。確認のためにプロジェクトのスラッグの入力が必要です。`--force`（`-f`）を指定すると、プロンプトをスキップします。

`[name]` を省略した場合は、リンクされているプロジェクトが使用されます。

Cloudflare への直接のターゲットでは、このコマンドの実行は拒否されます。推論されたリソースは共有されている可能性があるため、Void は自動的な削除を行いません。所有権を確認し、Cloudflare のツールで明示的にリソースを削除してください。

## `void project purge-cache` {#void-project-purge-cache}

```
void project purge-cache [--project <name>]
```

リンクされているプロジェクトのキャッシュ済みのページをすべてパージします。エッジキャッシュは数秒以内にクリアされます。

`--project` を指定すると、リンクされているプロジェクトの代わりに、そのプロジェクトのキャッシュをパージします。

このコマンドはホスト型専用です。Cloudflare への直接のターゲットでは、再デプロイするか、設定済みの ISR KV 名前空間を自分でパージしてください。
