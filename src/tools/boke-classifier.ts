// ボケの種類を自動分類する機能

export interface ClassifiedBoke {
  text: string;
  type: 'しゃべくり' | 'アクション' | '状況' | 'キャラクター';
  confidence: number;
}

export function classifyBokes(bokes: string[]): ClassifiedBoke[] {
  return bokes.map(boke => {
    const classified: ClassifiedBoke = {
      text: boke,
      type: 'しゃべくり',
      confidence: 0.5
    };
    
    // アクションボケの判定
    if (boke.match(/動く|走る|飛ぶ|投げる|叩く|転ぶ|ジャンプ|踊る|回る|倒れる/)) {
      classified.type = 'アクション';
      classified.confidence = 0.8;
    }
    // 状況ボケの判定
    else if (boke.match(/もし|なったら|だったら|という設定|の世界/)) {
      classified.type = '状況';
      classified.confidence = 0.7;
    }
    // キャラクターボケの判定
    else if (boke.match(/性格|くせに|なのに|みたいな|っぽい|キャラ/)) {
      classified.type = 'キャラクター';
      classified.confidence = 0.7;
    }
    // しゃべくりボケ（デフォルト）
    else {
      classified.type = 'しゃべくり';
      classified.confidence = 0.6;
    }
    
    return classified;
  });
}

export function formatClassifiedBokes(classifiedBokes: ClassifiedBoke[]): string {
  const types = {
    'しゃべくり': [] as string[],
    'アクション': [] as string[],
    '状況': [] as string[],
    'キャラクター': [] as string[]
  };
  
  classifiedBokes.forEach(boke => {
    types[boke.type].push(`${boke.text} (確信度: ${Math.round(boke.confidence * 100)}%)`);
  });
  
  let output = '**ボケの種類分析結果**\n\n';
  
  Object.entries(types).forEach(([type, bokes]) => {
    if (bokes.length > 0) {
      output += `### ${type}ボケ (${bokes.length}個)\n`;
      bokes.forEach((boke, i) => {
        output += `${i + 1}. ${boke}\n`;
      });
      output += '\n';
    }
  });
  
  return output;
}