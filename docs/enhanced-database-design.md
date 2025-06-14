# MCP-NETA-CHO 強化版データベース設計

## 学習理論を基にした設計思想

### 新たに学んだ重要な理論
1. **4つの基本パターン理論** (①日常×日常 ②日常×非日常 ③非日常×日常 ④非日常×非日常【禁止】)
2. **笑いの4要素** (フリ・ボケ・ツッコミ・オチ)
3. **ボケの3段階理論** (あるある・ありそう・ないない)
4. **3W-1H構造** (When・Where・Who・How)
5. **季節設定の重要性**
6. **「間」の概念**

---

## 強化版データベース構造

### 1. パターン分類テーブル（新規追加）
```sql
CREATE TABLE pattern_types (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- '日常×日常', '日常×非日常', '非日常×日常'
    description TEXT,
    is_allowed BOOLEAN DEFAULT TRUE, -- ④パターンは FALSE
    success_rate FLOAT,
    difficulty_level INTEGER, -- 1-5 (1:簡単, 5:高難度)
    recommended_for_beginners BOOLEAN DEFAULT FALSE
);
```

### 2. 強化されたシチュエーションテーブル
```sql
CREATE TABLE situations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_realistic BOOLEAN NOT NULL, -- 日常/非日常の判定
    genre VARCHAR(50), -- '学校', '病院', '職場', '家庭', '宇宙', '魔法世界'
    season VARCHAR(20), -- '春', '夏', '秋', '冬', '通年'
    
    -- 3W-1H構造
    when_setting TEXT, -- いつの設定か
    where_detail TEXT, -- 詳細な場所設定
    situation_constraints TEXT, -- その状況の制約や特徴
    
    -- パターン分類
    pattern_type_id INTEGER,
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT,
    
    FOREIGN KEY (pattern_type_id) REFERENCES pattern_types(id)
);
```

### 3. 強化された登場人物テーブル
```sql
CREATE TABLE characters (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    is_realistic BOOLEAN NOT NULL, -- 普通の人/特殊キャラの判定
    personality_type VARCHAR(50), -- 'オタク', '先生', '生徒', '宇宙人'
    
    -- キャラクター特徴
    characteristic_tags TEXT, -- 'メガネ,チェックシャツ,早口' など
    typical_reactions TEXT, -- 典型的な反応パターン
    speech_pattern TEXT, -- 話し方の特徴
    
    -- 相性・関係性
    compatible_characters TEXT, -- 相性の良い相手のID一覧
    relationship_types TEXT, -- '先輩後輩', '先生生徒', '店員客'
    
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT
);
```

### 4. ボケパターンテーブル（大幅強化）
```sql
CREATE TABLE boke_patterns (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    
    -- ボケの分類
    boke_type VARCHAR(50) NOT NULL, -- '勘違い系', '天然系', '理屈系', '価値観系', '行動系', '言語系'
    boke_level VARCHAR(20) NOT NULL, -- 'あるある', 'ありそう', 'ないない'
    
    -- 設定・人物との関連
    situation_id INTEGER,
    character_id INTEGER,
    pattern_type_id INTEGER,
    
    -- 3W-1H詳細
    when_timing TEXT, -- どのタイミングで使うか
    where_context TEXT, -- どんな場所で効果的か
    who_suitable TEXT, -- どんなキャラクターに適しているか
    how_delivery TEXT, -- どのように演じるか
    
    -- 効果・統計
    ma_timing INTEGER, -- 「間」の長さ（ミリ秒）
    expected_reaction VARCHAR(50), -- 'クスッ', '声出し笑い', '爆笑'
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT,
    
    FOREIGN KEY (situation_id) REFERENCES situations(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    FOREIGN KEY (pattern_type_id) REFERENCES pattern_types(id)
);
```

### 5. ツッコミパターンテーブル（強化）
```sql
CREATE TABLE tsukkomi_patterns (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    
    -- ツッコミの分類
    tsukkomi_type VARCHAR(50) NOT NULL, -- '普通', 'ノリツッコミ', 'ボケ殺し', '例えツッコミ', 'フリ返し'
    intensity INTEGER NOT NULL, -- 1-10（ツッコミの強さ）
    
    -- 対応するボケとの関係
    suitable_boke_types TEXT, -- どのボケタイプに適しているか
    suitable_boke_levels TEXT, -- どのボケレベルに適しているか
    
    -- タイミング・演技
    timing_after_boke INTEGER, -- ボケの後何ミリ秒で入るか
    delivery_style TEXT, -- 演技のスタイル
    
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT
);
```

### 6. 笑いの要素管理テーブル（新規）
```sql
CREATE TABLE warai_elements (
    id INTEGER PRIMARY KEY,
    element_type VARCHAR(20) NOT NULL, -- 'フリ', 'ボケ', 'ツッコミ', 'オチ'
    content TEXT NOT NULL,
    sequence_order INTEGER, -- 順序
    duration_seconds INTEGER, -- 持続時間
    ma_before INTEGER, -- 前の間（ミリ秒）
    ma_after INTEGER, -- 後の間（ミリ秒）
    
    composition_id INTEGER,
    FOREIGN KEY (composition_id) REFERENCES neta_compositions(id)
);
```

