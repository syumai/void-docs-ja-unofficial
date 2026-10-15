---
outline: deep
---

# プラットフォーム設定 {#plan-configuration}

これらのコマンドには、管理者セッションを使用します。プラットフォームの選択、プレビュー、確認については、[プラットフォーム管理](./platform.md#operator-commands)を参照してください。

`void platform config plans` は、管理者セッションを使用して対話型のプランメニューを開きます。プランには、安定した ID と編集可能な表示名があります。既存のプランをコピーして追加したり、再デプロイせずに制限を編集したり、アーカイブして新規の割り当てを停止したり、そのプランのアカウントに対する置き換え先を明示して削除したりできます。

```sh
void platform config plans show [plan-id]
void platform config plans add <plan-id> --copy <existing-id> --name "Team"
void platform config plans set <plan-id> [--name "Team"] [--file plan.json]
void platform config plans reset <builtin-plan-id>
void platform config plans archive <plan-id>
void platform config plans restore <plan-id>
void platform config plans remove <plan-id> [--replacement <plan-id>]
void platform config plans default <plan-id>
void platform config plans sync
```

`--plan` を使うと、変更内容と影響を受けるアカウントをプレビューできます。スクリプトによる変更には `--yes` が必要です。すべてのコマンドが `--connection <slug-or-url>` と `--json` をサポートします。`show` は、有効な制限、既定のプラン、割り当て、保留中のアカウント更新を報告します。`reset` は、組み込みプランの元の制限とビルドインスタンスサイズを復元します。アーカイブされたプランは既存のアカウントを維持しますが、新規の割り当ては受け付けません。既定のプランをアーカイブする場合は、先に既定を変更してください。`remove` は、アカウントを持つプランまたは既定のプランに対して、置き換え先を必要とします。既定を変更しても、影響を受けるのは新しいアカウントだけです。

`add` と `set` では、`--file` は JSON オブジェクトを読み込みます。このオブジェクトには、任意で `name`、`limits`、`buildInstanceType`、真偽値の `allowShortSlugs` を含められます。`limits` は、非負の整数からなる部分的なオブジェクトで、`0` はプランによる制限なしを意味します。ビルドのタイムアウトは、プラットフォームの上限である 60 分に制限されたままで、`0` はその上限を使用します。省略した設定は、現在の値、またはコピー元のプランの値を保持します。`buildInstanceType` は `standard-3` または `standard-4` です。`allowShortSlugs` は、5 文字以下のプロジェクトスラッグの今後の割り当てを許可します。既存の URL は引き続き利用できます。ストレージのクォータは編集できません。サポートされている制限と例については、[プランと制限](../../guide/platform/administration/plans.md)を参照してください。

適用時には、プレビューのリビジョンが確認され、同時に行われた変更は拒否されます。クォータを下げると、すでにそれを超えているアカウントが制限される場合があります。使用量の履歴と請求期間は保持されます。CLI は、アカウントの更新が完了するまで続行します。更新が失敗したり、進行しなくなったりした場合、設定は保存されたままで、コマンドは異常終了します。プランを再度編集する前に、`sync --yes` を実行して続行してください。リクエストの結果が不確かな場合は、`show` とオペレーターイベントを確認してください。

## 認証設定 {#authentication-configuration}

`void platform config auth` は、対話型の設定を開きます。これらのコマンドは、`void platform auth login` で取得した管理者セッションを使用します。

```sh
void platform config auth list
void platform config auth show company
void platform config auth add google
void platform config auth add oidc --id company
void platform config auth add cloudflare-access --id access
void platform config auth configure company
void platform config auth test company
void platform config auth link company
void platform config auth enable company
void platform config auth disable github
void platform config auth admission
void platform config auth protection show
void platform config auth protection enable --installation <id>
void platform config auth protection disable --installation <id>
void platform config auth recover company --installation <id> --file recovery.json
```

既存のインストールを初めて設定する場合は、`void platform config auth initialize` を実行してから、再度サインインしてください。現在のログイン方法とサインアップポリシーは維持されます。

方法を追加または編集すると、保留中の設定として保存されます。有効にすると、適用する前にブラウザーでログインが検証されます。検証済みの ID をあなたのアカウントにリンクするのは、別の明示的な操作です。方法を無効にする前に、リンク済みの代替手段を検証してください。最後の方法は無効にできません。無効にすると、その方法で作成された人間のセッション(オペレーターセッションを含む)が失効します。スコープ付きのデプロイトークンは有効なままです。`VOID_TOKEN` として使用されている人間のログイントークンは、引き続き失効します。

コマンドは `--connection <slug-or-url>` と `--json` を受け付けます。変更には `--plan` または `--yes` を指定します。スクリプトによる設定では、機密でないフィールドには `--file <path>` を、シークレットを含む環境変数には `--client-secret-env <name>` を使用します。編集時にシークレットを省略すると、保存済みの値が保持されます。スクリプトで `enable` または `link` を行う場合は、完了したテストの `--test-id <id>` を指定してください。`test --json` は、完了を待たずに、ブラウザー URL、テスト ID、有効期限を返します。

`admission` は、招待制/許可リスト制、会社承認制、公開サインアップのいずれかを選択します。会社承認制のサインアップでは、ユーザーが設定済みの会社ルールを満たすと、通常のアカウントが自動的に作成されます。有効で、会社に制限された OIDC または Google Workspace の方法、もしくは有効な Cloudflare Access のゲートを選択します。スクリプトでは、`admission --file <path> --yes` が `{"mode":"company","connections":["company"],"access":false}` のようなポリシーを読み込みます。

`protection enable` は、ログイン方法とは独立して、Cloudflare Access アプリケーションを作成または接続します。その `--file` は、[インストールのセットアップ](../../guide/platform/installation/setup.md#choose-login-methods)で説明されている `cloudflareAccess` オブジェクトを受け付けます。保護の変更には、インストールの所有権、保存済みの復旧用認証情報、人間の管理者セッションが必要です。現在の人間のセッションは失効します。保護を削除する前に、そのゲートに依存しているサインアップルールを変更してください。Cloudflare のアプリケーションは、意図的なクリーンアップのために残されます。

`recover <connection-id>` は、通常のログインができない場合に、既存の管理者を復元します。そのファイルには、`administratorUserId`、任意の機密でないプロバイダーの `configuration`、そして `--yes` を使用する場合は、正確な `issuer` と `subject` を持つ `expectedIdentity` オブジェクトを含めます。復旧には、Cloudflare の管理/データベースの権限、元の復旧キー、ブラウザーでのプロバイダーテストの成功が必要です。新規または更新した認証情報には、`--client-secret-env <name>` を使用します。

自動化については、[オペレーター認証](./platform.md#operator-authentication)を参照してください。
