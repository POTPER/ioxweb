import React, { useMemo } from 'react';
import { TechnicalCard, Button } from './Common';
import ReactECharts from 'echarts-for-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Calendar, Clock, Award, BarChart3, ChevronDown, 
  ChevronRight, CheckCircle2, XCircle, FileText, Printer, 
  Download, Home, ShieldCheck, Zap, Activity, AlertTriangle
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
  correctAnswer: string;
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
  const getStep = (id: string) => stepData?.[id] || { score: 0, maxScore: 0, answers: [] };

  const m1Steps = ['4.2.1-1', '4.2.1-2-1', '4.2.1-2-2', '4.2.1-2-3', '4.2.1-3-1', '4.2.1-3-2', '4.2.1-4'];
  const m2Steps = ['4.2.2-1', '4.2.2-2'];
  const m3Steps = ['4.2.3-1', '4.2.3-2', '4.2.3-3'];

  const calculateModuleScore = (stepIds: string[]) => {
    return stepIds.reduce((acc, id) => acc + (stepData?.[id]?.totalScore || stepData?.[id]?.score || 0), 0);
  };

  const calculateModuleMaxScore = (stepIds: string[]) => {
    const maxScores: Record<string, number> = {
      '4.2.1-1': 5, '4.2.1-2-1': 2, '4.2.1-2-2': 8, '4.2.1-2-3': 4, '4.2.1-3-1': 4, '4.2.1-3-2': 4, '4.2.1-4': 4,
      '4.2.2-1': 4, '4.2.2-2': 21,
      '4.2.3-1': 15, '4.2.3-2': 15, '4.2.3-3': 20
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
      '4.2.1-1': '前期技术准备', '4.2.1-2-1': '取料区域', '4.2.1-2-2': '管材拼装', '4.2.1-2-3': '安装到钢筋笼', 
      '4.2.1-3-1': '管口验收', '4.2.1-3-2': '通畅性测试', '4.2.1-4': '初测(基准测量)',
      '4.2.2-1': '测前准备与安全防护', '4.2.2-2': '读数仪设置与数据采集',
      '4.2.3-1': '数据导入与预处理', '4.2.3-2': '监测日报表填写', '4.2.3-3': '多期数据分析'
    };
    return stepIds.map(id => ({
      id,
      name: names[id] || id,
      score: stepData?.[id]?.totalScore || stepData?.[id]?.score || 0,
      maxScore: calculateModuleMaxScore([id]),
      questions: stepData?.[id]?.answers || []
    }));
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
        (stepData?.['4.2.1-3-1']?.score + stepData?.['4.2.1-3-2']?.score) / 8 || 0,
        (stepData?.['4.2.2-2']?.totalScore / 21) || 0,
        (stepData?.['4.2.2-1']?.score / 4) || 0,
        (stepData?.['4.2.3-2']?.totalScore / 15) || 0,
        (stepData?.['4.2.3-1']?.totalScore / 15) || 0,
        (stepData?.['4.2.3-3']?.totalScore / 20) || 0
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

const RadarChart: React.FC<{ dimensions: string[]; values: number[] }> = ({ dimensions, values }) => {
  const option = {
    radar: {
      indicator: dimensions.map(d => ({ name: d, max: 1 })),
      splitArea: { show: false },
      axisLine: { lineStyle: { color: '#141414', opacity: 0.2 } },
      splitLine: { lineStyle: { color: '#141414', opacity: 0.1 } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '能力评估',
        areaStyle: { color: 'rgba(20, 20, 20, 0.1)' },
        lineStyle: { color: '#141414', width: 2 },
        itemStyle: { color: '#141414' }
      }]
    }]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
};

