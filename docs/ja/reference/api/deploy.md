# デプロイアーティファクト {#deployment-artifacts}

Node.js から `void/deploy` を使うと、プラットフォームの認証情報なしで、ビルド済みの Void アプリをマネージドプラットフォームへのデプロイ用に準備できます。

分離された環境内で、マネージドモードでアプリをビルドします。

```sh
VOID_DEPLOY_BUILD=1 VOID_DEPLOY_PROJECT_ID=artifact npm run build
```

これらの値は、プラットフォームと互換性のあるビルドを選択します。`artifact` はビルドのマーカーであり、既存のプロジェクト ID や認証情報ではありません。対象のプロジェクトは、公開の承認時に選択されます。

```ts
import { prepareDeployArtifact } from 'void/deploy';

const { artifact, assets } = await prepareDeployArtifact('/path/to/app');
```

`artifact` には、デプロイのマニフェスト、コンテンツアドレス指定のアセットのメタデータ、Base64 エンコードされた Worker モジュールが含まれます。`assets` は、アセットの URL パスを Base64 のバイト列にマッピングします。[公開の承認](/ja/guide/platform/administration/connected-apps)をリクエストする間は、この結果を変更しないでください。

準備では既存のビルド出力をパッケージ化します。ビルド、プラットフォームへの接続、リソースのプロビジョニング、デプロイは行いません。Void の Cloudflare Worker ビルドをサポートしています。Node ターゲット、静的出力、リモートデータ、デプロイ時のプリレンダリング、Sandbox、Live リソースには、通常の `void deploy` ワークフローが必要です。

準備は、アプリのビルドと同じ分離された環境内で実行してください。アプリの設定とビルドプラグインはプロジェクトのコードを実行します。プラットフォームの認証情報は、公開を行うサーバーに保持してください。
