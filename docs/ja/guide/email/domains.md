---
outline: deep
---

# メールドメインとセットアップ {#email-domains-and-setup}

デプロイ環境に合わせたセットアップを選択してください。Void プラットフォームにドメインを登録する方法と、自分の Cloudflare アカウントでメールを設定する方法があります。プラットフォーム共有の送信元を使う場合は、[メールの送信](./sending.md#setup)に従ってください。

## プラットフォーム上の独自ドメイン {#your-own-domain-on-the-platform}

共有送信元は、プラットフォームに設定されたメールドメインを使用します。自分が所有するドメインで送信と受信を行うには、その Cloudflare ゾーンをプロジェクトに登録します。

```sh
void email domain add acme.com
```

`add` を実行すると、Cloudflare の API トークンテンプレートが開きます。トークンを作成する前に、選択したアカウントとメールゾーンに権限を絞ってください。Workers Scripts 権限はアカウント全体に適用されます。CLI はマスクされた貼り付け、または新しくコピーしたトークンを受け付け、これらの制限を確認するよう求めます。プラットフォームはゾーン接続用の認証情報を暗号化するため、そのゾーンを共有するプロジェクトごとに個別の受信用 Worker は必要ありません。

プラットフォームが管理するカスタム受信メールには、Cloudflare ゾーンのアペックス（ルートドメイン）が必要です。Cloudflare のキャッチオールはそのアペックスのみを対象とするため、選択したゾーンのサブドメインでは任意のアドレス宛のメールを受信できません。他のメールプロバイダーを使っていないアペックスを選ぶか、プラットフォーム共有のメールアドレスを使用してください。Void は他のプロバイダーの MX レコードと有効なキャッチオールを保持します。各カスタムアペックスは 1 つのプロジェクトに属しますが、1 つのプロジェクトが複数のアペックスを登録することもできます。

セットアップが中断された場合は、再試行する前に `void email domain status <domain>` で保存済みの操作を確認してください。

`void email domain status <domain>` は、次の 3 つの独立した結果を報告します。

- **Inbound**: メールがプロジェクトのハンドラーに到達できるかどうか。
- **Outbound**: 送信の準備ができているか、検証済みの宛先に制限されているか、保留中か、ブロックされているか。
- **Management**: 保存されている Cloudflare の認証情報で接続を管理できるかどうか。

セットアップを完了して準備状況を更新するには、`void email domain sync <domain>` を使用します。ステータスには、まだ必要なダッシュボード操作や認証情報の手順が表示されます。受信の準備が整った後に接続シークレットをローテーションするには `rotate-secret` を、ドメインを切り離すには `remove` を使用します。使用していない API トークンは Cloudflare で失効させてください。[メールドメインコマンド](../../reference/cli/email.md#void-email-domain)を参照してください。

受信の準備が整うと、そのドメイン上の任意のアドレス宛のメールが `email/` ハンドラーに届きます。任意の宛先への送信には送信側の準備も必要です。検証済みの宛先に制限されたドメインでは、引き続き宛先の検証が必要です。プラットフォームのクォータと停止措置は、共有送信元とカスタム送信元の両方に適用されます。

管理者が管理するプラットフォームでは、`add` は新しいドメイン向けの管理者用コマンドを表示します。所有者が管理している既存の接続は、引き続き所有者が利用できます。管理者は、共有送信元からのメールを特定の宛先ドメイン、または任意の宛先に許可する場合があります。プラットフォームの共有メールドメイン上の宛先は、引き続き明示的な検証が必要です。

## 自分の Cloudflare アカウント {#your-own-cloudflare-account}

所有している Cloudflare ゾーンに送信元を設定します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  email: { from: 'Acme <support@mail.acme.com>' },
});
```

`acme.com` の既存のメールを現在のプロバイダーに残したい場合は、メール用のサブドメインを使用してください。Void は他のプロバイダーの MX レコードを置き換えることを拒否します。

### セットアップ {#setup-1}

`void cloudflare login` でサインインするか、デプロイ権限に加えて **Email Routing Edit** と **Email Sending Edit** を持つ `CLOUDFLARE_API_TOKEN` を使用します。ブラウザセッションにメール権限がない場合は、いったんログアウトして再度サインインしてください。Global API Key はサポートされていません。

`void deploy --platform cloudflare` を実行します。Void は、設定しようとしているドメイン、ルーティング、送信、DNS、ハンドラーのアドレスを表示します。承認すると、メールのセットアップとデプロイが行われます。以降のデプロイでは、このセットアップが再利用されます。最初のセットアップを拒否した場合、アプリはメールなしでデプロイされます。

`email.from` がない場合、Void は自動セットアップをスキップし、自分で記述した `cloudflare.send_email` バインディングと `cloudflare.addresses` を保持します。それらの準備状況は自分で確認してください。自動セットアップを検証できない場合、`--require-email` を指定していればデプロイは引き続き拒否されます。

サブドメインのセットアップでダッシュボード上の手順が必要な場合は、**Email → Settings → Subdomains** にあるチェックリストに従ってから再試行してください。DNS を変更した後は、次のコマンドで準備状況を確認します。

```sh
void email status --platform cloudflare
```

### 受信アドレス {#inbound-addresses}

`email.from` が `mail.acme.com` にある場合、ハンドラーは次のアドレス宛のメールを受信します。

| ハンドラー                          | サブドメインのアドレス   | ゾーンアペックスのアドレス |
| ----------------------------------- | ------------------------ | -------------------------- |
| `support.ts`, `support+[ticket].ts` | `support@mail.acme.com`  | `support@acme.com`         |
| `_default.ts`                       | キャッチオールルールなし | `*@acme.com`               |
| `[user].ts`, `[user]+[tag].ts`      | サポートなし             | `*@acme.com`               |

Cloudflare のキャッチオールはゾーンアペックスのみを対象とします。サブドメインでは、`_default.ts` は明示的なルールで許可されたメールを処理できますが、任意のアドレス宛のメールは受信できません。

セットアップではゾーンのプラスアドレッシングが有効になるため、`support+T-42@mail.acme.com` は `support+[ticket].ts` に届きます。この設定はアペックスや他のサブドメインにも適用されます。

`replyEmail()` は、送信元をデフォルトでメッセージを受信したアドレスに設定します。転送には、検証済みの Cloudflare 宛先が必要です。

### 送信 {#sending}

Workers Free では、`sendEmail()` は Cloudflare の **Email Routing → Destination addresses** に登録された検証済みの宛先に送信できます。

[Cloudflare のメール認証に関するガイダンス](https://developers.cloudflare.com/email-service/concepts/email-authentication/)に従って送信元ドメインの SPF、DKIM、DMARC レコードを設定し、受信したメッセージの元のヘッダーで認証結果を確認してください。`sendEmail()` が成功しても、確認できるのはプロバイダーが受け付けたことだけであり、配信や認証の準備ができていることは保証されません。

任意の宛先に送信するには、[Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans) と Email Sending のオンボーディングが必要です。アップグレード後に `void email setup --platform cloudflare` を実行してください。Void は通常のデプロイ中にオンボーディングを再試行しません。

既存の DMARC または bounce ドメインのレコードがオンボーディングを妨げることがあります。チェックリストに、解消すべき競合が示されます。受信メールは引き続き利用できます。

`void email usage`、`logs`、`destinations`、`allow`、`disallow` コマンドは Void プラットフォームに対して使用します。

### 設定の変更 {#configuration-changes}

セットアップ後は `void.lock.json` をコミットしてください。Void はハンドラーからルーティングアドレスを導出し、デプロイ時にそのルールを作成します。

別の Worker や転送サービスが所有している既存のルールはそのまま残されます。`cloudflare.addresses` を自分で管理している場合は、自動メールセットアップと組み合わせずに、チェックリストに従ってください。

ハンドラーを削除した後は、報告された古いアドレスを確認し、必要な `cloudflare.addresses` を設定してください。ルーティングルールの削除には、対話型ターミナルでの確認が必要です。

メールのセットアップをすべて削除するには、`void.lock.json` の `resolved` から `addresses`、`send_email`、`vars.__VOID_EMAIL_FROM` を削除し、`void.config.ts` の対応するオーバーライドを削除し、Cloudflare 上のルーティングルールを削除します。

### CI {#ci}

まずローカルでメールをセットアップします。

```sh
void email setup --platform cloudflare
void email status --platform cloudflare
```

`void.lock.json` をコミットし、CI では次のコマンドでデプロイします。

```sh
void deploy --platform cloudflare --require-email
```

CI はセットアップのプロンプトに応答できません。`--require-email` がない場合、未設定のアプリはメールなしでデプロイされることがあります。セットアップは保存されているものの DNS が反映されていない場合、デプロイは後の再試行まで待機します。検証済みの宛先向けの Workers Free セットアップは、`--require-email` を満たします。
