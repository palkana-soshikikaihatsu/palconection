# パルコネ - 社内SNS

社内限定の登録制SNSアプリケーションです。

## 機能

- **ログイン/ログアウト**: セッションベースの認証
- **タイムライン**: 全社員の投稿を時系列で表示
- **コミュニティ掲示板**: グループ別の掲示板機能
- **プロフィール**: ユーザー情報の表示・編集

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router

### バックエンド
- Google Apps Script (GAS)
- Google Spreadsheet（データベース）

### ホスティング
- GitHub Pages

## セットアップ手順

### 1. スプレッドシートの準備

1. [Google Spreadsheet](https://sheets.google.com/) で新規スプレッドシートを作成
2. スプレッドシートのIDをメモ（URLの `/d/` と `/edit` の間の部分）

### 2. Google Apps Scriptの設定

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」を作成
3. `gas/` フォルダ内のファイルをGASエディタにコピー
4. 「プロジェクトの設定」→「スクリプトプロパティ」で以下を設定：
   - `SPREADSHEET_ID`: 作成したスプレッドシートのID
   - `ALLOWED_ORIGIN`: GitHub PagesのURL（例: `https://username.github.io`）

5. 初期管理者を作成：
   - `Auth.gs` の `createInitialAdmin()` 関数でメール/パスワードを設定
   - GASエディタで `createInitialAdmin` を実行

6. サンプルコミュニティを作成（任意）：
   - GASエディタで `createSampleCommunities` を実行

7. Webアプリとしてデプロイ：
   - 「デプロイ」→「新しいデプロイ」
   - 種類：「ウェブアプリ」
   - 実行するユーザー：「自分」
   - アクセス権：「全員」
   - デプロイ後、URLをコピー

### 3. フロントエンドの設定

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルにGASのURLを設定

# 開発サーバー起動
npm run dev
```

### 4. GitHub Pagesへのデプロイ

1. GitHubリポジトリにプッシュ
2. リポジトリの「Settings」→「Secrets and variables」→「Actions」
3. `VITE_GAS_URL` シークレットを追加（GASのURL）
4. 「Settings」→「Pages」でソースを「GitHub Actions」に設定
5. mainブランチにプッシュすると自動デプロイ

## 管理者機能

管理者は以下の機能を使用できます：

- ユーザーの新規登録
- ユーザーの有効/無効化
- コミュニティの作成

## 制限事項

- **同時アクセス**: 30人程度が目安
- **レスポンス**: 1-3秒程度
- **画像**: 外部URL（Imgur等）を使用
- **リアルタイム更新**: 非対応（手動更新）

## ディレクトリ構成

```
palconection/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── hooks/          # カスタムフック
│   ├── services/       # APIサービス
│   ├── types/          # TypeScript型定義
│   ├── App.tsx         # メインアプリ
│   └── main.tsx        # エントリーポイント
├── gas/                # Google Apps Scriptコード
├── public/             # 静的ファイル
└── README.md
```

## ライセンス

MIT License
