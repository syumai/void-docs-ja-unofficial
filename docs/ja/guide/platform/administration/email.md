---
outline: deep
---

# メール {#email}

## メールの管理 {#managing-email}

これらのコマンドは、メールを有効にしているプラットフォームに適用されます。すべてのプロジェクトは、プラットフォームの共有メールドメイン上の `<slug>+tag@<mail domain>` から送信できます。`email/` ハンドラーを持つアプリをデプロイすると、受信ルールの準備ができた時点で、そのアドレスでの受信が設定されます。アプリケーションがそれをどう扱うかについては、[メールガイド](/ja/guide/email)を参照してください。

共有の受信メールでは、受信するプロジェクトごとに 1 つの完全一致ルーティングルールを使用し、Cloudflare のゾーン単位のプラスアドレス指定を有効にします。プロジェクトの作成や、メール送信のみを行うアプリのデプロイでは、受信ルールは消費されません。既存のルールとアペックスのキャッチオールはそのまま残ります。Cloudflare は通常、[ドメインあたり 200 件のルーティングルール](https://developers.cloudflare.com/email-service/platform/limits/)を許可しています。共有ドメインが上限に達した場合は、未使用のルールを削除するか、より高い上限を申請してください。プロジェクトのベースアドレスまたはプラスアドレスに対する無関係なルールがあると、その競合が取り除かれるまでセットアップはブロックされます。

受信者の作成が中断された場合は、保持されている意図を確認します。

```sh
void platform email shared-recipients --project my-app
void platform email shared-recipient-resolve <recipient-id> --ended --outcome not-applied --reason "Provider audit confirms the request did not create a rule" --plan
```

報告された復旧時刻まで待ち、元の実行が終了したことを確認し、プランに表示された正確なプロバイダーリソースを確認します。所有する正確なルールが存在する場合は `applied` を使用します。プロバイダーの監査によって作成が行われなかったことが確認できる場合にのみ、`not-applied` を使用します。存在しないことだけでは、結果を確定できません。確認後、同じコマンドを `--yes` を付けて実行します。復旧では、ルールの作成や削除を行わずに、判断をプラットフォームイベントに記録します。その後、通常の整合処理によって配信が検証されます。削除中のプロジェクトは閉じたままで、その削除は再試行できます。復旧の要件については、[オペレーターのメールコマンド](../../../reference/cli/platform-email.md#operator-email)を参照してください。

### メールの到達先を決める {#deciding-who-mail-may-reach}

既定では、共有送信元からのメールは、各プロジェクトが検証した受信者にのみ届きます。アプリケーションが主に同僚にメールを送るチームでは、インストール全体に対して 1 度だけこれを広げられます。

```sh
void platform email policy
void platform email policy-set domains --domains example.com,corp.example.net
void platform email policy-set any
void platform email policy-set verified
```

ポリシーは、管理 UI の **Email** ページまたは上記のコマンドで選択します。

- `verified`: 各プロジェクトの検証済み受信者のみ。
- `domains`: 検証済み受信者に加えて、リストされたドメイン上の任意のアドレス。
- `any`: 任意の受信者。

未検証の受信者に送信するには、引き続き Cloudflare Email Sending のオンボーディングと [Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans) が必要です。そうでない場合、それらの送信は `UNVERIFIED_DESTINATION` を返します。プロジェクトのカスタムドメインからのメールと、プラットフォーム自身のメールドメイン宛てのメールには、常に受信者の検証が必要です。

ポリシーの変更は新規の送信に適用されます。すでに受け付けられた試行は完了することがあります。

### プロジェクトの上限 {#project-caps}

各プロジェクトには、既定で UTC の暦月あたり 200 件、直近 60 秒間で 10 件の受信者への送信が許可されています。試行は開始された時点で課金済みとなり、失敗した場合や結果が不明な場合も同様です。プロジェクトの上限は、ID またはスラッグを指定して引き上げたり引き下げたりできます。

```sh
void platform email limit hr-portal --monthly 2000 --burst 30
```

管理 UI のプロジェクトページには現在の値が表示され、そこから上書きをクリアできます。

### 中断された送信からの復旧 {#recovering-an-interrupted-send}

送信側がプロバイダーの呼び出しを開始した後に停止すると、未解決の試行によって、プロジェクトまたは送信ドメインの削除がブロックされます。試行の ID と開始時刻を確認します。

```sh
void platform email attempts --project hr-portal
```

まず、Worker のログまたはインシデント記録を通じて、元の実行が終了したことを確認します。試行から 24 時間以上が経過したら、受信者のアドレスやメッセージ内容を含まない監査理由を付けて解決します。

```sh
void platform email attempt-resolve <attempt-id> --ended --reason "Original Worker execution ended; provider outcome could not be verified" --plan
void platform email attempt-resolve <attempt-id> --ended --reason "Original Worker execution ended; provider outcome could not be verified"
```

これにより、その送信は `outcome_unknown` として記録され、クリーンアップフェンスが解放されます。試行は課金済みのままで、再試行されることはありません。30 日間の配信記録がすでに期限切れの場合は、受信者情報を含まないフェンスのみが削除されます。元の実行がまだ動作している可能性がある間は、試行を解決しないでください。

プロジェクトの保持されている受領記録と受信者ごとの結果は、次のコマンドで確認できます。

```sh
void platform email logs hr-portal --page 1 --limit 50 --json
```

ログには、操作 ID、記録された結果、プロバイダーの参照、エラーコードが含まれます。プロジェクトの削除後は、30 日間のメタデータ保持期間が終了するまで、そのプロジェクト ID を使用します。メッセージ本文、件名、添付ファイル、認証情報はログに記録されません。

### プロジェクトのメールドメインを登録する {#registering-email-domains-for-projects}

ユーザーが Cloudflare アカウントを持っていない場合があります。管理者がメールドメインを登録することをプラットフォームに設定すると、`void email domain add` はトークン作成ページを開く代わりに、あなたに依頼するためのコマンドを表示します。

```sh
void platform email settings-set --domains admin
```

その後、プロジェクトのドメインを登録します。ゾーンはプラットフォームの Cloudflare アカウント内にある必要があります。セットアップにはプラットフォーム自身の認証情報が使用され、ドメインごとの Cloudflare 認証情報は保存されません。

```sh
void platform email domain-add example.com --project hr-portal
void platform email domain-status example.com
void platform email domain-rotate-secret example.com
void platform email domains
```

選択した Cloudflare ゾーンのアペックスを使用してください。プラットフォーム管理のカスタム受信メールはキャッチオールを使用しますが、これはサブドメインをカバーしません。他のメールプロバイダーを使用していないアペックスを選ぶか、プラットフォームの共有メールアドレスを使用してください。`domain-status` は、受信、送信、管理の準備状況を個別に報告します。必要な DNS または Cloudflare ダッシュボードの手順を実施してから、`domain-sync` で整合させます。ゾーンの ingress 認証情報を明示的に置き換える必要がある場合は、`domain-rotate-secret` を使用します。Email Sending のオンボーディングには Workers Paid が必要です。アップグレード後に `domain-sync` を実行すると、再度試行されます。別の Cloudflare アカウントのゾーンの場合は、そのアカウントの API トークンを標準入力から渡します。

```sh
void platform email domain-add other.example --project hr-portal --token-stdin --yes < token.txt
```

プロジェクトオーナーは、管理者が登録したドメインを `void email domain list` と `status` で確認できます。`status` は、自分では実行できない手順について `void platform email` コマンドを案内し、`sync` と `remove` は `domain-sync` と `domain-remove` を案内します。`admin` に切り替える前にオーナーが登録したドメインは、引き続きオーナー自身が更新、同期、削除できます。これを機能させるには、ランタイムトークンに[セルフホスティングガイド](/ja/guide/platform/installation/credentials#runtime-token-permissions)に記載されているメール権限が必要です。

権限の拒否によって、セットアップはブロックされたままになります。修正後に `domain-sync` を実行すると、同じセットアップ操作が再開されます。ブロックされたローテーションを、ステージ済みのシークレットを置き換えずに再開するには、`domain-rotate-secret` を再度実行します。プロジェクトの削除によってドメインのクリーンアップがブロックされた場合は、権限を修正してから `domain-remove <domain>` を実行し、保持されているクリーンアップを完了させます。そのトークンが期限切れまたは失効している場合は、同じアカウントとゾーンにスコープされた代替トークンを渡します。

```sh
void platform email domain-remove other.example --token-stdin --yes < token.txt
```

この復旧は、プロジェクトの削除が開始されており、他のプロジェクトがその接続を使用していない場合にのみ利用できます。稼働中のプロジェクトでは、`domain-add` を通じてトークンを更新します。タイムアウトした Cloudflare の変更は、再実行するとプロバイダーへの書き込みが重複する可能性があるため、停止したままになります。元の実行が終了したことを確認したら、24 時間待ち、プレビューに示された正確なルーティング、Worker、シークレット、キャッチオール、または Sending のリソースを確認し、その復旧フェンスを使用します。

```sh
void platform email operation-resolve <operation-id> --ended --outcome <applied|not-applied> --reason "Provider state verified" --plan
void platform email operation-resolve <operation-id> --ended --outcome <applied|not-applied> --reason "Provider state verified"
```

復旧は、保存された意図を作成したものと同じプラットフォームバージョンで実行してください。`applied` は書き込みを再実行せずに続行し、`not-applied` はその正確なステップの再試行を許可します。シークレットのローテーションはステージ済みの世代を保持し、削除は未解決のクリーンアップステップから再開されます。時間の経過だけでは、再試行は許可されません。
