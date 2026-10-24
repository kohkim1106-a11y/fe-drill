# App Store Connect 掲載情報（基本情報ドリル v1.0）

App Store Connect に入力する文面と回答をまとめる。文字数は App Store Connect の上限内であることを確認済み（数え方は各項目に記載）。入力時はコードブロックの中身だけをコピーする。

- Bundle ID：`com.kohki.m1106`
- バージョン：1.0
- 主言語：日本語

---

## 1. アプリ名（30 文字以内）

```
基本情報ドリル
```

7 文字。

## 2. サブタイトル（30 文字以内）

```
基本情報技術者試験の問題演習と用語カード
```

20 文字。

## 3. プロモーションテキスト（170 文字以内）

審査なしでいつでも変更できる欄。109 文字。

```
基本情報技術者試験（科目A・科目B）の学習アプリです。オリジナル問題340問とIPA公開問題165問、用語カード300語を収録。通信なしで動くので、通勤中や機内モードでも学習できます。広告・課金・ログインはありません。
```

## 4. 説明文（4000 文字以内、プレーンテキスト）

約 1,100 文字（改行を含む）。

```
基本情報ドリルは、基本情報技術者試験（FE）の学習用アプリです。科目Aと科目Bの問題演習、用語カード、模試、復習をひとつにまとめました。無料で、広告、アプリ内課金、ログインはありません。

■ 収録内容
・オリジナル問題 340問（科目A 300問、科目B 40問）
・IPA 公開問題・サンプル問題 165問（科目A・科目B）
・用語カード 300語
すべての問題に解説が付いています。

■ 主な機能
・問題演習：クイックスタートのほか、大分類・中分類を選んで分野別に解けます。1問ごとに解説を確認できます。
・基数変換ドリル：2進数・16進数などの変換を繰り返し練習できます。
・復習：解いた問題を正誤に応じて間隔をあけて再び出題します。今日復習する問題はホーム画面に表示されます。
・用語カード：カードをタップして裏返し、左右にスワイプして「覚えた」「まだ」に仕分けます。
・模試：解説を最後にまとめて表示する形式で解けます。途中で中断しても、あとから再開できます。
・分析：分野別の正答率、苦手な分野、直近14日の学習量を確認できます。試験日と1日の目標を設定すると、ホーム画面に試験までの日数と今日の目標が表示されます。
・学習リマインダー：毎日決まった時刻に通知で学習を促します（任意）。
・テーマ：ダークとライトを切り替えられます。端末の設定に合わせることもできます。

■ オフラインで使えます
問題・解説・用語はすべてアプリに入っています。通信を行わないので、電波のない場所や機内モードでも使えます。

■ プライバシー
学習記録は端末の中にだけ保存され、外部に送信されません。個人情報や利用状況の収集、アクセス解析、広告はありません。

■ IPA 問題の出典について
本アプリの一部の問題は、独立行政法人情報処理推進機構（IPA）が公開している基本情報技術者試験の公開問題・サンプル問題を出典としています。各問題に出典（年度・試験区分・問番号）を記載し、図表を文章に改めるなど一部を改変した問題にはその旨を付記しています。解説は本アプリ独自のものであり、IPA が作成したものではありません。問題の著作権は IPA に帰属します。
本アプリは個人が開発したもので、IPA とは関係ありません。

■ お問い合わせ
不具合の報告や問題の誤りは、サポートページから GitHub の Issues でお知らせください。問題画面の「誤りを報告」で問題IDをコピーできます。
```

## 5. キーワード（100 バイト以内、カンマ区切り）

```
技術者試験,FE,過去問,科目A,科目B,IT資格,試験対策,用語,暗記,擬似言語,復習
```

- UTF-8 で **100 バイト**（44 文字）。`python3 -c "print(len('…'.encode()))"` で確認済み。上限ちょうどなので、1 文字でも足す場合は何かを削る。
- アプリ名とサブタイトルの語（「基本情報」「ドリル」「問題演習」「用語カード」など）は検索対象に含まれるため、キーワードには重ねて入れていない。
- 「IPA」は他者の名称のため、キーワードには入れていない（説明文の出典表記には記載）。

## 6. カテゴリ

- プライマリ：**教育**
- セカンダリ：**辞書/参考書**（英語名 Reference）

理由：本アプリの中心は試験対策の学習なので、プライマリは教育。セカンダリは、用語 300 語のカードと解説付きの問題集という「参照して調べ直す」性格に合う Reference を選ぶ。仕事効率化（Productivity）はタスク管理やメモなどの道具を探す利用者向けのカテゴリで、学習アプリを置くと利用者の期待とずれる。

※ App Store Connect 上の日本語のカテゴリ名は表示を見て選ぶ（英語名 Reference のもの）。

## 7. 年齢制限（年齢区分の質問票）

すべて「なし」または「いいえ」で回答する。想定される区分は **4+**。

| 質問の内容 | 回答 |
|---|---|
| 暴力（アニメ・リアル）、恐怖、性的な内容、ヌード、冒とく的・下品なユーモア | なし |
| アルコール・タバコ・薬物の使用や言及 | なし |
| 医療・治療に関する情報、健康・ウェルネスの話題 | なし |
| 賭博（シミュレートされたギャンブルを含む）、コンテスト | なし |
| 成人向けの話題 | なし |
| 制限のない Web アクセス | いいえ（外部サイトを表示しない） |
| ユーザー生成コンテンツ、利用者同士のメッセージ・チャット | いいえ |
| 広告 | いいえ |
| ペアレンタルコントロール・年齢確認の機能 | いいえ |

