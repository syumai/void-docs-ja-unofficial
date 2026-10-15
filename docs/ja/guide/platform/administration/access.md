---
outline: deep
---

# サインインとアクセス {#sign-in-and-access}

## サインイン {#signing-in}

ブラウザーの管理 UI を使うには、`<API URL>/admin` を開き、セットアップ時に選択した管理者のログイン方法を使用します。新規インストールでは、表示される管理者セットアップの手順に従って最初の管理ユーザーを作成してください。先にアプリを作成したり、CLI でサインインしたりする必要はありません。

プラットフォームの API URL に接続してから、管理者としてサインインします。

```sh
void connect platform.example.com --no-login
void platform auth login
```

最初のコマンドで接続を保存します。2 番目のコマンドはブラウザーを開いてサインインし、管理者セッションをシステムのキーチェーンに保存します。セッションの有効期間は 1 時間で、プラットフォームごとに別々に保存されます。

どのアカウントでサインインしているかは、いつでも確認できます。

```sh
void platform auth status
```

アカウント、セッションの有効期限、プラットフォームで利用できる機能が表示されます。セッションを終了するには、`void platform auth logout` を実行します。

プラットフォームが Cloudflare Access で保護されている場合、`void connect <url>` は Void ログインの前に会社のサインインを処理します。対話的な Access 認証にはローカルにインストールされた `cloudflared` を使用し、短期間有効な認証情報をそのプラットフォームのオリジンごとにシステムのキーチェーンに保存します。ブラウザーの Cookie をコピーする必要はありません。

CI では、オリジンをキーとする `VOID_ACCESS_CREDENTIALS` の Access 認証情報とあわせて、[プロジェクトのデプロイトークン](/ja/guide/platform/installation/first-deployment)を使用します。Access のサービストークンでは Void のデプロイを認可できません。必要なオリジンと形式については、[CI デプロイのセットアップ](/ja/guide/platform/installation/first-deployment)を参照してください。

## プラットフォームの選択 {#choosing-a-platform}

複数のプラットフォームを管理している場合は、接続を一覧表示して既定のものを選択します。

```sh
void platform list
void platform use <connection-id>
```

`--connection` を使うと、1 つのコマンドだけに対してプラットフォームを選択することもできます。

```sh
void platform user list --connection <connection-id>
```

接続一覧に表示されている ID または URL を使用してください。管理コマンドは、デプロイ先が異なるアプリの内部で実行した場合でも、この選択を使用します。

## 管理者ログインの復旧 {#recovering-administrator-login}

設定済みの ID プロバイダーをどの管理者も使用できない場合、インストールの所有者は、Cloudflare の管理アクセス、データベースへの直接アクセス、元の暗号化された復旧用認証情報を使って、既存の管理者を復旧できます。

```sh
void platform config auth recover company --installation <id> --file recovery.json
```

このファイルでは既存のアカウントを指定します（例: `{"administratorUserId":"existing-admin-id"}`）。復旧では実際のログインテストが開かれ、アクセスを復元する前に正確な ID を確認するよう求められます。新しい管理者は作成されません。代替のプロバイダーを使用するには、新しい接続 ID とともにその機密ではない `configuration` を含め、シークレットは `--client-secret-env <name>` で渡します。既存のプロバイダーのシークレットをローテーションするには、その接続 ID と ID の設定を維持してください。

`--yes` を使う場合は、ファイルに正確な `issuer` と `subject` を含む `expectedIdentity` も固定してください。ブラウザーでのログインの成功は引き続き必要です。復旧を開始する前に、`--plan` を使って影響を受ける管理者と接続をプレビューできます。

## ユーザーへのアクセス付与 {#giving-people-access}

ログイン方法を追加、テスト、有効化、無効化するには、管理者 UI の **Settings** を開くか、`void platform config auth` を実行します。Access による保護とログイン方法は別々の設定です。プロバイダーのテストでは、明示的にリンクしたり設定を有効にしたりする前に、認証されたアカウントが表示されます。

インストール後に会社のゲートを変更するには、保存された復旧用認証情報を持つインストール元のワークステーションを使用します。

```sh
void platform config auth protection show
void platform config auth protection enable --installation <id>
void platform config auth protection disable --installation <id>
```

