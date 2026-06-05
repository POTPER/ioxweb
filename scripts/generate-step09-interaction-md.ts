/**
 * 从 step09InteractionFlows.ts 生成 .doc/读数仪交互逻辑.md
 * 运行: npx tsx scripts/generate-step09-interaction-md.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportStep09InteractionMarkdownBody } from '../src/data/requirements/step09InteractionFlows.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../.doc/读数仪交互逻辑.md');

const header = `# 读数仪设置与数据采集 — 交互逻辑说明

> **对应步骤**：Q09 · \`acq.instrument\`  
> **实现文件**：\`src/components/steps/Step9_InstrumentSetting.tsx\`  
> **数据期次**：监测数据表第 6 期（\`monitoringPeriodData.csv\`）  
> **打印版**：[docs/step09-instrument-interaction.html](../docs/step09-instrument-interaction.html)（浏览器打开后可打印 / 导出 PDF）  
> **单一事实来源**：\`src/data/requirements/step09InteractionFlows.ts\`  
> **更新**：2026-06-04

本文档采用「整体布局 + 逐屏流程 + 初始状态 / 交互说明」版式，对齐投标交互说明图结构；内容以当前 Step9 实现为准。

---

`;

writeFileSync(outPath, header + exportStep09InteractionMarkdownBody(), 'utf-8');
console.log('Wrote', outPath);
