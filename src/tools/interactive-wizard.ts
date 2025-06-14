import * as fs from 'fs/promises';
import * as path from 'path';
import { classifyBokes, formatClassifiedBokes } from './boke-classifier.js';

// MCPは質問するだけ！答えはユーザーが考える！

export async function startWizard() {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  // 初期化
  const initialState = {
    currentStep: 1,
    answers: {}
  };
  
  await fs.mkdir(path.join(process.cwd(), '.neta-cho'), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(initialState, null, 2));
  
  return {
    content: [{
      type: 'text',
      text: `🎭 **漫才・コント台本作成ウィザードへようこそ！**

⚠️ **このウィザードは選択肢がたくさん出ます。表示されない場合は折りたたまれている可能性があります。**

これから18のステップで、理論に基づいた台本を一緒に作っていきます。

私は質問をするだけです。答えを考えるのは**あなた**です！

準備はいいですか？

最初の質問：
**ステップ1: 漫才とコント、どちらを作りますか？**

「漫才」または「コント」でお答えください。`
    }]
  };
}

export async function nextQuestion(answer: any) {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  let state;
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    state = JSON.parse(data);
  } catch {
    return {
      content: [{
        type: 'text',
        text: '❌ ウィザードが開始されていません。先に startWizard を実行してください。'
      }]
    };
  }
  
  // 現在のステップの回答を保存
  state.answers[`step${state.currentStep}`] = answer;
  state.currentStep++;
  
  // 質問リスト（MCPは質問するだけ！）
  const questions = [
    { step: 1, q: "漫才とコント、どちらを作りますか？" },
    { step: 2, q: "テーマを教えてください。（例：学校、コンビニ、家族など）" },
    { step: 3, q: "基本パターンを選んでください。\n【場所/シチュエーション × 登場人物】\n1. 場所が日常×キャラが日常（普通の場所で普通の人物）\n2. 場所が日常×キャラが非日常（普通の場所で変わった人物）おすすめ！\n3. 場所が非日常×キャラが日常（変わった場所で普通の人物）\n4. 場所が非日常×キャラが非日常（変わった場所で変わった人物）避けるべき！" },
    { step: 4, q: "いつの話にしますか？（朝、昼、夜、季節など具体的に）" },
    { step: 5, q: "どこでの話にしますか？（具体的な場所を）" },
    { step: 6, q: "ボケ役はどんな人物にしますか？（名前や立場）" },
    { step: 7, q: "ツッコミ役はどんな人物にしますか？（名前や立場）" },
    { step: 8, q: "どんな状況で始まりますか？（何をしているところか）" },
    { step: 9, q: "ボケ役の性格を教えてください。（天然、理屈っぽい、強がりなど）" },
    { step: 10, q: "ツッコミ役の性格を教えてください。（常識人、心配性、短気など）" },
    { step: 11, q: "二人の関係性を教えてください。（友達、先輩後輩、夫婦など）" },
    { step: 12, q: "この設定でボケを考えてください。（最低10個、思いつくまま書いてください）" },
    { step: 13, q: "もっとボケを追加しますか？\n『はい』か『いいえ』でお答えください。" },
    { step: 14, q: "出したボケを見返して、\n- 「あるある」（共感できる）\n- 「ありそう」（少し誇張）\n- 「ないない」（大きく飛躍）\nに分類してください。" },
    { step: 15, q: "ボケの種類を確認します。\n- しゃべくりボケ（言葉の面白さ）\n- アクションボケ（動きで笑い）\n- 状況ボケ（設定から生まれる）\n- キャラクターボケ（人物の特徴）\n自動分類が合っているか確認してください。" },
    { step: 16, q: "ツッコミのスタイルを決めてください。\n- 否定型（違うやろ！）\n- 疑問型（なんでやねん）\n- 共感型（確かに...って違うわ！）\n- 発展型（それやったら○○やん）\n- 説明型（要するに○○やん）\n- アクション型（手で叩くなど）" },
    { step: 17, q: "最後に、オチをどうするか考えてください。" },
    { step: 18, q: "台本の構成を確認しましょう。次のステップに進みますか？" }
  ];
  
  const nextQ = questions.find(q => q.step === state.currentStep);
  
  if (!nextQ) {
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    return {
      content: [{
        type: 'text',
        text: `🎉 **おめでとうございます！**

全ての質問に答えていただきました。
これで台本の素材が揃いました。

あなたが考えた内容で台本を組み立ててください。
私はアドバイスが必要な時にお手伝いします。

次のステップ：
- **内容確認**: show_wizard_answers
- **ボケ調査**: research_boke_ideas（ネットでアイデア収集）
- **構成提案**: propose_sequence（ボケの順序とツッコミを提案）
- **台本生成**: generate_script（ト書き付き台本作成）
- **評価**: evaluate_script（理論に基づく評価）`
      }]
    };
  }
  
  // ステップ13（ボケ追加確認）の特別処理
  if (state.currentStep === 13 && answer === 'はい') {
    state.currentStep = 12; // ボケ作成に戻る
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    return {
      content: [{
        type: 'text',
        text: `では、追加のボケを考えてください。`
      }]
    };
  }
  
  // ステップ12（ボケ作成）で既にボケがある場合は追記
  if (state.currentStep === 12 && state.answers.step12) {
    const existingBokes = state.answers.step12;
    const newBokes = Array.isArray(answer) ? answer : [answer];
    state.answers.step12 = [...existingBokes, ...newBokes];
  }
  
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  
  // ステップ15の場合はボケの種類を自動分類
  if (nextQ.step === 15) {
    const allBokes = [
      ...(state.answers.step12 || [])
    ];
    
    if (allBokes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `❌ ボケが記録されていません。先にボケを作成してください。`
        }]
      };
    }
    
    const classified = classifyBokes(allBokes);
    const formattedResult = formatClassifiedBokes(classified);
    
    return {
      content: [{
        type: 'text',
        text: `✅ 回答を記録しました。

**ステップ15: ボケの種類を確認してください**

${formattedResult}

この分類は正しいですか？
間違っている場合は修正内容を教えてください。
正しい場合は「正しい」とお答えください。`
      }]
    };
  }
  
  // ステップ3の場合は見やすく整形
  if (nextQ.step === 3) {
    return {
      content: [{
        type: 'text',
        text: `✅ 回答を記録しました。

**ステップ3: 基本パターンを選んでください**

【場所/シチュエーション × 登場人物】

**1.** 場所が日常×キャラが日常
   （普通の場所で普通の人物）

**2.** 場所が日常×キャラが非日常 ← おすすめ！
   （普通の場所で変わった人物）

**3.** 場所が非日常×キャラが日常
   （変わった場所で普通の人物）

**4.** 場所が非日常×キャラが非日常 ← 避けるべき！
   （変わった場所で変わった人物）

番号（1〜4）で答えてください。`
      }]
    };
  }
  
  // ステップ18の場合は最終確認
  if (nextQ.step === 18) {
    return {
      content: [{
        type: 'text',
        text: `✅ 回答を記録しました。

**ステップ18: 台本の構成を最終確認**

これまでの回答を確認して、台本作成の準備が整いました。

次のステップに進みますか？
- **はい** → 台本作成を完了して評価に進む
- **いいえ** → 前のステップに戻って修正する

どちらか選択してください。`
      }]
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: `✅ 回答を記録しました。

**ステップ${nextQ.step}: ${nextQ.q}**

${nextQ.step === 12 ? '💡 ヒント: 思いついたボケを箇条書きで書いてください。例：\n- 宿題忘れたって言ったら「じゃあ君が宿題になりなさい」って言われた\n- コンビニで「温めますか？」って聞かれて「僕も温めてください」って答えた' : ''}

${nextQ.step >= 3 && nextQ.step <= 17 ? '\n次のステップに進む場合は回答してください。' : ''}`
    }]
  };
}

