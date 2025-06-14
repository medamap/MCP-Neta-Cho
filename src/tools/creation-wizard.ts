import * as fs from 'fs/promises';
import * as path from 'path';

interface WizardState {
  currentStep: number;
  data: {
    // 基礎段階
    theme?: string;
    pattern?: string;
    when?: string;
    where?: string;
    who?: {
      boke: string;
      tsukkomi: string;
    };
    how?: string;
    
    // 構築段階
    setting?: string;
    characterDetails?: {
      bokePersonality: string;
      tsukkomiPersonality: string;
      relationship: string;
    };
    
    // ボケ作成
    rawBokes?: string[];  // 分類前のボケ
    categorizedBokes?: {
      aruaru: string[];
      arisou: string[];
      nainai: string[];
    };
    
    // 構成
    structure?: {
      introduction: string;
      development: string;
      climax: string;
      ending: string;
    };
  };
}

const WIZARD_STEPS = [
  // ========== 基礎段階 ==========
  {
    id: 1,
    stage: '基礎段階',
    name: 'テーマ決定',
    prompt: 'テーマを決定してください。日常的で身近なものがおすすめです。',
    type: 'choice',
    choices: ['学校', 'コンビニ', '家族', '仕事', '恋愛', '電車', '病院', 'その他（自由入力）'],
    field: 'theme'
  },
  {
    id: 2,
    stage: '基礎段階',
    name: '基本パターン選択',
    prompt: '基本パターンを次の4つから選んでください。',
    type: 'choice',
    choices: [
      '日常×日常（共感重視・初心者向け）',
      '日常×非日常（ギャップで笑い・おすすめ）',
      '非日常×日常（シュールな笑い）',
      '非日常×非日常（避けるべき）'
    ],
    field: 'pattern'
  },
  {
    id: 3,
    stage: '基礎段階',
    name: 'When（いつ）の設定',
    prompt: 'いつの話か決定してください。',
    type: 'input',
    example: '例：朝、昼休み、放課後、深夜、季節など',
    field: 'when'
  },
  {
    id: 4,
    stage: '基礎段階',
    name: 'Where（どこで）の設定',
    prompt: 'どこでの話か決定してください。',
    type: 'input',
    example: '例：教室、コンビニ店内、リビング、駅のホームなど',
    field: 'where'
  },
  {
    id: 5,
    stage: '基礎段階',
    name: 'Who（誰が）の設定',
    prompt: 'ボケとツッコミの役を決定してください。',
    type: 'input_pair',
    fields: {
      boke: 'ボケ役の名前や立場',
      tsukkomi: 'ツッコミ役の名前や立場'
    },
    field: 'who'
  },
  {
    id: 6,
    stage: '基礎段階',
    name: 'How（どのように）の設定',
    prompt: 'どのような状況か決定してください。',
    type: 'input',
    example: '例：買い物中、勉強中、待ち合わせ中など',
    field: 'how'
  },
  
  // ========== 構築段階 ==========
  {
    id: 7,
    stage: '構築段階',
    name: '詳細設定',
    prompt: '設定の詳細を決定してください。具体的な状況を描写してください。',
    type: 'input',
    field: 'setting'
  },
  {
    id: 8,
    stage: '構築段階',
    name: 'キャラクター性格設定',
    prompt: 'ボケとツッコミの性格を決定してください。',
    type: 'input_triple',
    fields: {
      bokePersonality: 'ボケの性格（天然、強がり、理屈っぽいなど）',
      tsukkomiPersonality: 'ツッコミの性格（常識人、心配性、短気など）',
      relationship: '二人の関係性（友達、先輩後輩、夫婦など）'
    },
    field: 'characterDetails'
  },
  {
    id: 9,
    stage: '構築段階',
    name: 'ボケ出し',
    prompt: 'この設定で思いつくボケを10個以上出してください。まだ分類は考えなくていいです。',
    type: 'input_list',
    minItems: 10,
    field: 'rawBokes'
  },
  {
    id: 10,
    stage: '構築段階',
    name: 'ボケの分類',
    prompt: '出したボケを「あるある」「ありそう」「ないない」に分類してください。',
    type: 'categorize',
    sourceField: 'rawBokes',
    categories: ['aruaru', 'arisou', 'nainai'],
    field: 'categorizedBokes'
  },
  
  // ========== 実践段階 ==========
  {
    id: 11,
    stage: '実践段階',
    name: '起（導入）の構成',
    prompt: '導入部分（0-25%）を決定してください。「あるある」から始めて観客を引き込みます。',
    type: 'compose',
    useBokeFrom: 'aruaru',
    field: 'structure.introduction'
  },
  {
    id: 12,
    stage: '実践段階',
    name: '承（展開）の構成',
    prompt: '展開部分（25-50%）を決定してください。「ありそう」で徐々にエスカレートさせます。',
    type: 'compose',
    useBokeFrom: 'arisou',
    field: 'structure.development'
  },
  {
    id: 13,
    stage: '実践段階',
    name: '転（クライマックス）の構成',
    prompt: 'クライマックス（50-75%）を決定してください。「ないない」で最大の笑いを作ります。',
    type: 'compose',
    useBokeFrom: 'nainai',
    field: 'structure.climax'
  },
  {
    id: 14,
    stage: '実践段階',
    name: '結（オチ）の構成',
    prompt: 'オチ（75-100%）を決定してください。きれいに締めくくります。',
    type: 'input',
    field: 'structure.ending'
  }
];

