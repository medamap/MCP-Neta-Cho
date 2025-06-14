# MCP-NETA-CHO API設計書

## 概要

MCP-NETA-CHOは、Model Context Protocol (MCP) を使用して漫才・コント作成支援機能を提供します。本文書では、MCPツールの設計と実装仕様を定義します。

## 設計原則

1. **直感的なインターフェース** - ツール名と引数が自明であること
2. **段階的な複雑性** - 基本的な使い方は簡単に、高度な使い方も可能に
3. **エラーハンドリング** - 明確で実用的なエラーメッセージ
4. **拡張性** - 将来の機能追加を考慮した設計

## MCPツール一覧

### 1. プロジェクト管理ツール

#### project_init
プロジェクトを初期化する

```typescript
interface ProjectInitParams {
  name: string;                    // プロジェクト名（必須）
  type: 'manzai' | 'conte';       // 種類（必須）
  path?: string;                  // 作成パス（デフォルト：カレントディレクトリ）
  description?: string;           // プロジェクトの説明
  targetDuration?: number;        // 目標時間（秒）
  targetAudience?: string;        // ターゲット層
}

interface ProjectInitResponse {
  success: boolean;
  projectId: string;
  projectPath: string;
  message: string;
}

// 使用例
await mcp.project_init({
  name: "学校あるあるコント",
  type: "conte",
  description: "高校生活のあるあるネタを中心にしたコント",
  targetDuration: 300
});
```

#### project_open
既存のプロジェクトを開く

```typescript
interface ProjectOpenParams {
  path: string;                   // プロジェクトパス
}

interface ProjectOpenResponse {
  success: boolean;
  project: ProjectInfo;
  scripts: ScriptSummary[];
  recentAnalyses: AnalysisSummary[];
}
```

#### project_status
プロジェクトの状態を確認

```typescript
interface ProjectStatusParams {
  projectId?: string;             // 省略時はカレントプロジェクト
}

interface ProjectStatusResponse {
  project: ProjectInfo;
  statistics: {
    totalScripts: number;
    totalAnalyses: number;
    averageScore: number;
    lastModified: string;
  };
  currentScript?: ScriptSummary;
}
```

### 2. 台本作成ツール

#### script_create
新しい台本を作成

```typescript
interface ScriptCreateParams {
  title: string;                  // 台本タイトル
  projectId?: string;             // プロジェクトID（省略時はカレント）
  template?: string;              // テンプレート名
}

interface ScriptCreateResponse {
  success: boolean;
  scriptId: string;
  filePath: string;
  templateApplied: boolean;
}
```

#### script_add_element
台本に要素を追加

```typescript
interface ScriptAddElementParams {
  scriptId: string;               // 台本ID
  elementType: 'boke' | 'tsukkomi' | 'narration' | 'action';
  content: string;                // 内容
  character?: string;             // キャラクター名
  position?: number;              // 挿入位置（省略時は末尾）
  patternHint?: string;           // パターンのヒント
}

interface ScriptAddElementResponse {
  success: boolean;
  elementId: string;
  sequenceNumber: number;
  suggestions?: string[];         // 次の要素の提案
}
```

#### script_edit_element
台本要素を編集

```typescript
interface ScriptEditElementParams {
  elementId: string;              // 要素ID
  content?: string;               // 新しい内容
  character?: string;             // 新しいキャラクター名
}
```

### 3. 知識ベース検索ツール

#### search_boke_patterns
ボケパターンを検索

```typescript
interface SearchBokeParams {
  level?: 'aruaru' | 'arisou' | 'nainai';
  type?: string;                  // ボケの種類
  context?: string;               // コンテキスト（例：「学校」「職場」）
  tags?: string[];                // タグでフィルタ
  limit?: number;                 // 結果数制限（デフォルト：10）
}

interface BokePattern {
  id: string;
  content: string;
  type: string;
  level: string;
  example: string;
  effectiveness: number;
  usageTips: string;
}

interface SearchBokeResponse {
  patterns: BokePattern[];
  totalCount: number;
  suggestions: string[];          // 関連する検索候補
}
```

#### search_tsukkomi_patterns
ツッコミパターンを検索

```typescript
interface SearchTsukkomiParams {
  type?: string;                  // ツッコミの種類
  intensity?: {                   // 強度範囲
    min: number;
    max: number;
  };
  compatibleBokeType?: string;    // 相性の良いボケタイプ
  limit?: number;
}
```

#### search_situations
シチュエーションを検索

```typescript
interface SearchSituationParams {
  genre?: string;                 // ジャンル
  isRealistic?: boolean;          // 現実的かどうか
  participantCount?: number;      // 登場人物数
  tags?: string[];
}
```

