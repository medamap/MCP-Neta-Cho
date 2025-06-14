# MCP-NETA-CHO 実装戦略

## 基本方針

### データ構造の二層化
1. **知識ベース層（読み取り専用）**
   - 漫才・コント理論データベース
   - プリセット辞書
   - 成功パターン集
   
2. **プロジェクト層（読み書き可能）**
   - ユーザーの台本データ
   - 作業履歴
   - カスタマイズ設定

## 推奨アーキテクチャ

### 1. 知識ベース層の実装
```
mcp-neta-cho/
├── knowledge-base/
│   ├── theory.db          # SQLite（理論・パターン）
│   ├── dictionaries/      # JSON辞書ファイル群
│   │   ├── aruaru.json
│   │   ├── boke-patterns.json
│   │   └── tsukkomi-patterns.json
│   └── examples/          # Markdown例文集
│       ├── manzai/
│       └── conte/
```

**理由：**
- SQLiteは複雑なクエリが可能（パターン検索、条件付き抽出）
- JSONは辞書的データに最適（高速アクセス、編集容易）
- Markdownは例文の可読性が高い

### 2. プロジェクト層の実装
```
user-workspace/
└── my-neta-project/
    ├── .neta-cho/
    │   ├── project.json    # プロジェクト設定
    │   ├── history.db      # 作業履歴（SQLite）
    │   └── cache/          # 一時データ
    ├── scripts/            # 台本ファイル
    │   ├── draft-001.md
    │   └── draft-002.md
    └── analysis/           # 分析結果
        └── balance-report.md
```

**理由：**
- プロジェクトごとに独立したフォルダ
- 台本はMarkdownで人間が読み書きしやすい
- 履歴はSQLiteで効率的に管理

## MCPツールの実装例

### 1. プロジェクト初期化
```typescript
// neta_project_init
async function initProject(projectName: string) {
  const projectPath = path.join(process.cwd(), projectName);
  
  // フォルダ構造作成
  await fs.mkdir(path.join(projectPath, '.neta-cho'));
  await fs.mkdir(path.join(projectPath, 'scripts'));
  await fs.mkdir(path.join(projectPath, 'analysis'));
  
  // プロジェクト設定
  const config = {
    name: projectName,
    type: 'manzai', // or 'conte'
    created: new Date().toISOString(),
    version: '1.0.0'
  };
  
  await fs.writeFile(
    path.join(projectPath, '.neta-cho/project.json'),
    JSON.stringify(config, null, 2)
  );
}
```

### 2. ボケアドバイザー
```typescript
// boke_advisor
async function adviseOnBoke(context: string, level: 'aruaru' | 'arisou' | 'nainai') {
  // 知識ベースから適切なパターンを検索
  const patterns = await queryKnowledgeBase(`
    SELECT pattern, advice, example 
    FROM boke_patterns 
    WHERE level = ? AND context_type = ?
  `, [level, detectContextType(context)]);
  
  // カレントプロジェクトの履歴も参照
  const history = await queryProjectHistory();
  
  return {
    patterns: patterns,
    contextualAdvice: generateAdvice(context, patterns),
    avoidDuplication: checkDuplication(history, patterns)
  };
}
```

### 3. バランス分析
```typescript
// analyze_balance
async function analyzeBalance(scriptPath: string) {
  const script = await fs.readFile(scriptPath, 'utf-8');
  
  // 台本を解析
  const analysis = {
    bokeCount: countBoke(script),
    tsukkomiCount: countTsukkomi(script),
    patternDistribution: analyzePatterns(script),
    pacing: analyzePacing(script)
  };
  
  // レポート生成
  const report = generateBalanceReport(analysis);
  
  // 分析結果を保存
  await fs.writeFile(
    path.join(projectPath, 'analysis', `balance-${Date.now()}.md`),
    report
  );
  
  return analysis;
}
```

## データ永続化戦略

### 知識ベース（読み取り専用）
- **場所**: MCPパッケージ内（`node_modules/mcp-neta-cho/knowledge-base/`）
- **更新**: パッケージ更新時のみ
- **形式**: SQLite（構造化データ）+ JSON（辞書）+ Markdown（例文）

### プロジェクトデータ（読み書き可能）
- **場所**: ユーザーのワークスペース内
- **更新**: リアルタイム
- **形式**: JSON（設定）+ Markdown（台本）+ SQLite（履歴）

## 実装の優先順位

1. **Phase 1: 基本機能**
   - プロジェクト初期化
   - 基本的なアドバイザー機能
   - シンプルな分析

2. **Phase 2: 高度な機能**
   - パターン学習
   - 履歴からの提案
   - 詳細な分析レポート

3. **Phase 3: 拡張機能**
   - チーム共有機能
   - バージョン管理連携
   - エクスポート機能

## Claude Codeでの使用イメージ

```bash
# プロジェクト作成
mcp-neta-cho init "my-first-manzai"

# 台本作成開始
cd my-first-manzai
mcp-neta-cho create script "school-aruaru"

# アドバイスを受ける
mcp-neta-cho advise boke --level aruaru --context "学校"

# バランスチェック
mcp-neta-cho analyze scripts/draft-001.md

# 履歴確認
mcp-neta-cho history show
```

この設計により、理論的な知識と実践的な作業を効率的に組み合わせることができます。