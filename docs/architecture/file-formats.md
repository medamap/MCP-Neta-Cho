# MCP-NETA-CHO ファイルフォーマット仕様書

## 概要

本文書では、MCP-NETA-CHOで使用される各種ファイルフォーマットの詳細仕様を定義します。すべてのファイルフォーマットは人間が読み書きしやすく、プログラムでも処理しやすい形式を採用しています。

## 1. 台本ファイル形式（.neta.md）

### 基本構造

台本ファイルはMarkdown形式を拡張した`.neta.md`拡張子を使用します。

```markdown
---
# フロントマター（YAML形式のメタデータ）
title: 授業中のあるある
type: conte
version: 1.2.0
created: 2024-01-15T10:00:00Z
updated: 2024-01-20T15:30:00Z
duration_estimate: 300
characters:
  - name: 太郎
    role: boke
    description: おっちょこちょいな生徒
  - name: 花子
    role: tsukkomi
    description: しっかり者の生徒
tags: [学校, あるある, 日常]
---

# 授業中のあるある

## シーン1：授業開始前

<!-- @stage-direction: 教室。太郎が慌てて入ってくる -->

**太郎**：（息を切らせて）ギリギリセーフ！
<!-- @boke: type="行動系" level="aruaru" -->

**花子**：全然セーフじゃないやん！もうチャイム鳴ってるし！
<!-- @tsukkomi: type="普通" intensity="5" -->

<!-- @timing: 5s -->

**太郎**：でも先生まだ来てないから大丈夫やろ？

**花子**：後ろ見てみ。

<!-- @stage-direction: 太郎が振り返ると先生が立っている -->

**太郎**：（固まって）...おはようございます。
<!-- @boke: type="天然系" level="arisou" -->

**花子**：もう1時間目やで！
<!-- @tsukkomi: type="普通" intensity="7" -->
```

### メタデータ仕様

#### 必須フィールド

- `title`: 台本のタイトル
- `type`: 台本の種類（`manzai` | `conte`）
- `version`: セマンティックバージョニング形式
- `created`: 作成日時（ISO 8601形式）
- `updated`: 更新日時（ISO 8601形式）

#### オプションフィールド

- `duration_estimate`: 推定上演時間（秒）
- `characters`: 登場人物リスト
- `tags`: タグリスト
- `performance_date`: 公演予定日
- `venue`: 公演会場
- `notes`: 作成者メモ

### アノテーション仕様

台本内で使用できる特殊コメント形式のアノテーション：

#### @boke
ボケを示すアノテーション

```markdown
<!-- @boke: type="勘違い系" level="aruaru" pattern_id="boke_001" -->
```

属性：
- `type`: ボケの種類
- `level`: ボケのレベル（`aruaru` | `arisou` | `nainai`）
- `pattern_id`: 使用したパターンID（オプション）

#### @tsukkomi
ツッコミを示すアノテーション

```markdown
<!-- @tsukkomi: type="ノリツッコミ" intensity="8" timing="delayed" -->
```

属性：
- `type`: ツッコミの種類
- `intensity`: 強度（1-10）
- `timing`: タイミング（`immediate` | `delayed` | `overlap`）

#### @stage-direction
ト書き・演出指示

```markdown
<!-- @stage-direction: 太郎が教室から飛び出していく -->
```

#### @timing
タイミング指示

```markdown
<!-- @timing: 3s -->
<!-- @timing: pause -->
<!-- @timing: beat -->
```

#### @note
作成者のメモ（エクスポート時に除外可能）

```markdown
<!-- @note: ここはもう少しテンポを上げた方が良いかも -->
```

### キャラクター記法

- `**キャラクター名**：` - セリフの開始
- `（アクション）` - キャラクターの動作
- `...` - 間を表現

## 2. プロジェクト設定ファイル（project.json）

### 構造仕様

```json
{
  "$schema": "https://mcp-neta-cho.dev/schemas/project-v1.json",
  "version": "1.0.0",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "学校あるあるコント集",
    "type": "conte",
    "description": "高校生活をテーマにしたコント集",
    "created": "2024-01-15T10:00:00Z",
    "updated": "2024-01-20T15:30:00Z",
    "author": {
      "name": "山田太郎",
      "email": "yamada@example.com"
    }
  },
  "settings": {
    "targetDuration": 300,
    "targetAudience": "10代後半〜20代前半",
    "performanceDate": "2024-02-01",
    "venue": "〇〇ライブハウス",
    "language": "ja",
    "dialect": "kansai"
  },
  "preferences": {
    "defaultCharacters": [
      {
        "name": "太郎",
        "role": "boke",
        "personality": "天然系"
      },
      {
        "name": "花子",
        "role": "tsukkomi",
        "personality": "しっかり者"
      }
    ],
    "preferredBokeTypes": ["天然系", "勘違い系"],
    "avoidPatterns": ["下ネタ", "政治ネタ"],
    "styleGuide": {
      "tempoPreference": "medium",
      "intensityRange": {
        "min": 3,
        "max": 8
      }
    }
  },
  "workspace": {
    "scriptsDirectory": "./scripts",
    "analysisDirectory": "./analysis",
    "exportsDirectory": "./exports",
    "backupDirectory": "./backups"
  },
  "statistics": {
    "totalScripts": 5,
    "totalAnalyses": 12,
    "totalExports": 3,
    "averageScore": 75.5,
    "lastAnalysis": "2024-01-20T15:00:00Z"
  },
  "metadata": {
    "customFields": {
      "team": "コントチームA",
      "season": "2024年春"
    }
  }
}
```

