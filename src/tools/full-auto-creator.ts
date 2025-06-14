import * as fs from 'fs/promises';
import * as path from 'path';

interface FullAutoRequest {
  theme: string;
  genre: 'manzai' | 'conte';
  concept?: string;
  duration?: string;
  targetAudience?: string;
  specialRequests?: string;
}

interface AutoCreationState {
  id: string;
  request: FullAutoRequest;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  results: {
    webResearch?: any;
    bokeCollection?: string[];
    categorizedBokes?: any;
    sequence?: any;
    script?: string;
    evaluation?: any;
  };
  createdAt: string;
  completedAt?: string;
}

export async function requestFullAuto(
  theme: string,
  genre: 'manzai' | 'conte',
  concept?: string,
  duration?: string,
  targetAudience?: string,
  specialRequests?: string
) {
  const request: FullAutoRequest = {
    theme,
    genre,
    concept,
    duration,
    targetAudience,
    specialRequests
  };

  return {
    content: [{
      type: 'text',
      text: `🤖 **フルオート台本作成モード**

**⚠️ 重要な確認事項 ⚠️**

このモードを実行すると、以下のことが**自動的に**行われます：

## 🔄 自動実行される処理

### 1. **Web調査フェーズ（5-10分）**
- テーマ「${theme}」に関するネタをインターネットで収集
- あるある、体験談、エピソードを自動検索
- 収集したデータからボケ候補を自動抽出

### 2. **ネタ作成フェーズ（3-5分）**
- 収集した情報を基にボケを15-20個自動生成
- 「あるある」「ありそう」「ないない」に自動分類
- バランス調整とクオリティチェック

### 3. **構成設計フェーズ（2-3分）**
- 最適なボケの順序を理論に基づいて決定
- 各ボケに最適なツッコミを自動選択
- 起承転結の構成を自動設計

### 4. **台本生成フェーズ（2-3分）**
- ト書き付きの完全な台本を自動作成
- キャラクター設定、シチュエーション設定
- タイミングや演出指示も含めて完成

### 5. **評価・改善フェーズ（1-2分）**
- 理論に基づく品質評価
- 改善提案の自動生成
- 最終調整

## 📋 あなたの指定内容
- **テーマ**: ${theme}
- **ジャンル**: ${genre}
${concept ? `- **コンセプト**: ${concept}` : ''}
${duration ? `- **想定時間**: ${duration}` : ''}
${targetAudience ? `- **対象観客**: ${targetAudience}` : ''}
${specialRequests ? `- **特別要望**: ${specialRequests}` : ''}

## ⏱️ 予想所要時間
**合計: 約15-25分**

## 🚨 注意事項
- **この間、あなたの介入は不要です**
- **MCPが全自動で台本を完成させます**
- **完成後に内容を確認・修正が可能です**
- **全プロセスが記録され、後で参照できます**

---

**このフルオート機能を使用しますか？**

- **「はい」** → 自動作成を開始
- **「いいえ」** → 通常のウィザードモードを使用
- **「設定変更」** → 上記の設定を修正

どちらか選択してください。`
    }]
  };
}

export async function startFullAutoCreation(confirmed: boolean, request: FullAutoRequest) {
  if (!confirmed) {
    return {
      content: [{
        type: 'text',
        text: '❌ フルオート作成をキャンセルしました。通常のウィザードモードをご利用ください。'
      }]
    };
  }

  // 作業ディレクトリとIDの作成
  const sessionId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  
  await fs.mkdir(workDir, { recursive: true });

  const initialState: AutoCreationState = {
    id: sessionId,
    request,
    status: 'in_progress',
    currentStep: 0,
    totalSteps: 5,
    results: {},
    createdAt: new Date().toISOString()
  };

  // 状態ファイルを保存
  await fs.writeFile(
    path.join(workDir, 'session.json'),
    JSON.stringify(initialState, null, 2)
  );

  return {
    content: [{
      type: 'text',
      text: `🚀 **フルオート台本作成を開始しました！**

**セッションID**: \`${sessionId}\`

## 📊 進行状況
\`\`\`
ステップ 0/5: 準備完了 ✅
\`\`\`

**次の処理が自動的に実行されます：**

1. **Web調査開始** - \`auto_step_1_research\` を実行してください
2. **ボケ生成** - \`auto_step_2_generate\` を実行してください  
3. **構成設計** - \`auto_step_3_compose\` を実行してください
4. **台本作成** - \`auto_step_4_script\` を実行してください
5. **評価完了** - \`auto_step_5_evaluate\` を実行してください

**手動実行が必要な理由：**
MCP環境では完全自動実行に制限があるため、各ステップを順番に手動で実行していただく必要があります。

**開始方法：**
\`\`\`
auto_step_1_research sessionId: "${sessionId}"
\`\`\`

進捗は \`check_auto_progress\` で確認できます。`
    }]
  };
}


async function simulateWebResearch(theme: string) {
  // 実際のWeb検索のシミュレーション
  const sampleEpisodes = generateSampleEpisodes(theme);
  
  return {
    theme,
    sourcesCount: 12,
    searchQueries: [
      `${theme} あるある`,
      `${theme} 体験談 面白い`,
      `${theme} エピソード 笑える`
    ],
    episodes: sampleEpisodes,
    categories: {
      aruaru: sampleEpisodes.filter(e => e.category === 'aruaru').length,
      episodes: sampleEpisodes.filter(e => e.category === 'episodes').length,
      funny: sampleEpisodes.filter(e => e.category === 'funny').length
    },
    collectedAt: new Date().toISOString()
  };
}

