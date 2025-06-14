# MCP-NETA-CHO データ構造設計書

## 概要

MCP-NETA-CHOのデータ構造は、漫才・コント理論の体系的な管理と効率的なアクセスを実現するため、以下の原則に基づいて設計されています：

1. **知識ベース層と作業層の分離**
2. **スキーマの拡張性と保守性**
3. **クエリパフォーマンスの最適化**
4. **データの一貫性と整合性の保証**

## データベース設計

### 1. 知識ベースデータベース（knowledge.db）

読み取り専用の理論・パターンデータを格納するSQLiteデータベース。

#### 1.1 ボケパターンテーブル（boke_patterns）

```sql
CREATE TABLE boke_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_code VARCHAR(50) UNIQUE NOT NULL, -- パターン識別コード
    content TEXT NOT NULL,                    -- ボケの内容
    type VARCHAR(50) NOT NULL,                -- ボケの種類
    level VARCHAR(20) NOT NULL,               -- レベル（あるある/ありそう/ないない）
    description TEXT,                         -- 詳細説明
    example TEXT,                             -- 使用例
    context_tags TEXT,                        -- コンテキストタグ（JSON配列）
    effectiveness_score FLOAT DEFAULT 0.5,     -- 効果スコア（0-1）
    difficulty_level INTEGER DEFAULT 1,        -- 難易度（1-5）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (level IN ('aruaru', 'arisou', 'nainai')),
    CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    CHECK (difficulty_level >= 1 AND difficulty_level <= 5)
);

CREATE INDEX idx_boke_type_level ON boke_patterns(type, level);
CREATE INDEX idx_boke_effectiveness ON boke_patterns(effectiveness_score DESC);
```

#### 1.2 ツッコミパターンテーブル（tsukkomi_patterns）

```sql
CREATE TABLE tsukkomi_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_code VARCHAR(50) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,               -- ツッコミの種類
    intensity INTEGER NOT NULL,               -- 強度（1-10）
    timing_type VARCHAR(30),                  -- タイミングタイプ（即座/間を置いて/被せ）
    compatible_boke_types TEXT,               -- 相性の良いボケタイプ（JSON配列）
    example TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (intensity >= 1 AND intensity <= 10),
    CHECK (timing_type IN ('immediate', 'delayed', 'overlap', 'multiple'))
);

CREATE INDEX idx_tsukkomi_type ON tsukkomi_patterns(type);
CREATE INDEX idx_tsukkomi_intensity ON tsukkomi_patterns(intensity);
```

#### 1.3 シチュエーションテーブル（situations）

```sql
CREATE TABLE situations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    situation_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_realistic BOOLEAN NOT NULL,
    genre VARCHAR(50) NOT NULL,
    sub_genre VARCHAR(50),
    location_type VARCHAR(50),               -- 場所のタイプ（屋内/屋外/特殊）
    time_period VARCHAR(30),                 -- 時間帯（朝/昼/夜/深夜）
    participant_count INTEGER,               -- 想定登場人物数
    props_needed TEXT,                       -- 必要な小道具（JSON配列）
    difficulty_level INTEGER DEFAULT 1,
    tags TEXT,                              -- タグ（JSON配列）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (difficulty_level >= 1 AND difficulty_level <= 5)
);

CREATE INDEX idx_situation_genre ON situations(genre, sub_genre);
CREATE INDEX idx_situation_realistic ON situations(is_realistic);
```

#### 1.4 キャラクターテンプレートテーブル（character_templates）

```sql
CREATE TABLE character_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_realistic BOOLEAN NOT NULL,
    personality_type VARCHAR(50),            -- 性格タイプ
    role_type VARCHAR(30),                   -- 役割（ボケ/ツッコミ/両方）
    traits TEXT,                             -- 特徴（JSON配列）
    speech_patterns TEXT,                    -- 話し方の特徴（JSON配列）
    compatible_partners TEXT,                -- 相性の良い相方タイプ（JSON配列）
    example_lines TEXT,                      -- セリフ例（JSON配列）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (role_type IN ('boke', 'tsukkomi', 'both', 'support'))
);

CREATE INDEX idx_character_role ON character_templates(role_type);
CREATE INDEX idx_character_realistic ON character_templates(is_realistic);
```

#### 1.5 構成パターンテーブル（composition_patterns）

```sql
CREATE TABLE composition_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    structure_type VARCHAR(50),              -- 構成タイプ（起承転結/三段構成など）
    duration_seconds INTEGER,                -- 想定時間（秒）
    phase_count INTEGER,                     -- フェーズ数
    phase_details TEXT,                      -- フェーズ詳細（JSON）
    success_examples TEXT,                   -- 成功例（JSON配列）
    difficulty_level INTEGER DEFAULT 1,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (difficulty_level >= 1 AND difficulty_level <= 5)
);
```

#### 1.6 関連テーブル（boke_tsukkomi_compatibility）

