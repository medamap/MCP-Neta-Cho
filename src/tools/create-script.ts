import * as fs from 'fs/promises';
import * as path from 'path';

export async function createScript(title: string, theme?: string) {
  try {
    // プロジェクト設定を読み込み
    const configPath = path.join(process.cwd(), '.neta-cho', 'project.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!configExists) {
      throw new Error('プロジェクトが初期化されていません。先に neta_project_init を実行してください。');
    }
    
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    const type = config.type;
    
    // ファイル名生成
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${timestamp}-${title.replace(/\s+/g, '-')}.neta.md`;
    const filepath = path.join(process.cwd(), 'scripts', filename);
    
    // 台本テンプレート作成（最小限）
    const template = `---
title: ${title}
theme: ${theme || '未設定'}
type: ${type}
created: ${new Date().toISOString()}
status: draft
---

# ${title}

## テーマ
${theme || '（テーマを設定してください）'}

## 台本

**A**: 
**B**: 

---

## メモ
- 「あるある」から始めて共感を得る
- 「ありそう」で徐々にエスカレート
- 「ないない」でクライマックス
- boke_advisor ツールを使ってアイデアを広げよう！
`;
    
    await fs.writeFile(filepath, template);
    
    return {
      content: [
        {
          type: 'text',
          text: `📝 台本を作成しました！\n\n` +
                `📄 ファイル: ${filename}\n` +
                `🎭 タイプ: ${type === 'manzai' ? '漫才' : 'コント'}\n` +
                `📂 場所: scripts/${filename}\n\n` +
                `💡 ヒント:\n` +
                `- 「あるある」から始めて共感を得る\n` +
                `- 「ありそう」で少しずつエスカレート\n` +
                `- 「ないない」でクライマックスを作る\n\n` +
                `次は boke_advisor ツールでアドバイスを受けましょう！`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`台本作成に失敗: ${error}`);
  }
}