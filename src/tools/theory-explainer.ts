import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '../../knowledge-base');

export async function explainTheory(topic: string) {
  try {
    // 理論データを読み込む
    const theoryPath = path.join(KNOWLEDGE_BASE_PATH, 'dictionaries', 'comedy-theory.json');
    const theoryData = await fs.readFile(theoryPath, 'utf-8');
    const theory = JSON.parse(theoryData);

    let explanation = '';
    
    switch (topic.toLowerCase()) {
      case 'patterns':
      case 'パターン':
        const patterns = theory.fundamental_patterns;
        explanation = `🎭 基本パターン理論\n\n`;
        for (const [key, pattern] of Object.entries(patterns)) {
          const p = pattern as any;
          explanation += `**${p.name}**\n`;
          explanation += `${p.description}\n`;
          explanation += `難易度: ${'★'.repeat(p.difficulty)}\n`;
          if (p.tip) explanation += `💡 ${p.tip}\n`;
          if (p.warning) explanation += `⚠️ ${p.warning}\n`;
          explanation += '\n';
        }
        break;

      case 'structure':
      case '構成':
        const structure = theory.script_structure;
        explanation = `📋 台本の構成\n\n`;
        for (const [key, section] of Object.entries(structure)) {
          const s = section as any;
          explanation += `**${s.name}** (全体の${(s.duration_ratio * 100).toFixed(0)}%)\n`;
          explanation += `目的: ${s.purpose}\n`;
          explanation += `ポイント:\n`;
          s.key_points.forEach((point: string) => {
            explanation += `• ${point}\n`;
          });
          explanation += '\n';
        }
        break;

      case 'timing':
      case 'タイミング':
      case '間':
        const timing = theory.timing_principles;
        explanation = `⏱️ タイミングの理論\n\n`;
        
        // 間について
        const ma = timing.ma;
        explanation += `**${ma.name}**\n`;
        explanation += `${ma.description}\n`;
        for (const [type, desc] of Object.entries(ma.types)) {
          explanation += `• ${desc}\n`;
        }
        explanation += '\n';
        
        // テンポについて
        const tempo = timing.tempo;
        explanation += `**${tempo.name}**\n`;
        explanation += `${tempo.description}\n`;
        
        break;

      case 'boke':
      case 'ボケ':
        const bokeTypesPath = path.join(KNOWLEDGE_BASE_PATH, 'dictionaries', 'boke-types.json');
        const bokeData = await fs.readFile(bokeTypesPath, 'utf-8');
        const bokeTypes = JSON.parse(bokeData);
        
        explanation = `😄 ボケの種類と技法\n\n`;
        for (const [key, type] of Object.entries(bokeTypes.boke_types)) {
          const t = type as any;
          explanation += `**${t.name}**\n`;
          explanation += `${t.description}\n`;
          explanation += `技法:\n`;
          t.techniques.forEach((tech: string) => {
            explanation += `• ${tech}\n`;
          });
          explanation += '\n';
        }
        break;

      case 'tsukkomi':
      case 'ツッコミ':
        const tsukkoomiTypesPath = path.join(KNOWLEDGE_BASE_PATH, 'dictionaries', 'tsukkomi-types.json');
        const tsukkomiData = await fs.readFile(tsukkoomiTypesPath, 'utf-8');
        const tsukkomiTypes = JSON.parse(tsukkomiData);
        
        explanation = `💢 ツッコミの種類と使い方\n\n`;
        for (const [key, type] of Object.entries(tsukkomiTypes.tsukkomi_types)) {
          const t = type as any;
          explanation += `**${t.name}**\n`;
          explanation += `${t.description}\n`;
          explanation += `例: ${t.examples.join(', ')}\n`;
          explanation += `使用場面: ${t.usage}\n\n`;
        }
        break;

      default:
        explanation = `❓ トピック「${topic}」についての説明が見つかりません。\n\n`;
        explanation += `利用可能なトピック:\n`;
        explanation += `• patterns / パターン - 基本パターン理論\n`;
        explanation += `• structure / 構成 - 台本の構成\n`;
        explanation += `• timing / タイミング / 間 - タイミングの理論\n`;
        explanation += `• boke / ボケ - ボケの種類\n`;
        explanation += `• tsukkomi / ツッコミ - ツッコミの種類`;
    }

    return {
      content: [
        {
          type: 'text',
          text: explanation,
        },
      ],
    };
  } catch (error) {
    throw new Error(`理論説明エラー: ${error}`);
  }
}