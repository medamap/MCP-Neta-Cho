import * as fs from 'fs/promises';
import * as path from 'path';

interface ScriptElement {
  type: 'dialogue' | 'stage-direction' | 'timing';
  character?: string;
  text: string;
  metadata?: {
    bokeType?: string;
    tsukkomiType?: string;
    level?: 'aruaru' | 'arisou' | 'nainai';
    intensity?: number;
  };
}

interface ScriptComposition {
  sequence: Array<{
    boke: string;
    bokeType: string;
    level: string;
    suggestedTsukkomi: string[];
    selectedTsukkomi?: string;
    tsukkomiType?: string;
  }>;
}

export async function proposeBokeSequence() {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(data);
    
    const categorized = state.answers.step14;
    if (!categorized) {
      return {
        content: [{
          type: 'text',
          text: '❌ まずボケの分類を完了してください。'
        }]
      };
    }
    
    // ボケの順序提案
    const sequence = createBokeSequence(categorized);
    
    return {
      content: [{
        type: 'text',
        text: formatSequenceProposal(sequence)
      }]
    };
  } catch {
    return {
      content: [{
        type: 'text',
        text: '❌ ウィザードのデータが見つかりません。'
      }]
    };
  }
}

function createBokeSequence(categorized: any): ScriptComposition {
  const { aruaru, arisou, nainai } = categorized;
  const sequence: Array<{
    boke: string;
    bokeType: string;
    level: string;
    suggestedTsukkomi: string[];
  }> = [];
  
  // 導入：あるある（2-3個）
  aruaru.slice(0, 3).forEach((boke: string) => {
    sequence.push({
      boke,
      bokeType: 'あるある',
      level: 'aruaru',
      suggestedTsukkomi: [
        '確かにそうやな',
        'あー、あるある！',
        'わかるわー'
      ]
    });
  });
  
  // 展開：ありそう（3-4個）
  arisou.slice(0, 4).forEach((boke: string) => {
    sequence.push({
      boke,
      bokeType: 'ありそう',
      level: 'arisou',
      suggestedTsukkomi: [
        'そんなことあるか？',
        'まあ...ありそうやけど',
        'それはちょっと...'
      ]
    });
  });
  
  // クライマックス：ないない（2個）
  nainai.slice(0, 2).forEach((boke: string) => {
    sequence.push({
      boke,
      bokeType: 'ないない', 
      level: 'nainai',
      suggestedTsukkomi: [
        'なんでやねん！',
        'そんなわけあるかい！',
        'ありえへんやろ！'
      ]
    });
  });
  
  return { sequence };
}

function formatSequenceProposal(composition: ScriptComposition): string {
  let output = '🎬 **台本構成の提案**\n\n';
  output += '教科書の理論に基づいて、最適な順序を提案します。\n\n';
  
  composition.sequence.forEach((item, index) => {
    const stage = index < 3 ? '【導入】' : 
                  index < 7 ? '【展開】' : '【クライマックス】';
    
    output += `## ${index + 1}. ${stage} ${item.bokeType}\n\n`;
    output += `**ボケ**: ${item.boke}\n\n`;
    output += `**ツッコミ候補**:\n`;
    item.suggestedTsukkomi.forEach((tsukkomi, i) => {
      output += `${i + 1}. ${tsukkomi}\n`;
    });
    output += '\n---\n\n';
  });
  
  output += '💭 **この構成はいかがですか？**\n';
  output += '- 順序を変更したい場合は「順序変更」\n';
  output += '- ツッコミを選択したい場合は「ツッコミ選択」\n';
  output += '- このまま台本作成する場合は「台本作成」\n\n';
  output += 'どれか選択してください。';
  
  return output;
}

export async function generateScript() {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(data);
    
    // 台本生成
    const script = createFullScript(state.answers);
    
    // 台本をファイルに保存
    const scriptPath = path.join(process.cwd(), '.neta-cho', 'generated-script.md');
    await fs.writeFile(scriptPath, script);
    
    return {
      content: [{
        type: 'text',
        text: `🎭 **台本が完成しました！**\n\n${script}\n\n📁 ファイルとして保存しました: \`generated-script.md\`\n\n評価したい場合は \`evaluate_script\` ツールを使用してください。`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ 台本生成エラー: ${error}`
      }]
    };
  }
}

function createFullScript(answers: any): string {
  const bokeCharacter = answers.step6 || 'ボケ';
  const tsukkomiCharacter = answers.step7 || 'ツッコミ';
  const setting = answers.step8 || '設定未定';
  const theme = answers.step2 || 'テーマ未定';
  
  let script = `# ${theme}の台本\n\n`;
  script += `## 設定\n`;
  script += `- **場所**: ${answers.step5 || '場所未定'}\n`;
  script += `- **時間**: ${answers.step4 || '時間未定'}\n`;
  script += `- **状況**: ${setting}\n`;
  script += `- **登場人物**: ${bokeCharacter}、${tsukkomiCharacter}\n\n`;
  script += `---\n\n`;
  
  script += `## シーン1：導入\n\n`;
  script += `<!-- @stage-direction: ${setting} -->\n\n`;
  
  // ボケとツッコミの展開例
  const categorized = answers.step14;
  if (categorized) {
    let count = 1;
    
    // あるある段階
    if (categorized.aruaru && categorized.aruaru.length > 0) {
      script += `### 導入（あるある）\n\n`;
      categorized.aruaru.slice(0, 2).forEach((boke: string) => {
        script += `**${bokeCharacter}**: ${boke}\n`;
        script += `<!-- @boke: type="あるある" level="aruaru" -->\n\n`;
        script += `**${tsukkomiCharacter}**: あー、わかるわー。\n`;
        script += `<!-- @tsukkomi: type="共感型" intensity="3" -->\n\n`;
        script += `<!-- @timing: 2s -->\n\n`;
      });
    }
    
    // ありそう段階
    if (categorized.arisou && categorized.arisou.length > 0) {
      script += `### 展開（ありそう）\n\n`;
      categorized.arisou.slice(0, 3).forEach((boke: string) => {
        script += `**${bokeCharacter}**: ${boke}\n`;
        script += `<!-- @boke: type="ありそう" level="arisou" -->\n\n`;
        script += `**${tsukkomiCharacter}**: それはちょっと...\n`;
        script += `<!-- @tsukkomi: type="疑問型" intensity="5" -->\n\n`;
        script += `<!-- @timing: 1s -->\n\n`;
      });
    }
    
    // ないない段階
    if (categorized.nainai && categorized.nainai.length > 0) {
      script += `### クライマックス（ないない）\n\n`;
      categorized.nainai.slice(0, 2).forEach((boke: string) => {
        script += `**${bokeCharacter}**: ${boke}\n`;
        script += `<!-- @boke: type="ないない" level="nainai" -->\n\n`;
        script += `**${tsukkomiCharacter}**: なんでやねん！！\n`;
        script += `<!-- @tsukkomi: type="否定型" intensity="8" -->\n\n`;
        script += `<!-- @timing: 3s -->\n\n`;
      });
    }
  }
  
  // オチ
  const ochi = answers.step17 || '（オチは後で考える）';
  script += `### オチ\n\n`;
  script += `**${tsukkomiCharacter}**: ${ochi}\n\n`;
  script += `<!-- @stage-direction: 二人で決めポーズ -->\n\n`;
  script += `---\n\n`;
  script += `*台本終了*\n\n`;
  script += `🤖 Generated with MCP-NETA-CHO\n`;
  
  return script;
}