```sql
CREATE TABLE boke_tsukkomi_compatibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boke_pattern_id INTEGER NOT NULL,
    tsukkomi_pattern_id INTEGER NOT NULL,
    compatibility_score FLOAT NOT NULL,      -- 相性スコア（0-1）
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT,
    notes TEXT,
    FOREIGN KEY (boke_pattern_id) REFERENCES boke_patterns(id),
    FOREIGN KEY (tsukkomi_pattern_id) REFERENCES tsukkomi_patterns(id),
    UNIQUE(boke_pattern_id, tsukkomi_pattern_id),
    CHECK (compatibility_score >= 0 AND compatibility_score <= 1)
);

CREATE INDEX idx_compatibility_score ON boke_tsukkomi_compatibility(compatibility_score DESC);
```

### 2. プロジェクトデータベース（project.db）

ユーザーの作業データを管理する読み書き可能なデータベース。

#### 2.1 プロジェクトテーブル（projects）

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(36) UNIQUE NOT NULL,  -- UUID
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,               -- manzai/conte
    description TEXT,
    target_duration INTEGER,                 -- 目標時間（秒）
    target_audience VARCHAR(50),             -- ターゲット層
    performance_date DATE,                   -- 公演予定日
    venue VARCHAR(100),                      -- 会場
    status VARCHAR(20) DEFAULT 'draft',      -- draft/rehearsal/completed
    metadata TEXT,                           -- その他メタデータ（JSON）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('manzai', 'conte')),
    CHECK (status IN ('draft', 'rehearsal', 'completed', 'archived'))
);
```

#### 2.2 台本テーブル（scripts）

```sql
CREATE TABLE scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id VARCHAR(36) UNIQUE NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    version INTEGER DEFAULT 1,
    title VARCHAR(200),
    content TEXT NOT NULL,                   -- Markdown形式の台本
    duration_estimate INTEGER,               -- 推定時間（秒）
    character_count INTEGER,                 -- 登場人物数
    metadata TEXT,                           -- メタデータ（JSON）
    is_current BOOLEAN DEFAULT TRUE,         -- 現在のバージョンかどうか
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE INDEX idx_script_project ON scripts(project_id, is_current);
```

#### 2.3 台本要素テーブル（script_elements）

```sql
CREATE TABLE script_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    element_id VARCHAR(36) UNIQUE NOT NULL,
    script_id VARCHAR(36) NOT NULL,
    sequence_number INTEGER NOT NULL,        -- 順序
    element_type VARCHAR(30) NOT NULL,       -- boke/tsukkomi/narration/action
    character_name VARCHAR(100),             -- キャラクター名
    content TEXT NOT NULL,                   -- セリフ・動作内容
    timing_seconds FLOAT,                    -- タイミング（秒）
    boke_pattern_id INTEGER,                 -- 使用したボケパターン
    tsukkomi_pattern_id INTEGER,             -- 使用したツッコミパターン
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES scripts(script_id),
    FOREIGN KEY (boke_pattern_id) REFERENCES boke_patterns(id),
    FOREIGN KEY (tsukkomi_pattern_id) REFERENCES tsukkomi_patterns(id),
    CHECK (element_type IN ('boke', 'tsukkomi', 'narration', 'action', 'direction'))
);

CREATE INDEX idx_element_script_seq ON script_elements(script_id, sequence_number);
```

#### 2.4 分析履歴テーブル（analysis_history）

```sql
CREATE TABLE analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id VARCHAR(36) UNIQUE NOT NULL,
    script_id VARCHAR(36) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,      -- balance/tempo/pattern/comprehensive
    results TEXT NOT NULL,                   -- 分析結果（JSON）
    suggestions TEXT,                        -- 提案内容（JSON）
    score FLOAT,                            -- 総合スコア（0-100）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES scripts(script_id)
);

CREATE INDEX idx_analysis_script ON analysis_history(script_id, created_at DESC);
```

#### 2.5 作業履歴テーブル（work_history）

```sql
CREATE TABLE work_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,        -- create/edit/analyze/export等
    target_type VARCHAR(30),                 -- script/character/situation等
    target_id VARCHAR(36),
    description TEXT,
    metadata TEXT,                           -- 詳細データ（JSON）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE INDEX idx_history_project ON work_history(project_id, created_at DESC);
