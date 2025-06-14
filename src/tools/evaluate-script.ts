import * as fs from 'fs/promises';
import * as path from 'path';

interface ScriptEvaluation {
  overall_score: number;
  categories: {
    balance: EvaluationItem;
    variety: EvaluationItem;
    progression: EvaluationItem;
    structure: EvaluationItem;
    impact: EvaluationItem;
  };
  suggestions: string[];
  praise: string[];
}

interface EvaluationItem {
  score: number;
  max_score: number;
  feedback: string;
}

export async function evaluateScript() {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(data);
    
    if (!state.answers || Object.keys(state.answers).length < 12) {
      return {
        content: [{
          type: 'text',
          text: '❌ まだ台本が完成していません。ウィザードを最後まで進めてください。'
        }]
      };
    }
    
    const evaluation = analyzeScript(state.answers);
    return formatEvaluation(evaluation);
    
  } catch {
    return {
      content: [{
        type: 'text',
        text: '❌ 評価する台本が見つかりません。先にウィザードで台本を作成してください。'
      }]
    };
  }
}

function analyzeScript(answers: any): ScriptEvaluation {
  const evaluation: ScriptEvaluation = {
    overall_score: 0,
    categories: {
      balance: { score: 0, max_score: 20, feedback: '' },
      variety: { score: 0, max_score: 20, feedback: '' },
      progression: { score: 0, max_score: 20, feedback: '' },
      structure: { score: 0, max_score: 20, feedback: '' },
      impact: { score: 0, max_score: 20, feedback: '' }
    },
    suggestions: [],
    praise: []
  };
  
  // ボケの分析
  const bokeList = answers.step12 || [];
  const categorized = answers.step13 || { aruaru: [], arisou: [], nainai: [] };
  
  // 1. バランスの評価
  analyzeBalance(categorized, evaluation);
  
  // 2. バラエティの評価
  analyzeVariety(bokeList, evaluation);
  
  // 3. 進行の評価
  analyzeProgression(categorized, evaluation);
  
  // 4. 構成の評価
  analyzeStructure(answers, evaluation);
  
  // 5. インパクトの評価
  analyzeImpact(categorized, evaluation);
  
  // 総合スコア計算
  evaluation.overall_score = Object.values(evaluation.categories)
    .reduce((sum, cat) => sum + cat.score, 0);
  
  return evaluation;
}

function analyzeBalance(categorized: any, evaluation: ScriptEvaluation) {
  const aruaru = categorized.aruaru?.length || 0;
  const arisou = categorized.arisou?.length || 0;
  const nainai = categorized.nainai?.length || 0;
  const total = aruaru + arisou + nainai;
  
  // 理想的な比率: あるある30%, ありそう50%, ないない20%
  const idealRatio = { aruaru: 0.3, arisou: 0.5, nainai: 0.2 };
  const actualRatio = {
    aruaru: total > 0 ? aruaru / total : 0,
    arisou: total > 0 ? arisou / total : 0,
    nainai: total > 0 ? nainai / total : 0
  };
  
  // スコア計算
  let score = 20;
  const aruaruDiff = Math.abs(actualRatio.aruaru - idealRatio.aruaru);
  const arisouDiff = Math.abs(actualRatio.arisou - idealRatio.arisou);
  const nainaiDiff = Math.abs(actualRatio.nainai - idealRatio.nainai);
  
  score -= (aruaruDiff + arisouDiff + nainaiDiff) * 20;
  score = Math.max(0, Math.round(score));
  
  evaluation.categories.balance.score = score;
  
  // フィードバック
  if (aruaru < 3) {
    evaluation.categories.balance.feedback = '「あるある」が少なすぎます。観客の共感を得るために最低3つは必要です。';
    evaluation.suggestions.push('日常でよくある「あるある」をあと' + (3 - aruaru) + 'つ追加してください。みんなが「わかる！」と思えるものを。');
  } else if (nainai < 2) {
    evaluation.categories.balance.feedback = '「ないない」のインパクトが足りません。';
    evaluation.suggestions.push('インパクトの強い「ないない」があと' + (2 - nainai) + 'つほど必要です。思い切って飛躍してみましょう！');
  } else if (arisou < 4) {
    evaluation.categories.balance.feedback = '「ありそう」が少なめです。中間のボケをもっと増やしましょう。';
    evaluation.suggestions.push('「ありそう」のボケをあと' + (4 - arisou) + 'つ考えてください。あるあるを少し誇張する感じで。');
  } else {
    evaluation.categories.balance.feedback = 'バランスは良好です！';
    evaluation.praise.push('ボケのバランスが理想的です。あるある→ありそう→ないないの流れが作れそうですね。');
  }
}

