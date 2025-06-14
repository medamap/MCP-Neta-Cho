import * as fs from 'fs/promises';
import * as path from 'path';

export async function analyzeBalance(scriptPath: string) {
  try {
    // ファイルの存在確認
    const fullPath = path.isAbsolute(scriptPath) 
      ? scriptPath 
      : path.join(process.cwd(), scriptPath);
    
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // 台本の解析
    const analysis = analyzeScript(content);
    
    // レポート生成
    const report = generateReport(analysis);
    
    // レポートファイル保存
    const reportName = `balance-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
    const reportPath = path.join(process.cwd(), 'analysis', reportName);
    
    await fs.writeFile(reportPath, report);
    
    return {
      content: [
        {
          type: 'text',
          text: `📊 バランス分析完了！\n\n${generateSummary(analysis)}\n\n` +
                `📄 詳細レポート: analysis/${reportName}\n\n` +
                `${generateAdvice(analysis)}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`バランス分析エラー: ${error}`);
  }
}

interface ScriptAnalysis {
  totalLines: number;
  bokeCount: number;
  tsukkomiCount: number;
  dialogueBalance: number;
  sections: {
    introduction: number;
    development: number;
    climax: number;
    ending: number;
  };
  tempo: 'slow' | 'medium' | 'fast';
  estimatedDuration: number;
}

function analyzeScript(content: string): ScriptAnalysis {
  const lines = content.split('\n');
  let bokeCount = 0;
  let tsukkomiCount = 0;
  let dialogueLines = 0;
  
  // セクション分析
  let currentSection: keyof ScriptAnalysis['sections'] = 'introduction';
  const sections = {
    introduction: 0,
    development: 0,
    climax: 0,
    ending: 0,
  };
  
  for (const line of lines) {
    // セクション判定
    if (line.includes('導入') || line.includes('あるある')) {
      currentSection = 'introduction';
    } else if (line.includes('展開') || line.includes('ありそう')) {
      currentSection = 'development';
    } else if (line.includes('クライマックス') || line.includes('ないない')) {
      currentSection = 'climax';
    } else if (line.includes('オチ')) {
      currentSection = 'ending';
    }
    
    // 対話行の判定
    if (line.startsWith('**A**:')) {
      bokeCount++;
      dialogueLines++;
      sections[currentSection]++;
    } else if (line.startsWith('**B**:')) {
      tsukkomiCount++;
      dialogueLines++;
      sections[currentSection]++;
    }
  }
  
  // バランス計算
  const totalDialogue = bokeCount + tsukkomiCount;
  const dialogueBalance = totalDialogue > 0 ? bokeCount / totalDialogue : 0.5;
  
  // テンポ判定
  const avgWordsPerLine = content.length / dialogueLines;
  const tempo = avgWordsPerLine < 20 ? 'fast' : avgWordsPerLine < 40 ? 'medium' : 'slow';
  
  // 推定時間（1行あたり3秒で計算）
  const estimatedDuration = dialogueLines * 3;
  
  return {
    totalLines: lines.length,
    bokeCount,
    tsukkomiCount,
    dialogueBalance,
    sections,
    tempo,
    estimatedDuration,
  };
}

function generateReport(analysis: ScriptAnalysis): string {
  const { bokeCount, tsukkomiCount, dialogueBalance, sections, tempo, estimatedDuration } = analysis;
  
  return `# 台本バランス分析レポート

生成日時: ${new Date().toLocaleString('ja-JP')}

## 基本統計

- 総行数: ${analysis.totalLines}行
- ボケ数: ${bokeCount}回
- ツッコミ数: ${tsukkomiCount}回
- ボケ/ツッコミ比率: ${(dialogueBalance * 100).toFixed(1)}% / ${((1 - dialogueBalance) * 100).toFixed(1)}%
- 推定上演時間: ${Math.floor(estimatedDuration / 60)}分${estimatedDuration % 60}秒
- テンポ: ${tempo === 'fast' ? '速い' : tempo === 'medium' ? '普通' : 'ゆっくり'}

## セクション分析

| セクション | 対話数 | 割合 |
|----------|--------|------|
| 導入（あるある） | ${sections.introduction} | ${((sections.introduction / (bokeCount + tsukkomiCount)) * 100).toFixed(1)}% |
| 展開（ありそう） | ${sections.development} | ${((sections.development / (bokeCount + tsukkomiCount)) * 100).toFixed(1)}% |
| クライマックス（ないない） | ${sections.climax} | ${((sections.climax / (bokeCount + tsukkomiCount)) * 100).toFixed(1)}% |
| オチ | ${sections.ending} | ${((sections.ending / (bokeCount + tsukkomiCount)) * 100).toFixed(1)}% |

## 推奨事項

${generateRecommendations(analysis)}

## バランス評価

${generateBalanceEvaluation(analysis)}
`;
}

