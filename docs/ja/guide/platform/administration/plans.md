---
outline: deep
---

# プランと制限 {#plans-and-limits}

プランは、プラットフォーム上のアカウントに割り当てるリソース制限を定義します。ユーザーへの課金や Cloudflare サービスの購入は行いません。管理者アカウントでサインインして管理ダッシュボードの **Plans** を開くか、CLI を使用します。

```sh
void platform auth login
void platform config plans
```

プランを選択して内容の確認や編集を行ったり、既存のプランを新しいプランにコピーしたり、新規アカウントのデフォルトを選択したりできます。変更にあたって、アプリやプラットフォームの再デプロイは不要です。

## ダッシュボードを使用する {#use-the-dashboard}

**Plans** を開くと、各プランの固定 ID、アカウント数、サインアップ時のデフォルトを確認できます。**Add plan** を選択すると既存のプランをコピーできます。**Edit** を選択すると、表示名、制限、ビルドサイズ、短いプロジェクトスラッグの使用許可を変更できます。

**Review changes** を選択すると、現在の設定と変更後の設定を比較し、影響を受けるアカウント数を確認できます。クォータに関する警告を確認してから、**Apply changes** を選択します。確認している間に他の誰かがカタログを変更した場合は、プランをもう一度開いて、新しい確認を作成してください。

編集ページでは、サインアップ時のデフォルトの選択、割り当てのアーカイブや復元、組み込みプランのリセット、有効な代替プランを指定したプランの削除も行えます。どの操作にも確認のステップがあります。

アカウントの更新は、結果ページで自動的に続行されます。ページを離れた場合や更新が一時停止した場合は、**Plans** を開いて **Continue account updates** を選択してください。再びプランを変更する前に、保留中のアカウント更新を完了させてください。記録された使用量と課金期間は保持されます。

## プランを追加する {#add-a-plan}

各プランには、固定 ID と編集可能な表示名があります。プランをコピーすると、制限、ビルドインスタンスのサイズ、短いプロジェクトスラッグの使用許可がコピーされます。

```sh
void platform config plans add team --copy pro --name "Team" --plan
void platform config plans add team --copy pro --name "Team" --yes
```

既存のアカウントに割り当てるか、新規アカウントのデフォルトにします。

```sh
void platform user plan <user-id> team --yes
void platform config plans default team --yes
```

デフォルトを変更しても、既存のアカウントは移動しません。プランの名前を変更しても、その ID や割り当ては変わりません。

## 制限を編集する {#edit-limits}

インタラクティブメニューでは、一度に 1 つの制限を変更できます。スクリプトや複数の変更を行う場合は、JSON ファイルを作成します。

```json
{
  "name": "Team",
  "limits": {
    "requestsPerMonth": 10000000,
    "concurrentBuilds": 3,
    "buildTimeoutMinutes": 15
  },
  "buildInstanceType": "standard-4"
}
```

省略した設定は現在の値が維持されます。プレビューしてから適用します。

```sh
void platform config plans set team --file team-plan.json --plan
void platform config plans set team --file team-plan.json --yes
```

制限は 0 以上の整数で、`0` はプランによる制限なし（無制限）を意味します。ビルドタイムアウトにはプラットフォームの上限として常に 60 分があり、`0` はその上限を使用します。次の項目を設定できます。

| 設定                            | 制限                                                      |
| ------------------------------- | --------------------------------------------------------- |
| `requestsPerMonth`              | アカウントの課金月あたりのアプリケーションリクエスト数    |
| `cpuMsPerRequest`               | アプリケーションリクエストあたりのデフォルトの CPU ミリ秒 |
| `maxCpuMsPerRequest`            | アプリケーションが要求できる CPU 制限の最大値             |
| `subRequestsPerInvocation`      | 1 回の呼び出しあたりのサブリクエスト数                    |
| `deploysPerDay`                 | 1 日あたりのデプロイ数                                    |
| `aiNeuronsPerMonth`             | アカウントの課金月あたりの AI ニューロン数                |
| `retainedDeployments`           | 保持される Worker デプロイ数                              |
| `sandboxRuntimeSecondsPerMonth` | アカウントの課金月あたりの Sandbox ランタイム秒数         |
| `sandboxMaxConcurrentInstances` | 同時に実行できる Sandbox インスタンス数                   |
| `concurrentBuilds`              | 同時に実行できるビルド数                                  |
| `buildTimeoutMinutes`           | ビルドタイムアウト（分）                                  |

