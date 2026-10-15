---
outline: deep
---

# オブジェクトストレージ {#object-storage}

`void/storage` の `storage` を使って、[Cloudflare R2](https://developers.cloudflare.com/r2/) にファイルを保存します。アップロード、ダウンロード、メタデータを扱うための型付きの R2 API が使用できます。

## 基本操作 {#basic-operations}

```ts
import { storage } from 'void/storage';

// Upload
await storage.put('uploads/photo.jpg', file, {
  httpMetadata: { contentType: 'image/jpeg' },
});

// Download
const object = await storage.get('uploads/photo.jpg');
if (object) {
  const data = await object.arrayBuffer();
}

// Delete
await storage.delete('uploads/photo.jpg');

// List
const listed = await storage.list({ prefix: 'uploads/' });
for (const obj of listed.objects) {
  console.log(obj.key, obj.size);
}

// Head (metadata only)
const head = await storage.head('uploads/photo.jpg');
```

`storage` は、[R2Bucket API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) をすべてサポートしています。

## ファイルを配信する {#serving-files}

よくあるパターンは、API ルートからアップロードされたファイルを配信することです。

```ts
// routes/files/[key].ts
import { defineHandler } from 'void';
import { storage } from 'void/storage';

export const GET = defineHandler(async (c) => {
  const object = await storage.get(`uploads/${c.req.param('key')}`);

  if (!object) {
    return c.notFound();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Don't let an uploaded HTML or SVG file run as a page on your site.
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', 'attachment');

  return new Response(object.body, { headers });
});
```

ユーザーがアップロードしたファイルには、HTML やスクリプトが含まれている可能性があります。サーバーが決めたキーで保存し、`nosniff` と `Content-Disposition: attachment` を付けて配信してください。`<img>` タグや `<video>` タグでは引き続き表示されますが、URL を直接開くとファイルがダウンロードされます。

## カスタムバインディング {#custom-bindings}

独自の R2 バインディングを使用する場合やテストでは、`createStorage(bucket)` を使用します。

```ts
import { createStorage } from 'void/storage';

const storage = createStorage(env.MY_BUCKET);
```
