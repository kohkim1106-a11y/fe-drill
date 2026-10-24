# 06. IPA 公開問題の出典と利用条件

基本情報ドリルに収録している IPA（独立行政法人情報処理推進機構）の公開問題・サンプル問題について、利用条件、出典、収録数、除外した問題とその理由をまとめる。

- 調査・取得日：2026-10-24
- 対象データ：`data/questions/ipa-*.json`（10 ファイル、計 165 問）

## 1. 利用条件（IPA の FAQ より）

参照ページ：IPA「よくある質問（試験）」の「試験の過去問題の使用方法（申請方法、使用料等）について教えてください。」
<https://www.ipa.go.jp/shiken/faq.html>

要点（筆者による要約）：

- IPA が公表している過去の試験問題は、法令に特別な定めがある場合を除き、**許諾の申請も使用料も不要**で使える。ダウンロードして使うことも問題ない。
- ただし IPA は**著作権を放棄していない**。
- 教育目的など、情報処理技術者試験制度の意義に反しない使い方であれば、問題集やテキストに使う場合も許諾・使用料は不要とされている。
- **出典の明記が必要**。年度、期、試験区分、時間区分、問番号などを記載する（FAQ の例：「出典：平成31年度 春期 基本情報技術者試験 午前 問1」）。
- **問題の一部を改変した場合は、その旨も明記する**。
- 公表している PDF 以外の電子データは提供されない。

判断：本アプリは無料の個人学習用 PWA で、GitHub Pages で公開する。学習（教育）目的であり、出典と改変の有無を明記すれば上記の条件に合うと判断した。営利・非営利の区別について FAQ に記載はない。

## 2. 出典 PDF と収録数

すべて www.ipa.go.jp から 2026-10-24 に取得した。正解は各回の「解答例」PDF による。

