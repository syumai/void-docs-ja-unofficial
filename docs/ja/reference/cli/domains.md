---
outline: deep
---

# カスタムドメイン {#custom-domains}

## `void domain add` {#void-domain-add}

```
void domain add <hostname> [--project <name>]
```

保存されたターゲットにカスタムドメインを追加します。ホスト型の Void プロジェクトでは、SaaS ホスト名の検証に必要な DNS レコードが表示されます。Cloudflare に直接デプロイするプロジェクトでは、`custom_domain` ルートを追加し、ルートの設定のみを即座に同期します。cron、キュー、ワークフローのトリガーは変更されません。DNS レコードと TLS 証明書は、固定されたアカウント内のゾーンで Cloudflare が管理します。ドメインを追加しても既存のルートを覆い隠してしまわないよう、従来の単数形の `route` フィールドは、先に `routes` 配列に変換してください。

> ワイルドカードのカスタムホスト名(`*.example.com`)はサポートされていません。サブドメインを 1 つずつ登録してください。

## `void domain delete` {#void-domain-delete}

```
void domain delete <hostname> [--project <name>]
```

Cloudflare に直接デプロイするプロジェクトでは、変更が即座に適用されます。最後のカスタムドメインを削除する場合は、`void cloudflare login` で取得したブラウザセッション、または Workers Scripts: Edit 権限を持つ API トークンが使用されます。Cloudflare が変更を拒否した場合、Void は以前のドメイン設定の復元を試み、復元に成功したかどうかを報告します。

## `void domain list` {#void-domain-list}

```
void domain list [--project <name>]
```

すべてのカスタムドメインを一覧表示します。ホスト型プロジェクトでは、プラットフォームからの active/pending の状態が表示されます。Cloudflare に直接デプロイするプロジェクトでは、`void.config.ts` に現在設定されているカスタムドメインのルートが一覧表示されます。

## `void domain status` {#void-domain-status}

```
void domain status <hostname> [--project <name>] [--verbose]
```

ドメインの検証と TLS 証明書の状態を表示します。設定すべき DNS レコードと、必要な対応も含まれます。ドメインは、検証と証明書の発行が完了すると自動的に有効化されます。

Cloudflare に直接デプロイするプロジェクトでは、status は Void の Cloudflare 設定にルートが存在するかどうかを報告します。リモートでの証明書の発行状況は確認しません。その状態は Cloudflare が管理しており、ダッシュボードで確認できます。`--project` はホスト型でのみ使用できます。
