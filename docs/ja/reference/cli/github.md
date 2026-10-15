---
outline: deep
---

# GitHub とビルド {#github}

GitHub へのデプロイは、Google、GitHub、その他の SSO など、**どの** Void ログインでも利用できます。初めて GitHub を接続するときに、Void は GitHub の ID を現在のアカウントにリンクします(ログイン方法に依存しない 1 回限りの手順です)。2 つ目のアカウントが作成されることはありません。

プロジェクトスコープの `github` コマンドと `build` コマンドは、デプロイと同じ順序でプロジェクトを解決します。`[project]` 引数または `--project`、次に `VOID_PROJECT`、最後にリンクされたプロジェクト(`.void/project.json`)の順です。

## `void github link` {#void-github-link}

```
void github link
```

サインイン中の Void アカウントを、ブラウザー経由で GitHub にリンクします。必要な場合は `void github install` が自動的にこれを行います。

::: warning 既存の GitHub サインイン
GitHub の ID は 1 つの Void アカウントにのみ属することができます。すでに別の場所にリンクされている場合は、そちらの Void アカウントにサインインするか、別の GitHub の ID を認可してください。
:::

## `void github install` {#void-github-install}

```
void github install
```

ブラウザーで GitHub App のインストールページを開きます。アカウントにまだリンクされた GitHub の ID がない場合、`void github install` はまず GitHub のリンクを自動的に実行し(ブラウザーでの認可)、その後に続行します。インストール後、`void github connect` を実行してリポジトリをプロジェクトにリンクします。

## `void github installations` {#void-github-installations}

```
void github installations
```

アカウントにリンクされているすべての GitHub App インストールを一覧表示します。各エントリには、非対話モードで `--installation` に必要な `[id: <installation_id>]` が含まれます。

## `void github join` {#void-github-join}

```
void github join
```

既存の組織のインストールに、ブラウザー経由で参加します。`void github connect` は、対話的なターミナルではこれを自動的に実行できます。非対話のセットアップの前に必要な場合は、ローカルで `join` を実行してください。

サインイン済みの Void アカウントと、プラットフォームで有効化された組織インストールの共有が必要です。インストール ID を調べるには `void github installations` を使用します。

## `void github connect` {#void-github-connect}

```
void github connect [project] [options]
```

自動デプロイのために、GitHub リポジトリを Void プロジェクトに接続します。設定したブランチへのプッシュのたびに、Void はプロジェクトを自動的にビルドしてデプロイします。

CLI は、GitHub の認可が必要な場合にブラウザーを開きます。利用可能なインストールがない場合は、`void github install` を実行してください。

**オプション**

| フラグ                | 説明                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `--project <name>`    | プロジェクト名(位置引数の別名)                                                             |
| `--installation <id>` | GitHub App のインストール ID(複数のインストールがある場合は必須)                           |
| `--repo <owner/repo>` | リポジトリのフルネーム。インストールが付与しているリポジトリがちょうど 1 つでない限り必須  |
| `--branch <name>`     | デプロイ元のブランチ。**非対話モードでは必須**                                             |
| `--executor <type>`   | ビルドエグゼキューター: `container`(デフォルト)または `github_actions`                     |
| `--workflow <path>`   | 認可されたデプロイワークフローのファイル。デフォルトは `.github/workflows/void-deploy.yml` |

プラットフォームでのビルドには `container`、デプロイワークフローには `github_actions` を選択します。CLI はエグゼキューターを、GitHub Actions の場合はさらにワークフローファイルを対話的に尋ねます。対応するフラグを渡すと、そのプロンプトをスキップできます。

ワークフローは `.github/workflows/` 配下の `.yml` または `.yaml` ファイルである必要があります。そのワークフローだけが、プロジェクトの OIDC デプロイトークンを取得できます。専用のデプロイワークフローを使うことをおすすめします。

CI では、プロジェクトとブランチを指定し、自動的に選択できない場合はインストールとリポジトリも指定します。組織の接続では、まずローカルのブラウザーでリポジトリの認可が必要です。

```
void github connect my-app \
  --installation 42 \
  --repo owner/my-app \
  --branch main
```

