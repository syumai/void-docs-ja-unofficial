---
outline: deep
---

# メールの送信 {#sending-email}

トランザクションメールを送信するには `sendEmail` を使用します。開発中、Void はメッセージをローカルの受信トレイにキャプチャします。

```ts
import { sendEmail } from 'void/email';

const result = await sendEmail({
  from: 'Acme <acme+noreply@mail.example.com>', // プロジェクトの送信元アドレスを使用する
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Thanks for signing up!',
  // html: '<p>Thanks for signing up!</p>', // 省略可能 — text と組み合わせると multipart/alternative として送信される
});

if (!result.ok) {
  if ('error' in result) {
    // リクエストレベルの失敗。OUTCOME_UNKNOWN の場合、すでに送信されている可能性がある。
    console.error(result.error.code, result.error.message);
  } else {
    // 一部の宛先が失敗した。どれかは `deliveries` でわかる。
    for (const d of result.deliveries.filter((d) => !d.ok)) {
      console.error(d.recipient, d.error.code, d.error.message);
    }
  }
}
```

失敗の 2 つの形式をどちらも確認してください。`result.error` はリクエスト全体の失敗を、`result.deliveries` は個々の宛先の失敗を報告します。未検証の宛先は `deliveries` で失敗します。

## セットアップ {#setup}