function generateSampleEpisodes(theme: string) {
  const templates: Record<string, Array<{text: string, category: string}>> = {
    'カーナビ': [
      { text: 'カーナビが「右です」って言うから右折したら、民家の駐車場だった', category: 'aruaru' },
      { text: 'カーナビの音声が関西弁で「そこ曲がってんか〜」って言われた', category: 'funny' },
      { text: '目的地に着いたのにカーナビが「お疲れ様でした」って丁寧に挨拶してきた', category: 'episodes' },
      { text: 'カーナビが故障して宇宙の座標を案内し始めた', category: 'nainai' }
    ],
    'コンビニ': [
      { text: 'レジで「温めますか？」って聞かれて、アイスクリームだった', category: 'aruaru' },
      { text: 'コンビニ店員が商品の場所を聞かれて一緒に探し回ってくれた', category: 'episodes' },
      { text: '深夜のコンビニで店員が客より眠そうにしてる', category: 'funny' }
    ]
  };
  
  return templates[theme] || [
    { text: `${theme}でよくあること`, category: 'aruaru' },
    { text: `${theme}での面白い体験`, category: 'episodes' }
  ];
}

export async function checkAutoProgress(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    const stepNames = [
      '準備', 'Web調査', 'ボケ生成', '構成設計', '台本作成', '評価完了'
    ];
    
    let progressBar = '';
    for (let i = 0; i <= 5; i++) {
      if (i <= state.currentStep) {
        progressBar += '✅ ';
      } else {
        progressBar += '⬜ ';
      }
      progressBar += stepNames[i];
      if (i < 5) progressBar += ' → ';
    }
    
    return {
      content: [{
        type: 'text',
        text: `📊 **フルオート作成進捗確認**

**セッションID**: \`${sessionId}\`
**ステータス**: ${state.status}
**進行状況**: ${state.currentStep}/${state.totalSteps}

## 📈 進捗バー
${progressBar}

**作成開始**: ${new Date(state.createdAt).toLocaleString()}
${state.completedAt ? `**完了時刻**: ${new Date(state.completedAt).toLocaleString()}` : ''}

## 📋 次のアクション
${getNextAction(state.currentStep, sessionId)}

**セッション情報は \`${workDir}\` に保存されています。**`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ セッション情報が見つかりません: ${error}`
      }]
    };
  }
}

function getNextAction(currentStep: number, sessionId: string): string {
  const actions = [
    `\`auto_step_1_research sessionId: "${sessionId}"\` - Web調査を開始`,
    `\`auto_step_2_generate sessionId: "${sessionId}"\` - ボケ生成を開始`, 
    `\`auto_step_3_compose sessionId: "${sessionId}"\` - 構成設計を開始`,
    `\`auto_step_4_script sessionId: "${sessionId}"\` - 台本作成を開始`,
    `\`auto_step_5_evaluate sessionId: "${sessionId}"\` - 評価を開始`,
    `\`view_completed_script sessionId: "${sessionId}"\` - 完成した台本を確認`
  ];
  
  if (currentStep < actions.length - 1) {
    return actions[currentStep];
  } else {
    return '🎉 全ステップ完了！完成した台本をご確認ください。';
  }
}

export async function listAutoSessions() {
  const sessionsDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions');
  
  try {
    const sessions = await fs.readdir(sessionsDir);
    
    if (sessions.length === 0) {
      return {
        content: [{
          type: 'text',
          text: '📂 **自動作成セッション一覧**\n\n現在保存されているセッションはありません。'
        }]
      };
    }
    
    let output = '📂 **自動作成セッション一覧**\n\n';
    
    for (const sessionId of sessions) {
      try {
        const sessionPath = path.join(sessionsDir, sessionId, 'session.json');
        const data = await fs.readFile(sessionPath, 'utf-8');
        const state: AutoCreationState = JSON.parse(data);
        
        const statusEmoji = {
          'pending': '⏳',
          'in_progress': '🔄', 
          'completed': '✅',
          'error': '❌'
        }[state.status] || '❓';
        
        output += `${statusEmoji} **${sessionId}**\n`;
        output += `   - テーマ: ${state.request.theme}\n`;
        output += `   - ジャンル: ${state.request.genre}\n`;
        output += `   - 進捗: ${state.currentStep}/${state.totalSteps}\n`;
        output += `   - 作成日: ${new Date(state.createdAt).toLocaleString()}\n`;
        if (state.completedAt) {
          output += `   - 完了日: ${new Date(state.completedAt).toLocaleString()}\n`;
        }
        output += '\n';
      } catch {
        output += `❓ **${sessionId}** (情報読み取りエラー)\n\n`;
      }
    }
    
    output += '**使用方法:**\n';
    output += '- 進捗確認: `check_auto_progress sessionId: "セッションID"`\n';
    output += '- 台本確認: `view_completed_script sessionId: "セッションID"`\n';
    
    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ セッション一覧の取得に失敗しました: ${error}`
      }]
    };
  }
}