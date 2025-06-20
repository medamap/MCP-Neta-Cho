# MCP-NETA-CHO（MCPネタ帳）

漫才・コント台本作成支援のためのModel Context Protocol (MCP)サーバー

## プロジェクト概要

MCP-NETA-CHOは、漫才・コントの台本作成を支援するMCPサーバーです。**MCPは質問をするだけ**で、ユーザーが自分でネタを考えて台本を作成できるよう、理論に基づいたガイダンスを提供します。

## 🎯 主な機能

### 1. インタラクティブウィザード（推奨）
```bash
# MCPは質問するだけ！ユーザーが考えて答える方式
start_wizard  # 18ステップの対話形式で台本作成
```

### 2. Web調査アシスタント
```bash
# ネタ探しのヒントを提供
research_boke_ideas theme: "カーナビ"
```

### 3. 台本評価システム
```bash
# 理論に基づいた評価とアドバイス
evaluate_script
```

### 4. フルオート作成（要確認）
```bash
# 明示的な確認後、自動で台本を生成
request_full_auto theme: "コンビニ" genre: "manzai"
```

## 🎭 理論的基盤

### 4つの基本パターン
1. **場所が日常×キャラが日常** - 最も安全で共感しやすい
2. **場所が日常×キャラが非日常** - 意外性とリアリティのバランス
3. **場所が非日常×キャラが日常** - シチュエーションコメディ
4. **場所が非日常×キャラが非日常** - ❌使用禁止（観客が理解困難）

### ボケの3段階理論
- **あるある（30%）** - 共感を得る日常的なボケ
- **ありそう（50%）** - ちょっと変だけどありえるボケ
- **ないない（20%）** - 完全に非現実的なボケ

### 起承転結の構成
- **起**: テーマ設定と観客の引き込み
- **承**: あるあるボケで共感形成
- **転**: ありそう・ないないでギャップ作り
- **結**: 強いオチで締める

## 💻 技術仕様

- **プロトコル**: Model Context Protocol (MCP)
- **言語**: TypeScript
- **データ形式**: JSON（Node.js v23対応）
- **実行環境**: Node.js v23以上

## 📦 インストール

### 基本的なセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/medamap/MCP-Neta-Cho.git
cd MCP-Neta-Cho

# 依存関係のインストール
npm install

# ビルド
npm run build
```

### 各クライアントでの設定

#### Claude Code
```bash
# MCPサーバーを追加
claude mcp add mcp-neta-cho -- node /path/to/MCP-Neta-Cho/dist/index.js

# MCPサーバーを削除する場合
claude mcp remove mcp-neta-cho
```

#### Claude Desktop
手動で `claude_desktop_config.json` に追加：
```json
{
  "mcpServers": {
    "mcp-neta-cho": {
      "command": "node",
      "args": ["/absolute/path/to/MCP-Neta-Cho/dist/index.js"]
    }
  }
}
```

#### 開発・テスト用
```bash
# MCPサーバーとして直接実行
npm start
```

## 🚀 使い方

### 基本的な流れ
1. `start_wizard`でウィザードを開始
2. MCPの質問に答えていく（全18ステップ）
3. 途中で`get_hint`でヒントを取得可能
4. 完成後は`evaluate_script`で評価を確認

### コマンド例
```bash
# ウィザード開始
start_wizard

# 次の質問へ進む
next_question answer: "コンビニ"

# ヒントが欲しい時
get_hint topic: "ボケの作り方"

# これまでの回答を確認
show_wizard_answers
```

## 📂 プロジェクト構造

```
mcp-neta-cho/
├── src/
│   ├── index.ts              # MCPサーバーのエントリポイント
│   └── tools/
│       ├── interactive-wizard.ts  # 対話形式ウィザード
│       ├── evaluate-script.ts     # 評価システム
│       ├── web-research.ts        # Web調査支援
│       └── full-auto-creator.ts  # フルオート作成
├── knowledge-base/            # 理論データベース
├── docs/                      # ドキュメント
└── package.json
```

## 🤝 開発への貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 注意事項

- **MCPは質問するだけ**: ネタの内容はすべてユーザーが考えます

## 🔄 今後の予定

- [ ] より詳細な評価基準の実装
- [ ] ボケのバリエーション提案機能
- [ ] 過去の台本管理機能
- [ ] コラボレーション機能

## ライセンス

MIT License

## 貢献

このプロジェクトは漫才・コント理論の研究とシステム化を目的としています。理論面でのご意見や実装に関するご提案を歓迎いたします。

---

**注意**: このツールは創作の代替ではなく、創作の最良のパートナーとして機能することを目指しています。面白さの保証や自動生成は行いません。