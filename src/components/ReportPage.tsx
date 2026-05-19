import React from 'react';
import { Button } from './Common';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { scoringConfigs } from '../data/scoringConfig';
import {
  User, Calendar, Clock, Award, ChevronDown,
  ChevronRight, CheckCircle2, XCircle, FileText, Printer, 
  Download, Home
} from 'lucide-react';

// --- Types for the Report ---

export interface QuestionResult {
  id: string;
  label: string;
  type: 'choice' | 'input' | 'hotspot' | 'multi';
  score: number;
  maxScore: number;
  correct: boolean;
  userAnswer: string;
  correctAnswer?: string;
  userAnswerLabel?: string;
  correctAnswerLabel?: string;
  correctRange?: [number, number];
  unit?: string;
  analysis?: string;
  explanation?: string;
}

export interface StepResult {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  questions: QuestionResult[];
}

export interface ModuleResult {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  duration: number; // in seconds
  steps: StepResult[];
}

export interface ReportData {
  student: {
    name: string;
    studentId: string;
    className: string;
  };
  exam: {
    startTime: string;
    endTime: string;
    totalDuration: number;
    totalScore: number;
    totalMaxScore: number;
  };
  modules: ModuleResult[];
  radar: {
    dimensions: string[];
    values: number[];
  };
}

// --- Mock Data Generator (for demonstration) ---
export const generateMockReport = (studentName: string, stepData?: Record<string, any>): ReportData => {
  const stepAliases = Object.fromEntries(
    Object.values(scoringConfigs).map(config => [config.reportStepId, config.appStepId])
  );
  const legacyStepAliases: Record<string, string> = {
    'Q01': 'prep.tech',
    'Q02': 'prep.material',
    'Q03': 'prep.assembly',
    'Q04': 'prep.cage',
    'Q05': 'prep.inspection',
    'S01': 'prep.tech',
    'S02': 'prep.material',
    'S03': 'prep.assembly',
    'S04': 'prep.cage',
    'S05': 'prep.inspection',
    '4.2.1-1': 'prep.tech',
    '4.2.1-2-1': 'prep.material',
    '4.2.1-2-2': 'prep.assembly',
    '4.2.1-2-3': 'prep.cage',
    '4.2.1-3-1': 'prep.inspection',
    '4.2.2-2': '9',
  };

  const getStep = (id: string) => {
    const alias = stepAliases[id];
    const legacyAlias = legacyStepAliases[id];
    const legacyAppAlias = legacyAlias ? stepAliases[legacyAlias] : undefined;
    return stepData?.[id] || (alias ? stepData?.[alias] : undefined) || (legacyAlias ? stepData?.[legacyAlias] : undefined) || (legacyAppAlias ? stepData?.[legacyAppAlias] : undefined) || { score: 0, totalScore: 0, maxScore: 0, answers: [] };
  };

  const m1Steps = ['prep.tech', 'prep.material', 'prep.assembly', 'prep.cage', 'prep.inspection', '4.2.1-3-2', '4.2.1-4'];
  const m2Steps = ['4.2.2-1', '4.2.2-2'];
  const m3Steps = ['4.2.3-1', '4.2.3-2', '4.2.3-3'];

  const calculateModuleScore = (stepIds: string[]) => {
    return stepIds.reduce((acc, id) => {
      const step = getStep(id);
      return acc + (step.totalScore || step.score || 0);
    }, 0);
  };

  const calculateModuleMaxScore = (stepIds: string[]) => {
    const maxScores: Record<string, number> = {
      'prep.tech': 3, 'prep.material': 2, 'prep.assembly': 4, 'prep.cage': 4, 'prep.inspection': 4, '4.2.1-1': 3, '4.2.1-2-1': 2, '4.2.1-2-2': 4, '4.2.1-2-3': 4, '4.2.1-3-1': 4, '4.2.1-3-2': 4, '4.2.1-4': 4,
      '4.2.2-1': 6, '4.2.2-2': 26,
      '4.2.3-1': 5, '4.2.3-2': 16, '4.2.3-3': 22
    };
    return stepIds.reduce((acc, id) => acc + (maxScores[id] || 0), 0);
  };

  const m1Score = calculateModuleScore(m1Steps);
  const m1Max = calculateModuleMaxScore(m1Steps);
  const m2Score = calculateModuleScore(m2Steps);
  const m2Max = calculateModuleMaxScore(m2Steps);
  const m3Score = calculateModuleScore(m3Steps);
  const m3Max = calculateModuleMaxScore(m3Steps);

  const totalScore = m1Score + m2Score + m3Score;
  const totalMax = m1Max + m2Max + m3Max;

  const formatSteps = (stepIds: string[]) => {
    const names: Record<string, string> = {
      'prep.tech': '前期技术准备', 'prep.material': '取料区域', 'prep.assembly': '管材拼装', 'prep.cage': '导管安装到钢筋笼', 'prep.inspection': '管口验收', '4.2.1-1': '前期技术准备', '4.2.1-2-1': '取料区域', '4.2.1-2-2': '管材拼装', '4.2.1-2-3': '安装到钢筋笼', 
      '4.2.1-3-1': '管口验收', '4.2.1-3-2': '通畅性测试', '4.2.1-4': '初测(基准测量)',
      '4.2.2-1': '测前准备与安全防护', '4.2.2-2': '读数仪设置与数据采集',
      '4.2.3-1': '数据导入与预处理', '4.2.3-2': '监测日报表填写', '4.2.3-3': '多期数据分析'
    };
    return stepIds.map(id => {
      const step = getStep(id);
      return {
        id,
        name: step.stepName || names[id] || id,
        score: step.totalScore || step.score || 0,
        maxScore: step.maxScore || calculateModuleMaxScore([id]),
        questions: (step.answers || []).map((question: any) => ({
          ...question,
          id: question.id || question.questionId,
          userAnswer: question.userAnswerLabel || question.userAnswer || '',
          correctAnswer: question.correctAnswerLabel || question.correctAnswer || (question.correctRange ? `${question.correctRange[0]}-${question.correctRange[1]}${question.unit || ''}` : ''),
          analysis: question.analysis || question.explanation || '暂无解析，请参考标准答案与评分规则。',
        }))
      };
    });
  };

  return {
    student: { name: studentName, studentId: "20240403001", className: "土木工程2401班" },
    exam: {
      startTime: "2026-04-03 14:00",
      endTime: new Date().toLocaleString(),
      totalDuration: 2700,
      totalScore,
      totalMaxScore: totalMax
    },
    modules: [
      {
        id: "module1",
        name: "专项实操一：深层水平位移监测管选型、安装与埋设实操",
        score: m1Score,
        maxScore: m1Max,
        duration: 900,
        steps: formatSteps(m1Steps)
      },
      {
        id: "module2",
        name: "专项实操二：深层水平位移数据采集",
        score: m2Score,
        maxScore: m2Max,
        duration: 800,
        steps: formatSteps(m2Steps)
      },
      {
        id: "module3",
        name: "专项实操三：深层水平位移数据处理与分析",
        score: m3Score,
        maxScore: m3Max,
        duration: 1000,
        steps: formatSteps(m3Steps)
      }
    ],
    radar: {
      dimensions: ["安装规范知识", "验收检测能力", "设备操作能力", "数据采集规范", "数据分析能力", "异常诊断能力", "预警决策能力"],
      values: [
        (m1Score / m1Max) || 0,
        ((getStep('4.2.1-3-1').score || 0) + (getStep('4.2.1-3-2').score || 0)) / 8 || 0,
        (getStep('4.2.2-2').totalScore / 26) || 0,
        (getStep('4.2.2-1').score / 6) || 0,
        (getStep('4.2.3-2').totalScore / 15) || 0,
        (getStep('4.2.3-1').totalScore / 5) || 0,
        (getStep('4.2.3-3').totalScore / 22) || 0
      ]
    }
  };
};

