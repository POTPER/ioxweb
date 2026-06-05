/**
 * 从 step09InteractionFlows.ts 生成可打印 HTML
 * 运行: npx tsx scripts/generate-step09-interaction-html.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportStep09InteractionJson } from '../src/data/requirements/step09InteractionFlows.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../docs/step09-instrument-interaction.html');
const dataJson = exportStep09InteractionJson();

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>读数仪交互逻辑说明 — Q09</title>
  <style>
    :root {
      --industrial-bg: #E4E3E0;
      --industrial-fg: #141414;
      --industrial-surface: #FFFFFF;
      --callout-bg: #FFF8E1;
      --callout-border: #F9A825;
      --lcd-bg: #E4E3E0;
      --highlight: #141414;
      --highlight-fg: #FFFFFF;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Inter", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
      background: var(--industrial-bg);
      color: var(--industrial-fg);
      line-height: 1.45;
      font-size: 13px;
    }
    .page { max-width: 1200px; margin: 0 auto; padding: 16px 20px 40px; }
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 2px solid var(--industrial-fg);
    }
    .toolbar h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .toolbar .meta { font-size: 11px; opacity: 0.6; font-family: ui-monospace, monospace; }
    .btn-print {
      background: var(--industrial-fg); color: #fff; border: none;
      padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
    }
    .btn-print:hover { opacity: 0.9; }
    .section-title {
      font-size: 14px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; margin: 24px 0 12px;
      padding-bottom: 6px; border-bottom: 1px solid var(--industrial-fg);
    }
    .card {
      background: var(--industrial-surface);
      border: 1px solid var(--industrial-fg);
      box-shadow: 3px 3px 0 rgba(20,20,20,1);
      padding: 12px;
      margin-bottom: 12px;
    }
    /* Part A: layout overview */
    .layout-grid {
      display: grid;
      grid-template-columns: 7fr 5fr;
      gap: 10px;
      min-height: 320px;
    }
    .zone {
      border: 2px dashed var(--industrial-fg);
      padding: 10px;
      position: relative;
      background: #fafafa;
    }
    .zone-label {
      position: absolute; top: 6px; left: 8px;
      font-size: 10px; font-weight: 700; font-family: ui-monospace, monospace;
      background: var(--industrial-fg); color: #fff; padding: 2px 6px;
    }
    .zone-right { display: flex; flex-direction: column; gap: 10px; }
    .zone ul { margin: 28px 0 0; padding-left: 18px; font-size: 11px; }
    .zone .unlock { font-size: 10px; opacity: 0.55; margin-top: 8px; }
    .device-mock {
      flex: 1; min-height: 140px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 2px solid var(--industrial-fg); background: #fff;
      font-family: ui-monospace, monospace; font-size: 10px;
    }
    .device-mock .lcd-mini {
      width: 80%; height: 48px; background: var(--lcd-bg);
      border: 1px solid var(--industrial-fg); margin-bottom: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .diff-list { font-size: 12px; margin: 0; padding-left: 18px; }
    .diff-list li { margin-bottom: 4px; }
    /* Part B: screen cards */
    .flow-board {
      display: flex; flex-wrap: wrap; gap: 16px;
      align-items: flex-start;
    }
    .screen-card {
      flex: 1 1 340px;
      max-width: 100%;
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 10px;
      page-break-inside: avoid;
    }
    .screen-device {
      border: 2px solid var(--industrial-fg);
      background: #fff;
      padding: 8px;
    }
    .screen-order {
      font-size: 10px; font-weight: 700; font-family: ui-monospace, monospace;
      margin-bottom: 4px; opacity: 0.6;
    }
    .screen-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
    .lcd {
      background: var(--lcd-bg);
      border: 1px solid var(--industrial-fg);
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 9px;
      padding: 6px 8px;
      min-height: 100px;
      line-height: 1.35;
    }
    .lcd .hl { background: var(--highlight); color: var(--highlight-fg); margin: 0 -4px; padding: 0 4px; }
    .lcd .dim { opacity: 0.45; }
    .nav-keys {
      display: flex; gap: 4px; justify-content: center; margin-top: 8px;
    }
    .nav-keys span {
      width: 28px; height: 28px; border: 2px solid var(--industrial-fg);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; background: var(--industrial-bg);
    }
    .nav-keys .ok { background: var(--industrial-fg); color: #fff; }
    .callouts { display: flex; flex-direction: column; gap: 8px; }
    .callout {
      background: var(--callout-bg);
      border-left: 4px solid var(--callout-border);
      padding: 8px 10px;
      font-size: 11px;
    }
    .callout h4 {
      margin: 0 0 6px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .callout ul { margin: 0; padding-left: 16px; }
    .callout li { margin-bottom: 3px; }
    .callout table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .callout th, .callout td { border: 1px solid rgba(0,0,0,0.15); padding: 3px 5px; text-align: left; vertical-align: top; }
    .callout th { background: rgba(0,0,0,0.06); width: 28%; }
    .transitions { font-size: 10px; margin-top: 6px; opacity: 0.8; }
    .transitions span { display: inline-block; margin-right: 8px; }
    .controls-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .controls-table th, .controls-table td { border: 1px solid var(--industrial-fg); padding: 6px 8px; text-align: left; }
    .controls-table th { background: #f0f0f0; width: 22%; }
    .mermaid-fallback {
      font-family: ui-monospace, monospace; font-size: 10px;
      white-space: pre-wrap; background: #f5f5f5; padding: 10px;
      border: 1px solid var(--industrial-fg);
    }
    @media print {
      body { background: #fff; }
      .toolbar .btn-print { display: none; }
      .page { padding: 0; max-width: none; }
      .screen-card { break-inside: avoid; }
      .callout { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="toolbar">
      <div>
        <h1>读数仪交互逻辑说明</h1>
        <div class="meta">Q09 · acq.instrument · 生成自 step09InteractionFlows.ts</div>
      </div>
      <button class="btn-print" onclick="window.print()">打印 / 导出 PDF</button>
    </div>

    <div class="section-title">Part A — 实训界面总览</div>
    <div class="card layout-grid" id="layout-overview"></div>

    <div class="section-title">与参考图的差异</div>
    <div class="card"><ul class="diff-list" id="ref-diffs"></ul></div>

    <div class="section-title">物理控件一览</div>
    <div class="card"><table class="controls-table" id="controls-table"></table></div>

    <div class="section-title">Part B — LCD 逐屏交互板</div>
    <div class="flow-board" id="flow-board"></div>

    <div class="section-title">Part C — LCD 界面总流转</div>
    <div class="card mermaid-fallback" id="flow-mermaid"></div>
  </div>

  <script id="step09-data" type="application/json">${dataJson}</script>
  <script>
    const DATA = JSON.parse(document.getElementById('step09-data').textContent);

    function renderLayout() {
      const el = document.getElementById('layout-overview');
      const d = DATA.layoutZones.find(z => z.id === 'D');
      const m = DATA.layoutZones.find(z => z.id === 'M');
      const i = DATA.layoutZones.find(z => z.id === 'I');
      el.innerHTML = \`
        <div class="zone">
          <span class="zone-label">\${d.label}</span>
          <ul>\${d.items.map(x => '<li>' + x + '</li>').join('')}</ul>
          <div class="unlock">\${d.unlock}</div>
        </div>
        <div class="zone-right">
          <div class="zone" style="flex:1">
            <span class="zone-label">\${m.label}</span>
            <ul>\${m.items.map(x => '<li>' + x + '</li>').join('')}</ul>
            <div class="unlock">\${m.unlock}</div>
          </div>
          <div class="zone">
            <span class="zone-label">\${i.label}</span>
            <div class="device-mock">
              <div class="lcd-mini">LCD</div>
              <div>[←][OK][↑][↓] &nbsp; ⏻ &nbsp; ○探头</div>
            </div>
            <div class="unlock">\${i.unlock}</div>
          </div>
        </div>
      \`;
    }

    function renderDiffs() {
      document.getElementById('ref-diffs').innerHTML =
        DATA.referenceDiffs.map(d => '<li>' + d + '</li>').join('');
    }

    function renderControls() {
      const rows = DATA.physicalControls.map(c =>
        '<tr><th>' + c.control + '</th><td>' + c.action + '</td></tr>'
      ).join('');
      document.getElementById('controls-table').innerHTML =
        '<thead><tr><th>控件</th><th>作用</th></tr></thead><tbody>' + rows + '</tbody>';
    }

    function renderLcd(lines, highlightLine) {
      return lines.map((line, i) => {
        const cls = i === highlightLine ? 'hl' : (line === '' ? 'dim' : '');
        return '<div class="' + cls + '">' + (line || '&nbsp;') + '</div>';
      }).join('');
    }

    function renderScreens() {
      const board = document.getElementById('flow-board');
      board.innerHTML = DATA.screens.map(s => {
        const interactions = s.interactions.map(i =>
          '<tr><th>' + i.control + '</th><td>' + i.action + '</td></tr>'
        ).join('');
        const initial = s.initialState.map(x => '<li>' + x + '</li>').join('');
        const trans = s.transitions.map(t =>
          '<span>→ <b>' + t.to + '</b>：' + t.when + '</span>'
        ).join('');
        const webNotes = (s.webAreaNotes || []).length
          ? '<div class="callout"><h4>Web 区补充</h4><ul>' +
            s.webAreaNotes.map(n => '<li>' + n + '</li>').join('') + '</ul></div>'
          : '';
        return \`
          <div class="card screen-card">
            <div class="screen-device">
              <div class="screen-order">\${s.id} · \${s.lcdScreen}</div>
              <div class="screen-title">\${s.order}. \${s.title}</div>
              <div class="lcd">\${renderLcd(s.mockupLines, s.highlightLine)}</div>
              <div class="nav-keys">
                <span>←</span><span class="ok">OK</span><span>↑</span><span>↓</span>
              </div>
            </div>
            <div class="callouts">
              <div class="callout">
                <h4>初始状态</h4>
                <ul>\${initial}</ul>
              </div>
              <div class="callout">
                <h4>交互说明</h4>
                <table><tbody>\${interactions}</tbody></table>
                <div class="transitions">\${trans}</div>
              </div>
              \${webNotes}
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderMermaid() {
      document.getElementById('flow-mermaid').textContent = DATA.flowMermaid;
    }

    renderLayout();
    renderDiffs();
    renderControls();
    renderScreens();
    renderMermaid();
  </script>
</body>
</html>
`;

writeFileSync(outPath, html, 'utf-8');
console.log('Wrote', outPath);
