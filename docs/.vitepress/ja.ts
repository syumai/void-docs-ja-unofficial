// Japanese (unofficial) locale: derives nav/sidebar/footer from the English theme config.
// Links get a `/ja` prefix and labels are mapped through `labels` (unmapped labels stay as-is).

const labels: Record<string, string> = {
  Guide: 'ガイド',
  Platform: 'プラットフォーム',
  Reference: 'リファレンス',
  Integrations: 'インテグレーション',
  'Getting Started': 'はじめに',
  Introduction: 'イントロダクション',
  Quickstart: 'クイックスタート',
  'Supported App Types': '対応アプリタイプ',
  'Routing & Rendering': 'ルーティングとレンダリング',
  'Server Routing': 'サーバールーティング',
  'Pages Routing': 'Pages ルーティング',
  Overview: '概要',
  'Layouts & Shared Data': 'レイアウトと共有データ',
  'Loaders & Props': 'ローダーと Props',
  'Actions & Forms': 'アクションとフォーム',
  'View Transitions': 'ビュートランジション',
  'Head Management': 'Head 管理',
  Islands: 'アイランド',
  'Edge Routing': 'エッジルーティング',
  'Static Assets Caching': '静的アセットのキャッシュ',
  'Revalidation (ISR)': '再検証 (ISR)',
  'Edge Prerendering': 'エッジプリレンダリング',
  'Custom Headers': 'カスタムヘッダー',
  Redirects: 'リダイレクト',
  Rewrites: 'リライト',
  'Custom SSR': 'カスタム SSR',
  Data: 'データ',
  'Type Safety': '型安全性',
  Database: 'データベース',
  'Typed Fetch': '型付き Fetch',
  'Key-Value Storage': 'Key-Value ストレージ',
  'Object Storage': 'オブジェクトストレージ',
  'Durable State': 'Durable State',
  'Environment Variables': '環境変数',
  'Backend Features': 'バックエンド機能',
  Authentication: '認証',
  Email: 'メール',
  'Sending Email': 'メール送信',
  'Receiving Email': 'メール受信',
  'Domains and Setup': 'ドメインとセットアップ',
  Sandboxes: 'サンドボックス',
  'Cron Jobs': 'Cron ジョブ',
  Queues: 'キュー',
  'Server-Sent Events': 'Server-Sent Events',
  'Live Event Streams': 'ライブイベントストリーム',
  'Development & Deployment': '開発とデプロイ',
  'Remote Development': 'リモート開発',
  'Deploying Your App': 'アプリのデプロイ',
  'Project Collaboration': 'プロジェクトの共同作業',
  Installation: 'インストール',
  Prerequisites: '前提条件',
  Credentials: '認証情報',
  'Install and Configure Login': 'インストールとログイン設定',
  'First Deployment': '最初のデプロイ',
  'Domains and Resources': 'ドメインとリソース',
  'Maintenance and Recovery': 'メンテナンスと復旧',
  'Install from CI': 'CI からのインストール',
  'Disable and Uninstall': '無効化とアンインストール',
  Administration: '管理',
  'Sign-in and Access': 'サインインとアクセス',
  'Connected apps': '接続済みアプリ',
  'Users and Projects': 'ユーザーとプロジェクト',
  'Plans and Limits': 'プランと制限',
  'Project Zero Trust': 'プロジェクトの Zero Trust',
  Operations: '運用',
  'Development & Customization': '開発とカスタマイズ',
  'Local Development': 'ローカル開発',
  'Runtime and Source Builds': 'ランタイムとソースビルド',
  'Schema and CI': 'スキーマと CI',
  General: '一般',
  'Project Structure': 'プロジェクト構造',
  'Resource Inference': 'リソース推論',
  Config: '設定',
  'Project Setup': 'プロジェクトのセットアップ',
  'Connections and Authentication': '接続と認証',
  Projects: 'プロジェクト',
  Deployment: 'デプロイ',
  'Code Generation': 'コード生成',
  'Secrets and Environment': 'シークレットと環境',
  'GitHub and Builds': 'GitHub とビルド',
  'Custom Domains': 'カスタムドメイン',
  'Platform Management': 'プラットフォーム管理',
  'Platform Installation': 'プラットフォームのインストール',
  'Platform Configuration': 'プラットフォームの設定',
  'Platform Users and Projects': 'プラットフォームのユーザーとプロジェクト',
  'Platform Operations': 'プラットフォームの運用',
  'Platform Email': 'プラットフォームのメール',
  'Plugin and Configuration': 'プラグインと設定',
  'Handlers and Middleware': 'ハンドラーとミドルウェア',
  'Fetch Client': 'Fetch クライアント',
  'Durable State and WebSockets': 'Durable State と WebSockets',
  'Deployment artifacts': 'デプロイ成果物',
  'Database and Seeding': 'データベースとシーディング',
  'Resource Clients': 'リソースクライアント',
  Types: '型',
  'Pages Adapters': 'Pages アダプター',
  'Meta Frameworks': 'メタフレームワーク',
  'Coding Agents': 'コーディングエージェント',
  Docs: 'ドキュメント',
  'Open Source': 'オープンソース',
};

const prefixLink = (link: string) =>
  link.startsWith('/') && !link.startsWith('/ja') ? `/ja${link}` : link;

function localize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(localize);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'link' && typeof v === 'string') {
        out[k] = prefixLink(v);
      } else if (k === 'text' && typeof v === 'string') {
        out[k] = labels[v] ?? v;
      } else if (k === 'title' && typeof v === 'string') {
        out[k] = labels[v] ?? v;
      } else if (k === 'activeMatch' && typeof v === 'string') {
        out[k] = v
          .replace('^/', '^/ja/')
          .replace('/reference/', '/ja/reference/')
          .replace(/^\/integrations\//, '/ja/integrations/');
      } else {
        out[k] = localize(v);
      }
    }
    return out;
  }
  return value;
}

export function localizeThemeConfig(tc: Record<string, unknown>) {
  const sidebar: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tc.sidebar as Record<string, unknown>)) {
    sidebar[prefixLink(key)] = localize(value);
  }
  return {
    ...tc,
    nav: localize(tc.nav),
    sidebar,
    footer: {
      ...(tc.footer as Record<string, unknown>),
      nav: localize((tc.footer as { nav: unknown }).nav),
      copyright: '© Cloudflare Inc. 非公式の日本語訳です。',
    },
    docFooter: { prev: '前のページ', next: '次のページ' },
    outline: { label: 'このページの内容' },
    sidebarMenuLabel: 'メニュー',
    returnToTopLabel: 'ページトップへ',
    lastUpdated: { text: '最終更新' },
  };
}
