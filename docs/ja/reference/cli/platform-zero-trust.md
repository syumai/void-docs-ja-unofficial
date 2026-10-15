---
outline: deep
---

# プロジェクトの Zero Trust {#operator-zero-trust}

これらのコマンドには、管理者のセッションを使用します。プラットフォームの選択、プレビュー、確認については、[プラットフォーム管理](./platform.md#operator-commands)を参照してください。

インストール全体の Cloudflare Access ポリシーと、プロジェクトごとの上書きを構成します。

```sh
void platform zero-trust status [--check]
printf '%s' "$ACCESS_API_TOKEN" | void platform zero-trust configure \
  --identity-providers <id[,id...]> \
  --policies <id[,id...]> \
  [--existing-projects <protected|public>] \
  [--protect-new-projects] \
  --token-stdin \
  --yes
void platform zero-trust reconcile
void platform zero-trust disable

void platform zero-trust project-status <project-id>
void platform zero-trust project-protect <project-id>
void platform zero-trust project-public <project-id>
void platform zero-trust project-reconcile <project-id>
```

新しいインストールでは、アプリへのアクセスを `void platform install` で構成します。
あとから確認または変更するには、これらのコマンドを使用します。Default-Deny のアカウントで
公開のみのルールを構成または更新するには、ID ポリシーを省略して `--public-apps` を使用します。

```sh
printf '%s' "$ACCESS_API_TOKEN" | void platform zero-trust configure \
  --public-apps --token-stdin --yes
```

無効な構成から有効にする場合は、`--existing-projects public` を追加します。
公開のみのルールは、保護されたプロジェクトの選択と組み合わせることはできません。
すでに保護されている構成を公開のみのルールに切り替えるには、先に無効にしてください。Default-Deny のアカウントでは、
その移行中に Access がトラフィックをブロックする場合があります。

変更を伴うコマンドは `--plan`、`--yes`、`--timeout` をサポートします。
この変更を適用せずに確認するには、`--yes` の代わりに `--plan` を使用します。Access 管理用のトークンは、
標準入力でのみ受け付けられます。Zero Trust は、プラットフォームをホストする
Cloudflare アカウントを使用します。新しいプロジェクトをデフォルトで公開にするには、
`--protect-new-projects` を省略します。`--existing-projects` は Zero Trust を有効にするときに必須で、
すでに有効な場合は拒否されます。以降の構成の変更では、各プロジェクトの
保護設定は維持されます。`status` は保存されている状態を報告し、`--check` はそれを
Cloudflare Access とも比較します。ステータスが `configuring` または `disabling` のままの場合は、
`void platform zero-trust reconcile` を実行して、保存されている操作を再開します。保護された
プロジェクトでは、最大 100 個のカスタムドメインがサポートされます。

トークンには、プラットフォームの Cloudflare アカウントにスコープされた、**Access: Apps and Policies Write** と
**Access: Organizations, Identity Providers, and Groups Read** が必要です。ID に基づいてユーザーを照合する
Allow ポリシーを少なくとも 1 つ選択してください。Void は、Bypass および Service Auth ポリシー、
そして Everyone やサービストークンを許可するルールを拒否します。要件と復旧については、
[プロジェクトの Zero Trust](../../guide/platform/administration/zero-trust.md)を参照してください。