function analyzeVariety(bokeList: string[], evaluation: ScriptEvaluation) {
  if (!bokeList || bokeList.length === 0) {
    evaluation.categories.variety.score = 0;
    evaluation.categories.variety.feedback = 'ボケが記録されていません。';
    return;
  }
  
  let score = 20;
  const patterns = new Set<string>();
  
  // パターン分析（簡易版）
  bokeList.forEach(boke => {
    if (boke.includes('勘違い')) patterns.add('勘違い');
    if (boke.includes('間違い') || boke.includes('間違え')) patterns.add('間違い');
    if (boke.includes('忘れ')) patterns.add('忘れ');
    if (boke.includes('みたい') || boke.includes('ような')) patterns.add('比喩');
    if (boke.includes('逆に')) patterns.add('逆転');
    if (boke.includes('もし')) patterns.add('仮定');
  });
  
  // 同じパターンの連続をチェック
  let consecutiveSame = 0;
  let maxConsecutive = 0;
  let lastPattern = '';
  
  bokeList.forEach((boke, index) => {
    const currentPattern = detectPattern(boke);
    if (currentPattern === lastPattern && currentPattern !== '') {
      consecutiveSame++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveSame);
    } else {
      consecutiveSame = 0;
    }
    lastPattern = currentPattern;
  });
  
  // スコア調整
  score -= maxConsecutive * 3;
  score = Math.min(20, score + patterns.size * 2);
  score = Math.max(0, score);
  
  evaluation.categories.variety.score = score;
  
  if (maxConsecutive >= 3) {
    evaluation.categories.variety.feedback = '同じタイプのボケが連続しています。';
    evaluation.suggestions.push('同じパターンのボケが' + (maxConsecutive + 1) + '個連続しています。もう少しバラけさせましょう。');
  } else if (patterns.size < 3) {
    evaluation.categories.variety.feedback = 'ボケのパターンが単調です。';
    evaluation.suggestions.push('ボケのバリエーションを増やしましょう。勘違い、比喩、極端な例など、違うパターンを試してください。');
  } else {
    evaluation.categories.variety.feedback = 'バラエティ豊かです！';
    evaluation.praise.push('いろんなパターンのボケがあって飽きさせない構成です。');
  }
}

function analyzeProgression(categorized: any, evaluation: ScriptEvaluation) {
  const aruaru = categorized.aruaru || [];
  const arisou = categorized.arisou || [];
  const nainai = categorized.nainai || [];
  
  let score = 20;
  let feedback = '';
  
  // 進行の理想形をチェック
  if (aruaru.length === 0) {
    score -= 10;
    feedback = '導入の「あるある」がありません。';
    evaluation.suggestions.push('最初は共感できる「あるある」から始めましょう。観客を引き込むために重要です。');
  } else if (nainai.length === 0) {
    score -= 8;
    feedback = 'クライマックスの「ないない」がありません。';
    evaluation.suggestions.push('盛り上がりに欠けます。思い切った「ないない」でクライマックスを作りましょう。');
  } else {
    feedback = '進行の流れは良好です！';
    evaluation.praise.push('あるある→ありそう→ないないの理想的な進行が作れそうです。');
  }
  
  evaluation.categories.progression.score = Math.max(0, score);
  evaluation.categories.progression.feedback = feedback;
}

function analyzeStructure(answers: any, evaluation: ScriptEvaluation) {
  let score = 20;
  let issues = [];
  
  // 必須要素のチェック
  if (!answers.step2) {
    score -= 5;
    issues.push('テーマが不明確');
  }
  if (!answers.step6 || !answers.step7) {
    score -= 5;
    issues.push('キャラクター設定が不完全');
  }
  if (!answers.step14) {
    score -= 5;
    issues.push('オチが決まっていない');
  }
  
  // パターンチェック
  const pattern = answers.step3;
  if (pattern && pattern.includes('非日常×非日常')) {
    score -= 5;
    evaluation.suggestions.push('「非日常×非日常」のパターンは避けた方が良いです。観客が理解しにくくなります。');
  }
  
  evaluation.categories.structure.score = Math.max(0, score);
  
  if (issues.length > 0) {
    evaluation.categories.structure.feedback = '構成に問題があります: ' + issues.join('、');
  } else {
    evaluation.categories.structure.feedback = '構成はしっかりしています！';
    evaluation.praise.push('基本的な構成要素がすべて揃っています。');
  }
}

