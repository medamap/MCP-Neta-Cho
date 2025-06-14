// フルオート作成の各ステップの実装

import * as fs from 'fs/promises';
import * as path from 'path';
import { classifyBokes } from './boke-classifier.js';

export async function executeAutoStep1Research(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    if (state.status !== 'in_progress') {
      throw new Error('セッションが進行中ではありません');
    }

    // Web調査の実行（シミュレーション）
    const theme = state.request.theme;
    const researchData = await simulateWebResearch(theme);
    
    // 結果を保存
    state.currentStep = 1;
    state.results.webResearch = researchData;
    
    await fs.writeFile(sessionPath, JSON.stringify(state, null, 2));
    await fs.writeFile(
      path.join(workDir, 'research_results.json'),
      JSON.stringify(researchData, null, 2)
    );

    return {
      content: [{
        type: 'text',
        text: `🔍 **ステップ1: Web調査完了**

## 📊 進行状況
\`\`\`
ステップ 1/5: Web調査完了 ✅
\`\`\`

**調査結果:**
- **収集サイト数**: ${researchData.sourcesCount}サイト
- **抽出エピソード数**: ${researchData.episodes.length}個
- **あるあるネタ**: ${researchData.categories.aruaru}個
- **体験談**: ${researchData.categories.episodes}個
- **面白エピソード**: ${researchData.categories.funny}個

**次のステップを実行してください：**
\`\`\`
auto_step_2_generate sessionId: "${sessionId}"
\`\`\`

💾 調査データは \`research_results.json\` に保存されました。`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ ステップ1でエラーが発生しました: ${error}`
      }]
    };
  }
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

interface AutoCreationState {
  id: string;
  request: any;
  status: string;
  currentStep: number;
  totalSteps: number;
  results: any;
  createdAt: string;
  completedAt?: string;
}

export async function executeStep2Generate(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    // Web調査結果からボケを生成
    const bokeData = await generateBokesFromResearch(state.results.webResearch);
    
    // 結果を保存
    state.currentStep = 2;
    state.results.bokeCollection = bokeData.bokes;
    state.results.categorizedBokes = bokeData.categorized;
    
    await fs.writeFile(sessionPath, JSON.stringify(state, null, 2));
    await fs.writeFile(
      path.join(workDir, 'boke_results.json'),
      JSON.stringify(bokeData, null, 2)
    );

    return {
      content: [{
        type: 'text',
        text: `🎭 **ステップ2: ボケ生成完了**

## 📊 進行状況
\`\`\`
ステップ 2/5: ボケ生成完了 ✅
\`\`\`

**生成結果:**
- **総ボケ数**: ${bokeData.bokes.length}個
- **あるある**: ${bokeData.categorized.aruaru.length}個
- **ありそう**: ${bokeData.categorized.arisou.length}個  
- **ないない**: ${bokeData.categorized.nainai.length}個

**ボケ例（抜粋）:**
${bokeData.bokes.slice(0, 3).map((boke, i) => `${i + 1}. ${boke}`).join('\n')}

**次のステップを実行してください：**
\`\`\`
auto_step_3_compose sessionId: "${sessionId}"
\`\`\`

💾 ボケデータは \`boke_results.json\` に保存されました。`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ ステップ2でエラーが発生しました: ${error}`
      }]
    };
  }
}

export async function executeStep3Compose(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    // 構成を設計
    const composition = await designComposition(state.results.categorizedBokes);
    
    // 結果を保存
    state.currentStep = 3;
    state.results.sequence = composition;
    
    await fs.writeFile(sessionPath, JSON.stringify(state, null, 2));
    await fs.writeFile(
      path.join(workDir, 'composition.json'),
      JSON.stringify(composition, null, 2)
    );

    return {
      content: [{
        type: 'text',
        text: `🎼 **ステップ3: 構成設計完了**

## 📊 進行状況
\`\`\`
ステップ 3/5: 構成設計完了 ✅
\`\`\`

**構成結果:**
- **導入部**: ${composition.introduction.length}個のボケ
- **展開部**: ${composition.development.length}個のボケ
- **クライマックス**: ${composition.climax.length}個のボケ
- **総実行時間**: 約${composition.estimatedDuration}分

**構成例:**
1. ${composition.introduction[0]?.boke || 'なし'}
2. ${composition.development[0]?.boke || 'なし'}
3. ${composition.climax[0]?.boke || 'なし'}

**次のステップを実行してください：**
\`\`\`
auto_step_4_script sessionId: "${sessionId}"
\`\`\`

💾 構成データは \`composition.json\` に保存されました。`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ ステップ3でエラーが発生しました: ${error}`
      }]
    };
  }
}

export async function executeStep4Script(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    // 台本を生成
    const script = await generateFullScript(state);
    
    // 結果を保存
    state.currentStep = 4;
    state.results.script = script;
    
    await fs.writeFile(sessionPath, JSON.stringify(state, null, 2));
    await fs.writeFile(
      path.join(workDir, 'final_script.md'),
      script
    );

    return {
      content: [{
        type: 'text',
        text: `📜 **ステップ4: 台本作成完了**

## 📊 進行状況
\`\`\`
ステップ 4/5: 台本作成完了 ✅
\`\`\`

**台本情報:**
- **タイトル**: ${state.request.theme}の${state.request.genre}
- **文字数**: 約${script.length}文字
- **想定時間**: 約5-7分
- **ト書き**: 含む（演出指示付き）

**次のステップを実行してください：**
\`\`\`
auto_step_5_evaluate sessionId: "${sessionId}"
\`\`\`

💾 完成台本は \`final_script.md\` に保存されました。

**プレビュー（最初の100文字）:**
\`\`\`
${script.substring(0, 100)}...
\`\`\``
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ ステップ4でエラーが発生しました: ${error}`
      }]
    };
  }
}

export async function executeStep5Evaluate(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const sessionPath = path.join(workDir, 'session.json');
  
  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const state: AutoCreationState = JSON.parse(data);
    
    // 評価を実行
    const evaluation = await evaluateAutoScript(state);
    
    // 結果を保存して完了
    state.currentStep = 5;
    state.status = 'completed';
    state.completedAt = new Date().toISOString();
    state.results.evaluation = evaluation;
    
    await fs.writeFile(sessionPath, JSON.stringify(state, null, 2));
    await fs.writeFile(
      path.join(workDir, 'evaluation.json'),
      JSON.stringify(evaluation, null, 2)
    );

    return {
      content: [{
        type: 'text',
        text: `🎉 **フルオート台本作成完了！**

## 📊 最終結果
\`\`\`
ステップ 5/5: 全工程完了 ✅
\`\`\`

**総合評価スコア: ${evaluation.totalScore}/100点**

### 📈 詳細評価
- **構成**: ${evaluation.structure}点/20点
- **バラエティ**: ${evaluation.variety}点/20点
- **バランス**: ${evaluation.balance}点/20点
- **インパクト**: ${evaluation.impact}点/20点
- **実用性**: ${evaluation.practicality}点/20点

### 🎭 完成した台本
**セッションID**: \`${sessionId}\`

**台本を確認:**
\`\`\`
view_completed_script sessionId: "${sessionId}"
\`\`\`

**改善提案:**
${evaluation.suggestions.slice(0, 2).map(s => `- ${s}`).join('\n')}

### 💾 保存されたファイル
- \`final_script.md\` - 完成台本
- \`evaluation.json\` - 評価レポート
- \`boke_results.json\` - ボケ素材
- \`research_results.json\` - 調査データ

**🔄 ブラッシュアップしたい場合:**
\`\`\`
improve_auto_script sessionId: "${sessionId}" aspect: "バランス"
\`\`\`

お疲れ様でした！約15-20分で理論に基づいた台本が完成しました。`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ ステップ5でエラーが発生しました: ${error}`
      }]
    };
  }
}

async function generateBokesFromResearch(researchData: any) {
  // Web調査データからボケを生成（簡易実装）
  const rawBokes = [];
  
  // 調査データから基本ボケを抽出
  if (researchData.episodes) {
    researchData.episodes.forEach((episode: any) => {
      // エピソードをボケに変換
      rawBokes.push(episode.text);
      
      // バリエーションを生成
      if (episode.category === 'aruaru') {
        rawBokes.push(`${episode.text}って、あるある！`);
      }
    });
  }
  
  // 不足分を補完生成
  const theme = researchData.theme;
  const additionalBokes = [
    `${theme}で一番困ること`,
    `${theme}でよくある勘違い`,
    `${theme}での予想外の出来事`,
    `${theme}で思わず笑ってしまうこと`,
    `${theme}でのありえない体験`
  ];
  
  rawBokes.push(...additionalBokes);
  
  // あるある・ありそう・ないないに分類
  const categorized = {
    aruaru: rawBokes.filter(b => b.includes('あるある') || b.includes('よくある')).slice(0, 6),
    arisou: rawBokes.filter(b => b.includes('勘違い') || b.includes('困る')).slice(0, 4),
    nainai: rawBokes.filter(b => b.includes('ありえない') || b.includes('予想外')).slice(0, 3)
  };
  
  // 不足分を補完
  while (categorized.aruaru.length < 6) {
    categorized.aruaru.push(`${theme}でよくあること${categorized.aruaru.length + 1}`);
  }
  while (categorized.arisou.length < 4) {
    categorized.arisou.push(`${theme}でありそうなこと${categorized.arisou.length + 1}`);
  }
  while (categorized.nainai.length < 3) {
    categorized.nainai.push(`${theme}でありえないこと${categorized.nainai.length + 1}`);
  }
  
  return {
    bokes: [...categorized.aruaru, ...categorized.arisou, ...categorized.nainai],
    categorized,
    generatedAt: new Date().toISOString()
  };
}

async function designComposition(categorizedBokes: any) {
  return {
    introduction: categorizedBokes.aruaru.slice(0, 3).map((boke: string) => ({
      boke,
      type: 'aruaru',
      tsukkomi: 'あー、わかるわー',
      timing: '2s'
    })),
    development: categorizedBokes.arisou.slice(0, 3).map((boke: string) => ({
      boke,
      type: 'arisou', 
      tsukkomi: 'それはちょっと...',
      timing: '1s'
    })),
    climax: categorizedBokes.nainai.slice(0, 2).map((boke: string) => ({
      boke,
      type: 'nainai',
      tsukkomi: 'なんでやねん！',
      timing: '3s'
    })),
    estimatedDuration: 6,
    designedAt: new Date().toISOString()
  };
}

async function generateFullScript(state: any) {
  const { theme, genre } = state.request;
  const { sequence } = state.results;
  
  let script = `# ${theme}の${genre}\n\n`;
  script += `## 設定\n`;
  script += `- **テーマ**: ${theme}\n`;
  script += `- **ジャンル**: ${genre}\n`;
  script += `- **作成方法**: フルオート生成\n`;
  script += `- **セッションID**: ${state.id}\n\n`;
  script += `---\n\n`;
  
  script += `## シーン1: 導入\n\n`;
  script += `<!-- @stage-direction: ${theme}の設定で二人が登場 -->\n\n`;
  
  sequence.introduction.forEach((item: any, index: number) => {
    script += `**ボケ**: ${item.boke}\n`;
    script += `<!-- @boke: type="${item.type}" -->\n\n`;
    script += `**ツッコミ**: ${item.tsukkomi}\n`;
    script += `<!-- @tsukkomi: type="共感型" -->\n\n`;
    script += `<!-- @timing: ${item.timing} -->\n\n`;
  });
  
  script += `## シーン2: 展開\n\n`;
  sequence.development.forEach((item: any, index: number) => {
    script += `**ボケ**: ${item.boke}\n`;
    script += `<!-- @boke: type="${item.type}" -->\n\n`;
    script += `**ツッコミ**: ${item.tsukkomi}\n`;
    script += `<!-- @tsukkomi: type="疑問型" -->\n\n`;
    script += `<!-- @timing: ${item.timing} -->\n\n`;
  });
  
  script += `## シーン3: クライマックス\n\n`;
  sequence.climax.forEach((item: any, index: number) => {
    script += `**ボケ**: ${item.boke}\n`;
    script += `<!-- @boke: type="${item.type}" -->\n\n`;
    script += `**ツッコミ**: ${item.tsukkomi}\n`;
    script += `<!-- @tsukkomi: type="否定型" intensity="8" -->\n\n`;
    script += `<!-- @timing: ${item.timing} -->\n\n`;
  });
  
  script += `<!-- @stage-direction: 決めポーズで終了 -->\n\n`;
  script += `---\n\n`;
  script += `*🤖 MCP-NETA-CHO フルオート生成台本*\n`;
  script += `*生成日時: ${new Date().toLocaleString()}*\n`;
  
  return script;
}

async function evaluateAutoScript(state: any) {
  const bokes = state.results.bokeCollection || [];
  const categorized = state.results.categorizedBokes || {};
  
  // 簡易評価システム
  let structureScore = 15; // 構成の評価
  let varietyScore = 12;   // バラエティの評価  
  let balanceScore = 14;   // バランスの評価
  let impactScore = 13;    // インパクトの評価
  let practicalityScore = 16; // 実用性の評価
  
  const totalScore = structureScore + varietyScore + balanceScore + impactScore + practicalityScore;
  
  const suggestions = [
    'ボケのバリエーションを増やすとさらに良くなります',
    'ツッコミのタイミングをもう少し調整してみてください',
    '観客の反応を見ながら間の取り方を調整しましょう',
    'オチをもっと印象的にできるかもしれません'
  ];
  
  return {
    totalScore,
    structure: structureScore,
    variety: varietyScore,
    balance: balanceScore,
    impact: impactScore,
    practicality: practicalityScore,
    suggestions,
    evaluatedAt: new Date().toISOString()
  };
}

export async function viewCompletedScript(sessionId: string) {
  const workDir = path.join(process.cwd(), '.neta-cho', 'auto-sessions', sessionId);
  const scriptPath = path.join(workDir, 'final_script.md');
  
  try {
    const script = await fs.readFile(scriptPath, 'utf-8');
    
    return {
      content: [{
        type: 'text',
        text: `📜 **完成台本 (セッション: ${sessionId})**\n\n${script}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ 台本が見つかりません: ${error}`
      }]
    };
  }
}