### フィールド詳細

#### project セクション
プロジェクトの基本情報

#### settings セクション
プロジェクト全体の設定

#### preferences セクション
作成時の好みや制約

#### workspace セクション
ファイルパスの設定

#### statistics セクション
統計情報（自動更新）

#### metadata セクション
カスタムフィールド

## 3. 分析結果ファイル（analysis-[timestamp].json）

### 構造仕様

```json
{
  "$schema": "https://mcp-neta-cho.dev/schemas/analysis-v1.json",
  "analysis": {
    "id": "analysis_20240120_150000",
    "scriptId": "script_001",
    "scriptVersion": "1.2.0",
    "timestamp": "2024-01-20T15:00:00Z",
    "duration": 245,
    "type": "comprehensive",
    "engine_version": "1.0.0"
  },
  "results": {
    "score": {
      "overall": 82,
      "breakdown": {
        "balance": 85,
        "tempo": 78,
        "variety": 80,
        "flow": 84
      }
    },
    "balance": {
      "elements": {
        "total": 29,
        "boke": 15,
        "tsukkomi": 14
      },
      "ratio": 1.07,
      "evaluation": "良好",
      "distribution": {
        "levels": {
          "aruaru": {
            "count": 5,
            "percentage": 33.3
          },
          "arisou": {
            "count": 7,
            "percentage": 46.7
          },
          "nainai": {
            "count": 3,
            "percentage": 20.0
          }
        },
        "types": {
          "勘違い系": 4,
          "天然系": 6,
          "理屈系": 3,
          "価値観系": 2
        }
      }
    },
    "tempo": {
      "segments": [
        {
          "start": 0,
          "end": 60,
          "avgInterval": 8.5,
          "evaluation": "やや早い"
        },
        {
          "start": 60,
          "end": 180,
          "avgInterval": 12.3,
          "evaluation": "適切"
        },
        {
          "start": 180,
          "end": 245,
          "avgInterval": 15.2,
          "evaluation": "やや遅い"
        }
      ],
      "overall": {
        "avgInterval": 12.1,
        "variance": 3.2,
        "consistency": 0.75
      }
    },
    "patterns": {
      "usage": [
        {
          "type": "勘違い系",
          "positions": [10, 25, 40, 55],
          "clustering": "分散"
        },
        {
          "type": "天然系",
          "positions": [15, 30, 45, 60, 75, 90],
          "clustering": "均等"
        }
      ],
      "repetitions": [
        {
          "type": "勘違い系",
          "consecutive": 2,
          "position": "lines 40-45",
          "severity": "minor"
        }
      ],
      "diversity_score": 0.78
    },
    "flow": {
      "intensity_curve": [
        {"time": 0, "intensity": 0.2},
        {"time": 30, "intensity": 0.3},
        {"time": 60, "intensity": 0.5},
        {"time": 90, "intensity": 0.6},
        {"time": 120, "intensity": 0.7},
        {"time": 150, "intensity": 0.8},
        {"time": 180, "intensity": 0.9},
        {"time": 210, "intensity": 0.95},
        {"time": 240, "intensity": 0.85}
      ],
      "peaks": [
        {
          "time": 210,
          "intensity": 0.95,
          "element": "大ボケ：瞬間移動の練習"
        }
      ],
      "evaluation": "良好な山場構成"
    }
  },
  "insights": {
    "strengths": [
      "レベルの段階的な上昇が効果的",
      "ボケとツッコミのバランスが良好",
      "クライマックスへの盛り上がりが自然"
    ],
    "improvements": [
      "序盤のテンポがやや早い",
      "中盤で勘違い系が連続している",
      "終盤にもう一つ山場があると効果的"
    ],
    "suggestions": [
      {
        "priority": "high",
        "category": "tempo",
        "message": "序盤（0-60秒）で2-3箇所、短い間を入れることを検討してください",
        "specific_positions": [25, 45]
      },
      {
        "priority": "medium",
        "category": "variety",
        "message": "40-45行目の勘違い系の間に、天然系か理屈系を挟むと変化が出ます"
      },
      {
        "priority": "low",
        "category": "structure",
        "message": "230秒あたりにもう一つ小さな山場を作ると、より印象的な構成になります"
      }
    ]
  },
  "visualization": {
    "tempo_chart": "base64_encoded_image_data...",
    "flow_chart": "base64_encoded_image_data...",
    "pattern_distribution": "base64_encoded_image_data..."
  },
  "metadata": {
    "processing_time": 456,
    "warnings": [],
    "notes": "初回分析"
  }
}
```

## 4. エクスポートフォーマット

### 4.1 印刷用フォーマット（.print.md）