function generateSummary(analysis: ScriptAnalysis): string {
  const { bokeCount, tsukkomiCount, estimatedDuration } = analysis;
  
  return `📈 分析結果サマリー:
• ボケ ${bokeCount}回 / ツッコミ ${tsukkomiCount}回
• 推定時間: ${Math.floor(estimatedDuration / 60)}分${estimatedDuration % 60}秒
• テンポ: ${analysis.tempo === 'fast' ? '⚡速い' : analysis.tempo === 'medium' ? '🚶普通' : '🐌ゆっくり'}`;
}

function generateAdvice(analysis: ScriptAnalysis): string {
  const advice: string[] = [];
  
  // ボケ・ツッコミバランス
  if (analysis.dialogueBalance > 0.7) {
    advice.push('💡 ボケが多すぎます。ツッコミを増やしてメリハリをつけましょう');
  } else if (analysis.dialogueBalance < 0.4) {
    advice.push('💡 ツッコミが多すぎます。もっとボケを入れて笑いどころを増やしましょう');
  }
  
  // 時間
  if (analysis.estimatedDuration < 120) {
    advice.push('⏱️ 少し短いかもしれません。展開部分を充実させましょう');
  } else if (analysis.estimatedDuration > 300) {
    advice.push('⏱️ 長すぎる可能性があります。不要な部分を削りましょう');
  }
  
  // セクションバランス
  const { sections } = analysis;
  const total = analysis.bokeCount + analysis.tsukkomiCount;
  
  if (sections.introduction / total < 0.15) {
    advice.push('🎯 導入が短すぎます。「あるある」でもっと観客を引き込みましょう');
  }
  if (sections.climax / total < 0.2) {
    advice.push('🎯 クライマックスを充実させましょう。「ないない」でインパクトを！');
  }
  
  return advice.length > 0 
    ? `💡 改善のヒント:\n${advice.join('\n')}`
    : '✨ 良いバランスです！実際に演じて確認してみましょう';
}

function generateRecommendations(analysis: ScriptAnalysis): string {
  const recommendations: string[] = [];
  
  if (analysis.tempo === 'slow') {
    recommendations.push('- セリフを短くしてテンポアップを図る');
  }
  
  if (analysis.dialogueBalance > 0.6) {
    recommendations.push('- ツッコミのバリエーションを増やす');
    recommendations.push('- 「なんでやねん」以外のツッコミを考える');
  }
  
  if (analysis.sections.development < analysis.sections.introduction) {
    recommendations.push('- 展開部分をもっと充実させる');
    recommendations.push('- 「ありそう」レベルのボケを追加');
  }
  
  return recommendations.join('\n');
}

function generateBalanceEvaluation(analysis: ScriptAnalysis): string {
  let score = 0;
  const evaluations: string[] = [];
  
  // ボケ・ツッコミバランス（40点）
  const balanceScore = 40 - Math.abs(0.6 - analysis.dialogueBalance) * 100;
  score += Math.max(0, balanceScore);
  evaluations.push(`ボケ/ツッコミバランス: ${Math.round(balanceScore)}/40点`);
  
  // セクション構成（30点）
  const sectionScore = analysis.sections.climax > analysis.sections.introduction ? 30 : 15;
  score += sectionScore;
  evaluations.push(`セクション構成: ${sectionScore}/30点`);
  
  // 時間（30点）
  const timeScore = analysis.estimatedDuration >= 120 && analysis.estimatedDuration <= 240 ? 30 : 15;
  score += timeScore;
  evaluations.push(`上演時間: ${timeScore}/30点`);
  
  evaluations.push(`\n**総合評価: ${Math.round(score)}/100点**`);
  
  return evaluations.join('\n');
}