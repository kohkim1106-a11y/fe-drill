# Firebase 設定手順 — 基本情報ドリル

複数の端末（スマホとPCなど）で学習記録を同期するための設定です。設定しなくてもアプリは端末内だけで動きます。所要時間は15分ほど、費用はかかりません（無料の Spark プラン）。

## 1. Firebase プロジェクトを作る

1. <https://console.firebase.google.com/> を開き、Google アカウントでログインする
2. 「プロジェクトを作成」（または「プロジェクトを追加」）を押す
3. プロジェクト名に `fe-drill` など好きな名前を入れて「続行」
4. Google アナリティクスは不要なのでオフにして「プロジェクトを作成」
5. 料金プランが「Spark（無料）」になっていることを左下で確認する。Blaze へのアップグレードはしない

## 2. ウェブアプリを登録する

1. プロジェクトのトップ画面で「</>」（ウェブ）のアイコンを押す
2. アプリのニックネームに `fe-drill-web` などを入れる。「Firebase Hosting も設定する」はチェックしない
3. 「アプリを登録」を押すと、次のような設定値が表示される

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "fe-drill-xxxx.firebaseapp.com",
     projectId: "fe-drill-xxxx",
     storageBucket: "fe-drill-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```

4. この画面は後で使うので開いたままにしておく（あとから「プロジェクトの設定 › 全般 › マイアプリ」でも見られる）

## 3. Google ログインを有効にする

1. 左メニュー「構築 › Authentication」を開き「始める」
2. 「ログイン方法」タブで「Google」を選ぶ
3. 「有効にする」をオンにし、プロジェクトのサポートメールに自分のメールアドレスを選んで「保存」

## 4. Firestore データベースを作る

1. 左メニュー「構築 › Firestore Database」を開き「データベースを作成」
2. ロケーションは `asia-northeast1`（東京）を選ぶ。**後から変更できない**ので注意
3. 「本番環境モードで開始する」を選んで「作成」

## 5. 設定値をアプリに貼る

1. リポジトリの `src/sync/firebase-config.ts` を開く
2. 手順2で表示された値を、同じ名前の項目にそれぞれ貼る

   ```ts
   export const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "fe-drill-xxxx.firebaseapp.com",
     projectId: "fe-drill-xxxx",
     storageBucket: "fe-drill-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef",
   };
   ```

3. 保存してコミットし、GitHub に push する。これらは公開してよい値で、他人のデータへのアクセスは手順7のルールで防ぐ

`apiKey` が空のままなら、アプリは同期機能を隠して端末内だけで動きます。

## 6. 公開先のドメインを許可する

1. 「Authentication › 設定 › 承認済みドメイン」を開く
2. 「ドメインの追加」で `<あなたのGitHubユーザー名>.github.io` を追加する（例：`taro.github.io`）
3. `localhost` は最初から入っているので、手元の `npm run dev` でもログインを試せる

## 7. セキュリティルールを設定する

本人だけが自分の記録を読み書きできるようにします。ルールの中身はリポジトリの `firestore.rules` です。どちらか一方の方法で設定してください。

### 方法A：コンソールに貼る（簡単）

1. 「Firestore Database › ルール」タブを開く
2. 表示されている内容をすべて消し、`firestore.rules` の中身を貼る
3. 「公開」を押す

### 方法B：コマンドで反映する

```sh
npx firebase-tools@15.34.1 login
npx firebase-tools@15.34.1 deploy --only firestore:rules --project <プロジェクトID>
```

`firebase.json` がない場合は、先に次の内容で作っておく。

```json
{ "firestore": { "rules": "firestore.rules" } }
```

## 8. 動作を確かめる

1. 公開したアプリ（`https://<ユーザー名>.github.io/fe-drill/`）を開き、「分析 › 設定」から Google でログインする
2. 何問か解いてから、別の端末で同じアカウントでログインし、記録が同じになることを確認する
3. Firebase コンソールの「Firestore Database › データ」に `users/<uid>/progress`、`days`、`meta/settings` ができていれば成功

## 同期の仕組み（参考）

- 端末内の記録が正本。オフラインで解いた分は Firestore のオフラインキャッシュに貯まり、オンラインに戻ると送られる
- ログイン直後にクラウドの記録をすべて取得し、同じ項目は更新時刻（updatedAt）が新しい方を採用する
- ホーム画面に追加した iPhone のアプリではポップアップが使えないため、ログイン画面へ移動する方式（リダイレクト）でログインする

## 困ったとき

| 症状 | 確認すること |
|---|---|
| ログインのポップアップがすぐ閉じる／`auth/unauthorized-domain` | 手順6の承認済みドメインに公開先が入っているか |
| ログインできるが記録が同期されない／`permission-denied` | 手順7のルールが公開されているか |
| 同期のボタンが表示されない | `src/sync/firebase-config.ts` の `apiKey` が空のままになっていないか、push 後にビルドが終わっているか |