### 4. アドバイザーツール

#### advise_next_boke
次のボケを提案

```typescript
interface AdviseNextBokeParams {
  scriptId: string;               // 現在の台本ID
  contextWindow?: number;         // 考慮する直前の要素数（デフォルト：5）
  preferredTypes?: string[];      // 優先するボケタイプ
  avoidTypes?: string[];          // 避けるボケタイプ
}

interface AdviseNextBokeResponse {
  suggestions: {
    pattern: BokePattern;
    reasoning: string;            // 提案理由
    confidence: number;           // 信頼度（0-1）
    example: string;              // 具体例
  }[];
  currentContext: {
    recentPatterns: string[];
    levelProgression: string[];
    dominantType: string;
  };
}
```

#### advise_tsukkomi
ボケに対するツッコミを提案

```typescript
interface AdviseTsukkomiParams {
  bokeContent: string;            // ボケの内容
  bokeType?: string;              // ボケのタイプ
  previousTsukkomi?: string[];    // 直前のツッコミ（重複回避用）
}
```

#### advise_balance
構成バランスのアドバイス

```typescript
interface AdviseBalanceParams {
  scriptId: string;
  focusAreas?: ('level' | 'type' | 'tempo' | 'all')[];
}

interface BalanceAdvice {
  area: string;
  status: 'good' | 'warning' | 'needs_improvement';
  message: string;
  specifics: any;                 // エリアごとの詳細データ
  suggestions: string[];
}
```

### 5. 分析ツール

#### analyze_script
台本を総合的に分析

```typescript
interface AnalyzeScriptParams {
  scriptId: string;
  analysisTypes?: ('balance' | 'tempo' | 'pattern' | 'flow' | 'all')[];
  saveResults?: boolean;          // 結果を保存するか（デフォルト：true）
}

interface AnalysisResult {
  analysisId: string;
  timestamp: string;
  score: number;                  // 総合スコア（0-100）
  breakdown: {
    balance: BalanceAnalysis;
    tempo: TempoAnalysis;
    pattern: PatternAnalysis;
    flow: FlowAnalysis;
  };
  strengths: string[];
  improvements: string[];
  detailedSuggestions: Suggestion[];
}
```

#### analyze_balance
バランスのみを分析

```typescript
interface AnalyzeBalanceParams {
  scriptId: string;
}

interface BalanceAnalysis {
  bokeCount: number;
  tsukkomiCount: number;
  ratio: number;
  levelDistribution: {
    aruaru: number;
    arisou: number;
    nainai: number;
  };
  evaluation: string;
  visualChart: string;            // ASCIIアートのチャート
}
```

#### analyze_tempo
テンポを分析

```typescript
interface TempoAnalysis {
  averageInterval: number;        // 平均間隔（秒）
  variance: number;               // ばらつき
  segments: {
    start: number;
    end: number;
    tempo: 'slow' | 'normal' | 'fast';
    effectiveness: number;
  }[];
  suggestions: string[];
}
```

### 6. 可視化ツール

#### visualize_flow
盛り上がりの流れを可視化

```typescript
interface VisualizeFlowParams {
  scriptId: string;
  format?: 'ascii' | 'json' | 'markdown';
}

interface FlowVisualization {
  format: string;
  data: string;                   // フォーマットに応じた可視化データ
  peaks: {
    timing: number;
    intensity: number;
    description: string;
  }[];
  valleys: {
    timing: number;
    intensity: number;
    suggestion: string;
  }[];
}

// ASCII形式の出力例
/*
盛り上がり度
100 |                    ****
 90 |                 ***    **
 80 |              ***        **
 70 |           ***            *
 60 |        ***                **
 50 |     ***                    *
 40 |  ***                        **
 30 |**                            *
 20 |                               **
 10 |                                *
  0 +----------------------------------
    0   30   60   90  120  150  180  210
                  時間（秒）
*/
```

#### visualize_pattern_distribution
パターン分布を可視化

```typescript
interface VisualizePatternParams {
  scriptId: string;
  groupBy: 'type' | 'level';
}
```

### 7. エクスポート・インポートツール

#### export_script
台本をエクスポート

```typescript
interface ExportScriptParams {
  scriptId: string;
  format: 'markdown' | 'pdf' | 'docx' | 'plain';
  includeAnalysis?: boolean;      // 分析結果を含めるか
  includeAnnotations?: boolean;   // 注釈を含めるか
}

interface ExportResponse {
  success: boolean;
  filePath: string;
  format: string;
  fileSize: number;
}
```