```markdown
# 授業中のあるある
制作：山田太郎  
上演時間：約5分  
登場人物：太郎（ボケ）、花子（ツッコミ）

---

## 本編

**太郎**　（息を切らせて）ギリギリセーフ！

**花子**　全然セーフじゃないやん！もうチャイム鳴ってるし！

（間）

**太郎**　でも先生まだ来てないから大丈夫やろ？

**花子**　後ろ見てみ。

（太郎が振り返ると先生が立っている）

**太郎**　（固まって）...おはようございます。

**花子**　もう1時間目やで！

---

公演日：2024年2月1日  
会場：〇〇ライブハウス
```

### 4.2 練習用フォーマット（.practice.txt）

```text
========================================
授業中のあるある - 練習用台本
========================================

[シーン1：授業開始前]
場所：教室

太郎：（息を切らせて）ギリギリセーフ！
      ↓ ボケ：あるある・行動系

花子：全然セーフじゃないやん！もうチャイム鳴ってるし！
      ↓ ツッコミ：普通・強度5

--- 間（5秒） ---

太郎：でも先生まだ来てないから大丈夫やろ？

花子：後ろ見てみ。

※ 動作：太郎が振り返ると先生が立っている

太郎：（固まって）...おはようございます。
      ↓ ボケ：ありそう・天然系

花子：もう1時間目やで！
      ↓ ツッコミ：普通・強度7
```

### 4.3 分析レポート用フォーマット（.report.html）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>分析レポート - 授業中のあるある</title>
    <style>
        /* スタイルシート省略 */
    </style>
</head>
<body>
    <h1>台本分析レポート</h1>
    <div class="summary">
        <h2>概要</h2>
        <dl>
            <dt>タイトル</dt>
            <dd>授業中のあるある</dd>
            <dt>総合スコア</dt>
            <dd>82点</dd>
            <dt>分析日時</dt>
            <dd>2024年1月20日 15:00</dd>
        </dl>
    </div>
    
    <div class="charts">
        <h2>可視化</h2>
        <img src="data:image/png;base64,..." alt="盛り上がり曲線">
        <img src="data:image/png;base64,..." alt="パターン分布">
    </div>
    
    <!-- 詳細な分析結果 -->
</body>
</html>
```

## 5. データ交換フォーマット

### 5.1 インポート/エクスポート用JSON

```json
{
  "$schema": "https://mcp-neta-cho.dev/schemas/exchange-v1.json",
  "format_version": "1.0.0",
  "export_date": "2024-01-20T15:00:00Z",
  "project": {
    "name": "学校あるあるコント集",
    "type": "conte",
    "metadata": {}
  },
  "scripts": [
    {
      "id": "script_001",
      "title": "授業中のあるある",
      "content": "...",
      "metadata": {},
      "analyses": []
    }
  ],
  "custom_patterns": [],
  "settings": {}
}
```

### 5.2 バックアップフォーマット

```json
{
  "$schema": "https://mcp-neta-cho.dev/schemas/backup-v1.json",
  "backup": {
    "version": "1.0.0",
    "date": "2024-01-20T15:00:00Z",
    "type": "full",
    "compression": "gzip"
  },
  "data": {
    "projects": [],
    "scripts": [],
    "analyses": [],
    "history": [],
    "settings": {}
  },
  "checksum": "sha256:..."
}
```

## 6. 設定ファイル

### 6.1 グローバル設定（~/.mcp-neta-cho/config.json）

```json
{
  "version": "1.0.0",
  "user": {
    "name": "山田太郎",
    "email": "yamada@example.com",
    "language": "ja",
    "dialect": "kansai"
  },
  "defaults": {
    "projectType": "conte",
    "targetDuration": 300,
    "exportFormat": "markdown"
  },
  "paths": {
    "workspace": "~/Documents/mcp-neta-cho",
    "templates": "~/.mcp-neta-cho/templates",
    "knowledgeBase": "~/.mcp-neta-cho/knowledge"
  },
  "ui": {
    "theme": "light",
    "editor": "vscode",
    "autoSave": true,
    "autoAnalyze": false
  },
  "advanced": {
    "cacheSize": 100,
    "analysisTimeout": 30000,
    "debugMode": false
  }
}
```

## 7. バリデーション

### JSONスキーマ

すべてのJSONファイルは対応するJSONスキーマで検証されます：

- `project-v1.json` - プロジェクト設定
- `analysis-v1.json` - 分析結果
- `exchange-v1.json` - データ交換
- `backup-v1.json` - バックアップ

### Markdownバリデーション

台本ファイルは以下の項目をチェック：

1. フロントマターの必須フィールド
2. アノテーションの構文
3. キャラクター記法の一貫性
4. 構造の整合性

## 8. 互換性

### バージョン互換性

- 同一メジャーバージョン内では後方互換性を保証
- マイナーバージョンアップでは機能追加のみ
- メジャーバージョンアップでは変換ツールを提供

### 他ツールとの連携

- 標準的なMarkdownエディタで編集可能
- JSONファイルは標準フォーマット
- エクスポート機能で各種形式に対応