### 7. 強化されたネタ構成テーブル
```sql
CREATE TABLE neta_compositions (
    id INTEGER PRIMARY KEY,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 基本設定
    situation_id INTEGER,
    pattern_type_id INTEGER,
    season VARCHAR(20),
    
    -- 3W-1H情報
    when_setting TEXT,
    where_setting TEXT,
    who_characters TEXT, -- 登場人物のID一覧
    how_development TEXT,
    
    -- 構成分析
    total_duration INTEGER, -- 総時間（秒）
    boke_count INTEGER DEFAULT 0,
    tsukkomi_count INTEGER DEFAULT 0,
    aru_aru_count INTEGER DEFAULT 0, -- あるあるボケの数
    ari_sou_count INTEGER DEFAULT 0, -- ありそうボケの数
    nai_nai_count INTEGER DEFAULT 0, -- ないないボケの数
    
    -- バランス評価
    balance_score FLOAT, -- バランススコア
    tempo_score FLOAT, -- テンポスコア
    pattern_variety_score FLOAT, -- パターン多様性スコア
    
    -- 実績
    performance_count INTEGER DEFAULT 0,
    audience_reaction_score FLOAT,
    success_rate FLOAT,
    
    FOREIGN KEY (situation_id) REFERENCES situations(id),
    FOREIGN KEY (pattern_type_id) REFERENCES pattern_types(id)
);
```

### 8. 季節別推奨設定テーブル（新規）
```sql
CREATE TABLE seasonal_settings (
    id INTEGER PRIMARY KEY,
    season VARCHAR(20) NOT NULL, -- '春', '夏', '秋', '冬'
    setting_name VARCHAR(100),
    setting_description TEXT,
    character_suggestions TEXT,
    timing_notes TEXT, -- その季節での最適なタイミング
    success_examples TEXT, -- 成功例
    usage_frequency INTEGER DEFAULT 0
);
```

### 9. パターン相性テーブル（新規）
```sql
CREATE TABLE pattern_compatibility (
    id INTEGER PRIMARY KEY,
    situation_type VARCHAR(50), -- 日常/非日常
    character_type VARCHAR(50), -- 日常/非日常
    pattern_name VARCHAR(100),
    compatibility_score FLOAT, -- 1.0-5.0
    risk_level INTEGER, -- 1-5 (5が最も危険)
    beginner_safe BOOLEAN DEFAULT TRUE,
    warning_message TEXT -- ④パターンの場合の警告文
);
```

### 10. 構成分析結果テーブル（新規）
```sql
CREATE TABLE composition_analysis (
    id INTEGER PRIMARY KEY,
    composition_id INTEGER,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- バランス分析
    pattern_distribution TEXT, -- ボケパターンの分布（JSON）
    level_distribution TEXT, -- あるある/ありそう/ないないの分布
    timing_analysis TEXT, -- テンポ分析結果
    
    -- 問題点
    warning_issues TEXT, -- 問題点のリスト
    improvement_suggestions TEXT, -- 改善提案
    
    -- スコア
    overall_score FLOAT,
    balance_score FLOAT,
    variety_score FLOAT,
    tempo_score FLOAT,
    
    FOREIGN KEY (composition_id) REFERENCES neta_compositions(id)
);
```

---

## 初期データの挿入例

### パターン分類の初期データ
```sql
INSERT INTO pattern_types (name, description, is_allowed, difficulty_level, recommended_for_beginners) VALUES
('日常×日常', '最も安全で理解しやすいパターン', TRUE, 1, TRUE),
('日常×非日常', '設定は身近、キャラクターが特殊', TRUE, 2, TRUE),
('非日常×日常', '設定は特殊、キャラクターは普通', TRUE, 3, FALSE),
('非日常×非日常', '観客が理解できない禁止パターン', FALSE, 5, FALSE);
```

### 季節設定の初期データ
```sql
INSERT INTO seasonal_settings (season, setting_name, setting_description, character_suggestions) VALUES
('春', '入学式', '新入生と先輩の出会い', '新入生,先輩,先生'),
('春', '花見', '桜の下でのひととき', '会社員,家族,友人グループ'),
('夏', '海水浴', '海での一日', '学生,家族連れ,ライフセーバー'),
('秋', '文化祭', '学校の年間行事', '学生,先生,保護者'),
('冬', 'クリスマス', '年末の特別な時期', 'カップル,家族,サンタクロース');
```

---

## 新機能への対応

### 1. ④パターン検出・警告機能
- pattern_compatibility テーブルで危険度チェック
- 非日常×非日常の組み合わせを自動検出
- 警告メッセージの表示

### 2. 3W-1H構造分析
- 各テーブルにWhen/Where/Who/How項目を追加
- 構造の完全性をチェック
- 不足要素の指摘

### 3. 季節別最適化
- seasonal_settings テーブルで季節ごとの推奨
- 時期に応じた設定提案
- 観客の共感度向上

### 4. バランス分析の高度化
- ボケレベル分布の分析
- パターン多様性のチェック
- テンポ・間の分析

### 5. 成功パターン学習
- 実際の芸人データの分析結果を蓄積
- パターン別成功率の統計
- 推奨設定の自動生成

---

## 実装優先順位

1. **基本テーブルの作成** - pattern_types, 強化版situations, characters
2. **パターン検証機能** - ④パターンの自動検出・警告
3. **3W-1H分析** - 構造の完全性チェック
4. **季節別推奨** - 時期に応じた設定提案
5. **高度な分析機能** - バランス・テンポ・間の分析

この設計により、学習した理論を完全にシステム化し、実用的なコント作成支援ツールとして機能します。