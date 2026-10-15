---
outline: deep
---

# メールの受信 {#inbound}

トップレベルの `email/` ディレクトリにあるハンドラーでメールを受信します。受信ハンドラーにはネイティブの Void アプリが必要で、フレームワークや Node.js、Bun、Deno 向けのビルドではサポートされません。

```ts
// email/_default.ts — 一致しない宛先すべてのフォールバック
import { defineEmail, parseEmail } from 'void/email';

export default defineEmail(async (message, env, ctx) => {
  const parsed = await parseEmail(message);

  if (parsed.subject?.startsWith('STOP')) {
    message.setReject('Use the unsubscribe link.');
    return;
  }

  await message.forward('archive@example.com');
});
```

ハンドラーは Cloudflare ネイティブの `ForwardableEmailMessage` に加えて、動的 / タグ付きのルートセグメントの `params` が設定された、省略可能な 4 番目の引数 `info` を受け取ります。

| メソッド                           | 用途                                               |
| ---------------------------------- | -------------------------------------------------- |
| `message.setReject(reason)`        | SMTP エラーでメッセージを拒否します。              |
| `message.forward(to, headers?)`    | 検証済みの宛先に転送します。                       |
| `replyEmail(message, options)`     | スレッド化された返信を送信します。                 |
| `message.reply({ from, to, raw })` | 独自の MIME バイト列またはストリームで返信します。 |

何も操作せずに戻ると、メッセージは受理されます。`forward` と `message.reply` にはメールアドレスのみを指定してください。

`parseEmail(message)` は `from`、`to`、`subject`、`text`、`html`、`attachments`、`headers` を返します。基盤となるストリームは一度しか読み取れないため、メッセージごとに最大 1 回だけ呼び出してください。

## 宛先ごとのルーティング {#per-recipient-routing}

```
email/
  support.ts                — support@<your-domain> を処理
  billing.ts                — billing@<your-domain> を処理
  support+[ticket].ts       — support+ticket-123@... を処理 → info.params.ticket = "ticket-123"
  support+vip.ts            — support+vip@... のみを処理（support+[ticket].ts より優先）
  [user].ts                 — 動的なローカルパート   → info.params.user
  [user]+[tag].ts           — 動的 + サブアドレス → info.params.user, info.params.tag
  _default.ts               — どのアドレスパターンにも一致しない場合のフォールバック
```

ファイルは `To` アドレスのローカルパート（`@` より前の部分）に対して、大文字小文字を区別せずに照合されます。**一致の優先順位（より具体的なものが優先）:**

1. `support+vip.ts`（静的 + リテラルのタグ）
2. `support+[ticket].ts`（静的 + キャプチャされるタグ）
3. `support.ts`（静的）
4. `[user]+vip.ts`（動的 + リテラルのタグ）
5. `[user]+[tag].ts`（動的 + キャプチャされるタグ）
6. `[user].ts`（動的）
7. `_default.ts`（フォールバック）

最初に一致したパターンが採用されます。同じ形式の中では、リテラルのタグがキャプチャされるタグより優先されます。`support+vip@` は `support+vip.ts` に届き、それ以外の `support+…@` はすべて `support+[ticket].ts` に届きます。同じ形式のハンドラーはアルファベット順に試されます。

どれにも一致せず `_default.ts` もない場合、制御は Cloudflare に戻り、送信者には配信不能通知が送られます。`email/` 配下のネストしたフォルダーは無視されます。宛先はパスではなく、フラットな文字列です。

## スレッド化された返信 {#threaded-replies}

```ts
// email/support+[ticket].ts
import { defineEmail, parseEmail, replyEmail } from 'void/email';

export default defineEmail(async (message, env, ctx, info) => {
  const parsed = await parseEmail(message);
  await ticketStore.append(info!.params.ticket, parsed.text ?? '');

  await replyEmail(message, {
    text: `Got your message on ticket ${info!.params.ticket}.`,
  });
});
```

`replyEmail()` は、スレッド化された件名で元の送信者に返信します。`subject` は上書きできます。

Void プラットフォームでは、既定の送信元はプロジェクトの共有アドレス、または登録済みドメインでメールを受信したアドレスです。共有メールにはこの既定値を使用してください。`message.to` からはプロジェクトのプレフィックスが取り除かれています。送信元を上書きする場合は、プロジェクトに属するアドレスでなければなりません。

返信はプロジェクトの宛先ポリシーに従います。共有送信元の宛先は `void email allow <address>` で検証してください。ハンドラーの終了後、プロバイダーの結果は `void email logs` で確認できます。

転送にはネイティブの Cloudflare メールイベントが必要です。プラットフォーム経由で中継されるカスタムドメインでは、代わりに返信を使用してください。

## 受信配信の設定 {#configuring-inbound-delivery}

メールが有効なプラットフォームでは、プラットフォームが宛先ルールを検証してプラス記号付きアドレス指定を有効にすると、プロジェクトごとの DNS 設定なしで `<slug>+anything@<mail domain>` がデプロイ済みの `email/` ハンドラーに届きます。このルールはハンドラーをデプロイしたときに Void が設定します。プロジェクトの作成やメール送信だけでは、受信ルールは必要ありません。設定を完了できない場合、デプロイ時にルーティングの競合または容量の上限が報告されます。[登録済みのカスタムドメイン](./domains.md#your-own-domain-on-the-platform)は、受信の準備状況が `ready` になるとそれらのハンドラーに届くようになります。現在のプロバイダーのルーティングと残りのセットアップ手順は、`void email domain status` で確認できます。

直接デプロイの場合は、[自分の Cloudflare アカウント](./domains.md#your-own-cloudflare-account)に従って受信アドレスを設定してください。

`void dev` にはローカルの受信トリガーがありません。開発用の送信インボックスのみを提供します。受信ハンドラーは、後述の `createInboundTestHarness` でテストしてください。

## 受信ハンドラーのテスト {#testing-inbound-handlers}

`createInboundTestHarness` を使うと、返信、転送、拒否を捕捉できます。共有プラットフォームのメールでは、[`acme+support+abc-123@acme.dev`](mailto:acme+support+abc-123@acme.dev) のように、プロジェクトのプレフィックスを含む完全なアドレスを渡します。Cloudflare への直接配信では、`slug: null` を設定し、[`support+abc-123@mail.acme.com`](mailto:support+abc-123@mail.acme.com) のように指定します。

```ts
import { describe, it, expect } from 'vitest';
import { createInboundTestHarness } from 'void/email/testing';
import defaultHandler from './email/_default';
import support from './email/support+[ticket]';

describe('email handlers', () => {
  it('routes to support+[ticket] and extracts the tag', async () => {
    const harness = createInboundTestHarness({
      routes: { 'support+[ticket]': support, _default: defaultHandler },
    });
    const result = await harness.deliver({
      from: 'user@example.com',
      to: 'acme+support+abc-123@acme.dev',
      subject: 'Help',
      text: 'I have a problem',
    });
    expect(result.handler).toBe('support+[ticket]');
    expect(result.params).toEqual({ ticket: 'abc-123' });
  });

  it('rejects STOP messages via _default', async () => {
    const harness = createInboundTestHarness({ routes: { _default: defaultHandler } });
    await harness.deliver({
      from: 'user@example.com',
      to: 'acme+unknown@acme.dev',
      subject: 'STOP',
      text: 'bye',
    });
    expect(harness.rejects).toEqual(['Use the unsubscribe link.']);
  });
});
```

ハーネスは、デプロイされたメールルートと同じ順序でハンドラーを照合します。
