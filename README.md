# KAN Official Website

KANの個人公式サイトです。フレームワークやビルド工程を使わず、HTML・CSS・JavaScriptだけで構成しています。

## ページ

- `index.html` — ホーム
- `about.html` — プロフィール・活動方針
- `creative.html` — 制作内容
- `contact.html` — お問い合わせ
- `sns.html` — 公式SNS

## 更新しやすい場所

各ページの文章は対応するHTMLファイル内で編集できます。プロフィール写真とアイコンは `assets` フォルダ、色・余白・文字サイズは `css/style.css` 冒頭のCSS変数、動きやフォーム送信時の表示は `js/main.js` で調整できます。

GitHub Pagesではリポジトリのルートを公開対象に指定すると、そのまま公開できます。

HOMEのファーストビューでは、Three.jsをCDNから通常のスクリプトとして読み込み、控えめなWebGLパーティクル背景を表示します。WebGL非対応環境、CDNを読み込めない環境、動きを減らす設定では、既存の静的背景へ自動的に切り替わります。
