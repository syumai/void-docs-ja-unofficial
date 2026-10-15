---
outline: deep
---

<script setup>
import LegacyDocRedirect from '../../.vitepress/theme/LegacyDocRedirect.vue';
import links from '../../.vitepress/redirects/guide-email.json';
</script>

<LegacyDocRedirect page="guide/email.md" :links="links" />

# メール {#email}

Void を使って、トランザクションメールの送信、ルートハンドラーでのメッセージ受信、ローカルの受信トレイでの送信メールのテストができます。

| ガイド                                       | 用途                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| [メールを送信する](./email/sending.md)       | メッセージと添付ファイルの送信、エラー処理、ローカルでの配信テスト。             |
| [メールを受信する](./email/receiving.md)     | 受信メッセージのルーティング、返信、転送、ハンドラーのテスト。                   |
| [ドメインとセットアップ](./email/domains.md) | プラットフォームでのドメインの登録、またはご自身の Cloudflare アカウントの設定。 |

メールが有効な Void プラットフォームでは、まず[共有送信元](./email/sending.md#setup)から始めてください。Cloudflare への直接デプロイでは、最初に[送信元とドメインを設定](./email/domains.md#your-own-cloudflare-account)してください。
