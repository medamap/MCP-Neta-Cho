import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '../../knowledge-base');

export async function getBokePatterns(theme: string, level: string): Promise<any[]> {
  try {
    const patternsPath = path.join(KNOWLEDGE_BASE_PATH, 'dictionaries', 'boke-patterns.json');
    const data = await fs.readFile(patternsPath, 'utf-8');
    const patterns = JSON.parse(data);
    
    if (patterns[level]?.examples[theme]) {
      return patterns[level].examples[theme].patterns;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to load boke patterns:', error);
    return [];
  }
}

export async function getAruaruList(theme: string): Promise<string[]> {
  try {
    const aruaruPath = path.join(KNOWLEDGE_BASE_PATH, 'dictionaries', 'aruaru.json');
    const data = await fs.readFile(aruaruPath, 'utf-8');
    const aruaru = JSON.parse(data);
    
    return aruaru[theme] || [];
  } catch (error) {
    console.error('Failed to load aruaru list:', error);
    return [];
  }
}

export async function getTsukkomiPatterns(bokeType: string): Promise<any[]> {
  // TODO: ツッコミパターンのJSONを作成後に実装
  return [];
}

export async function getTheoryByTopic(topic: string): Promise<any> {
  // TODO: 理論データのJSONを作成後に実装
  return null;
}