export async function showWizardAnswers() {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(data);
    
    let summary = '📝 **あなたが考えた内容**\n\n';
    
    const labels = [
      "タイプ", "テーマ", "パターン", "時間", "場所", 
      "ボケ役", "ツッコミ役", "状況", "ボケの性格", 
      "ツッコミの性格", "関係性", "ボケ案", "ボケ追加", "ボケ分類", 
      "ボケ種類", "ツッコミスタイル", "オチ", "最終確認"
    ];
    
    Object.entries(state.answers).forEach(([key, value], index) => {
      if (labels[index]) {
        summary += `**${labels[index]}**: ${value}\n\n`;
      }
    });
    
    summary += `\n進捗: ステップ ${state.currentStep - 1} / 18 完了`;
    
    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  } catch {
    return {
      content: [{
        type: 'text',
        text: '❌ まだ回答がありません。'
      }]
    };
  }
}

export async function getHint(topic: string) {
  const hints: Record<string, string> = {
    'ボケ': `ボケを考えるヒント：
- 日常の中の違和感を探す
- 「もしも」を考える
- 極端に考えてみる
- 勘違いや聞き間違いを使う`,
    
    'あるある': `「あるある」のヒント：
- みんなが経験したこと
- 共感できる失敗談
- 日常のちょっとした不満
- 誰もが感じる気持ち`,
    
    'ありそう': `「ありそう」のヒント：
- あるあるを少し大げさに
- ちょっと変わった反応
- でも理解できる範囲で
- キャラクターらしさを出す`,
    
    'ないない': `「ないない」のヒント：
- 常識を完全に覆す
- でも文脈は保つ
- 物理法則は無視してもOK
- インパクト重視`,
    
    'オチ': `オチのヒント：
- 今までの流れをまとめる
- 最後に一番大きなボケ
- きれいに締める
- 余韻を残す`
  };
  
  const hint = hints[topic] || '具体的なトピックを教えてください（ボケ、あるある、ありそう、ないない、オチ）';
  
  return {
    content: [{
      type: 'text',
      text: `💡 **${topic}のヒント**\n\n${hint}`
    }]
  };
}