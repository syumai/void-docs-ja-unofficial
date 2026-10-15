---
outline: deep
---

# リソースクライアント {#resource-clients}

## KV {#kv}

`"void/kv"` からインポートします。

### `kv` {#kv-1}

推論された `KV` バインディング向けの、JSON に対応した型付きクライアントです。

```ts
import { kv } from 'void/kv';

await kv.put('settings', { theme: 'dark' });
const settings = await kv.get<{ theme: string }>('settings');
```

**主なエクスポート:** `kv`、`createKV(namespace)`、`KVClient`、`KVMap`、`PutOptions`、`ListOptions`。

`kv.map(prefix)` は、すべてのキーが `prefix:` の下に保存される、型付きの名前空間ビューを作成します。

## Storage {#storage}

`"void/storage"` からインポートします。

### `storage` {#storage-1}

推論された `STORAGE` バインディング向けの、デフォルトの [R2 バケット](https://developers.cloudflare.com/r2/)プロキシです。

```ts
import { storage } from 'void/storage';

await storage.put('avatars/alice.png', file);
const object = await storage.get('avatars/alice.png');
```

**主なエクスポート:** `storage`、`createStorage(bucket)`。

## AI {#ai}

`"void/ai"` からインポートします。

### `ai` {#ai-1}

Cloudflare の AI モデルと、プロバイダーネイティブの AI Gateway リクエスト向けの、型付き AI クライアントです。

```ts
import { ai } from 'void/ai';

const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages: [{ role: 'user', content: 'Summarize this release note.' }],
});

const response = await ai.provider('openai').fetch('/chat/completions', {
  body: {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Summarize this release note.' }],
  },
});
```

**主なエクスポート:** `ai`、`VoidAi`、プロバイダーのリクエスト型。プロバイダーのセットアップとストリーミングの例については [AI](../../guide/ai.md) を参照してください。

AI メソッドはプロミスを返し、使用量制限に達した場合は `void/limits` の `UsageLimit` で reject されます。Void のルートと Pages アクションは、捕捉されなかった制限に対して構造化された HTTP 429 を返します。任意の `instanceof UsageLimit` による処理については、[使用量制限](../../guide/ai.md#usage-limits)を参照してください。

### プロバイダーキー {#provider-keys}

`ai.provider()` のデフォルトのシークレット名です。別の名前を使うには `apiKeyEnv` を使用します。

| プロバイダーのプレフィックス | 環境変数              |
| ---------------------------- | --------------------- |
| `openai`                     | `OPENAI_API_KEY`      |
| `anthropic`                  | `ANTHROPIC_API_KEY`   |
| `google-ai-studio`           | `GOOGLE_API_KEY`      |
| `deepseek`                   | `DEEPSEEK_API_KEY`    |
| `groq`                       | `GROQ_API_KEY`        |
| `mistral`                    | `MISTRAL_API_KEY`     |
| `grok`                       | `GROK_API_KEY`        |
| `openrouter`                 | `OPENROUTER_API_KEY`  |
| `perplexity`                 | `PERPLEXITY_API_KEY`  |
| `cohere`                     | `COHERE_API_KEY`      |
| `cerebras`                   | `CEREBRAS_API_KEY`    |
| `huggingface`                | `HUGGINGFACE_API_KEY` |
| `replicate`                  | `REPLICATE_API_KEY`   |
| `baseten`                    | `BASETEN_API_KEY`     |
| `cartesia`                   | `CARTESIA_API_KEY`    |
| `deepgram`                   | `DEEPGRAM_API_KEY`    |
| `elevenlabs`                 | `ELEVENLABS_API_KEY`  |
| `fal`                        | `FAL_API_KEY`         |
| `ideogram`                   | `IDEOGRAM_API_KEY`    |
| `parallel`                   | `PARALLEL_API_KEY`    |

## ISR {#isr}

`"void/isr"` からインポートします。

### `revalidate(options)` {#revalidate-options}

ISR でキャッシュされたページをオンデマンドで再検証します。ローカル開発ではエッジの ISR キャッシュが存在しないため、何も行われません。

```ts
import { revalidate } from 'void/isr';

await revalidate({ paths: ['/', '/blog/hello'] });
await revalidate({ all: true });
```

**シグネチャ:**

```ts
function revalidate(options: { paths?: string[]; all?: boolean }): Promise<void>;
```

## ロギング {#logging}

`"void/log"` からインポートします。

### `logger` {#logger}

呼び出しごとに JSON 1 行を出力する構造化ロガーです。これにより、デプロイされたログをメッセージとフィールドでフィルタリングできます。

```ts
import { logger } from 'void/log';

logger.info('checkout completed', { orderId, userId });
logger.error('webhook failed', { provider: 'stripe', attempt: 3 });
```

**メソッド:** `logger.error(message, fields?)`、`logger.warn(message, fields?)`、`logger.info(message, fields?)`。
