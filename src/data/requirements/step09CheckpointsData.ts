/**
 * Step9 产品说明检查点 — 从 CSV 加载说明文案
 */

import checkpointsCSV from './step09-checkpoints.csv?raw';
import { STEP9_SNAPSHOT_BY_ID, type Step9Snapshot } from './step09Snapshots';

export type Step9Checkpoint = {
  checkpointId: string;
  stepId: string;
  order: number;
  title: string;
  subtitle: string;
  wireframeRefs: string;
  scoringRefs: string;
  specMarkdown: string;
  snapshot: Step9Snapshot;
};

function parseCSV(csv: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(current);
    current = '';
  };

  const pushRow = () => {
    if (row.length > 0 || current.length > 0) {
      pushField();
      result.push(row);
      row = [];
    }
  };

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      pushField();
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      pushRow();
    } else {
      current += char;
    }
  }

  pushRow();
  return result;
}

function loadCheckpoints(): Step9Checkpoint[] {
  const rows = parseCSV(checkpointsCSV);
  const items: Step9Checkpoint[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const checkpointId = row[0];
    const snapshot = STEP9_SNAPSHOT_BY_ID[checkpointId];
    if (!snapshot) continue;

    items.push({
      checkpointId,
      stepId: row[1] ?? 'acq.instrument',
      order: Number(row[2] ?? i),
      title: row[3] ?? snapshot.title,
      subtitle: row[4] ?? '',
      wireframeRefs: row[5] ?? '',
      scoringRefs: row[6] ?? '',
      specMarkdown: row[7] ?? '',
      snapshot,
    });
  }

  return items.sort((a, b) => a.order - b.order);
}

export const step9Checkpoints: Step9Checkpoint[] = loadCheckpoints();

const DRAFT_STORAGE_KEY = 'ioxweb.step09.checkpointDrafts.v1';

export function loadCheckpointDraft(checkpointId: string): string | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[checkpointId] ?? null;
  } catch {
    return null;
  }
}

export function saveCheckpointDraft(checkpointId: string, markdown: string) {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[checkpointId] = markdown;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getEffectiveSpec(checkpoint: Step9Checkpoint): string {
  return loadCheckpointDraft(checkpoint.checkpointId) ?? checkpoint.specMarkdown;
}

export function formatSnapshotSummary(snapshot: Step9Snapshot): string {
  const lines = [
    `phase=${snapshot.phase} · lcd=${snapshot.lcdScreen}`,
    `测区 ${snapshot.params.area} · 孔 ${snapshot.params.hole} · 深 ${snapshot.params.depth}m`,
    `探头 ${snapshot.probe.direction} · 步长 ${snapshot.probe.stepLength}m`,
  ];
  if (snapshot.measureType) {
    lines.push(`测量 ${snapshot.measureType === 'forward' ? '正测' : '反测'} · 深度 ${snapshot.currentDepth ?? '—'}m`);
  }
  if (snapshot.showMovePrompt) lines.push('状态：待上提');
  if (snapshot.showCableModal) lines.push('状态：线材弹窗');
  return lines.join('\n');
}

export function exportStep9SpecMarkdown(checkpoints: Step9Checkpoint[] = step9Checkpoints): string {
  const header = `# 第九步 · 读数仪设置与数据采集 — 产品说明

> 自动生成于 ${new Date().toISOString().slice(0, 10)} · 数据源 step09-checkpoints.csv

## 流程概览

${checkpoints.map(c => `${c.order}. **${c.title}** (${c.checkpointId})`).join('\n')}

---

`;

  const body = checkpoints
    .map(c => {
      const spec = getEffectiveSpec(c);
      return `## ${c.order}. ${c.title}（${c.checkpointId}）

${c.subtitle ? `> ${c.subtitle}\n\n` : ''}**线框引用：** ${c.wireframeRefs || '—'}  
**评分题：** ${c.scoringRefs || '—'}

**状态摘要：**
\`\`\`
${formatSnapshotSummary(c.snapshot)}
\`\`\`

${spec}
`;
    })
    .join('\n---\n\n');

  return header + body;
}

export function downloadStep9SpecMarkdown(filename = '第九步产品说明.md') {
  const content = exportStep9SpecMarkdown();
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildStep9FlowMermaid(checkpoints: Step9Checkpoint[] = step9Checkpoints): string {
  const nodes = checkpoints.map(c => `  ${c.checkpointId}["${c.order}. ${c.title}"]`);
  const edges = checkpoints.slice(1).map((c, i) => `  ${checkpoints[i].checkpointId} --> ${c.checkpointId}`);
  return `flowchart LR\n${nodes.join('\n')}\n${edges.join('\n')}`;
}
