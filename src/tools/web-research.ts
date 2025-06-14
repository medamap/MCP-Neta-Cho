import * as fs from 'fs/promises';
import * as path from 'path';

export async function researchBokeIdeas(theme?: string) {
  const statePath = path.join(process.cwd(), '.neta-cho', 'wizard-progress.json');
  
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(data);
    
    const targetTheme = theme || state.answers.step2;
    if (!targetTheme) {
      return {
        content: [{
          type: 'text',
          text: '❌ テーマが設定されていません。テーマを指定するか、先にウィザードでテーマを設定してください。'
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `🔍 **「${targetTheme}」のボケアイデアをネットで調査中...**

検索キーワード：
- ${targetTheme} あるある
- ${targetTheme} おもしろエピソード
- ${targetTheme} 漫才ネタ
- ${targetTheme} あるあるネタ

この機能は現在開発中です。手動で以下の検索ツールを使用してください：

**検索手順：**
1. \`mcp__mcp-omnisearch__tavily_search\` または \`mcp__mcp-omnisearch__brave_search\` を使用
2. 検索クエリ例：
   - "${targetTheme} あるある"
   - "${targetTheme} エピソード 面白い"
   - "${targetTheme} 体験談 笑える"
   - "${targetTheme} 漫才 ネタ"

検索結果が得られたら、\`analyze_web_results\` ツールで分析します。`
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

export async function analyzeWebResults(searchResults: string) {
  if (!searchResults || searchResults.trim().length === 0) {
    return {
      content: [{
        type: 'text',
        text: '❌ 検索結果が提供されていません。'
      }]
    };
  }
  
  // 検索結果からボケのアイデアを抽出・分析
  const analysis = extractBokeIdeas(searchResults);
  
  return {
    content: [{
      type: 'text',
      text: formatAnalysisResults(analysis)
    }]
  };
}

interface BokeIdea {
  text: string;
  category: 'あるある' | 'ありそう' | 'ないない';
  confidence: number;
  source: string;
}

function extractBokeIdeas(searchResults: string): {
  ideas: BokeIdea[];
  summary: string;
} {
  const ideas: BokeIdea[] = [];
  
  // 検索結果からボケの候補を抽出（簡易的な実装）
  const lines = searchResults.split('\n');
  
  lines.forEach(line => {
    // あるあるパターンの検出
    if (line.match(/あるある|よくある|いつも|必ず|毎回|みんな/)) {
      ideas.push({
        text: line.substring(0, 100),
        category: 'あるある',
        confidence: 0.8,
        source: 'web'
      });
    }
    // ありそうパターンの検出
    else if (line.match(/たまに|時々|ときどき|まあまあ|そこそこ|なんとなく/)) {
      ideas.push({
        text: line.substring(0, 100),
        category: 'ありそう',
        confidence: 0.6,
        source: 'web'
      });
    }
    // ないないパターンの検出
    else if (line.match(/まさか|絶対|ありえない|信じられない|とんでもない|超|めちゃくちゃ/)) {
      ideas.push({
        text: line.substring(0, 100),
        category: 'ないない',
        confidence: 0.7,
        source: 'web'
      });
    }
  });
  
  // 重複除去とフィルタリング
  const uniqueIdeas = ideas
    .filter(idea => idea.text.length > 10)
    .slice(0, 15); // 最大15個
  
  return {
    ideas: uniqueIdeas,
    summary: `検索結果から${uniqueIdeas.length}個のボケアイデアを抽出しました。`
  };
}

function formatAnalysisResults(analysis: { ideas: BokeIdea[]; summary: string }): string {
  let output = '📊 **ネット検索結果の分析**\n\n';
  output += `${analysis.summary}\n\n`;
  
  if (analysis.ideas.length === 0) {
    output += '❌ ボケのアイデアが見つかりませんでした。\n\n';
    output += '**改善案：**\n';
    output += '- より具体的なキーワードで検索してみてください\n';
    output += '- 「[テーマ] エピソード」「[テーマ] 体験談」で検索\n';
    output += '- SNSや掲示板の投稿も参考になります\n';
    return output;
  }
  
  // カテゴリ別に整理
  const categories = {
    'あるある': analysis.ideas.filter(idea => idea.category === 'あるある'),
    'ありそう': analysis.ideas.filter(idea => idea.category === 'ありそう'),
    'ないない': analysis.ideas.filter(idea => idea.category === 'ないない')
  };
  
  Object.entries(categories).forEach(([category, ideas]) => {
    if (ideas.length > 0) {
      output += `### ${category} (${ideas.length}個)\n\n`;
      ideas.forEach((idea, index) => {
        output += `${index + 1}. ${idea.text}\n`;
        output += `   *確信度: ${Math.round(idea.confidence * 100)}%*\n\n`;
      });
    }
  });
  
  output += '---\n\n';
  output += '💡 **活用方法：**\n';
  output += '- これらを参考に自分なりのボケを考えてみてください\n';
  output += '- 複数のアイデアを組み合わせて新しいボケを作ることもできます\n';
  output += '- 必要に応じて「あるある」→「ありそう」→「ないない」に発展させてください\n\n';
  
  output += '🔄 **次のステップ：**\n';
  output += '- `next_question` でウィザードを続ける\n';
  output += '- `get_hint` でより具体的なヒントを求める\n';
  output += '- 新しいキーワードで再検索する\n';
  
  return output;
}

export async function suggestRelatedTopics(theme: string) {
  const relatedTopics = generateRelatedTopics(theme);
  
  return {
    content: [{
      type: 'text',
      text: `🎯 **「${theme}」に関連する検索キーワード提案**\n\n${relatedTopics}`
    }]
  };
}

function generateRelatedTopics(theme: string): string {
  const baseKeywords = [
    `${theme} あるある`,
    `${theme} 体験談`,
    `${theme} エピソード`,
    `${theme} 失敗談`,
    `${theme} 困った`,
    `${theme} おもしろ`,
    `${theme} 笑える`,
    `${theme} 漫才`,
    `${theme} ネタ`
  ];
  
  // テーマ別の特化キーワード
  const specialized: Record<string, string[]> = {
    'カーナビ': ['道案内', '音声案内', 'GPS', '迷子', 'ルート'],
    'コンビニ': ['レジ', '店員', '商品', '温めますか', '袋'],
    '学校': ['授業', '先生', '生徒', 'テスト', '給食', '部活'],
    '病院': ['診察', '待ち時間', '看護師', '薬', '検査'],
    '電車': ['満員電車', '遅延', '車掌', 'ドア', '座席'],
    '家族': ['お母さん', 'お父さん', '兄弟', '親子', '夫婦']
  };
  
  const themeSpecific = specialized[theme] || [];
  
  let output = '**基本キーワード：**\n';
  baseKeywords.forEach(keyword => {
    output += `- "${keyword}"\n`;
  });
  
  if (themeSpecific.length > 0) {
    output += '\n**テーマ特化キーワード：**\n';
    themeSpecific.forEach(keyword => {
      output += `- "${theme} ${keyword}"\n`;
      output += `- "${keyword} ${theme}"\n`;
    });
  }
  
  output += '\n**検索のコツ：**\n';
  output += '- "あるある"を付けると共感系のネタが見つかりやすい\n';
  output += '- "失敗談"や"困った"で実体験ベースのネタを探す\n';
  output += '- "面白い"や"笑える"で既にネタ化されたものを参考にする\n';
  output += '- TwitterやYouTubeのコメント欄も良いアイデア源\n';
  
  return output;
}