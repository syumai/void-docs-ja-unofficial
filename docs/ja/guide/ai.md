---
outline: deep
---

# AI {#ai}

`void/ai` の `ai` を使うと、サーバーコードから Workers AI のモデルやプロバイダー API を実行できます。プロバイダーへのリクエストには Cloudflare の [AI Gateway](https://developers.cloudflare.com/ai-gateway/) が使用されます。

## ローカル開発 {#local-development}

Cloudflare への直接プロジェクトでは、アカウントを接続して開発を開始します。

```sh
void connect --platform cloudflare
npm run dev
```

アプリが `void/ai` をインポートしている場合、Void は開発中とプレビュー中にリモートの Workers AI バインディングを有効にします。リクエストにはあなたの Cloudflare アカウントとその利用枠が使用されます。Workers AI にはローカルシミュレーターがありません。開発とプレビューでは `void connect` と同じ Cloudflare ログインが使用されます。サインインには `void cloudflare login` を使用してください。`CLOUDFLARE_API_TOKEN` が優先されるため、自動化された環境ではこれを使用してください。

開発中に Cloudflare の認証エラーで停止した場合は、`void cloudflare status` に表示されるデプロイ先アカウントにアクセスできるユーザーとしてターミナルで `void cloudflare login` を実行するか、`CLOUDFLARE_API_TOKEN` を設定してください。`wrangler login` は開発には影響しません。

チームプラットフォームでは、`void connect <platform-url>` を使用してプロジェクトをリンクします。開発中のリクエストには、そのプラットフォームのアカウントと利用制限が適用されます。

## 基本的な使い方 {#basic-usage}

モデル名と入力を指定して `ai.run()` を呼び出します。モデル名と入力の型は `@cloudflare/workers-types` から完全に型付けされます。

```ts
import { defineHandler } from 'void';
import { ai } from 'void/ai';

export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();

  const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: prompt }],
  });
  return c.json(result);
});
```

AI のメソッドは Promise を返します。結果を受け取るには await するか、ハンドラーから Promise をそのまま返します。制限エラーについては[利用制限](#usage-limits)を参照してください。

Cloudflare の AI バインディングで利用できる任意のモデルを使用できます。たとえば `@cf/meta/llama-3.3-70b-instruct-fp8-fast` などの Workers AI モデルや、`google/gemini-2.5-flash`、`openai/gpt-4.1-mini` などの Cloudflare Gateway モデルです。入力オブジェクトは、選択した Cloudflare モデルのスキーマに一致する必要があります。生成された画像など、バイナリデータを返すモデルは、`ai.run()` から `Blob` として返されます。

## ストリーミング {#streaming}

`ai.stream()` を使用すると、SSE ヘッダー付きのストリーミングレスポンスを取得でき、ルートハンドラーからそのまま返せます。

```ts
import { defineHandler } from 'void';
import { ai } from 'void/ai';

export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();

  return ai.stream('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: prompt }],
  });
});
```

レスポンスの開始後に生成が中断された場合、ストリーミングレスポンスは `void:error` SSE イベントで終了します。利用制限の場合は `void:limit` で終了します。`void/client` の `fetchStream()` は、ストリーミング前またはストリーミング中の制限に対して `UsageLimit` を、その他の終端エラーに対して `StreamError` をスローします。UI でエラーをキャッチして生成中の状態を停止し、途中までの出力を保持して、再試行を提案してください。これはプロバイダーのストリーミングレスポンスや、`stream: true` を指定した `ai.run()` にも当てはまります。

## モデルの一覧表示 {#listing-models}

`ai.models()` を使用して、利用可能なモデルを一覧表示します。

```ts
const models = await ai.models();

// タスクで絞り込む
const textModels = await ai.models({ task: 'Text Generation' });
```

## Markdown 変換 {#markdown-conversion}

`ai.toMarkdown()` を使用して、ドキュメントを Markdown に変換します。

```ts
const result = await ai.toMarkdown([{ name: 'document.pdf', blob: pdfBytes }]);
```

## 利用制限 {#usage-limits}

Workers AI の使用量は[ニューロン](https://developers.cloudflare.com/workers-ai/platform/pricing/)で計測されます。直接デプロイでは、使用量はあなたの Cloudflare アカウントに計上されます。プロバイダーネイティブのリクエストでは、プロバイダーの認証情報とその課金条件も適用されます。

チームプラットフォームは独自の Cloudflare アカウントを使用し、ユーザーごとの制限を適用する場合があります。利用可能な枠については管理者に確認してください。

利用制限に達すると、操作の Promise は `void/limits` の `UsageLimit` で reject されます。これには `resource`、`reason`、および省略可能な `retryAt` タイムスタンプが含まれます。Void のルートハンドラーと Pages のアクションでは、キャッチされなかった制限エラーは、再試行情報を含む構造化された HTTP 429 になります。キュー、スケジュールジョブ、その他のサーバーコードでは、reject された Promise のままです。

制限の処理は任意です。フォールバックやアプリに合わせたメッセージが必要な場合は、`instanceof UsageLimit` を使用します。

```ts
import { defineHandler } from 'void';
import { ai } from 'void/ai';
import { UsageLimit } from 'void/limits';

export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();
  try {
    const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
    });
    return c.json(result);
  } catch (error) {
    if (error instanceof UsageLimit) {
      return error.response({ message: 'Try again shortly. Your prompt has been kept.' });
    }
    throw error;
  }
});
```

`error.response()` は構造化された HTTP 429 を作成し、省略可能なカスタム `message` を受け取ります。その他の失敗は通常どおり reject されます。`fetchStream()` を使用する場合も、同じ `instanceof UsageLimit` のチェックにより、クライアントでメッセージと再試行情報にアクセスできます。

## Cloudflare Gateway モデル {#cloudflare-gateway-models}

`ai.run()` は、Cloudflare の `env.AI.run()` のモデル名と入力スキーマをそのまま反映しています。サードパーティのモデルには、Cloudflare のモデル ID と Cloudflare が管理する認証情報が使用されます。

```ts
const result = await ai.run('google/gemini-2.5-flash', {
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Explain Durable Objects in one paragraph.' }],
    },
  ],
});
```

AI Gateway のオプションは 3 番目の引数として渡します: `ai.run(model, inputs, { gateway: { skipCache: true } })`。チームプラットフォームでは、プラットフォームがゲートウェイを選択し、そのメタデータとログを設定します。`skipCache` や `cacheTtl` などのオプションは引き続き適用されます。

直接デプロイでのプロバイダーネイティブのリクエストについては、[`ai.gateway`](../integrations/cloudflare.md#ai-self-host) を設定してください。

## プロバイダーネイティブのリクエスト {#provider-native-requests}

自分のプロバイダーキーを使ってプロバイダーネイティブの API を利用するには、`ai.provider(provider).fetch(path, init)` を使用します。リクエストは設定済みの Cloudflare AI Gateway を経由し、プロバイダー本来の HTTP 形式が維持されます。チームプラットフォームでは、そのインストールのプロキシも経由します。`cf-aig-cache-ttl` や `cf-aig-max-attempts` などの AI Gateway のキャッシュ、タイムアウト、リトライのヘッダーは引き続き適用されます。プラットフォームは、ログ、メタデータ、コストに関するヘッダーを無視します。

### OpenAI {#openai}

```ts
import { defineHandler } from 'void';
import { ai } from 'void/ai';

export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();

  return ai.provider('openai').fetch('/chat/completions', {
    body: {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    },
  });
});
```

### Google AI Studio {#google-ai-studio}

```ts
const response = await ai
  .provider('google-ai-studio')
  .fetch('/v1/models/gemini-2.5-flash:generateContent', {
    body: {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'What is Cloudflare?' }],
        },
      ],
    },
  });
```

### カスタムプロバイダー {#custom-providers}

Void のデフォルトのキーマップにないプロバイダーでは、シークレット名と API キーのヘッダーを渡します。

```ts
const response = await ai
  .provider('custom-provider', {
    apiKeyEnv: 'CUSTOM_PROVIDER_API_KEY',
    apiKeyHeader: 'x-api-key',
    apiKeyPrefix: '',
  })
  .fetch('/v1/respond', {
    body: { prompt: 'Hello' },
  });
```

### 画像生成 {#image-generation}

Cloudflare ネイティブの画像モデルには、`ai.run()` または `ai.image()` を使用します。

```ts
export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();
  return ai.image('@cf/black-forest-labs/flux-1-schnell', { prompt });
});
```

プロバイダーネイティブの画像 API には `ai.provider().fetch()` を使用します。[プロバイダーのリクエストスキーマ](https://developers.openai.com/api/reference/resources/images/methods/generate)に合わせてください。

```ts
export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();

  return ai.provider('openai').fetch('/images/generations', {
    body: {
      model: 'gpt-image-2.5-sunburst',
      prompt,
      size: '1024x1024',
    },
  });
});
```

マルチパートのプロバイダー API には `FormData` を渡します。

```ts
export const POST = defineHandler(async (c) => {
  const body = await c.req.parseBody();
  const form = new FormData();
  form.set('model', 'gpt-image-2.5-sunburst');
  form.set('prompt', String(body.prompt));
  form.set('image', body.image as Blob, 'source.png');

  return ai.provider('openai').fetch('/images/edits', { body: form });
});
```

### プロバイダーキーの規約 {#provider-key-convention}

プロバイダーネイティブのリクエストでは、OpenAI の `OPENAI_API_KEY` や Google AI Studio の `GOOGLE_API_KEY` など、プロジェクトのシークレットが使用されます。

サポートされているプロバイダーとそのシークレット名については、[プロバイダーキーのリファレンス](../reference/api/resources.md#provider-keys)を参照してください。

OpenAI 形式のプロバイダーは `Authorization: Bearer <key>` を使用します。Google AI Studio は `x-goog-api-key` を使用します。カスタムプロバイダーでは `apiKeyHeader` と `apiKeyPrefix` を使用してください。

本番環境では、API キーをプロジェクトのシークレットとして追加します。

```bash
void secret put OPENAI_API_KEY=sk-...
```

ローカル開発では、プロジェクトルートの `.env` に追加します。

```
OPENAI_API_KEY=sk-...
```

### プロバイダーネイティブ API でのストリーミング {#streaming-with-provider-native-apis}

プロバイダーのレスポンスをそのまま返します。たとえば、上記の OpenAI のリクエストボディに `stream: true` を追加します。
