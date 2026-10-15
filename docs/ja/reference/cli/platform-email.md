---
outline: deep
---

# プラットフォームのメール {#operator-email}

これらのコマンドには、管理者のセッションを使用します。プラットフォームの選択、プレビュー、確認については、[プラットフォーム管理](./platform.md#operator-commands)を参照してください。

共有の送信元からのメールが誰に届くか、誰がメールドメインを登録するか、およびプロジェクトの送信上限を設定します。

```sh
void platform email policy
void platform email policy-set <verified|domains|any> [--domains <domain[,domain...]>]
void platform email settings
void platform email settings-set --domains <self-serve|admin>
void platform email limit <project-id|slug> [--monthly <n>] [--burst <n>]
void platform email logs <project-id|slug> [--page <n>] [--limit <n>] [--json]
void platform email attempts [--project <id|slug>] [--page <n>] [--limit <n>]
void platform email attempt-resolve <attempt-id> --ended --reason <text>
void platform email operation-resolve <operation-id> --ended --outcome <applied|not-applied> --reason <text>
void platform email shared-recipients [--project <id|slug>] [--page <n>] [--limit <n>]
void platform email shared-recipient-resolve <recipient-id> --ended --outcome <applied|not-applied> --reason <text>
```

`policy` は、プロジェクトの `<slug>+tag@<mail domain>` 送信元がどの受信者に届くかを決定します。`verified`(デフォルト)は、そのプロジェクトの確認済みの宛先のみを意味します。`domains` は、列挙したドメイン上のすべてのアドレスを追加します。`any` は、このチェックを解除します。いずれの場合も、プラットフォーム自身のメールドメイン上のアドレスへの配信は広がりません。それらは引き続き確認済みの宛先のみとなるため、どのプロジェクトも、同意なしに別のプロジェクトの受信箱に届くことはありません。プラットフォームのメールドメインが Email Sending にオンボードされるまでは、Cloudflare は確認されていない宛先を拒否します。そのため、`domains` または `any` では、そのような拒否は受信者ごとの `UNVERIFIED_DESTINATION` という結果として返されます。カスタムドメインからの送信は影響を受けません。

`settings-set --domains admin` を設定すると、`void email domain add` はトークンのセットアップを開始する代わりに、管理者向けのコマンドを表示します。`limit` は、プロジェクトの月間および直近 60 秒間の上限(デフォルトはそれぞれ 200 と 10)を上書きします。管理 UI のプロジェクトページで、これらを確認およびクリアできます。

`logs` は、保持されている受信レシートと受信者ごとの結果を確認します。操作 ID、プロバイダーの参照、エラーコード、ポリシーのバージョンが含まれます。ページには最大 100 件のレコードが新しい順に含まれます。すべてのフィールドが必要な場合は `--json` を使用してください。プロジェクトの削除後も、30 日間の保持期間が終了するまでは、そのプロジェクト ID でメタデータを確認できます。メッセージの内容や認証情報は含まれません。

`attempts` は、中断されたプロバイダー呼び出しと、その最も早い解決可能時刻を一覧表示します。元の Worker の実行が終了していて、試行から 24 時間以上が経過している場合、`attempt-resolve` は `outcome_unknown` を記録し、そのクォータの消費を保持したまま、プロジェクトとドメインのクリーンアップのフェンスを解除します。`--ended` は、その呼び出しがもうアクティブではないという管理者の証明です。`--reason` は、オペレーターの監査ログに保存されます。理由には、受信者のアドレスやメッセージの内容を含めないでください。送信が再試行されることはありません。`--plan` でプレビューし、`--yes` でプロンプトなしに適用します。

`operation-resolve` は、結果が不明なままの Cloudflare のルーティング、Worker、シークレット、キャッチオール、または Sending の変更から復旧します。元の実行が終了していて、操作から 24 時間以上が経過したら、プレビューに示された正確なリソースを確認し、その書き込みが `applied`(適用済み)か `not-applied`(未適用)かを証明してください。適用済みの書き込みは次のステップから続行され、未適用の書き込みは、永続化された同じインテントで再試行されます。実行中のプラットフォームのバージョンはそのインテントと一致している必要があるため、古いコードによって作成された操作を復旧する場合は、一致するバージョンに戻してください。時間の経過だけでは、書き込みが再試行されることはありません。

`shared-recipients` は、共有の受信アドレス、プロバイダーのルール名と ID、および削除待ちのプロジェクトを含む中断された作成インテントを検出します。作成の結果が不明な場合は、元の実行が終了していて、その作成インテントから 24 時間以上が経過した後で、`shared-recipient-resolve` を使用してください。`--plan` に示された正確なアカウント、ゾーン、受信者、ルールを確認し、Cloudflare のプロバイダー監査を使って、作成が `applied` か `not-applied` かを判断します。ルールが存在しないという事実だけでは、`not-applied` の根拠として不十分です。その判断を `--reason` に記載してください。これはプラットフォームのイベントに記録されます。

適用済みとしての復旧では、所有しているルールがそのまま存在している必要があり、その ID が記録されます。未適用としての復旧では、プロバイダーの確認を繰り返し行い、管理者の証明を得た後にのみ、作成インテントが解放されます。どちらの結果でも、通常の照合によって検証されるまで、配信は未準備のままになります。復旧そのものがプロバイダーのルールを作成または削除することはなく、削除中のプロジェクトを再開することもありません。クリーンアップを復旧する場合は、その後に削除を再試行してください。プロンプトなしでプレビューを適用するには `--yes` を使用します。インテントまたはプロバイダーの所有権が変わった場合は、新しいプランを確認してください。

所有者が Cloudflare の認証情報を持たないプロジェクトのために、メールドメインを登録・管理します。

```sh
void platform email domains [--project <id|slug>]
void platform email domain-add <domain> --project <id|slug> [--token-stdin]
void platform email domain-status <domain>
void platform email domain-sync <domain>
void platform email domain-rotate-secret <domain>
void platform email domain-remove <domain> [--token-stdin]
```

`domain-add` は、プラットフォームのアカウント内のゾーンに対して、プラットフォームの Cloudflare 認証情報を使用します。別のアカウントの場合は、スコープを絞った Cloudflare API トークンを標準入力にパイプし、`--token-stdin --yes` を指定してください。マネージドなカスタム受信メールには、Cloudflare ゾーンのアペックス(`example.com`)が必要です。その MX レコードがすでに別のメールプロバイダーのものである場合は、プロジェクトの共有メールアドレスを使用するか、未使用の別のゾーンを選択してください。ネイティブな Cloudflare デプロイでは、サブドメイン上のリテラルな受信者アドレスもサポートされています。[自分の Cloudflare アカウント](../../guide/email/domains.md#your-own-cloudflare-account)を参照してください。

`domain-status` は、受信、送信、および認証情報管理の準備状況を、最新の操作とともに表示します。ブロックされた操作は `domain-sync` で再開され、ブロックされたローテーションは `domain-rotate-secret` で再開されます。その際、すでに確認済みのステップと、ステージされた認証情報は保持されます。結果が不確かな操作は、読み戻しによって結果が証明されるか、管理者が `operation-resolve` を使用するまで停止したままになります。管理者が追加したドメインには `managed_by: admin` と表示されます。所有者はそれらを一覧表示して確認できますが、`sync`、`domain-rotate-secret`、`remove` にはこれらのコマンドを使用します。

プロジェクトの削除後に、期限切れまたは失効した Cloudflare トークンのためにクリーンアップがブロックされている場合は、同じアカウントとゾーンにスコープされた新しいトークンを指定して、`domain-remove <domain> --token-stdin --yes` を使用します。これは、他のプロジェクトがその接続を使用していない場合にのみ、保持されているクリーンアップを再開します。稼働中のプロジェクトでは、代わりに `domain-add` でトークンを更新してください。
