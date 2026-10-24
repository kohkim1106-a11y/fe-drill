# 基本情報ドリル

基本情報技術者試験（科目A・科目B）をスマホで学習するPWA。

- 要件定義：[docs/01-requirements.md](docs/01-requirements.md)
- WBS・見積もり：[docs/02-wbs-estimate.md](docs/02-wbs-estimate.md)
- 設計：[docs/03-design.md](docs/03-design.md)
- 画面デザイン：`design/project/*.dc.html`（Claude Design キャンバス）

## 開発

Node.js 22 以降。

```bash
npm install
npm run dev        # 開発サーバー
npm test           # 単体テスト＋データ検証
npm run build      # 型チェック＋本番ビルド
```

問題データは `data/questions/*.json`、用語は `data/terms/*.json`。形式は設計書 §4 と `src/data/schema.ts` を参照。