| ファイル | 出典（問題冊子） | 解答例 | 収録 / 全問 |
|---|---|---|---|
| ipa-r5-a.json | [令和5年度 基本情報技術者試験 科目A 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_a_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_a_ans.pdf) | 18 / 20 |
| ipa-r5-b.json | [令和5年度 基本情報技術者試験 科目B 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_b_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_b_ans.pdf) | 5 / 6 |
| ipa-r6-a.json | [令和6年度 基本情報技術者試験 科目A 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_ans.pdf) | 18 / 20 |
| ipa-r6-b.json | [令和6年度 基本情報技術者試験 科目B 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_b_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_b_ans.pdf) | 6 / 6 |
| ipa-r7-a.json | [令和7年度 基本情報技術者試験 科目A 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_ans.pdf) | 19 / 20 |
| ipa-r7-b.json | [令和7年度 基本情報技術者試験 科目B 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_b_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_b_ans.pdf) | 4 / 6 |
| ipa-r8-a.json | [令和8年度 基本情報技術者試験 科目A 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_ans.pdf) | 19 / 20 |
| ipa-r8-b.json | [令和8年度 基本情報技術者試験 科目B 公開問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_b_qs.pdf) | [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_b_ans.pdf) | 5 / 6 |
| ipa-sample-a.json | [基本情報技術者試験 科目A試験 サンプル問題（60問）セット](https://www.ipa.go.jp/shiken/syllabus/henkou/2022/gmcbt80000007cfs-att/fe_kamoku_a_set_sample_qs.pdf) | [解答](https://www.ipa.go.jp/shiken/syllabus/henkou/2022/gmcbt80000007cfs-att/fe_kamoku_a_set_sample_ans.pdf) | 56 / 60 |
| ipa-sample-b.json | [基本情報技術者試験 科目B試験 サンプル問題（20問）セット](https://www.ipa.go.jp/shiken/syllabus/henkou/2022/gmcbt80000007cfs-att/fe_kamoku_b_set_sample_qs.pdf) | [解答](https://www.ipa.go.jp/shiken/syllabus/henkou/2022/gmcbt80000007cfs-att/fe_kamoku_b_set_sample_ans.pdf) | 15 / 20 |
| 合計 | | | **165 / 184** |

一覧ページ：

- SG・FE 公開問題：<https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/index.html>
- サンプル問題（試験要綱・シラバス等の変更のページ）：<https://www.ipa.go.jp/shiken/syllabus/henkou/2022/20220425.html>

※ 公開問題は実際の試験（科目A 60 問、科目B 20 問）のうち一部（科目A 20 問、科目B 6 問）が公開されたもの。

## 3. 除外した問題と理由

| 出典 | 問番号 | 理由 |
|---|---|---|
| 令和5年度 科目A | 問11 | 流れ図の番号（①〜⑥）と処理の対応が図に依存し、文章で正確に再現できない |
| 令和5年度 科目A | 問13 | アローダイアグラム（図）が必要 |
| 令和5年度 科目B | 問5 | 解答群が 9 個あり、アプリの上限（8 個）を超える |
| 令和6年度 科目A | 問13 | アローダイアグラム（図）が必要 |
| 令和6年度 科目A | 問19 | 散布図を読み取る問題 |
| 令和7年度 科目A | 問14 | アローダイアグラム（図）が必要 |
| 令和7年度 科目B | 問4 | 解答群が 10 個（上限 8 個を超える） |
| 令和7年度 科目B | 問6 | 解答群が 10 個（上限 8 個を超える） |
| 令和8年度 科目A | 問6 | 論理回路図とタイミングチャートが必要 |
| 令和8年度 科目B | 問6 | 解答群が 10 個（上限 8 個を超える） |
| サンプル 科目A | 問4 | 状態遷移図（オートマトン）が必要 |
| サンプル 科目A | 問5 | 選択肢が 2 分木の図 |
| サンプル 科目A | 問6 | 配列の状態を表す図が必要 |
| サンプル 科目A | 問44 | アローダイアグラム（図）が必要 |
| サンプル 科目B | 問15 | 三目並べの盤面の状態遷移図が必要 |
| サンプル 科目B | 問16 | 解答群が 9 個（上限 8 個を超える） |
| サンプル 科目B | 問17 | 解答群が 10 個（上限 8 個を超える） |
| サンプル 科目B | 問18 | 解答群が 10 個（上限 8 個を超える） |
| サンプル 科目B | 問19 | 空欄を含む操作権限の表の構成を PDF から正確に再現できない |

## 4. 改変の扱い

- 問題文・選択肢・正解は PDF の本文どおりに転記した。選択肢の順序（ア〜）は IPA のままで、全問 `"shuffle": false` としている。
- 擬似言語のプログラムは `code` に入れた。IPA の冊子では縦線で示す字下げを、半角スペースの字下げで表している。
- 次の改変をした問題は、`source.number` に改変内容を付記した（例：`"問10（図を文章に改変）"`）。
  - 表を文字で表記：表を「項目／項目」や「行：値」の形のテキストにした
  - 図を文字で表記・図を文章に改変：構成図・木・UML などの図を、同じ内容の文章にした（答えが図の細部に依存する問題は除外した）
  - 流れ図を文章に改変：単純なループだけの流れ図を文章にした
  - 図を省略：答えに関係しない図（配列の位置の図など）を省き、必要な情報を問題文に補った
  - 複数行にわたる選択肢は、1 行にまとめて「；」や「と」で区切った
- 解説（`explanation`）は IPA が公表していないため、本アプリが独自に作成したもの。各問で、自作の解説と IPA の正解が一致することを確認した。

## 5. アプリに表示する出典表記

問題画面（出典が `ipa` の問題）には、次の形式で表示する。

```
出典：令和5年度 基本情報技術者試験 科目A 公開問題 問3
```

改変した問題は `source.number` に改変内容が入っているので、そのまま表示すれば改変の旨も示せる。

```
出典：令和5年度 基本情報技術者試験 科目A 公開問題 問10（図を文章に改変）
```

設定画面やクレジット欄には、次の文を載せる。

```
本アプリの一部の問題は、独立行政法人情報処理推進機構（IPA）が公開している
基本情報技術者試験の公開問題・サンプル問題を出典としています。
各問題に出典（年度・試験区分・問番号）を記載し、図表を文章に改めるなど
一部を改変した問題にはその旨を付記しています。解説は本アプリ独自のものであり、
IPA が作成したものではありません。
問題の著作権は IPA に帰属します。
```