質問票の項目は Apple が改定することがあるため、表にない質問が出た場合も、本アプリの内容（試験問題、解説、用語、学習記録、ローカル通知のみ）に照らして回答する。

## 8. App のプライバシー（App Privacy）

- 「データの収集について」：**いいえ、このアプリではデータを収集しません**（Data Not Collected）
- 根拠：通信を一切行わず、学習記録は端末内（WebView のローカルストレージ）にだけ保存する。サードパーティの SDK（解析、広告、クラッシュレポート）は含まない。Apple の定義では、端末の外に送信されないデータは「収集」に当たらない。
- プライバシーポリシー URL：`https://kohkim1106-a11y.github.io/fe-drill/privacy.html`

## 9. 輸出コンプライアンス（暗号化）

- 本アプリは独自の暗号化を実装せず、通信も行わない。OS が提供する標準の暗号化以外を使っていないため、免除の対象。
- `ios/App/App/Info.plist` に `ITSAppUsesNonExemptEncryption` = `NO`（`<false/>`）を設定済み。これによりビルドのアップロードごとの質問は表示されない。
- 質問が表示された場合は「免除される暗号化のみを使用」／「いいえ」を選ぶ。

## 10. 著作権

```
2026 （開発者の氏名または屋号）
```

※ App Store Connect の「著作権」欄は「年 + 権利者名」の形で入れる（© 記号は不要）。名前は開発者が決める。個人で登録した場合、App Store の販売元には Apple Developer Program に登録した氏名が表示される。

## 11. URL

| 項目 | URL |
|---|---|
| サポート URL | `https://kohkim1106-a11y.github.io/fe-drill/support.html` |
| マーケティング URL（任意） | `https://kohkim1106-a11y.github.io/fe-drill/` |
| プライバシーポリシー URL | `https://kohkim1106-a11y.github.io/fe-drill/privacy.html` |

提出前に、3 つの URL がブラウザで開けることを確認する（`public/` の内容が GitHub Pages にデプロイされている必要がある）。

## 12. スクリーンショット

- 必須サイズ：**6.9 インチ（1320 × 2868 ピクセル、縦向き）**。シミュレータの iPhone 16 Pro Max / iPhone 17 Pro Max で撮るとこのサイズになる。
- 6.9 インチを用意すれば、それより小さい iPhone の表示には縮小して使われる。iPad は対象外（iPhone のみで提出）。
- 撮り方は `docs/07-ios-release.md` の手順 7 を参照。
- キャプションは画像に入れる場合の文言。入れない場合は撮影したそのままの画面でよい。

| # | 画面 | キャプション |
|---|---|---|
| 1 | ホーム（今日の復習数、試験日までの日数が見える状態） | 今日やる問題がひと目でわかる |
| 2 | 問題演習の解説表示（正誤と解説、IPA 問題なら出典表記が見える状態） | 解いてすぐ、解説で理解 |
| 3 | 用語カード（カードをスワイプしている途中、または裏返した状態） | 用語300語をスワイプで暗記 |
| 4 | 分析（分野別の正答率と日ごとの記録） | 苦手な分野が数字でわかる |
| 5 | 設定の学習リマインダー（通知時刻を設定した状態） | 毎日の通知で学習を続ける |

撮影前に数日分の学習記録を作っておくと、ホームと分析の画面が空にならない。ダークテーマで統一する。

## 13. App Review への備考（審査メモ）

「App Review に関する情報」の「メモ」欄に入れる。サインイン情報は「サインインが必要」のチェックを外す。

```
This app is a free study app for the Fundamental Information Technology Engineer Examination (基本情報技術者試験) in Japan.

- Offline only: all questions, explanations and glossary terms are bundled in the app. The app makes no network requests and works in Airplane Mode.
- No login, no account, no ads, no in-app purchases, no analytics. Study records are stored only on the device.

How to try the main features:
1. Home tab: start today's practice.
2. 演習 (Practice) tab: choose a category and answer questions; an explanation is shown after each answer.
3. カード (Cards) tab: tap a card to flip it, swipe right/left to sort.
4. 分析 (Stats) tab: open settings from the "変更" link. Under 学習リマインダー, turn on "毎日通知する" and set a time one or two minutes ahead, then allow notifications. A local notification arrives at that time even if the app is closed.

About the IPA questions:
165 of the questions are public exam questions and sample questions published by the Information-technology Promotion Agency, Japan (IPA). IPA states that its published past exam questions may be used without application or fee, provided the source is stated and any modifications are indicated: https://www.ipa.go.jp/shiken/faq.html
Each IPA question shows its source (year, exam section, question number), and modified questions are marked. The explanations are our own. Copyright of the questions remains with IPA. The other 340 questions and 300 glossary entries are original content written for this app.

Support: https://github.com/kohkim1106-a11y/fe-drill/issues
```

日本語の審査担当者向けに、同じ内容を日本語で添えてもよい。