`cpuMsPerRequest` は `maxCpuMsPerRequest` を超えることはできません。デフォルトの CPU 制限を無制限にするには、上限も無制限にする必要があります。ビルドインスタンスのサイズは `standard-3`（2 vCPU、8 GiB）と `standard-4`（4 vCPU、12 GiB）です。新しいビルドには新しいサイズとタイムアウトが使用され、実行中のビルドは記録された設定を維持します。

高度な設定ファイルでは、`"allowShortSlugs": true` を指定して 5 文字以下のプロジェクトスラッグを許可したり、`false` を指定して今後の変更でより長いスラッグを必須にしたりすることもできます。既存のプロジェクト URL は保持されます。プランをコピーすると、この設定が引き継がれます。組み込みの `free` プランでは無効、それ以外の組み込みプランでは有効です。

D1、R2、KV について表示されるストレージの数値は参考情報であり、強制されるクォータとして編集することはできません。静的デプロイは、既存の保持ポリシーを維持します。

プレビューでは、影響を受けるアカウント数が表示され、変更後のクォータをすでに超えているアカウントがないかをサンプルで確認します。クォータを下げると、サンプル外のアカウントを含め、既存のアプリが制限される場合があります。使用量の履歴と課金期間は保持されるため、プランを変更しても使用量はリセットされません。管理者による手動の停止はそのまま維持されます。

## プランをアーカイブまたは削除する {#archive-or-remove-a-plan}

プランをアーカイブすると、現在のアカウントを維持したまま、新しいアカウントへの割り当てを停止できます。

```sh
void platform config plans archive team --yes
void platform config plans restore team --yes
```

現在のデフォルトをアーカイブする前に、別のデフォルトを選択してください。アカウントがあるプランを削除するには、代替プランを選択し、先に変更内容を確認します。

```sh
void platform config plans remove team --replacement pro --plan
void platform config plans remove team --replacement pro --yes
```

デフォルトのプランを削除する場合も、代替プランが必要です。使用されておらずデフォルトでもないプランは、代替プランなしで削除できます。アカウントを代替プランに移動しても、使用量は保持されます。組み込みプランの元の制限とビルドサイズに戻すには、`void platform config plans reset <plan-id>` を使用します。カスタムプランには、組み込みのリセット値はありません。

削除の確認画面には、代替プランと、その制限、ビルドサイズ、短いスラッグの使用許可に対する変更が、確定前に表示されます。

## 保留中の更新を完了する {#complete-pending-updates}

変更を適用した後、CLI はアカウントの更新が完了するまで続行します。更新が失敗した場合や進行しなくなった場合でも、設定は保存されたままです。結果には保留中の作業が報告され、コマンドは 0 以外のステータスで終了します。カタログを確認してから、続行します。

```sh
void platform config plans show
void platform config plans sync --yes
```

`sync` は、保存されたポリシーのアカウント更新を完了するまで続行します。再びカタログを編集する前に、保留中の更新を完了させてください。リクエストの接続が切れた場合は、再試行する前にカタログと[オペレーターイベント](/ja/guide/platform/administration/operations)を確認してください。

すべてのコマンドは `--connection <registered-id-or-url>` と `--json` を受け付けます。スクリプトによる変更には `--yes` が必要です。読み取り専用のプレビューには `--plan` を使用します。
