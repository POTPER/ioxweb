import { useState, useMemo } from 'react';
import { Button } from './Common';
import { InstrumentSetting } from './steps/Step9_InstrumentSetting';
import { cn } from '../lib/utils';
import {
  step9Checkpoints,
  getEffectiveSpec,
  saveCheckpointDraft,
  formatSnapshotSummary,
  downloadStep9SpecMarkdown,
  buildStep9FlowMermaid,
  type Step9Checkpoint,
} from '../data/requirements/step09CheckpointsData';

interface Step9SpecStudioProps {
  onClose: () => void;
}

function SpecMarkdownPreview({ content }: { content: string }) {
  return (
    <div className="text-xs leading-relaxed space-y-2 whitespace-pre-wrap font-sans opacity-90">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={i} className="text-[11px] font-bold uppercase tracking-wider mt-3 first:mt-0 text-industrial-fg">
              {trimmed.slice(3)}
            </h4>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-green-600 shrink-0">✓</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }
        if (!trimmed) return <div key={i} className="h-1" />;
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

export function Step9SpecStudio({ onClose }: Step9SpecStudioProps) {
  const [activeId, setActiveId] = useState(step9Checkpoints[0]?.checkpointId ?? '');
  const [draft, setDraft] = useState('');
  const [editMode, setEditMode] = useState(false);

  const active: Step9Checkpoint | undefined = useMemo(
    () => step9Checkpoints.find(c => c.checkpointId === activeId),
    [activeId]
  );

  const displaySpec = editMode ? draft : (active ? getEffectiveSpec(active) : '');

  const openCheckpoint = (cp: Step9Checkpoint) => {
    setActiveId(cp.checkpointId);
    setDraft(getEffectiveSpec(cp));
    setEditMode(false);
  };

  const handleSaveDraft = () => {
    if (!active) return;
    saveCheckpointDraft(active.checkpointId, draft);
    setEditMode(false);
  };

  const mermaid = buildStep9FlowMermaid();

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-[#E4E3E0]">
      <div
        className="h-12 border-b bg-white flex items-center px-4 justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid #141414' }}
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest">Step9 产品说明 Studio</h2>
          <p className="text-[10px] opacity-50 font-mono">时间机器快照 · 真实界面预览 · 可编辑说明</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="text-xs h-8 px-3"
            onClick={() => downloadStep9SpecMarkdown('第九步产品说明.md')}
          >
            导出 Markdown
          </Button>
          <Button variant="secondary" onClick={onClose} className="text-xs h-8 px-4">
            关闭
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 时间轴 */}
        <aside
          className="w-56 flex-shrink-0 border-r bg-white overflow-y-auto"
          style={{ borderColor: '#141414' }}
        >
          <div className="p-3 text-[9px] font-bold uppercase tracking-widest opacity-40 border-b border-industrial-fg/10">
            检查点 ({step9Checkpoints.length})
          </div>
          <ul className="p-2 space-y-1">
            {step9Checkpoints.map(cp => (
              <li key={cp.checkpointId}>
                <button
                  type="button"
                  onClick={() => openCheckpoint(cp)}
                  className={cn(
                    'w-full text-left px-2 py-2 text-[11px] border transition-colors',
                    activeId === cp.checkpointId
                      ? 'bg-industrial-fg text-industrial-bg border-industrial-fg'
                      : 'border-transparent hover:bg-industrial-bg/30'
                  )}
                >
                  <div className="font-mono text-[9px] opacity-70">{cp.checkpointId}</div>
                  <div className="font-bold">{cp.order}. {cp.title}</div>
                  <div className="text-[9px] opacity-60 truncate">{cp.subtitle}</div>
                </button>
              </li>
            ))}
          </ul>
          <details className="p-3 border-t border-industrial-fg/10 text-[10px]">
            <summary className="cursor-pointer font-bold uppercase opacity-50">流程 Mermaid</summary>
            <pre className="mt-2 p-2 bg-industrial-bg/20 overflow-x-auto text-[9px] font-mono">{mermaid}</pre>
          </details>
        </aside>

        {/* Live 预览 */}
        <main className="flex-1 min-w-0 overflow-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase opacity-50">
              真实组件预览 · {active?.checkpointId}
            </span>
            <span className="text-[9px] font-mono opacity-40">previewMode · 不提交成绩</span>
          </div>
          <div
            className="border bg-white origin-top-left"
            style={{ border: '1px solid #141414', transform: 'scale(0.92)', transformOrigin: 'top left', width: '108%' }}
          >
            {active && (
              <InstrumentSetting
                key={active.checkpointId}
                previewMode
                initialSnapshot={active.snapshot}
                onNext={() => {}}
              />
            )}
          </div>
        </main>

        {/* 说明面板 */}
        <aside
          className="w-80 flex-shrink-0 border-l bg-white flex flex-col min-h-0"
          style={{ borderColor: '#141414' }}
        >
          <div className="p-3 border-b border-industrial-fg/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">产品说明</span>
            <div className="flex gap-1">
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => {
                    if (active) setDraft(getEffectiveSpec(active));
                    setEditMode(true);
                  }}
                  className="text-[10px] px-2 py-1 border border-industrial-fg/30 hover:bg-industrial-bg"
                >
                  编辑
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="text-[10px] px-2 py-1 bg-industrial-fg text-white"
                  >
                    存草稿
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="text-[10px] px-2 py-1 border"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>

          {active && (
            <div className="p-3 border-b border-industrial-fg/10 text-[10px] font-mono space-y-1 bg-industrial-bg/5">
              <div><span className="opacity-50">线框</span> {active.wireframeRefs || '—'}</div>
              <div><span className="opacity-50">评分</span> {active.scoringRefs || '—'}</div>
              <pre className="text-[9px] mt-2 opacity-70 whitespace-pre-wrap">{formatSnapshotSummary(active.snapshot)}</pre>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            {editMode ? (
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full h-full min-h-[320px] text-xs font-mono border p-2 resize-none focus:outline-none"
                style={{ borderColor: '#141414' }}
              />
            ) : (
              active && <SpecMarkdownPreview content={displaySpec} />
            )}
          </div>
          <div className="p-2 text-[9px] opacity-40 border-t border-industrial-fg/10">
            草稿保存在 localStorage；导出 Markdown 合并全部检查点说明
          </div>
        </aside>
      </div>
    </div>
  );
}