export async function getWizardStep(stepId?: number) {
  try {
    const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-state.json');
    let state: WizardState;
    
    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      state = { currentStep: 1, data: {} };
    }
    
    const targetStep = stepId || state.currentStep;
    const step = WIZARD_STEPS.find(s => s.id === targetStep);
    
    if (!step) {
      throw new Error(`ステップ ${targetStep} が見つかりません`);
    }
    
    let prompt = `📝 **${step.stage} - ${step.name}**\n\n${step.prompt}`;
    
    // タイプ別の追加情報
    if (step.type === 'choice' && step.choices) {
      prompt += '\n\n選択肢:\n';
      step.choices.forEach((choice, i) => {
        prompt += `${i + 1}. ${choice}\n`;
      });
    } else if (step.type === 'input' && step.example) {
      prompt += `\n\n${step.example}`;
    }
    
    // 進捗表示
    const progress = ((state.currentStep - 1) / WIZARD_STEPS.length) * 100;
    prompt += `\n\n---\n進捗: ${progress.toFixed(0)}% [${state.currentStep}/${WIZARD_STEPS.length}]`;
    
    return {
      content: [{
        type: 'text',
        text: prompt
      }]
    };
  } catch (error) {
    throw new Error(`ウィザードエラー: ${error}`);
  }
}

export async function updateWizardStep(stepId: number, data: any) {
  try {
    const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-state.json');
    let state: WizardState;
    
    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      state = { currentStep: 1, data: {} };
    }
    
    const step = WIZARD_STEPS.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`ステップ ${stepId} が見つかりません`);
    }
    
    // データを保存
    if (step.field) {
      if (step.field.includes('.')) {
        // ネストされたフィールド
        const [parent, child] = step.field.split('.');
        if (!state.data[parent as keyof typeof state.data]) {
          (state.data as any)[parent] = {};
        }
        (state.data as any)[parent][child] = data;
      } else {
        (state.data as any)[step.field] = data;
      }
    }
    
    // 次のステップへ
    state.currentStep = stepId + 1;
    
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    
    return {
      content: [{
        type: 'text',
        text: `✅ ${step.name}を完了しました！\n\n次のステップに進みます。`
      }]
    };
  } catch (error) {
    throw new Error(`更新エラー: ${error}`);
  }
}

