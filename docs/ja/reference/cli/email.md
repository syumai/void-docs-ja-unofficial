---
outline: deep
---

# メール {#email}

メールの使用状況を確認し、プロジェクトが送信を許可されている受信者を管理します。ランタイム API については[メール](../../guide/email.md)を参照してください。

メールコマンドでのプロジェクトの解決順序は、デプロイと同じです(`--project`、`VOID_PROJECT`、リンクされたプロジェクト)。`void email setup` と `void email status --platform cloudflare` は例外で、Cloudflare のサインイン(`void cloudflare login`)を通じてご自身の Cloudflare アカウントに対して動作し、Void プロジェクトを必要としません。

## `void email usage` {#void-email-usage}

```
void email usage [--project <name>]
```

当月の受信者への送信試行数と受信数、月間の送信試行数の上限、およびその残りを表示します。予約済みの送信は上限にカウントされます。開始された試行は、配信が失敗した場合や結果が不明な場合でも課金対象のままです。停止されたプロジェクトは、出力内で示されます。

## `void email logs` {#void-email-logs}

```
void email logs [--limit <n>] [--project <name>]
```

30 日間保持される、最近のメール操作のメタデータ(タイムスタンプ、方向、操作 ID、受信者、状態)を表示します。`--limit` には 1〜100 を指定できます。件名、本文、添付ファイルは保存されません。プロバイダーによる受理は、メールボックスへの配信を保証するものではありません。結果が不明な場合は、再試行する前に確認してください。

## `void email destinations` {#void-email-destinations}

```
void email destinations [--project <name>]
```

プロジェクトの受信者アドレスとその状態(`verified`、`pending`、`failed`)を一覧表示します。送信メールは、検証済みのアドレスにのみ配信されます。

## `void email allow` {#void-email-allow}

```
void email allow <address> [--project <name>]
```

プロジェクトの宛先リストに受信者を 1 件追加します。Cloudflare はそのアドレスに確認リンクをメールで送信します。受信者がそれをクリックするだけでよく、Void や Cloudflare のアカウントは不要です。その後 `void email destinations` を実行してください。クリックを記録するのはこの一覧の取得であり、それが行われるまでは、そのアドレスへの送信は当該受信者に対して `UNVERIFIED_DESTINATION` を返します。リンクが届かなかった場合や期限切れの場合は、アドレスがまだ pending の間に `void email allow <address>` を再度実行してください。CLI がリンクを再送するか、新しいリンクの入手方法を案内します。

プロジェクトのオーナーのメールアドレスは、プロジェクトの作成時に自動的に追加されます。そのためこの手順は不要ですが、検証は必要です。以前のあなたのプロジェクトで Cloudflare がすでに検証済みの場合を除き、送信された確認リンクをクリックして `void email destinations` を実行してください。それまでは、自分自身への送信は当該受信者に対して `UNVERIFIED_DESTINATION` を返します。

## `void email disallow` {#void-email-disallow}

```
void email disallow <address> [--project <name>]
```

プロジェクトの宛先リストから受信者を 1 件削除します。そのアドレスへの新規の送信はただちに拒否されます。すでに受け付けられた試行は完了する場合があります。デプロイは不要です。

## `void email domain` {#void-email-domain}

```
void email domain <add|status|list|sync|rotate-secret|remove> [<domain>] [--project <name>]
```

プロジェクトに登録された、ご自身が所有する Cloudflare ゾーン上の独自ドメインで送受信します。Void プラットフォームのみ対応です。ご自身の Cloudflare アカウントでは、メールドメインは代わりに `email.from` から決まります(`void email setup` を参照)。手順は[プラットフォーム上の独自ドメイン](../../guide/email/domains.md#your-own-domain-on-the-platform)にあります。

### `void email domain add` {#void-email-domain-add}

```
void email domain add <domain> [--project <name>]
```

スコープを限定した Cloudflare API トークンを使って、完全なドメイン名をプロジェクトに登録します。CLI はトークンのテンプレートを開き、マスクされた貼り付けまたは新しくコピーしたトークンを受け付け、アカウントとゾーンの制限を確認するよう求めます。認証情報は、ゾーン接続用に暗号化されます。カスタムの受信メールには Cloudflare のゾーンの apex が必要です。catch-all はサブドメインをカバーしないためです。他のサービスの MX レコードと catch-all は維持されます。apex がすでにメールを受信している場合は、別のゾーンの apex か、プラットフォームの共有メールアドレスを使用してください。各カスタム apex は 1 つのプロジェクトに属します。セットアップは操作 ID を返すため、中断されたリクエストを、操作を再開せずに確認できます。

### `void email domain status` {#void-email-domain-status}

```
void email domain status <domain> [--project <name>]
```

記録されている受信、送信、管理の準備状況、観測時刻、および最新の操作を表示します。`sync` を使うと、セットアップを整合させて準備状況を更新できます。

### `void email domain list` {#void-email-domain-list}

```
void email domain list [--project <name>]
```

プロジェクトに登録されているメールドメインとその準備状況を一覧表示します。

### `void email domain sync` {#void-email-domain-sync}

```
void email domain sync <domain> [--project <name>]
```

ドメインの接続を整合させ、準備状況を更新します。同期ではシークレットはローテーションされません。ブロックされた操作や結果が不明な操作は、異常終了し、確認すべき操作を示します。

### `void email domain rotate-secret` {#void-email-domain-rotate-secret}

```sh
void email domain rotate-secret <domain> [--project <name>]
```

このドメインと、同じゾーン上の他のドメインで共有されている接続シークレットをローテーションします。受信メールの配信が準備完了である必要があります。セットアップが未完了の場合は、先に `void email domain sync <domain>` を実行してください。結果が不明な場合は、再試行する前に確認してください。

### `void email domain remove` {#void-email-domain-remove}

```
void email domain remove <domain> [--project <name>]
```

ドメインの割り当てを無効にし、レコードをクリーンアップします。別のドメインが使用しているゾーンのリソースは、引き続き利用できます。未完了または結果が不明なクリーンアップは、安全に整合できるようになるまで記録されたままになります。

## `void email status` {#void-email-status}

```
void email status --platform cloudflare
```

`email.from` に設定されているドメインについて、権限、DNS、ルーティング、送信、ハンドラーアドレス、メールバインディングを確認します。セットアップが未完了の場合は異常終了します。Workers Free ではセットアップが完了していても、送信は検証済みの宛先に限定される場合があります。Workers Paid にアップグレードした後で `void email setup --platform cloudflare` を実行してください。

`void email status` はご自身の Cloudflare アカウントのみを読み取るため、`--platform cloudflare` が必須です。Void プラットフォームでは `void email usage` と `void email destinations` を使用してください。

## `void email setup` {#void-email-setup}

```
void email setup --platform cloudflare
```

CI からデプロイする前に、メールをセットアップします。`void.config.ts` の `email.from`、対話的なターミナル、Cloudflare のメール権限が必要です。

Void は、予定している DNS、ルーティング、プラスアドレッシング、送信の変更を表示し、適用する前に確認を求めます。`void.lock.json` をコミットしてから、CI で `void deploy --platform cloudflare --require-email` を実行してください。

Workers Free では、受信メールと検証済みの受信者への送信は引き続き利用できます。Workers Paid にアップグレードした後でこのコマンドを再度実行すると、任意の受信者への送信が有効になります。[メールのセットアップ](../../guide/email/domains.md#your-own-cloudflare-account)を参照してください。