接続できるのは、ご自身の GitHub アカウントがアクセスできるリポジトリのみです。

1 つのプロジェクトは 1 つの GitHub 接続を持ちます。すでに接続済みのプロジェクトで `void github connect` を実行すると失敗します。別のリポジトリに接続するには、先に `void github disconnect` を実行してください。

## `void github update` {#void-github-update}

```
void github update [project] [options]
```

既存の接続のブランチ、エグゼキューター、ワークフローを変更します。リポジトリを変更するには、切断して再接続してください。

**オプション**

| フラグ              | 説明                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| `--project <name>`  | プロジェクト名(位置引数の別名)                                            |
| `--branch <name>`   | 新しいデプロイ元のブランチ                                                |
| `--executor <type>` | 新しいビルドエグゼキューター: `container` または `github_actions`         |
| `--workflow <path>` | 新しい認可されたデプロイワークフローのファイル(`.github/workflows/` 配下) |

CLI は、現在の値をデフォルトとして新しい設定を対話的に尋ねます。CI では、`--branch`、`--executor`、`--workflow` のうち少なくとも 1 つを渡してください。

```
void github update my-app --executor github_actions
```

## `void github status` {#void-github-status}

```
void github status [project]
```

接続されているリポジトリ、ブランチ、エグゼキューター、ワークフローを表示します。コンテナビルドではワークフローファイルは使用されません。

**オプション**

| フラグ             | 説明                           |
| ------------------ | ------------------------------ |
| `--project <name>` | プロジェクト名(位置引数の別名) |

```
void github status my-app
```

## `void github disconnect` {#void-github-disconnect}

```
void github disconnect [project]
```

プロジェクトを GitHub リポジトリから切断し、自動デプロイを停止します。接続を削除する前に、プロジェクトの実行中のビルドはすべてキャンセルされます。プロジェクトに接続がない場合は、その旨を報告して正常終了します。プロジェクトを別のリポジトリに向けるには、先に切断してから `void github connect` を実行してください。

何かが削除される前に、確認を求められます。プロンプトをスキップするには `--yes` を渡します。応答するプロンプトが存在しない非対話シェル(CI)では、`--yes` は**必須**です。

**オプション**

| フラグ             | 説明                                               |
| ------------------ | -------------------------------------------------- |
| `--project <name>` | プロジェクト名(位置引数の別名)                     |
| `--yes`            | 確認プロンプトをスキップする(非対話シェルでは必須) |

```
void github disconnect my-app --yes
```

## ビルド {#build}

GitHub へのデプロイのビルドを確認します。

### `void build logs` {#void-build-logs}

```
void build logs [build] [--follow] [--output <file>] [--project <slug>]
```

**コンテナ**ビルドのビルドログをストリーミング、テール、またはダウンロードします。`[build]` 引数を省略すると、プロジェクトの最新のビルドが対象になります。

| フラグ                   | 目的                                                                     | デフォルト |
| ------------------------ | ------------------------------------------------------------------------ | ---------- |
| `--follow`, `-f`         | ライブテール: ビルドが終了し、最終ログが取得されるまでポーリングします。 | オフ       |
| `--output <file>`, `-o`  | ログを標準出力ではなくファイルに書き込みます(follow 中は追記されます)。  | 標準出力   |
| `--project <slug>`, `-p` | 対象のプロジェクト。                                                     | リンク済み |

**GitHub Actions** で実行されたビルドのログは GitHub 上に保持されます。このコマンドはストリーミングの代わりに、Actions の実行 URL を表示します。コンテナビルドで保持されるのは、直近 10,000 行のログのみです。

follow はプラットフォームが最終ログの末尾を確認するまで待機します。プラットフォームが確認できない場合は、プラットフォームのランタイムをアップグレードするか、`--follow` を付けずに保持されたログを読んでください。最終ログの末尾が未完了の場合は 2 分後にエラーを報告します。再試行すると回復できます。

例:

```
void build logs                     # print the latest build's logs
void build logs -f                  # follow the latest build until it finishes
void build logs bld_123 -o build.log  # download a specific build's logs
```