#### import_script
外部の台本をインポート

```typescript
interface ImportScriptParams {
  filePath: string;               // インポートするファイル
  projectId?: string;             // インポート先プロジェクト
  parsePatterns?: boolean;        // パターンを自動認識するか
}
```

### 8. 学習・履歴ツール

#### record_performance
公演結果を記録

```typescript
interface RecordPerformanceParams {
  scriptId: string;
  date: string;                   // 公演日
  venue: string;                  // 会場
  audienceSize?: number;          // 観客数
  response: {
    overall: 'poor' | 'fair' | 'good' | 'excellent';
    highlights: {
      elementId: string;
      response: 'silence' | 'chuckle' | 'laugh' | 'big_laugh';
    }[];
    notes?: string;
  };
}
```

#### learn_from_history
履歴から学習

```typescript
interface LearnFromHistoryParams {
  projectId?: string;             // 対象プロジェクト（省略時は全体）
  minScore?: number;              // 最低スコアでフィルタ
  period?: {                      // 期間指定
    from: string;
    to: string;
  };
}

interface LearningInsights {
  successfulPatterns: {
    pattern: string;
    frequency: number;
    averageResponse: number;
  }[];
  avoidPatterns: {
    pattern: string;
    reason: string;
  }[];
  recommendations: string[];
}
```

## エラーハンドリング

### エラーコード体系

```typescript
enum ErrorCode {
  // 1xxx: 入力エラー
  INVALID_PARAMS = 1001,
  MISSING_REQUIRED = 1002,
  INVALID_FORMAT = 1003,
  
  // 2xxx: リソースエラー
  RESOURCE_NOT_FOUND = 2001,
  RESOURCE_ALREADY_EXISTS = 2002,
  RESOURCE_LOCKED = 2003,
  
  // 3xxx: 処理エラー
  ANALYSIS_FAILED = 3001,
  GENERATION_FAILED = 3002,
  EXPORT_FAILED = 3003,
  
  // 4xxx: システムエラー
  DATABASE_ERROR = 4001,
  FILE_SYSTEM_ERROR = 4002,
  NETWORK_ERROR = 4003,
}

interface MCPError {
  code: ErrorCode;
  message: string;
  details?: any;
  suggestions?: string[];
}
```

### エラーレスポンス例

```json
{
  "error": {
    "code": 2001,
    "message": "指定された台本が見つかりません",
    "details": {
      "scriptId": "script_xyz",
      "searchPaths": ["./scripts", "./drafts"]
    },
    "suggestions": [
      "project_status で現在の台本一覧を確認してください",
      "script_create で新しい台本を作成できます"
    ]
  }
}
```

## 使用フロー例

### 1. 新規プロジェクト開始

```bash
# プロジェクト作成
mcp> project_init --name "学校コント" --type conte

# 台本作成
mcp> script_create --title "授業中のあるある"

# ボケパターン検索
mcp> search_boke_patterns --context "学校" --level aruaru

# 要素追加
mcp> script_add_element --elementType boke --content "先生が黒板に書いてる間にこっそりスマホ"
```

### 2. 既存台本の改善

```bash
# 台本分析
mcp> analyze_script --analysisTypes all

# バランスアドバイス
mcp> advise_balance --focusAreas type level

# 次のボケ提案
mcp> advise_next_boke --preferredTypes "天然系"

# 可視化
mcp> visualize_flow --format ascii
```

### 3. 学習と改善

```bash
# 公演結果記録
mcp> record_performance --date "2024-02-01" --venue "ライブハウス" --response.overall good

# 履歴から学習
mcp> learn_from_history --minScore 80

# 成功パターンで検索
mcp> search_boke_patterns --tags "successful" --limit 20
```

## パフォーマンス考慮事項

1. **レスポンスタイム目標**
   - 検索系：< 100ms
   - 分析系：< 500ms
   - 生成系：< 1000ms

2. **キャッシング戦略**
   - 知識ベースデータは起動時にメモリキャッシュ
   - 分析結果は一定期間キャッシュ
   - プロジェクトデータは都度読み込み

3. **バッチ処理**
   - 複数要素の追加はバッチ処理で高速化
   - 分析は差分更新で効率化

## セキュリティ考慮事項

1. **入力検証**
   - すべての入力パラメータをスキーマで検証
   - SQLインジェクション対策（プリペアドステートメント使用）
   - パストラバーサル対策

2. **データ保護**
   - プロジェクトデータは暗号化可能
   - 機密性の高い台本にはアクセス制限

3. **監査ログ**
   - すべてのAPI呼び出しをログ記録
   - 重要な操作は詳細ログ