有効にすると、アプリケーションの作成、または既存のアプリケーションへの接続を選択できます。すべての API、プロキシ、設定済みのダッシュボードのオリジンを確認し、会社のユーザーによるサインインを必須にします。保護を変更すると現在のすべての人間のセッションが終了するため、その後は再度サインインしてください。会社のサインアップに使用しているゲートを削除する前に、検証済みの別の会社ルールまたは制限付きサインアップを選択してください。保護を削除しても、Cloudflare のアプリケーションは意図的なクリーンアップのために残されます。Access のログイン方法を無効にしても、ゲートは削除されません。

ユーザーは、`void account link <connection-id>` またはオプションのダッシュボードの **Account** から、既存のアカウントに別の有効なログインを追加できます。求められた場合は先に再度サインインし、追加のプロバイダーで認証して、表示された ID を確認してください。メールアドレスが一致するだけではアカウントはリンクされません。

管理ダッシュボードで **People → Access** を開くと、参加できるユーザーの選択、ユーザーの招待、個別のサインアップ許可の管理ができます。**Company-approved or individually approved users** を選択すると、設定済みの会社のルールを満たすユーザーのアカウントが自動的に作成されます。そのうえで、明示的な招待と許可リストによる許可も引き続き利用できます。プラットフォームのエッジでの会社の保護は、ログインページに到達する前に引き続き適用されます。

招待制 / 許可リスト制のサインアップを選択している場合、チームメイトの GitHub ログインを許可リストに追加すると、GitHub で参加できるようになります。

```sh
void platform signup allow github teammate
```

Void は変更内容を表示し、確認を求めます。その後、チームメイトはプラットフォームの URL を指定して `void connect` を実行し、サインインできます。

同じ方法で、メールアドレスまたはメールドメイン全体を許可することもできます。

```sh
void platform signup allow email teammate@example.com
void platform signup allow email '*@example.com'
```

メールのパターンは、プラットフォームのすべてのサインインプロバイダーに適用されます。シェルが `*` を Void にそのまま渡すように、ドメインのパターンは引用符で囲んでください。

検証済みのメールアドレスを持たない OIDC ログインでは、代わりにログイン接続と、プロバイダーが発行する不変のサブジェクトで ID を許可します。

```sh
void platform signup allow identity company-sso 'Employee-42'
```

`void platform config auth list` に表示される接続 ID と、ID プロバイダーが報告する正確なサブジェクトを使用してください。照合は大文字小文字を区別し、メールアドレスの推測や別のアカウントとのリンクは行いません。そのログイン方法に設定されているドメインやグループの制限は引き続き適用され、アカウントは通常のユーザーとして参加します。許可を削除するには、`void platform signup disallow identity company-sso 'Employee-42'` を使用します。

他のユーザーをメールで招待するには、次のコマンドを使用します。

```sh
void platform invitation send alex@example.org
```

招待は、その正確なメールアドレスに対してサインインのアクセスを許可します。招待された人は、同じ検証済みメールアドレスを提供するログイン方法でサインインする必要があります。プラットフォームのメール配信が設定されている場合、Void は接続手順も送信します。配信が利用できない場合や失敗した場合でも、許可は有効です。プラットフォームの `/invite` ページまたは `void connect '<platform URL>'` コマンドを、ご自身で相手に共有してください。管理ダッシュボードには、招待の保留中、承諾済み、取り消し済みというステータスとは別に、配信結果が表示されます。

現在のアクセス設定と招待は、次のコマンドで確認できます。

```sh
void platform signup show
void platform invitation list
```

招待の履歴は、関係するアカウントが削除された後も利用できます。保存されているアクターの ID は、そのアカウントのログインが存在しなくなっても表示されたままです。

`void platform signup open` は、誰でもサインアップできるようにします。サインアップしたユーザーは全員、アプリケーションドメインにアプリをデプロイできるため、サインアップを開放する前に、それらのアプリが[どのように Cookie を共有するか](/ja/guide/platform/installation/domains#adding-a-domain)を確認してください。再び許可リストへの一致を必須にするには、`void platform signup restrict` を使用します。エントリを許可から外しても、影響するのは今後のサインアップであり、既存のアカウントは停止されません。

## 連携アプリ {#connected-apps}

別々のアプリケーションを、[連携アプリ](./connected-apps.md)を通じて OAuth クライアントとして登録します。ユーザーは自分の ID を接続し、Void への各公開を承認します。
