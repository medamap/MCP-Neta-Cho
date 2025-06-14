import * as path from 'path';
import { getBokePatterns as getPatterns } from '../db/knowledge-base.js';

export async function bokeAdvisor(context: string, level: 'aruaru' | 'arisou' | 'nainai') {
  try {
    // コンテキストからテーマを抽出
    const theme = extractTheme(context);
    
    // 知識ベースからパターンを取得
    const patterns = await getPatterns(theme, level);
    
    // レベル別アドバイス
    const levelAdvice = {
      aruaru: {
        title: '「あるある」レベルのボケ',
        description: '観客が共感できる、日常的な内容から始めましょう',
        tips: [
          '誰もが経験したことがある状況を選ぶ',
          '「そうそう！」と思わせる内容',
          '観客との距離を縮める効果',
        ],
      },
      arisou: {
        title: '「ありそう」レベルのボケ',
        description: '少し誇張しつつも、理解できる範囲で展開しましょう',
        tips: [
          'あるあるから一歩踏み込む',
          '「確かにそうかも」と思える範囲',
          'キャラクターの個性を出し始める',
        ],
      },
      nainai: {
        title: '「ないない」レベルのボケ',
        description: '大きく飛躍して、インパクトのあるボケを作りましょう',
        tips: [
          '予想を完全に裏切る',
          'でも文脈からは理解できる',
          '強烈な印象を残す',
        ],
      },
    };
    
    const advice = levelAdvice[level];
    
    // 具体例の生成
    const examples = generateExamples(theme, level, patterns);
    
    return {
      content: [
        {
          type: 'text',
          text: `🎭 ${advice.title}\n\n` +
                `📝 ${advice.description}\n\n` +
                `💡 ポイント:\n${advice.tips.map(tip => `• ${tip}`).join('\n')}\n\n` +
                `🎯 「${context}」での例:\n\n${examples.join('\n\n')}\n\n` +
                `⚡ 次のステップ:\n` +
                `1. これらの例を参考に、自分なりのボケを作る\n` +
                `2. 相方の反応（ツッコミ）も想定する\n` +
                `3. 実際に声に出して確認する`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`ボケアドバイザーエラー: ${error}`);
  }
}

function extractTheme(context: string): string {
  // シンプルなテーマ抽出（将来的にはより高度に）
  const themes = ['学校', 'コンビニ', '会社', '家族', '友達', '恋愛', '買い物'];
  
  for (const theme of themes) {
    if (context.includes(theme)) {
      return theme;
    }
  }
  
  return '日常';
}

function generateExamples(theme: string, level: string, patterns: any[]): string[] {
  // ハードコードされた例（将来的にはデータベースから）
  const exampleMap: Record<string, Record<string, string[]>> = {
    '学校': {
      aruaru: [
        'A: 授業中眠くなるよね\nB: わかる',
        'A: 宿題忘れた時の言い訳考えるの大変\nB: あるある',
      ],
      arisou: [
        'A: 宿題忘れたから、犬に食べられたって言った\nB: 古典的すぎるやろ',
        'A: 教室のドア開けたら別の学年やった\nB: たまにあるな',
      ],
      nainai: [
        'A: 宿題忘れたから、自分で犬になった\nB: 意味わからんわ！',
        'A: 校長先生が授業してた\nB: それはないやろ！',
      ],
    },
    'コンビニ': {
      aruaru: [
        'A: レジ並んでる時に限って隣が早い\nB: それな',
        'A: 買うもの決めてたのに余計なもの買う\nB: あるある',
      ],
      arisou: [
        'A: 店員さんに挨拶されて挨拶し返した\nB: 優しいな',
        'A: おにぎり全種類買おうとした\nB: 食べ過ぎやろ',
      ],
      nainai: [
        'A: レジで店員と入れ替わった\nB: なんでやねん！',
        'A: コンビニで一泊した\nB: ホテルちゃうぞ！',
      ],
    },
  };
  
  return exampleMap[theme]?.[level] || [
    `A: ${theme}での${level}ボケ例1`,
    `A: ${theme}での${level}ボケ例2`,
  ];
}