function analyzeImpact(categorized: any, evaluation: ScriptEvaluation) {
  const nainai = categorized.nainai || [];
  const allBokes = [
    ...(categorized.aruaru || []),
    ...(categorized.arisou || []),
    ...(categorized.nainai || [])
  ];
  
  let score = 15;
  
  // インパクトのあるボケの特徴をチェック
  let impactfulCount = 0;
  nainai.forEach((boke: string) => {
    if (boke.length > 30 || // 長いボケ
        boke.includes('！') || // 感嘆符
        boke.match(/\d{3,}/) || // 大きな数字
        boke.includes('世界') || boke.includes('宇宙') || // スケールの大きな言葉
        boke.includes('全部') || boke.includes('すべて')) { // 極端な表現
      impactfulCount++;
    }
  });
  
  if (impactfulCount > 0) {
    score += 5;
  }
  
  evaluation.categories.impact.score = Math.min(20, score);
  
  if (nainai.length === 0 || impactfulCount === 0) {
    evaluation.categories.impact.feedback = 'インパクトのあるボケが不足しています。';
    evaluation.suggestions.push('もっと思い切った「ないない」を考えてください。常識を覆すような、でも文脈は保った大胆なボケを。');
  } else {
    evaluation.categories.impact.feedback = 'インパクトは十分です！';
    evaluation.praise.push('記憶に残るインパクトのあるボケがありますね。');
  }
}

function detectPattern(boke: string): string {
  if (boke.includes('勘違い')) return '勘違い';
  if (boke.includes('間違い') || boke.includes('間違え')) return '間違い';
  if (boke.includes('忘れ')) return '忘れ';
  if (boke.includes('みたい') || boke.includes('ような')) return '比喩';
  if (boke.includes('逆に')) return '逆転';
  if (boke.includes('もし')) return '仮定';
  return '';
}

function formatEvaluation(evaluation: ScriptEvaluation) {
  let output = '📊 **台本評価レポート**\n\n';
  
  // 総合スコア
  output += `## 総合スコア: ${evaluation.overall_score}/100点\n\n`;
  
  // スコアをビジュアル化
  const stars = '★'.repeat(Math.floor(evaluation.overall_score / 20)) + 
                '☆'.repeat(5 - Math.floor(evaluation.overall_score / 20));
  output += `評価: ${stars}\n\n`;
  
  // カテゴリー別評価
  output += '## 詳細評価\n\n';
  
  const categoryNames = {
    balance: 'バランス',
    variety: 'バラエティ',
    progression: '進行',
    structure: '構成',
    impact: 'インパクト'
  };
  
  Object.entries(evaluation.categories).forEach(([key, item]) => {
    const percentage = Math.round((item.score / item.max_score) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    
    output += `### ${categoryNames[key as keyof typeof categoryNames]}\n`;
    output += `${bar} ${item.score}/${item.max_score}点 (${percentage}%)\n`;
    output += `💬 ${item.feedback}\n\n`;
  });
  
  // 良かった点
  if (evaluation.praise.length > 0) {
    output += '## 👍 良かった点\n\n';
    evaluation.praise.forEach(praise => {
      output += `- ${praise}\n`;
    });
    output += '\n';
  }
  
  // 改善提案
  if (evaluation.suggestions.length > 0) {
    output += '## 💡 改善のための提案\n\n';
    evaluation.suggestions.forEach(suggestion => {
      output += `- ${suggestion}\n`;
    });
    output += '\n';
  }
  
  // 総評
  output += '## 📝 総評\n\n';
  if (evaluation.overall_score >= 80) {
    output += '素晴らしい台本です！このまま練習を重ねれば、きっと大きな笑いが取れるでしょう。';
  } else if (evaluation.overall_score >= 60) {
    output += 'なかなか良い台本です。提案された改善点を取り入れれば、さらに良くなるでしょう。';
  } else if (evaluation.overall_score >= 40) {
    output += '基本はできています。もう少しボケを追加したり、バランスを調整したりしてみましょう。';
  } else {
    output += 'まだ改善の余地があります。教科書の理論を参考に、一つずつ改善していきましょう。';
  }
  
  return {
    content: [{
      type: 'text',
      text: output
    }]
  };
}