メールが有効なプラットフォームでは、追加のメール設定なしでデプロイできます。共有メールドメインについては管理者に確認してください。管理者は[インストールまたはアップグレード時にメールを有効にします](/ja/guide/platform/installation/credentials#runtime-token-permissions)。

メールが有効なプラットフォーム上の各プロジェクトには、次のものがあります。

- **デフォルトの送信元:** `<your-slug>+noreply@<mail-domain>`。スラッグが 56 文字を超える古いプロジェクトでは、`from` を明示的に渡す必要があります。
- **宛先としてのあなたのアカウントのメールアドレス:** プロジェクトの作成時に登録されます。Cloudflare がそのプラットフォームに対して検証していない場合は、メールで届く検証リンクに従い、そのアドレスに送信する前に `void email destinations` を実行してください。

共有の送信元は、検証済みの宛先にのみ送信できます。送信する前に、自分のアドレスを検証するか、[別の宛先を追加](#adding-recipients)してください。

代わりに自分の Cloudflare アカウントにデプロイする場合 (`void deploy --platform cloudflare`) は、`void.config.ts` に送信元を設定し、メールのセットアップが必要です。[自分の Cloudflare アカウント](./domains.md#your-own-cloudflare-account)を参照してください。

## 宛先を追加する {#adding-recipients}

Cloudflare の `send_email` バインディングは、宛先として登録したアドレスにのみ配信します。CLI で追加します。

```sh
void email allow user@acme.com
```

Cloudflare は宛先に検証リンクをメールで送信します。宛先がリンクをクリックし、`void email destinations` がそのクリックを検出すると、プロジェクトからそのアドレスに送信できるようになります。リンクが届かなかった場合や期限切れの場合は、アドレスが保留中の間に `void email allow <address>` をもう一度実行してください。CLI がリンクを再送するか、新しいリンクの取得方法を案内します。プロジェクトの宛先を一覧表示するには、次のようにします。

```sh
void email destinations
```

::: warning これが適しているケース
共有の送信元は、チームへのアラート、プロジェクトの通知、受信メールへの返信に適しています。

任意のユーザーへのメールには、[自分のドメインを登録する](./domains.md#your-own-domain-on-the-platform)、[自分の Cloudflare アカウントで Workers Paid を使用する](./domains.md#your-own-cloudflare-account)、またはハンドラーから別のメールプロバイダーを呼び出してください。
:::

## オプション {#options}

| オプション       | 型                           | 備考                                                                                                                               |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `from`           | `string \| { email, name? }` | 省略可能。プロジェクトの送信元に固定されます。以下を参照してください。                                                             |
| `to`             | `Address \| Address[]`       | 必須。1 つ以上の宛先。                                                                                                             |
| `subject`        | `string`                     | 必須。UTF-8 をサポートします (RFC 2047 としてエンコードされます)。                                                                 |
| `text`           | `string`                     | `text` / `html` の少なくとも一方が必須です。                                                                                       |
| `html`           | `string`                     | 両方を指定すると `multipart/alternative` として送信されます。                                                                      |
| `replyTo`        | `Address`                    | 省略可能な `Reply-To` ヘッダー。                                                                                                   |
| `cc`, `bcc`      | `Address \| Address[]`       | 省略可能。各宛先には、それぞれ個別のメッセージエンベロープが送信されます。                                                         |
| `headers`        | `Record<string, string>`     | カスタムヘッダー。予約済みのヘッダー (From、Date など) は無視されます。                                                            |
| `attachments`    | `Attachment[]`               | [添付ファイル](#attachments)を参照してください。                                                                                   |
| `idempotencyKey` | `string`                     | Void プラットフォームでは省略可能。スペースを除く印字可能な ASCII 文字で 1〜128 文字。同じ送信の再試行では同じキーを再利用します。 |

`to`、`cc`、`bcc` を合わせて、最大 50 件の宛先に送信できます。ローカル部が ASCII の標準的なメールアドレスを使用し、国際化ドメインには punycode を使用してください。

`Address` には、文字列 (`"hello@acme.dev"` または `"Name <hello@acme.dev>"`) か、オブジェクト (`{ email, name? }`) を指定できます。Unicode の表示名もサポートされています。

プラットフォームでは、送信元はプロジェクトに固定されます。`from` には、プロジェクト自身のプラットフォームアドレス (`<project-slug>@<mail-domain>` または `<project-slug>+<tag>@<mail-domain>`、表示名を付けることも可能) か、`void email domain add` で登録したドメイン上の任意のアドレスを指定する必要があります ([プラットフォーム上の自分のドメイン](./domains.md#your-own-domain-on-the-platform)を参照)。たとえば、プラットフォームのメールドメインが `mail.example.com` であれば、`Acme <acme+noreply@mail.example.com>` を使用できます。それ以外は `INVALID_FROM` で拒否されます。`from` を省略すると、Void が `<project-slug>+noreply@<mail-domain>` を補完します。

自分の Cloudflare アカウントでは、`from` のデフォルトは `void.config.ts` の `email.from` であり、アカウントから送信可能なドメイン上のアドレスである必要があります。Cloudflare はそれ以外の送信元を拒否し、`sendEmail` はそれを `INVALID_FROM` として報告します。

## 添付ファイル {#attachments}

```ts
await sendEmail({
  to: 'user@example.com',
  subject: 'Your receipt',
  text: 'Receipt attached.',
  attachments: [
    {
      filename: 'receipt.pdf',
      content: pdfBytes, // string | Uint8Array | ArrayBuffer | Blob
      contentType: 'application/pdf',
    },
  ],
});
```

インライン画像 (HTML から参照されるロゴなど) には、`disposition: 'inline'` と `contentId` を設定します。

```ts
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<img src="cid:logo" alt="Acme">',
  attachments: [
    {
      filename: 'logo.png',
      content: logoBytes,
      contentType: 'image/png',
      contentId: 'logo',
      disposition: 'inline',
    },
  ],
});
```

`contentType` を省略すると、Void はファイル名から推論します。明示的に指定する値は、有効なメディアタイプである必要があります。`contentId` は、HTML 内で `cid:<id>` によって参照される画像を指す名前です。`logo` や `logo@acme.dev` のような ID を使用してください。エンコード後のメッセージは 5 MiB、カスタムヘッダーは 16 KiB に制限されています。添付ファイルのフィールドが無効な場合やメッセージが大きすぎる場合は、`MIME_ERROR` が返されます。

## 結果とエラー {#result-and-errors}

`sendEmail` は、例外をスローする代わりに結果を返します。成功の結果は、プロバイダーが送信を受け付けたことを意味します。宛先のメールボックスへの配信を保証するものではありません。

`ok: true` には宛先の ID が含まれます。失敗の結果には、リクエストレベルの `error` か、宛先ごとの `deliveries` のいずれかが含まれます。プラットフォームの結果には、利用可能な場合は `operationId` が含まれます。

タイムアウトにより `OUTCOME_UNKNOWN` が返されることがあります。この場合でも、プロバイダーがメッセージを受け付けている可能性があります。再試行する前に結果を確認してください。

再試行する可能性のある送信には、冪等キーを使用します。

```ts
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Invoice ready',
  text: 'Your invoice is available in your account.',
  idempotencyKey: 'invoice:42:ready',
});

if (result.ok) {
  console.log('Accepted by the provider', result.operationId);
} else {
  console.log('Inspect the outcome before retrying', result.operationId, result);
}
```

30 日間は、同じペイロードで同じキーを繰り返すと、プロバイダーへの再送信なしに、記録された結果が返されます。異なるペイロードでキーを再利用すると `IDEMPOTENCY_CONFLICT` が返されます。レスポンスが失われた場合やプロバイダーへのリクエストが中断された場合は、`OUTCOME_UNKNOWN` が返されることがあります。`void email logs` を確認するか、同じキーを繰り返してください。新しいキーは新しい送信を作成するため、重複が発生する可能性があります。Cloudflare のネイティブバインディングによる送信では、プラットフォームの冪等キーはサポートされません。

| コード                   | 意味                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `BINDING_MISSING`        | メールのトランスポートが設定されていません。                                 |
| `INVALID_FROM`           | 送信元が無効であるか、プロジェクトに対して許可されていません。               |
| `INVALID_TO`             | 宛先リストが無効であるか、50 件を超えています。                              |
| `UNVERIFIED_DESTINATION` | 有効なポリシーのもとでは、宛先の検証が必要です。                             |
| `MIME_ERROR`             | メッセージが無効であるか、サイズ制限を超えています。                         |
| `QUOTA_EXCEEDED`         | プラットフォームまたはプロバイダーのクォータに達しました。                   |
| `IDEMPOTENCY_CONFLICT`   | このキーはすでに別のペイロードに使用されています。                           |
| `OUTCOME_UNKNOWN`        | 送信がプロバイダーに到達した可能性があります。無条件に再送しないでください。 |
| `UPSTREAM_ERROR`         | プロバイダーまたはプラットフォームがリクエストを拒否しました。               |

プラットフォームのデフォルトの許容量は、UTC の月あたり 200 件の宛先への送信試行と、直近 1 分あたり 10 件です。失敗した試行や結果が不確かな試行も、これらの制限に含まれる場合があります。現在の許容量は `void email usage` で確認してください。

`void email usage` は、月ごとの宛先への送信試行、受信レシート、残りの許容量を表示します。`void email logs --limit 50` は、30 日間保持される最大 100 件の最近のメタデータエントリ (操作、宛先、方向、状態、プロバイダーの参照、エラーコード) を表示します。件名、本文、添付ファイルは保存されません。メッセージの受信と返信の送信は、別々のイベントです。

## ローカル開発 {#local-development}

`void dev` の間、送信は Cloudflare に送られる代わりに、メモリ上の受信トレイにキャプチャされます。開発サーバーは、起動時に受信トレイの URL を表示します。

```
[void] Email inbox: http://localhost:5173/__void/inbox?token=<printed-token>
```

メッセージを開くと、HTML のプレビュー、添付ファイルの確認、`.eml` ファイルとしてのダウンロードができます。

すべての受信トレイのルートには、ローカルのアクセストークンが必要です。Void は、表示される受信トレイの URL とブラウザのリンクにそれを含めます。コマンドラインからのリクエストでは、以下のように `x-void-dev-trigger` ヘッダーで送信してください。トークンのないリクエストは `401` を返します。トークンは `.void/dev-trigger-token` に保存されます。特に開発サーバーをネットワークに公開する場合は、受信トレイの URL を認証情報として扱ってください。

```bash
# メッセージを .eml としてダウンロードする
curl http://localhost:5173/__void/inbox/<id>/raw \
  -H "x-void-dev-trigger: <printed-token>" -o message.eml

# 受信トレイをクリアする
curl -X DELETE http://localhost:5173/__void/inbox \
  -H "x-void-dev-trigger: <printed-token>"
```

受信トレイは、HMR をまたいで直近 100 件のメッセージを保持し、サーバーを完全に再起動するとクリアされます。

開発用の受信トレイは、ネイティブの Void アプリ、TanStack Start、React Router で動作します。SvelteKit、Nuxt、Analog、Astro では利用できず、これらのアプリからの送信は `BINDING_MISSING` を返します。テストで送信をキャプチャするには、`void/email/testing` の `createEmailTestHarness` を使用してください。設定された受信トレイに到達できない場合、`sendEmail` は送信せずに `UPSTREAM_ERROR` を返します。

`sendInDev` は非推奨です。`void dev` の間は受信トレイをスキップして `BINDING_MISSING` を返すため、配信されることはありません。削除し、実際の配信をテストするにはアプリをデプロイしてください。

## テスト {#testing}

テストハーネスを使用すると、バインディングをモックせずに、送信メッセージをアサートできます。

```ts
import { describe, it, expect } from 'vitest';
import { sendEmail } from 'void/email';
import { createEmailTestHarness } from 'void/email/testing';

describe('signup flow', () => {
  it('sends a welcome email', async () => {
    const inbox = createEmailTestHarness();

    await sendEmail({
      from: 'acme+noreply@mail.example.com', // プロジェクトの送信元を使用する
      to: 'user@example.com',
      subject: 'Welcome',
      text: 'Hi!',
    });

    expect(inbox.messages).toHaveLength(1);
    expect(inbox.messages[0].subject).toBe('Welcome');
    inbox.dispose();
  });
});
```

ハーネスは、`dispose()` が呼ばれるまで、すべての `sendEmail` の呼び出しを横取りします。`clear()` は、シンクを解放せずに、キャプチャ済みのリストを空にします。

受信メッセージの処理については、[メールの受信](./receiving.md)を参照してください。