const StepDetail: React.FC<{ step: StepResult }> = ({ step }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const percentage = (step.score / step.maxScore) * 100;
  const isWeak = percentage < 60;

  return (
    <div className="border border-industrial-fg/10 bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-industrial-bg/5 transition-colors"
      >
        <div className="flex-1 flex items-center space-x-4">
          <span className="text-[10px] font-mono opacity-40 w-16">{step.id}</span>
          <span className="text-xs font-bold uppercase tracking-wider">{step.name}</span>
          <div className="flex-1 max-w-xs h-1.5 bg-industrial-bg/10 relative">
            <div 
              className={cn("absolute inset-y-0 left-0 transition-all duration-500", isWeak ? "bg-red-500" : "bg-industrial-fg")}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] font-mono w-12 text-right">{step.score}/{step.maxScore}</span>
          {percentage === 100 && <Award size={14} className="text-yellow-500" />}
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
            <div className="p-4 space-y-2">
              {step.questions.map(q => (
                <div key={q.id} className="flex items-start justify-between p-2 bg-white border border-industrial-fg/5 text-[10px]">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {q.correct ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                      <span className="font-bold">{q.label}</span>
                    </div>
                    {!q.correct && (
                      <div className="pl-5 space-y-1 opacity-60">
                        <p>你的答案: <span className="text-red-500">{q.userAnswer}</span></p>
                        <p>正确答案: <span className="text-green-600">{q.correctAnswer}</span></p>
                      </div>
                    )}
                  </div>
                  <span className="font-mono">{q.score}/{q.maxScore}</span>
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
  const strengths = useMemo(() => {
    return data.radar.dimensions.filter((_, i) => data.radar.values[i] >= 0.8);
  }, [data]);

  const weaknesses = useMemo(() => {
    return data.radar.dimensions.filter((_, i) => data.radar.values[i] < 0.7);
  }, [data]);

  const getSuggestion = (dim: string) => {
    const suggestions: Record<string, string> = {
      "安装规范知识": "复习监测管管材选型、连接方式和钢筋笼绑扎规范",
      "验收检测能力": "加强管口验收标准和通畅性测试曲线判读的学习",
      "设备操作能力": "重点掌握读数仪参数设置、正反测操作流程",
      "数据采集规范": "复习测区/孔号选择规范和设备连接操作要求",
      "数据分析能力": "复习日报表变化速率计算方法和分析结论撰写",
      "异常诊断能力": "重点掌握校验和限差判断标准和异常原因分析",
      "预警决策能力": "重点学习GB 50497表8.0.4预警值标准和处理措施选择"
    };
    return suggestions[dim] || "继续保持学习";
  };

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

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.modules.map(m => {
            const pct = (m.score / m.maxScore) * 100;
            return (
              <div key={m.id} className="p-4 border border-industrial-fg/10 bg-industrial-bg/5 space-y-2">
                <h3 className="text-[10px] font-bold uppercase opacity-60 truncate">{m.name}</h3>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold font-mono">{m.score}<span className="text-[10px] opacity-40 font-normal">/{m.maxScore}</span></span>
                  <span className="text-[10px] font-mono">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-industrial-bg/10 relative">
                  <div className="absolute inset-y-0 left-0 bg-industrial-fg" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center border-y border-industrial-fg/10 py-8">
          <div>
            <h3 className="technical-label mb-4">能力雷达图</h3>
            <RadarChart dimensions={data.radar.dimensions} values={data.radar.values} />
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center">
                <CheckCircle2 size={14} className="mr-2" /> 优势能力
              </h4>
              <div className="space-y-1">
                {strengths.map(s => (
                  <div key={s} className="text-[11px] flex items-center space-x-2">
                    <Zap size={10} className="text-yellow-500" />
                    <span>{s} 掌握扎实</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center">
                <AlertTriangle size={14} className="mr-2" /> 薄弱环节
              </h4>
              <div className="space-y-2">
                {weaknesses.map(w => (
                  <div key={w} className="p-2 bg-red-50 border-l-2 border-red-500">
                    <p className="text-[11px] font-bold">{w} 需加强</p>
                    <p className="text-[10px] opacity-60">建议: {getSuggestion(w)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

        {/* Conclusion */}
        <div className="p-6 bg-industrial-bg/5 border border-industrial-fg/10 space-y-4">
          <h3 className="technical-label">综合评语</h3>
          <p className="text-xs leading-relaxed opacity-80">
            该生对监测管安装埋设和数据采集的基础操作掌握较好，但在数据处理分析和预警判断方面仍有提升空间。
            {weaknesses.length > 0 && `特别是在${weaknesses.join('、')}等环节，建议后续加强练习。`}
            整体表现{data.exam.totalScore >= 75 ? '良好' : '合格'}，具备基本的现场监测能力。
          </p>
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

        {/* System Status (Footer) */}
        <div className="flex justify-between items-center pt-8 text-[9px] font-mono opacity-30 uppercase tracking-widest">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1"><ShieldCheck size={10} /><span>Secured</span></div>
            <div className="flex items-center space-x-1"><Activity size={10} /><span>Verified</span></div>
          </div>
          <span>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
