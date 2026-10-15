---
outline: deep
---

# プラットフォームのユーザーとプロジェクト {#operator-users}

これらのコマンドには、管理者のセッションを使用します。プラットフォームの選択、プレビュー、確認については、[プラットフォーム管理](./platform.md#operator-commands)を参照してください。

ログイン名、メールアドレス、または ID でユーザーを検索し、そのプロジェクトと使用状況を確認します。

```sh
void platform user list [--search <text>] [--page <n>] [--limit <n>]
void platform user show <id>
```

同じ ID を使って、プランの変更、アカウントの停止または復元、削除を行います。

```sh
void platform user plan <id> <plan-id>
void platform user suspend <id> [--reason <text>]
void platform user restore <id>
void platform user delete <id>
```

ユーザーを停止すると、スケジュールジョブやキューコンシューマーを含め、そのユーザーのアプリケーションがブロックされます。アカウントが停止されている間、各キューメッセージは約 1 時間に 1 回再試行され、再試行のたびにそのキューのリトライ回数が 1 回消費されます。リトライ回数を使い切ったメッセージは破棄されます。デフォルトの 3 回では約 3 時間後、`maxRetries: 0` のキューでは即座に破棄されます。誤って停止したアカウントは、速やかに復元してください。キューの配信は約 1 時間以内に再開されます。ユーザーを削除すると、そのプロジェクトのリソースも削除されます。プランを変更するとリソースの上限が更新されますが、管理者による停止は維持されます。

最後のアクティブな管理者は、削除も停止もできません。このルールは、プレビューと実際の変更の両方で、ブラウザの管理 UI も含めて適用されます。許可された管理者の削除では、リソースのクリーンアップの前に管理者のアクセス権が取り消されます。クリーンアップが失敗した場合も、アクセス権は取り消されたままとなり、部分的な結果にそのことが報告されます。

## プロジェクト {#operator-projects}

プラットフォーム全体のプロジェクトを一覧表示し、所有者で絞り込み、または 1 つのプロジェクトのリソースを確認します。

```sh
void platform project list [--user <user-id>] [--search <text>] [--page <n>] [--limit <n>]
void platform project show <id>
void platform project normalize <id> [--plan | --yes]
void platform project delete <id>
void platform project owner <project-id> <user-id>
```

検索は、プロジェクトのスラッグ、ID、または所有者のログイン名に一致します。`show` には、リソース、ドメイン、最新 10 件のデプロイ、最新 20 件のビルドが含まれます。`delete` は、プロジェクトとそのリソースを削除します。

デプロイ時にプロジェクトの正規化が必要だと報告された場合、オペレーターは `normalize <id> --plan` でプレビューし、`--yes` で適用できます。プロジェクトのレコードを更新する前に、提供中のデプロイと記録されているキュー名を検証します。トラフィックと Cloudflare のリソースはそのまま残し、デプロイまたは復旧が進行中の間は変更を拒否します。検証済みのキュー名が、期待される配信ルーティング名と異なる場合、正規化は変更を拒否します。そのキューのルーティングを整合させてから再試行してください。提供中のデプロイを検証できない場合は、報告されたルートを調査してから再試行してください。アクティブなデプロイが存在しないプロジェクトをアップグレードする前に、以前の互換性のあるプラットフォームのランタイムで、中断されたデプロイの復旧を完了させてください。

`owner` は、プロジェクトを別の登録済みユーザーに移管します。`--plan` でプレビューし、対話的に、または `--yes` で適用します。プレビューには、アクティブな作業によるブロック要因と、適用されるアカウントのプランが報告されます。元の所有者はプロジェクトの管理者になり、プロジェクトにスコープされた既存の CI デプロイ認証情報は取り消され、すでに発生した使用量は元の所有者に残ります。

## サインアップのアクセス {#operator-signup}

サインアップの制限を確認し、全員にサインアップを開放するか、許可リストとの一致を必須にします。

```sh
void platform signup show
void platform signup open
void platform signup restrict
```

GitHub またはメールのエントリを、その種類とパターンで追加および削除します。

```sh
void platform signup allow <github|email> <pattern> [--note <text>]
void platform signup disallow <github|email> <pattern>
void platform signup remove <github|email> <pattern>
```

`remove` は、既存のスクリプト向けのエイリアスとして引き続き利用できます。GitHub のエントリはログイン名に一致します。メールのエントリは、サインインプロバイダーをまたいで、アドレスまたは `*@example.com` のようなドメインパターンに一致します。ワイルドカードのパターンは、シェルで引用符で囲んでください。

確認済みのメールアドレスを持たない OIDC のアイデンティティには、設定済みの接続 ID と、プロバイダーの安定したサブジェクトを使ってアクセスを許可します。

```sh
void platform signup allow identity <connection-id> <subject> [--note <text>]
void platform signup disallow identity <connection-id> <subject>
```

接続 ID は `void platform config auth list` で確認できます。アイデンティティのサブジェクトは、大文字小文字を区別して完全一致します。ワイルドカード、メールの推論、アカウントのリンクは適用されません。ログイン方法のドメインやグループの制限も引き続き通過する必要があり、新たに受け入れられたアカウントには通常のユーザーロールが付与されます。招待制または許可リスト制のサインアップでは、許可リストが空の場合、新しいアカウントはブロックされます。会社承認制のサインアップでは、会社のルールに加えて、明示的な許可によっても人が受け入れられます。

## 招待 {#operator-invitations}

メールで人を招待し、参加したかどうかを追跡します。

```sh
void platform invitation list [--page <n>] [--limit <n>]
void platform invitation send <email[,email...]>
void platform invitation revoke <id>
```

send は、カンマ区切りで最大 100 件のアドレスを受け付けます。メールの配信が利用できない場合や失敗した場合でも、招待によってサインインのアクセスが付与されます。配信状況は別途報告されます。メールが送信されない場合は、プラットフォームの `/invite` ページまたは `void connect '<platform URL>'` コマンドを、自分で共有してください。保留中の招待を取り消すと、その正確なメールアドレスの許可が削除されます。より広いドメインのエントリによって、その人がサインアップできる場合があります。
