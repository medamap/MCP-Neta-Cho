import * as fs from 'fs/promises';
import * as path from 'path';

interface CreationState {
  currentStep: string;
  completedSteps: string[];
  data: {
    type?: 'manzai' | 'conte';
    theme?: string;
    pattern?: string;
    characters?: {
      boke: string;
      tsukkomi: string;
    };
    situation?: {
      setting: string;
      isNichijo: boolean;
    };
  };
}

const CREATION_STEPS = {
  'start': {
    name: 'スタート',
    prompt: '漫才・コントの台本を作りましょう！まず、どちらを作りますか？',
    choices: ['manzai', 'conte'],
    next: 'theme_selection'
  },
  'theme_selection': {
    name: 'テーマ選択',
    prompt: 'テーマを決めましょう。学校、コンビニ、家族、仕事など、身近なテーマがおすすめです。',
    theory: '身近なテーマから「あるある」を見つけやすくなります',
    next: 'pattern_selection'
  },
  'pattern_selection': {
    name: 'パターン選択',
    prompt: '基本パターンを選びましょう：\n1. 日常×日常（共感重視）\n2. 日常×非日常（基本形）\n3. 非日常×日常（シュール）',
    theory: '初心者は「日常×非日常」がおすすめ。ギャップで笑いを作りやすい',
    next: 'character_setting'
  },
  'character_setting': {
    name: 'キャラクター設定',
    prompt: 'ボケとツッコミのキャラクターを決めましょう。性格や特徴を考えると面白くなります。',
    theory: 'キャラクターが明確だと、自然なボケが生まれやすい',
    next: 'situation_setting'
  },
  'situation_setting': {
    name: 'シチュエーション設定',
    prompt: '具体的な場所や状況を決めましょう。いつ、どこで、何をしている時？',
    theory: '3W1H（When, Where, Who, How）を明確にすると観客が理解しやすい',
    next: 'aruaru_creation'
  },
  'aruaru_creation': {
    name: '「あるある」作成',
    prompt: 'まず「あるある」レベルのボケを3つ考えてみましょう。共感できる内容から始めます。',
    theory: '観客との距離を縮め、笑いの準備運動になります',
    next: 'arisou_creation'
  },
  'arisou_creation': {
    name: '「ありそう」作成',
    prompt: '「あるある」を少し誇張して「ありそう」レベルに発展させましょう。',
    theory: '徐々にエスカレートさせることで、観客がついてこれます',
    next: 'nainai_creation'
  },
  'nainai_creation': {
    name: '「ないない」作成',
    prompt: 'クライマックス用の「ないない」ボケを考えましょう。大きく飛躍させますが、文脈は保ちます。',
    theory: '準備ができた後なら、大きな飛躍も受け入れられます',
    next: 'ending_creation'
  },
  'ending_creation': {
    name: 'オチ作成',
    prompt: 'きれいに締めるオチを考えましょう。余韻を残すことが大切です。',
    theory: '急に終わらず、観客が満足できる締めくくりを',
    next: 'complete'
  }
};

export async function getCreationGuide(stepName?: string) {
  try {
    // 現在の状態を読み込む
    const statePath = path.join(process.cwd(), '.neta-cho', 'creation-state.json');
    let state: CreationState;
    
    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      // 状態ファイルがない場合は初期化
      state = {
        currentStep: 'start',
        completedSteps: [],
        data: {}
      };
    }

    // 指定されたステップまたは現在のステップを取得
    const currentStepName = stepName || state.currentStep;
    const step = CREATION_STEPS[currentStepName as keyof typeof CREATION_STEPS];
    
    if (!step) {
      throw new Error(`不明なステップ: ${currentStepName}`);
    }

    // 進捗計算
    const totalSteps = Object.keys(CREATION_STEPS).length - 1; // 'complete'を除く
    const progress = (state.completedSteps.length / totalSteps) * 100;

    return {
      content: [
        {
          type: 'text',
          text: `📝 台本作成ガイド - ${step.name}\n\n` +
                `進捗: ${progress.toFixed(0)}% [${state.completedSteps.length}/${totalSteps}]\n\n` +
                `💭 ${step.prompt}\n\n` +
                ('theory' in step && step.theory ? `💡 理論: ${step.theory}\n\n` : '') +
                `📊 現在の設定:\n` +
                Object.entries(state.data)
                  .filter(([_, v]) => v !== undefined)
                  .map(([k, v]) => `• ${k}: ${JSON.stringify(v)}`)
                  .join('\n') +
                `\n\n次のステップ: ${step.next}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`ガイド取得エラー: ${error}`);
  }
}

export async function updateCreationState(stepName: string, data: any) {
  try {
    const statePath = path.join(process.cwd(), '.neta-cho', 'creation-state.json');
    
    // 現在の状態を読み込む
    let state: CreationState;
    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      state = {
        currentStep: 'start',
        completedSteps: [],
        data: {}
      };
    }

    // ステップを完了として記録
    if (!state.completedSteps.includes(stepName)) {
      state.completedSteps.push(stepName);
    }

    // データを更新
    state.data = { ...state.data, ...data };

    // 次のステップに進む
    const currentStep = CREATION_STEPS[stepName as keyof typeof CREATION_STEPS];
    if (currentStep && currentStep.next) {
      state.currentStep = currentStep.next;
    }

    // 状態を保存
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));

    return {
      content: [
        {
          type: 'text',
          text: `✅ ${currentStep?.name || stepName}を完了しました！\n\n` +
                `次は「${currentStep?.next}」に進みましょう。`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`状態更新エラー: ${error}`);
  }
}