```

## JSONデータ構造

### 1. 辞書ファイル形式

#### あるある辞書（aruaru.json）

```json
{
  "version": "1.0.0",
  "category": "aruaru",
  "entries": [
    {
      "id": "aruaru_001",
      "situation": "電車",
      "content": "急行に乗ったつもりが各駅停車",
      "tags": ["交通", "勘違い", "日常"],
      "variations": [
        "特急に乗ったつもりが急行",
        "快速に乗ったつもりが普通"
      ],
      "usage_tips": "導入部分で使いやすい。観客の共感を得やすい。"
    }
  ]
}
```

#### ボケパターン辞書（boke-patterns.json）

```json
{
  "version": "1.0.0",
  "patterns": {
    "勘違い系": {
      "description": "聞き間違い、見間違い、思い込みによるボケ",
      "techniques": [
        {
          "name": "言葉の聞き間違い",
          "example": "「会議」を「懐疑」と聞き間違える",
          "difficulty": 1,
          "effectiveness": 0.7
        }
      ]
    },
    "天然系": {
      "description": "素で間違える、常識がズレているボケ",
      "techniques": [
        {
          "name": "単位の間違い",
          "example": "100円を100万円と勘違い",
          "difficulty": 2,
          "effectiveness": 0.8
        }
      ]
    }
  }
}
```

### 2. プロジェクト設定ファイル（project.json）

```json
{
  "version": "1.0.0",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "学校あるあるコント",
    "type": "conte",
    "created": "2024-01-15T10:00:00Z",
    "updated": "2024-01-20T15:30:00Z"
  },
  "settings": {
    "targetDuration": 300,
    "targetAudience": "general",
    "performanceDate": "2024-02-01",
    "venue": "お笑いライブハウス"
  },
  "preferences": {
    "preferredBokeTypes": ["天然系", "勘違い系"],
    "avoidPatterns": ["下ネタ", "時事ネタ"],
    "characterCount": 2
  },
  "statistics": {
    "totalScripts": 5,
    "totalAnalyses": 12,
    "averageScore": 75.5
  }
}
```

### 3. 分析結果フォーマット（analysis-result.json）

```json
{
  "analysisId": "analysis_20240120_153000",
  "scriptId": "script_001",
  "timestamp": "2024-01-20T15:30:00Z",
  "type": "comprehensive",
  "results": {
    "balance": {
      "bokeCount": 15,
      "tsukkomiCount": 14,
      "ratio": 1.07,
      "evaluation": "良好",
      "distribution": {
        "aruaru": 5,
        "arisou": 7,
        "nainai": 3
      }
    },
    "tempo": {
      "averageInterval": 12.5,
      "minInterval": 3,
      "maxInterval": 25,
      "evaluation": "やや早い",
      "suggestions": ["中盤で少し間を取ると効果的"]
    },
    "patterns": {
      "usedTypes": ["勘違い系", "天然系", "理屈系"],
      "repetitions": [
        {
          "type": "勘違い系",
          "count": 3,
          "consecutive": true,
          "position": "lines 10-15"
        }
      ],
      "diversity": 0.75
    },
    "flow": {
      "phases": [
        {
          "phase": 1,
          "intensity": 0.3,
          "description": "導入・あるあるで共感獲得"
        },
        {
          "phase": 2,
          "intensity": 0.6,
          "description": "中盤・ありそうで展開"
        },
        {
          "phase": 3,
          "intensity": 0.9,
          "description": "クライマックス・ないないで爆笑"
        }
      ],
      "peakTiming": 240,
      "overall": "良好な山場構成"
    }
  },
  "score": 82,
  "suggestions": [
    {
      "priority": "high",
      "category": "pattern",
      "message": "10-15行目で勘違い系が3連続しています。天然系や理屈系を挟むことを検討してください。"
    },
    {
      "priority": "medium",
      "category": "tempo",
      "message": "前半のテンポが少し早めです。観客が追いつけるよう、適度な間を入れましょう。"
    }
  ]
}
```

## データアクセスパターン

### 1. 知識ベースへのアクセス

```typescript
// ボケパターンの検索
interface BokeSearchParams {
  level?: 'aruaru' | 'arisou' | 'nainai';
  type?: string;
  contextTags?: string[];
  minEffectiveness?: number;
}

// シチュエーションとキャラクターの組み合わせ検証
interface CombinationCheck {
  situationId: number;
  characterIds: number[];
}
```

### 2. プロジェクトデータの操作

```typescript
// 台本要素の追加
interface AddScriptElement {
  scriptId: string;
  elementType: 'boke' | 'tsukkomi' | 'narration' | 'action';
  content: string;
  characterName?: string;
  patternId?: number;
}

// 分析の実行
interface RunAnalysis {
  scriptId: string;
  analysisTypes: ('balance' | 'tempo' | 'pattern' | 'comprehensive')[];
}
```

## インデックス設計方針

1. **頻繁に検索される列にインデックスを作成**
   - パターンのtype, level
   - プロジェクトのstatus
   - 履歴の日時

2. **結合で使用される外部キーにインデックス**
   - すべての外部キー列

3. **複合インデックスの活用**
   - (type, level) でのボケパターン検索
   - (project_id, created_at) での履歴検索

## データ整合性の保証

1. **外部キー制約**
   - 関連データの整合性を保証
   - カスケード削除は使用しない（明示的な削除のみ）

2. **CHECK制約**
   - 列挙型の値を制限
   - 数値範囲の検証

3. **トランザクション**
   - 複数テーブルへの操作は必ずトランザクション内で実行
   - エラー時は確実にロールバック

## パフォーマンス最適化

1. **適切なデータ型の選択**
   - IDにはUUIDを使用（分散環境での一意性保証）
   - 列挙型にはVARCHARとCHECK制約

2. **JSON列の活用**
   - 構造が可変的なデータはJSON形式で格納
   - SQLiteのJSON関数で効率的にクエリ

3. **正規化とのバランス**
   - 過度な正規化は避け、実用的なレベルに留める
   - 頻繁にアクセスされるデータは適度に非正規化