// --- Sub-components ---

const ScoreCircle: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 90 ? '#52c41a' : percentage >= 75 ? '#1890ff' : percentage >= 60 ? '#faad14' : '#ff4d4f';
  const label = percentage >= 90 ? '优秀' : percentage >= 75 ? '良好' : percentage >= 60 ? '合格' : '不合格';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-industrial-bg stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
          <circle 
            className="transition-all duration-1000 ease-out stroke-current" 
            strokeWidth="8" 
            strokeDasharray={251.2} 
            strokeDashoffset={251.2 - (251.2 * percentage) / 100} 
            strokeLinecap="round" 
            cx="50" cy="50" r="40" 
            fill="transparent" 
            style={{ color }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono">{score}</span>
          <span className="text-[10px] opacity-40 uppercase">/ {maxScore}</span>
        </div>
      </div>
      <div className="mt-4 px-4 py-1 font-bold text-white uppercase tracking-widest text-xs" style={{ backgroundColor: color }}>
        {label}
      </div>
    </div>
  );
};

const StepDetail: React.FC<{ step: StepResult }> = ({ step }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const percentage = (step.score / step.maxScore) * 100;
  const isWeak = percentage < 60;
  const questionCount = step.questions.length;

  return (
    <div className="border border-industrial-fg/10 bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-industrial-bg/5 transition-colors"
      >
        <div className="flex-1 grid grid-cols-[1fr_auto_auto] items-center gap-3">
          <div className="min-w-0 flex items-baseline gap-2">
            <div className="text-xs font-bold uppercase tracking-wider truncate">{step.name}</div>
            <div className="text-[9px] font-mono opacity-45 whitespace-nowrap">共 {questionCount} 题 · 满分 {step.maxScore} 分</div>
          </div>
          <div className="w-28 h-1 bg-industrial-bg/10 relative">
            <div 
              className={cn("absolute inset-y-0 left-0 transition-all duration-500", isWeak ? "bg-red-500" : "bg-industrial-fg")}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className={cn(
            "px-2 py-0.5 border font-mono text-[10px] font-bold whitespace-nowrap",
            isWeak ? "border-red-300 bg-red-50 text-red-600" : "border-green-300 bg-green-50 text-green-700"
          )}>
            {step.score}/{step.maxScore}
          </div>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-industrial-fg/10 bg-industrial-bg/5"
          >
            <div className="p-2 space-y-2">
              {step.questions.map((q, index) => (
                <div key={q.id} className="bg-white border border-industrial-fg/10 text-[10px]">
                  <div className="flex items-center justify-between border-b border-industrial-fg/10 px-2 py-1.5 bg-industrial-bg/20">
                    <div className="flex items-center space-x-2">
                      {q.correct ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                      <span className="font-bold">第 {index + 1} 题 · {q.label}</span>
                    </div>
                    <span className="font-mono font-bold">{q.score}/{q.maxScore}</span>
                  </div>
                  <div className="p-2 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      <div className="border border-industrial-fg/10 bg-industrial-bg/10 px-2 py-1.5">
                        <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">你的答案</div>
                        <div className={cn("font-bold", q.correct ? "text-green-600" : "text-red-500")}>{q.userAnswer || '未作答'}</div>
                      </div>
                      <div className="border border-green-200 bg-green-50 px-2 py-1.5">
                        <div className="text-[8px] font-bold uppercase tracking-widest text-green-700/50">标准答案</div>
                        <div className="font-bold text-green-700">{q.correctAnswer || '详见评分规则'}</div>
                      </div>
                    </div>
                    <div className="border-l-2 border-industrial-fg/30 bg-industrial-bg/10 px-2 py-1.5 leading-snug">
                      <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">解析</div>
                      <div className="opacity-75">{q.analysis || q.explanation || '暂无解析，请参考标准答案与评分规则。'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Report Component ---

export const ReportPage: React.FC<{ data: ReportData; onBack: () => void }> = ({ data, onBack }) => {
  return (
    <div className="min-h-screen bg-industrial-bg/20 py-12 px-4 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border-2 border-industrial-fg p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] print:shadow-none print:border-none">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-industrial-fg pb-8 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-industrial-fg text-industrial-bg">
                <FileText size={24} />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter">深基坑深层水平位移监测实训 — 成绩报告</h1>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] font-mono">
              <div className="flex items-center space-x-2"><User size={12} className="opacity-40" /><span>学生姓名: {data.student.name}</span></div>
              <div className="flex items-center space-x-2"><Award size={12} className="opacity-40" /><span>学号: {data.student.studentId}</span></div>
              <div className="flex items-center space-x-2"><Home size={12} className="opacity-40" /><span>班级: {data.student.className}</span></div>
              <div className="flex items-center space-x-2"><Calendar size={12} className="opacity-40" /><span>完成时间: {data.exam.endTime}</span></div>
              <div className="flex items-center space-x-2"><Clock size={12} className="opacity-40" /><span>总用时: {Math.floor(data.exam.totalDuration / 60)}min</span></div>
            </div>
          </div>
          <ScoreCircle score={data.exam.totalScore} maxScore={data.exam.totalMaxScore} />
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          <h3 className="technical-label">得分明细</h3>
          <div className="space-y-4">
            {data.modules.map(m => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest">{m.name}</span>
                  <span className="text-[10px] font-mono opacity-40">{m.score}/{m.maxScore}</span>
                </div>
                <div className="space-y-1">
                  {m.steps.map(s => <StepDetail key={s.id} step={s} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4 pt-8 border-t border-industrial-fg/10 print:hidden">
          <Button variant="secondary" onClick={() => window.print()} className="flex items-center space-x-2">
            <Printer size={14} />
            <span>打印报告</span>
          </Button>
          <Button variant="secondary" className="flex items-center space-x-2">
            <Download size={14} />
            <span>导出 PDF</span>
          </Button>
          <Button onClick={onBack} className="flex items-center space-x-2">
            <Home size={14} />
            <span>返回首页</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
