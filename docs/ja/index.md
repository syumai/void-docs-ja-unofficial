---
layout: home
theme: dark

hero:
  name: Void
  text: Vite でビルド。Void でデプロイ。
  tagline: Void は、アプリのビルドとデプロイを統合する CLI、プラットフォーム、フルスタック SDK です。
  actions:
    - theme: brand
      text: はじめる
      link: ./guide/
    - theme: alt
      text: GitHub で見る
      link: https://github.com/voidzero-dev/void
    - theme: alt
      text: 発表記事を読む
      link: https://blog.cloudflare.com/deploy-with-void
features:
  - iconify: lucide:layers
    visual: stack
    title: 推論されるフルスタック
    details: 必要なものをインポートするだけ。Void がローカルリソースを提供し、デプロイ時にプロビジョニングします。
    highlights:
      - サーバールートと認証
      - データベース、ストレージ、AI
      - キューとスケジュールジョブ
    guide:
      text: SDK を見る
      link: /ja/guide/
  - iconify: lucide:wand-sparkles
    visual: resources
    title: データベースから UI まで型付き
    details: データベース、サーバーローダー、ページコンポーネントの間で型を共有できます。
    highlights:
      - データベーススキーマから型を生成
      - 型付きのローダー、アクション、API
      - サーバーコードはサーバーに留まる
    guide:
      text: 型安全性を見る
      link: /ja/guide/type-safety
  - iconify: lucide:blocks
    visual: frameworks
    title: お好みのフレームワークで
    details: Void のアダプターで構築することも、既存の Vite フレームワークをそのまま使うこともできます。
    highlights:
      - Async React、Vue、Svelte、Solid 向けのアダプターを同梱
      - TanStack Start、SvelteKit、Nuxt などをサポート
      - API、SPA、サーバーレンダリングのページを構築
    guide:
      text: フレームワークを見る
      link: /ja/integrations/frameworks/overview
platform_features:
  - id: platform-ai-coding
    iconify: lucide:bot
    title: チームのための安全なバイブコーディング
    details: 管理者が Cloudflare へのアクセスを管理したまま、チームがコーディングエージェントでビルドとデプロイを行えます。
    highlights:
      - 非エンジニアのチームメンバーが自分のアプリを作れるようにする
      - Cloudflare の認証情報は管理者チームが保持
      - プロトタイプを素早くデプロイし、アプリを共有してフィードバックを得る
    guide:
      text: チームでのデプロイを見る
      link: /ja/guide/self-hosted-platform
    visual: rive
    image_alt: チーム向けにアプリが構築される様子を表したアニメーションイラスト
  - id: platform-control-plane
    iconify: lucide:panels-top-left
    visual: resources
    title: アプリを管理するコントロールプレーン
    details: ユーザー、プロジェクト、デプロイ、プラットフォームの状態を、管理 UI または CLI から管理できます。
    highlights:
      - ユーザーとプロジェクトのアクセス、リソースを管理
      - デプロイ、ログ、ロールバックを確認
      - プラットフォームの状態と使用状況を監視
    guide:
      text: プラットフォーム管理
      link: /ja/guide/platform-administration
    image_alt: アクセス、ビルド、招待、管理のための Void プラットフォームコマンドの一覧
  - id: platform-security
    iconify: lucide:shield-check
    title: 独自のセキュリティを持ち込む
    details: チームのセキュリティ基準に合わせて、Void プラットフォームをフォークしてカスタマイズできます。
    highlights:
      - Cloudflare Access、Google、GitHub、OIDC でアクセスを管理
      - サインインとデプロイができるユーザーを制御
      - アクセスポリシーでプロジェクトを保護
    guide:
      text: プラットフォームのアクセスを設定する
      link: /ja/guide/platform/administration/access
    visual: rive
    image_alt: セルフホストのプラットフォームのセキュリティを表したアニメーションイラスト
footer_heading: Vite でビルド。Void でデプロイ。
footer_subheading: サーバーコード、リソース、デプロイを 1 つのワークフローで。
---

<script setup>
import Home from '../.vitepress/theme/Home.vue'
</script>

<Home />
