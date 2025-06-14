#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ツールのインポート
import { netaProjectInit } from './tools/project-init.js';
import { createScript } from './tools/create-script.js';
import { bokeAdvisor } from './tools/boke-advisor.js';
import { analyzeBalance } from './tools/analyze-balance.js';
import { showCreationProcess } from './tools/show-process.js';
import { getCreationGuide, updateCreationState } from './tools/creation-guide.js';
import { explainTheory } from './tools/theory-explainer.js';
import { getWizardStep, updateWizardStep, showWizardStatus, showBokeList } from './tools/creation-wizard.js';
import { startWizard, nextQuestion, showWizardAnswers, getHint } from './tools/interactive-wizard.js';
import { evaluateScript } from './tools/evaluate-script.js';
import { proposeBokeSequence, generateScript } from './tools/script-composer.js';
import { researchBokeIdeas, analyzeWebResults, suggestRelatedTopics } from './tools/web-research.js';
import { autoSearchBokeIdeas, searchAndAnalyze } from './tools/auto-web-search.js';
import { requestFullAuto, startFullAutoCreation, checkAutoProgress, listAutoSessions } from './tools/full-auto-creator.js';
import { executeStep2Generate, executeStep3Compose, executeStep4Script, executeStep5Evaluate, viewCompletedScript } from './tools/auto-steps.js';

