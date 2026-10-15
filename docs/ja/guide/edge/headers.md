---
outline: deep
---

# カスタムヘッダー {#custom-headers}

[`void.config.ts`](../../reference/config) の `routing.headers` フィールドを使って、カスタムのレスポンスヘッダーを定義します。キーは URL パターン、値は `"Name: value"` 形式の文字列の配列です。

```json
{
  "routing": {
    "headers": {
      "/assets/*": ["Cache-Control: public, max-age=31536000, immutable"],
      "/*": ["X-Frame-Options: DENY", "X-Content-Type-Options: nosniff"],
      "/*.html": ["Cache-Control: no-cache"]
    }
  }
}
```

## ルール {#rules}

- **パターンのキー**は `/` で始めます。`*` は `/` を含む任意の文字列に一致します。
- **ヘッダーの値**は `Name: value` 形式で指定します。値にコロンを含めることもできます。
- 一致したすべてのルールはマージされます。複数のルールが同じヘッダー名を設定した場合は、**最後に一致したものが優先**されます。
- ユーザーが定義した `Cache-Control` は、組み込みのデフォルトを上書きします。どのルールにも一致しない場合は、デフォルトが引き続き適用されます。

## 適用範囲 {#scope}

ヘッダールールは、静的アセット、SSR ページ、API レスポンスに適用されます。キャッシュから配信されるハッシュ付きアセットも含みます。

ハッシュ付きアセットには、ヘッダーを追加できますが、キャッシュとレスポンスのエンコーディングの制御はプラットフォームが保持します。これらのファイルでは、ルールで `Cache-Control`、`Content-Type`、`Content-Encoding`、`Content-Length`、`Content-Range`、`Accept-Ranges`、`Transfer-Encoding` を置き換えることはできません。

ヘッダールールは、ISR キャッシュのレスポンスには適用されません。

### Cookie ヘッダー {#cookie-headers}

[Void プラットフォーム](../deployment.md#deploy-to-a-team-platform)では、通常、アプリは `apps.example.com` のようなアプリケーションドメインを共有します。プラットフォームへのデプロイでは、ヘッダールールによって、カスタムドメインを含むアプリのすべてのホスト名で 2 つのヘッダーが変更されます。

- Void は、ヘッダールール内の `Set-Cookie` を無視します。
- Void は、ヘッダールール内の `Clear-Site-Data` から `"cookies"` ディレクティブを取り除きます。`"cache"` や `"storage"` などの他のディレクティブは引き続き適用されます。
- Void は、`"*"` を含む `Clear-Site-Data` ルールの値全体を無視します。この場合、レスポンスにはアプリのレスポンスの `Clear-Site-Data` の値が、`"cookies"` を除いた状態で残ります。その値にも `"*"` が含まれている場合、レスポンスには `Clear-Site-Data` が付きません。

これにより、ヘッダールールが同じドメイン上の他のアプリの Cookie を設定したり削除したりすることを防ぎます。これらの制限はヘッダールールにのみ適用されます。アプリ自身のレスポンスは Cookie を設定したり `Clear-Site-Data` を送信したりでき、共有ドメインでは、それが他のアプリに影響する可能性があります。[ドメインとリソース](../platform/installation/domains.md#adding-a-domain)を参照してください。

`void dev` と `void deploy --platform cloudflare`、および[その他のランタイム](../deployment.md#other-runtimes)では、ヘッダールールは両方のヘッダーを記述どおりに適用します。

## フレームワークの `_headers` ファイル {#framework-headers-files}

Void は、サポートされているフレームワークが生成する `_headers` ファイルを読み込みます。`routing.headers` のルールはその後に実行されるため、フレームワークのデフォルトを上書きできます。追加のセットアップは不要です。
