---
outline: deep
---

# 接続と認証 {#connect}

```sh
void connect
void connect platform.example.com
void connect --platform cloudflare
void connect --platform void
```

プロジェクトをデプロイ先に接続します。引数なしの場合は、Cloudflare か Void プラットフォームかを対話的に選択します。URL を指定すると、Void プラットフォームが直接選択されます。`--platform void` は、保存済みのプラットフォームと、別の URL を入力するオプションを提示します。

ホスト名も使用できます。`void connect platform.example.com` は HTTPS で接続します。ループバックホスト（`localhost`、`127.0.0.1`、`[::1]`）はデフォルトで HTTP になるため、ローカルのプラットフォームには `void connect localhost:8787` を使用してください。これは対話型のプロンプトでも同様に動作します。デフォルトを上書きするには、`void connect https://localhost:8787` のようにスキームを含めます。

Cloudflare の場合、Void は必要に応じてブラウザでサインインし、アクセス可能なアカウントを選択して、`void.config.ts` の `cloudflare.account_id` または `void.lock.json` の解決済みの状態として保存します。このセットアップは `void init` と共通です。すでに選択されているアカウントは保持されます。競合しているアカウント設定やアクセスできないアカウント設定は、続行する前に解消する必要があります。

Void プラットフォームの場合、Void は接続を確認し、必要に応じてブラウザでサインインします。認証情報は、プラットフォームごとに別々にシステムのキーチェーンへ保存されます。

デプロイ先の設定は `.void/project.json` に保存されます。別の Void プラットフォームに接続しても、既存のプロジェクトのリンクは保持されます。そのリンクや環境変数による上書きが引き続き別のデプロイ先を選択している場合、CLI がそのことを説明します。プロジェクトを明示的に選択するには `void project link` を使用してください。Cloudflare を選択した場合も、既存の Void プロジェクトのメタデータは保持されるため、あとで切り替えて戻れます。

非対話型のシェルでは、URL または明示的なターゲットを指定してください。Cloudflare では、使用可能な認証情報と、曖昧さのないアカウント（必要に応じて `CLOUDFLARE_ACCOUNT_ID`）が必要です。Void プラットフォームでは、対応する `VOID_API_URL` とともに `VOID_TOKEN` を指定するか、そのオリジンにスコープされた有効なキーチェーンのセッションを再利用します。`void connect <url> --no-login` を使うと、認証せずに検証済みの接続を保存できます。このオプションは Void プラットフォームでのみ使用できます。

## 認証 {#authentication}

`void auth login`、`void auth status`、`void auth logout` は、`void init` または `void connect` によって
現在のプロジェクトに保存されたデプロイ先を使用します。デプロイ先が保存されていない場合、
対話型のコマンドでは Cloudflare か接続済みの Void プラットフォームかを選択できます。
非対話型のシェルでは、`--platform cloudflare|void` を指定するか、
明示的な `void cloudflare` および `void account` コマンドを使用してください。認証のために
デプロイ先を選択しても、プロジェクトのデプロイターゲットは変わりません。

## Void プラットフォームのアカウント {#void-platform-account}

### `void account login` {#void-account-login}

プラットフォームで現在有効なログイン方法のいずれかを使った、ブラウザでのログインです。トークンは、プラットフォームのオリジンにスコープされた状態で、オペレーティングシステムのキーチェーンに保存されます。キーチェーンが利用できない場合、トークンを平文ファイルに書き込むことはせず、ログインは失敗します。ヘッドレス環境では、シークレットマネージャーの `VOID_TOKEN` を使用します。

ログインする前に、`void connect <url>` でプラットフォームに接続してください。古いプロジェクトのリンクにプラットフォームの URL がない場合は、接続したうえで `void project link` を実行し、プロジェクトを選択し直してください。

`VOID_TOKEN` と合わせて `VOID_API_URL` を設定し、そのトークンを発行したプラットフォームを指定します。
環境変数による認証には URL とトークンの両方が必要で、
その URL はすでに接続済みである必要があります。新しい CI 環境では、
デプロイの前に `void connect "$VOID_API_URL" --no-login` を実行してください。代わりに
プラットフォームの保存済みログインを使用するには、`VOID_TOKEN` を unset します。

`void connect` または対話型の `void init` フローの中で認証をすでに完了している場合、この手順は任意です。

### `void account link [connection-id]` {#void-account-link-connection-id}

現在のアカウントに、有効な別のログイン方法をリンクします。セッションが最近のものでなくなっている場合は
再度サインインし、追加するプロバイダーのブラウザログインを完了して、
表示された ID を確認してください。接続 ID を指定しない場合は、有効な
ログイン方法を対話的に選択します。オプションのダッシュボードでは、**Account** で同じフローを利用できます。

### `void account logout` {#void-account-logout}

保存されている認証情報を削除します。

### `void account whoami` {#void-account-whoami}

現在のログインを表示します。

### `void account token` {#void-account-token}

人間用の認証トークンをシステムのクリップボードにコピーします。
対話的なトラブルシューティング用であり、ログイン方法の失効の対象となります。
CI のために Cloudflare Access のサービストークンと組み合わせて使用しないでください。マシンの Access
による証明では、人間用の Void トークンを自動化用の ID にすることはできません。
代わりに、`void project token create` でプロジェクトにスコープされた認証情報を作成してください。

## Cloudflare 認証 {#cloudflare-authentication}

サインインと認証情報の管理には、Void の Cloudflare コマンドを使用します。別途 Cloudflare CLI は必要ありません。ブラウザの認証情報は暗号化され、システムのキーチェーンによって保護されます。

- `void cloudflare login` — ブラウザでサインインするか、Cloudflare のユーザーを切り替えます。
- `void cloudflare status` — ID、認証情報のソース、アクセス可能なアカウント、デプロイ先のアカウントを表示します。
- `void cloudflare logout` — ローカルのブラウザセッションを削除します。

対話型の `void connect --platform cloudflare`、`void init`、`void deploy --platform cloudflare` は、必要に応じて同じログインフローを自動的に呼び出します。非対話型の CI では、`CLOUDFLARE_API_TOKEN` を設定する必要があります。

サインインによって変更されるのはブラウザのセッションであり、プロジェクト設定の `account_id` ではありません。ユーザーを切り替えた後は `void cloudflare status` を確認してください。新しいユーザーが固定されたアカウントにアクセスできない場合は、デプロイの前に、プロジェクトのターゲットを別途解決してください。

環境変数に設定された API トークン、または Global API Key のペアは、ブラウザの認証情報より優先されます。明示的なブラウザログインは、これらの上書きの名前を表示して停止します。サインインする前に、そのシェルから削除してください。`status` はアクティブな認証情報のソースを報告し、`logout` は環境変数の認証情報が有効なまま残っている場合に警告します。明示的なブラウザログインには対話型のターミナルが必要です。自動的なデプロイ時のチェックでは、引き続き有効なセッションが再利用されます。
