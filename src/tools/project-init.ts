import * as fs from 'fs/promises';
import * as path from 'path';

export async function netaProjectInit(projectName: string, type: 'manzai' | 'conte') {
  const projectPath = path.join(process.cwd(), projectName);
  
  try {
    // プロジェクトディレクトリ作成
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(path.join(projectPath, '.neta-cho'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'analysis'), { recursive: true });
    
    // プロジェクト設定ファイル作成
    const config = {
      name: projectName,
      type: type,
      created: new Date().toISOString(),
      version: '1.0.0',
      settings: {
        defaultTempo: type === 'manzai' ? 'fast' : 'medium',
        targetDuration: type === 'manzai' ? 180 : 300, // 秒
      }
    };
    
    await fs.writeFile(
      path.join(projectPath, '.neta-cho', 'project.json'),
      JSON.stringify(config, null, 2)
    );
    
    // READMEファイル作成
    const readme = `# ${projectName}

${type === 'manzai' ? '漫才' : 'コント'}プロジェクト

作成日: ${new Date().toLocaleString('ja-JP')}

## 使い方

1. \`scripts/\` フォルダに台本を作成
2. MCP-NETA-CHOツールでアドバイスを受ける
3. \`analysis/\` フォルダで分析結果を確認

## 基本理論

- **あるある**: 共感を得る導入
- **ありそう**: 少し誇張した展開
- **ないない**: 大きく飛躍したオチ
`;
    
    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      readme
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ プロジェクト「${projectName}」を作成しました！\n\n` +
                `📁 場所: ${projectPath}\n` +
                `🎭 タイプ: ${type === 'manzai' ? '漫才' : 'コント'}\n\n` +
                `次のステップ:\n` +
                `1. cd ${projectName}\n` +
                `2. create_script ツールで台本を作成`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`プロジェクト作成に失敗: ${error}`);
  }
}