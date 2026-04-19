import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from './Common';

interface StartPageProps {
  onStart: () => void;
}

const FLOW_STEPS = [
  '监测与准备',
  '数据采集',
  '数据处理',
  '完成提交',
];

const TASK_INFO: { label: string; value: string }[] = [
  { label: '监测对象', value: '支护体系' },
  { label: '监测目的', value: '实时监测深层水平变形状态' },
  { label: '监测方法', value: '测斜仪探测 + 数字化分析' },
  { label: '监测要求', value: '按提示完成水平位移检测任务' },
];

export const StartPage: React.FC<StartPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-industrial-bg text-industrial-fg flex flex-col">
      {/* Title */}
      <header className="relative z-10 pt-10 pb-6 flex justify-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold tracking-[0.2em] uppercase text-center"
        >
          深层水平位移监测实训
        </motion.h1>
      </header>

      {/* Main card */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-6xl bg-white border-2 border-industrial-fg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row overflow-hidden"
        >
          {/* Left: Flow sidebar */}
          <aside className="md:w-56 border-b-2 md:border-b-0 md:border-r-2 border-industrial-fg p-6 bg-industrial-bg/30 flex flex-col">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] opacity-50 mb-6">
              操作流程
            </div>
            <ol className="space-y-3">
              {FLOW_STEPS.map((step, idx) => (
                <li key={step} className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-industrial-fg flex items-center justify-center text-[10px] font-mono font-bold bg-white">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px] font-bold tracking-wider">{step}</span>
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="ml-[11px] mt-1 mb-0 h-4 border-l-2 border-dashed border-industrial-fg/40" />
                  )}
                </li>
              ))}
            </ol>
          </aside>

          {/* Right: Task description + image + start */}
          <section className="flex-1 p-8 md:p-10 flex flex-col">
            {/* Task heading */}
            <div className="border-b border-industrial-fg pb-3 mb-6">
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase">任务说明</h2>
            </div>

            {/* Task info rows */}
            <div className="space-y-2.5 mb-8">
              {TASK_INFO.map(item => (
                <div key={item.label} className="flex items-start gap-4 text-[13px] leading-relaxed">
                  <span className="font-bold w-20 shrink-0 tracking-wider">{item.label}：</span>
                  <span className="flex-1">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Image placeholder */}
            <div className="flex-1 min-h-[220px] border-2 border-industrial-fg bg-industrial-bg/40 flex flex-col items-center justify-center relative overflow-hidden mb-6">
              <div className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-widest opacity-40">
               
              </div>
              <ImageIcon size={64} className="opacity-20" strokeWidth={1.5} />
              <div className="text-[11px] font-mono opacity-30 mt-2 uppercase tracking-wider">
                
              </div>
            </div>

            {/* Start button */}
            <div className="flex justify-end pt-2 border-t border-industrial-fg/10">
              <Button
                onClick={onStart}
                className="px-10 py-3 text-sm tracking-[0.3em] flex items-center gap-2"
              >
                开 始
                <ChevronRight size={16} />
              </Button>
            </div>
          </section>
        </motion.div>
      </main>

    </div>
  );
};