const server = new Server(
  {
    name: 'mcp-neta-cho',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧の定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_wizard',
        description: '対話形式で台本を作成開始（MCPは質問するだけ）',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'next_question',
        description: '回答を入力して次の質問へ',
        inputSchema: {
          type: 'object',
          properties: {
            answer: {
              type: ['string', 'array'],
              description: 'あなたの回答',
            },
          },
          required: ['answer'],
        },
      },
      {
        name: 'show_wizard_answers',
        description: 'これまでの回答を確認',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_hint',
        description: 'ヒントが欲しい時に（ボケ、あるある、オチなど）',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'ヒントが欲しいトピック',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'neta_project_init',
        description: '新しい漫才・コントプロジェクトを初期化します',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'プロジェクト名',
            },
            type: {
              type: 'string',
              enum: ['manzai', 'conte'],
              description: 'プロジェクトタイプ（漫才またはコント）',
            },
          },
          required: ['projectName', 'type'],
        },
      },
      {
        name: 'create_script',
        description: '新しい台本ファイルを作成します',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '台本のタイトル',
            },
            theme: {
              type: 'string',
              description: 'テーマ（例：学校、コンビニ、etc）',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'boke_advisor',
        description: 'ボケに関するアドバイスを提供します',
        inputSchema: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              description: '現在の文脈や設定',
            },
            level: {
              type: 'string',
              enum: ['aruaru', 'arisou', 'nainai'],
              description: 'ボケのレベル',
            },
          },
          required: ['context', 'level'],
        },
      },
      {
        name: 'analyze_balance',
        description: '台本のバランスを分析します',
        inputSchema: {
          type: 'object',
          properties: {
            scriptPath: {
              type: 'string',
              description: '分析する台本ファイルのパス',
            },
          },
          required: ['scriptPath'],
        },
      },
      {
        name: 'show_creation_process',
        description: '台本作成の全体プロセスを表示します',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'creation_guide',
        description: 'ステップバイステップの作成ガイドを表示・更新します',
        inputSchema: {
          type: 'object',
          properties: {
            stepName: {
              type: 'string',
              description: '表示するステップ名（省略時は現在のステップ）',
            },
          },
        },
      },
      {
        name: 'update_creation_state',
        description: '作成プロセスの状態を更新します',
        inputSchema: {
          type: 'object',
          properties: {
            stepName: {
              type: 'string',
              description: '完了したステップ名',
            },
            data: {
              type: 'object',
              description: 'ステップで決定したデータ',
            },
          },
          required: ['stepName', 'data'],
        },
      },
      {
        name: 'explain_theory',
        description: '漫才・コントの理論を説明します',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'patterns, structure, timing, boke, tsukkomi など',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'wizard_step',
        description: 'ウィザード形式で台本を作成（現在のステップを表示）',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: {
              type: 'number',
              description: 'ステップID（省略時は現在のステップ）',
            },
          },
        },
      },
      {
        name: 'wizard_update',
        description: 'ウィザードのステップを完了して次へ進む',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: {
              type: 'number',
              description: '完了するステップID',
            },
            data: {
              type: ['string', 'array', 'object'],
              description: '入力データ',
            },
          },
          required: ['stepId', 'data'],
        },
      },
      {
        name: 'wizard_status',
        description: '現在の設定状況を表示',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'show_boke_list',
        description: '作成したボケの一覧を表示',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'evaluate_script',
        description: '作成した台本を評価してアドバイス',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'propose_sequence',
        description: 'ボケの順序とツッコミの組み合わせを提案',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_script',
        description: '最終的な台本を生成（ト書き付き）',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'research_boke_ideas',
        description: 'ネットでボケアイデアを調査（検索方法を提案）',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: '調査するテーマ（省略時はウィザードのテーマを使用）',
            },
          },
        },
      },
      {
        name: 'analyze_web_results',
        description: '検索結果を分析してボケアイデアを抽出',
        inputSchema: {
          type: 'object',
          properties: {
            searchResults: {
              type: 'string',
              description: 'Web検索の結果テキスト',
            },
          },
          required: ['searchResults'],
        },
      },
      {
        name: 'suggest_search_keywords',
        description: 'テーマに関連する検索キーワードを提案',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: '検索キーワードを生成するテーマ',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'auto_search_boke',
        description: '自動ボケ調査（検索手順を詳細に案内）',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: '調査するテーマ',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'search_and_analyze',
        description: '検索と分析の統合ガイド',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: '調査するテーマ',
            },
            searchTool: {
              type: 'string',
              enum: ['tavily', 'brave'],
              description: '使用する検索ツール（デフォルト: tavily）',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'request_full_auto',
        description: 'フルオート台本作成をリクエスト（確認画面を表示）',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: '台本のテーマ',
            },
            genre: {
              type: 'string',
              enum: ['manzai', 'conte'],
              description: '漫才またはコント',
            },
            concept: {
              type: 'string',
              description: 'コンセプトや方向性（任意）',
            },
            duration: {
              type: 'string',
              description: '想定時間（任意）',
            },
            targetAudience: {
              type: 'string',
              description: '対象観客（任意）',
            },
            specialRequests: {
              type: 'string',
              description: '特別な要望（任意）',
            },
          },
          required: ['theme', 'genre'],
        },
      },
      {
        name: 'start_full_auto_creation',
        description: 'フルオート作成を実際に開始',
        inputSchema: {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              description: 'フルオート実行を確認したかどうか',
            },
            theme: {
              type: 'string',
              description: '台本のテーマ',
            },
            genre: {
              type: 'string',
              enum: ['manzai', 'conte'],
              description: '漫才またはコント',
            },
            concept: {
              type: 'string',
              description: 'コンセプトや方向性（任意）',
            },
            duration: {
              type: 'string',
              description: '想定時間（任意）',
            },
            targetAudience: {
              type: 'string',
              description: '対象観客（任意）',
            },
            specialRequests: {
              type: 'string',
              description: '特別な要望（任意）',
            },
          },
          required: ['confirmed', 'theme', 'genre'],
        },
      },
      {
        name: 'check_auto_progress',
        description: 'フルオート作成の進捗を確認',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'list_auto_sessions',
        description: '過去のフルオート作成セッション一覧',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'auto_step_1_research',
        description: 'フルオート ステップ1: Web調査実行',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'auto_step_2_generate',
        description: 'フルオート ステップ2: ボケ生成実行',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'auto_step_3_compose',
        description: 'フルオート ステップ3: 構成設計実行',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'auto_step_4_script',
        description: 'フルオート ステップ4: 台本作成実行',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'auto_step_5_evaluate',
        description: 'フルオート ステップ5: 評価実行',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'view_completed_script',
        description: '完成した台本を表示',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'セッションID',
            },
          },
          required: ['sessionId'],
        },
      },
    ],
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('引数が指定されていません');
  }

  try {
    switch (name) {
      case 'start_wizard':
        return await startWizard();
      
      case 'next_question':
        return await nextQuestion(args.answer);
      
      case 'show_wizard_answers':
        return await showWizardAnswers();
      
      case 'get_hint':
        return await getHint(args.topic as string);
      
      case 'neta_project_init':
        return await netaProjectInit(
          args.projectName as string,
          args.type as 'manzai' | 'conte'
        );
      
      case 'create_script':
        return await createScript(
          args.title as string,
          args.theme as string | undefined
        );
      
      case 'boke_advisor':
        return await bokeAdvisor(
          args.context as string,
          args.level as 'aruaru' | 'arisou' | 'nainai'
        );
      
      case 'analyze_balance':
        return await analyzeBalance(args.scriptPath as string);
      
      case 'show_creation_process':
        return await showCreationProcess();
      
      case 'creation_guide':
        return await getCreationGuide(args.stepName as string | undefined);
      
      case 'update_creation_state':
        return await updateCreationState(
          args.stepName as string,
          args.data as any
        );
      
      case 'explain_theory':
        return await explainTheory(args.topic as string);
      
      case 'wizard_step':
        return await getWizardStep(args.stepId as number | undefined);
      
      case 'wizard_update':
        return await updateWizardStep(
          args.stepId as number,
          args.data
        );
      
      case 'wizard_status':
        return await showWizardStatus();
      
      case 'show_boke_list':
        return await showBokeList();
      
      case 'evaluate_script':
        return await evaluateScript();
      
      case 'propose_sequence':
        return await proposeBokeSequence();
      
      case 'generate_script':
        return await generateScript();
      
      case 'research_boke_ideas':
        return await researchBokeIdeas(args.theme as string);
      
      case 'analyze_web_results':
        return await analyzeWebResults(args.searchResults as string);
      
      case 'suggest_search_keywords':
        return await suggestRelatedTopics(args.theme as string);
      
      case 'auto_search_boke':
        return await autoSearchBokeIdeas(args.theme as string);
      
      case 'search_and_analyze':
        return await searchAndAnalyze(
          args.theme as string,
          args.searchTool as 'tavily' | 'brave'
        );
      
      case 'request_full_auto':
        return await requestFullAuto(
          args.theme as string,
          args.genre as 'manzai' | 'conte',
          args.concept as string,
          args.duration as string,
          args.targetAudience as string,
          args.specialRequests as string
        );
      
      case 'start_full_auto_creation':
        return await startFullAutoCreation(
          args.confirmed as boolean,
          {
            theme: args.theme as string,
            genre: args.genre as 'manzai' | 'conte',
            concept: args.concept as string,
            duration: args.duration as string,
            targetAudience: args.targetAudience as string,
            specialRequests: args.specialRequests as string
          }
        );
      
      case 'check_auto_progress':
        return await checkAutoProgress(args.sessionId as string);
      
      case 'list_auto_sessions':
        return await listAutoSessions();
      
      case 'auto_step_1_research':
        return await import('./tools/auto-steps.js').then(m => 
          m.executeAutoStep1Research(args.sessionId as string)
        );
      
      case 'auto_step_2_generate':
        return await executeStep2Generate(args.sessionId as string);
      
      case 'auto_step_3_compose':
        return await executeStep3Compose(args.sessionId as string);
      
      case 'auto_step_4_script':
        return await executeStep4Script(args.sessionId as string);
      
      case 'auto_step_5_evaluate':
        return await executeStep5Evaluate(args.sessionId as string);
      
      case 'view_completed_script':
        return await viewCompletedScript(args.sessionId as string);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        },
      ],
    };
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);