export async function showWizardStatus() {
  try {
    const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-state.json');
    let state: WizardState;
    
    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      return {
        content: [{
          type: 'text',
          text: '❌ まだウィザードが開始されていません。'
        }]
      };
    }
    
    let status = '📊 **現在の設定状況**\n\n';
    
    // 基礎段階
    status += '### 基礎段階\n';
    if (state.data.theme) status += `- テーマ: ${state.data.theme}\n`;
    if (state.data.pattern) status += `- パターン: ${state.data.pattern}\n`;
    if (state.data.when) status += `- いつ: ${state.data.when}\n`;
    if (state.data.where) status += `- どこで: ${state.data.where}\n`;
    if (state.data.who) {
      status += `- ボケ役: ${state.data.who.boke}\n`;
      status += `- ツッコミ役: ${state.data.who.tsukkomi}\n`;
    }
    if (state.data.how) status += `- 状況: ${state.data.how}\n`;
    
    // 構築段階
    if (state.data.setting || state.data.characterDetails) {
      status += '\n### 構築段階\n';
      if (state.data.setting) status += `- 詳細設定: ${state.data.setting}\n`;
      if (state.data.characterDetails) {
        status += `- ボケの性格: ${state.data.characterDetails.bokePersonality}\n`;
        status += `- ツッコミの性格: ${state.data.characterDetails.tsukkomiPersonality}\n`;
        status += `- 関係性: ${state.data.characterDetails.relationship}\n`;
      }
    }
    
    // ボケ一覧
    if (state.data.rawBokes) {
      status += `\n### 出したボケ (${state.data.rawBokes.length}個)\n`;
      state.data.rawBokes.forEach((boke, i) => {
        status += `${i + 1}. ${boke}\n`;
      });
    }
    
    // 分類済みボケ
    if (state.data.categorizedBokes) {
      status += '\n### 分類済みボケ\n';
      status += `**あるある (${state.data.categorizedBokes.aruaru.length}個)**\n`;
      state.data.categorizedBokes.aruaru.forEach(b => status += `- ${b}\n`);
      status += `\n**ありそう (${state.data.categorizedBokes.arisou.length}個)**\n`;
      state.data.categorizedBokes.arisou.forEach(b => status += `- ${b}\n`);
      status += `\n**ないない (${state.data.categorizedBokes.nainai.length}個)**\n`;
      state.data.categorizedBokes.nainai.forEach(b => status += `- ${b}\n`);
    }
    
    const progress = ((state.currentStep - 1) / WIZARD_STEPS.length) * 100;
    status += `\n\n---\n進捗: ${progress.toFixed(0)}% [${state.currentStep}/${WIZARD_STEPS.length}]`;
    
    return {
      content: [{
        type: 'text',
        text: status
      }]
    };
  } catch (error) {
    throw new Error(`状況表示エラー: ${error}`);
  }
}

export async function showBokeList() {
  try {
    const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-state.json');
    const stateData = await fs.readFile(statePath, 'utf-8');
    const state: WizardState = JSON.parse(stateData);
    
    if (!state.data.rawBokes && !state.data.categorizedBokes) {
      return {
        content: [{
          type: 'text',
          text: '❌ まだボケが作成されていません。'
        }]
      };
    }
    
    let bokeList = '📝 **ボケ一覧**\n\n';
    
    if (state.data.rawBokes && !state.data.categorizedBokes) {
      bokeList += `### 未分類のボケ (${state.data.rawBokes.length}個)\n`;
      state.data.rawBokes.forEach((boke, i) => {
        bokeList += `${i + 1}. ${boke}\n`;
      });
    }
    
    if (state.data.categorizedBokes) {
      const { aruaru, arisou, nainai } = state.data.categorizedBokes;
      
      bokeList += `### あるある (${aruaru.length}個)\n`;
      aruaru.forEach((boke, i) => {
        bokeList += `${i + 1}. ${boke}\n`;
      });
      
      bokeList += `\n### ありそう (${arisou.length}個)\n`;
      arisou.forEach((boke, i) => {
        bokeList += `${i + 1}. ${boke}\n`;
      });
      
      bokeList += `\n### ないない (${nainai.length}個)\n`;
      nainai.forEach((boke, i) => {
        bokeList += `${i + 1}. ${boke}\n`;
      });
      
      const total = aruaru.length + arisou.length + nainai.length;
      bokeList += `\n---\n合計: ${total}個のボケ`;
    }
    
    return {
      content: [{
        type: 'text',
        text: bokeList
      }]
    };
  } catch (error) {
    throw new Error(`ボケ一覧表示エラー: ${error}`);
  }
}