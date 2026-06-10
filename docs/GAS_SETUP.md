# Google Apps Script セットアップガイド

## 1. スプレッドシートの作成

1. [Google Spreadsheet](https://docs.google.com/spreadsheets/) にアクセス
2. 「空白」をクリックして新規スプレッドシートを作成
3. スプレッドシートに「パルコネDB」などの名前をつける
4. URLからスプレッドシートIDをコピー

```
https://docs.google.com/spreadsheets/d/【このIDをコピー】/edit
```

## 2. Google Apps Script プロジェクトの作成

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「パルコネAPI」などに変更

## 3. コードのコピー

`gas/` フォルダ内の各ファイルをGASエディタにコピーします：

### Code.gs
メインファイル（既存の `Code.gs` を上書き）

### Auth.gs
1. 左側の「ファイル」の「+」をクリック
2. 「スクリプト」を選択
3. ファイル名を `Auth` に変更
4. コードをコピー

### Posts.gs, Communities.gs, Users.gs
同様に作成

## 4. スクリプトプロパティの設定

1. 左メニューの「プロジェクトの設定」（歯車アイコン）をクリック
2. 「スクリプト プロパティ」セクションまでスクロール
3. 「スクリプト プロパティを追加」をクリック
4. 以下のプロパティを追加：

| プロパティ | 値 |
|-----------|-----|
| SPREADSHEET_ID | 手順1でコピーしたID |
| ALLOWED_ORIGIN | `https://palkana-soshikikaihatsu.github.io` |

## 5. 初期管理者の作成

1. `Auth.gs` の `createInitialAdmin()` 関数内のメール/パスワードを変更

```javascript
function createInitialAdmin() {
  const email = 'admin@yourcompany.co.jp'; // ← 変更
  const password = 'YourSecurePassword123'; // ← 変更
  const displayName = '管理者';
  // ...
}
```

2. 画面上部の関数セレクタで `createInitialAdmin` を選択
3. 「実行」ボタンをクリック
4. 初回実行時は「承認が必要です」と表示されるので承認

## 6. サンプルコミュニティの作成（任意）

1. 関数セレクタで `createSampleCommunities` を選択
2. 「実行」ボタンをクリック

## 7. Webアプリとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」をクリック
2. 「種類の選択」の歯車アイコンで「ウェブアプリ」を選択
3. 以下の設定：
   - 説明: `パルコネ API v1` など
   - 実行するユーザー: `自分`
   - アクセスできるユーザー: `全員`
4. 「デプロイ」をクリック
5. 表示されたURLをコピー（後で使用）

```
https://script.google.com/macros/s/AKfycb.../exec
```

## 8. フロントエンドの設定

コピーしたGAS URLを環境変数に設定：

### ローカル開発時
`.env` ファイルを作成：
```
VITE_GAS_URL=https://script.google.com/macros/s/AKfycb.../exec
```

### GitHub Actions（本番デプロイ時）
1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」をクリック
3. Name: `VITE_GAS_URL`
4. Value: GASのURL
5. 「Add secret」をクリック

## トラブルシューティング

### 「承認が必要です」エラー
初回実行時は必ずGoogleの承認が必要です。「詳細」→「(プロジェクト名)に移動」をクリックして承認してください。

### CORSエラー
`ALLOWED_ORIGIN` が正しく設定されているか確認してください。

### スプレッドシートが見つからない
`SPREADSHEET_ID` が正しいか確認してください。

### デプロイ後の変更が反映されない
コードを変更した場合は、「デプロイを管理」→「新しいデプロイ」で新バージョンをデプロイする必要があります。
