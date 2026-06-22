import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { scoringConfigs, type StepScoringConfig } from '../data/scoringConfig';
import { calculateStepScore } from '../lib/scoring';
import {
  CheckCircle2, XCircle
} from 'lucide-react';
import { RequirementsOverlay } from './RequirementsOverlay';
import { Button } from './Common';

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
  unanswered?: boolean;
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
  const scoringConfigList = Object.values(scoringConfigs);
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
    '4.2.2-1': 'acq.safety',
    '4.2.2-2': 'acq.instrument',
  };

  const configByStepKey = new Map<string, StepScoringConfig>();
  const registerConfig = (key: string | undefined, config: StepScoringConfig) => {
    if (key) configByStepKey.set(key, config);
  };

  scoringConfigList.forEach(config => {
    registerConfig(config.stepId, config);
    registerConfig(config.reportStepId, config);
    registerConfig(config.appStepId, config);
  });

  Object.entries(legacyStepAliases).forEach(([legacyKey, targetKey]) => {
    const targetConfig = configByStepKey.get(targetKey);
    if (targetConfig) registerConfig(legacyKey, targetConfig);
  });

  const getStepConfig = (id: string) => configByStepKey.get(id);

  const getCandidateStepKeys = (id: string) => {
    const config = getStepConfig(id);
    const legacyAlias = legacyStepAliases[id];
    const legacyConfig = legacyAlias ? getStepConfig(legacyAlias) : undefined;
    const keys = [
      id,
      config?.stepId,
      config?.reportStepId,
      config?.appStepId,
      legacyAlias,
      legacyConfig?.stepId,
      legacyConfig?.reportStepId,
      legacyConfig?.appStepId,
    ];

    return keys.filter((key, index): key is string => Boolean(key) && keys.indexOf(key) === index);
  };

  const createUnansweredStep = (config: StepScoringConfig) => ({
    ...calculateStepScore(config, []),
    unanswered: true,
  });

  const getStep = (id: string) => {
    const config = getStepConfig(id);
    const step = getCandidateStepKeys(id).map(key => stepData?.[key]).find(Boolean);

    if (!config) {
      return step || { score: 0, totalScore: 0, maxScore: 0, answers: [] };
    }

    const hasAnswerDetails = Array.isArray(step?.answers) && step.answers.length > 0;
    if (!step || !hasAnswerDetails) {
      const unansweredStep = createUnansweredStep(config);
      return step ? {
        ...unansweredStep,
        ...step,
        answers: unansweredStep.answers,
        totalScore: step.totalScore ?? step.score ?? unansweredStep.totalScore,
        maxScore: step.maxScore ?? unansweredStep.maxScore,
        unanswered: true,
      } : unansweredStep;
    }

    return step;
  };

  const getStepScore = (id: string) => {
    const step = getStep(id);
    return step.totalScore ?? step.score ?? 0;
  };

  const m1Steps = ['prep.tech', 'prep.material', 'prep.assembly', 'prep.cage', 'prep.inspection', '4.2.1-3-2', '4.2.1-4'];
  const m2Steps = ['4.2.2-1', '4.2.2-2'];
  const m3Steps = ['4.2.3-1', '4.2.3-2', '4.2.3-3'];

  const calculateModuleScore = (stepIds: string[]) => {
    return stepIds.reduce((acc, id) => acc + getStepScore(id), 0);
  };

  const calculateModuleMaxScore = (stepIds: string[]) => {
    const maxScores: Record<string, number> = {
      'prep.tech': 3, 'prep.material': 2, 'prep.assembly': 4, 'prep.cage': 4, 'prep.inspection': 4, '4.2.1-1': 3, '4.2.1-2-1': 2, '4.2.1-2-2': 4, '4.2.1-2-3': 4, '4.2.1-3-1': 4, '4.2.1-3-2': 4, '4.2.1-4': 4,
      '4.2.2-1': 6, '4.2.2-2': 26,
      '4.2.3-1': 5, '4.2.3-2': 16, '4.2.3-3': 22
    };
    return stepIds.reduce((acc, id) => {
      const config = getStepConfig(id);
      const configMaxScore = config?.questions.reduce((sum, question) => sum + question.maxScore, 0);
      return acc + (configMaxScore ?? maxScores[id] ?? 0);
    }, 0);
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
      const questions = (step.answers || []).map((question: any) => ({
        ...question,
        id: question.id || question.questionId,
        userAnswer: question.userAnswerLabel || question.userAnswer || '',
        correctAnswer: question.correctAnswerLabel || question.correctAnswer || (question.correctRange ? `${question.correctRange[0]}-${question.correctRange[1]}${question.unit || ''}` : ''),
        analysis: question.analysis || question.explanation || '暂无解析，请参考标准答案与评分规则。',
      }));
      return {
        id,
        name: step.stepName || names[id] || id,
        score: step.totalScore ?? step.score ?? 0,
        maxScore: step.maxScore ?? calculateModuleMaxScore([id]),
        questions,
        unanswered: step.unanswered || (questions.length > 0 && questions.every(question => !question.userAnswer)),
      };
    });
  };

  return {
    student: { name: studentName, studentId: "20240403001", className: "土木工程2401班" },
    exam: {
      startTime: "2026-04-03 14:00",
      endTime: new Date().toLocaleString(),
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
        (getStepScore('4.2.1-3-1') + getStepScore('4.2.1-3-2')) / 8 || 0,
        getStepScore('4.2.2-2') / 26 || 0,
        getStepScore('4.2.2-1') / 6 || 0,
        getStepScore('4.2.3-2') / 16 || 0,
        getStepScore('4.2.3-1') / 5 || 0,
        getStepScore('4.2.3-3') / 22 || 0
      ]
    }
  };
};

export function generatePracticeReport(
  instrumentName: string,
  step9Data: any,
): ReportData {
  const answers = step9Data?.answers ?? [];
  const questions: QuestionResult[] = answers.map((question: any) => ({
    ...question,
    id: question.id || question.questionId,
    userAnswer: question.userAnswerLabel || question.userAnswer || '',
    correctAnswer:
      question.correctAnswerLabel ||
      question.correctAnswer ||
      (question.correctRange
        ? `${question.correctRange[0]}-${question.correctRange[1]}${question.unit || ''}`
        : ''),
    analysis:
      question.analysis ||
      question.explanation ||
      '暂无解析，请参考标准答案与评分规则。',
  }));

  const stepName = step9Data?.stepName || '读数仪设置与数据采集';

  return {
    student: { name: '练习', studentId: '', className: '' },
    exam: {
      startTime: '',
      endTime: new Date().toLocaleString(),
      totalScore: 0,
      totalMaxScore: 0,
    },
    modules: [
      {
        id: 'practice-module',
        name: `${instrumentName}练习`,
        score: 0,
        maxScore: 0,
        duration: 0,
        steps: [
          {
            id: 'acq.instrument',
            name: stepName,
            score: 0,
            maxScore: 0,
            questions,
            unanswered:
              questions.length > 0 &&
              questions.every((question) => !question.userAnswer),
          },
        ],
      },
    ],
    radar: { dimensions: [], values: [] },
  };
}

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

const formatItemScore = (score: number, maxScore: number) => `${score}/${maxScore}分`;

const formatUserAnswerText = (question: QuestionResult) => {
  if (question.id === 'acq.instrument.cleanupOrder') {
    if (!question.userAnswer) return '未作答';
    if (question.userAnswer.includes('先拔除线材')) return '先拔除线材，再关闭电源（未先关闭电源）';
  }

  return question.userAnswer || '未作答';
};

const isQuestionAnswered = (question: QuestionResult) =>
  formatUserAnswerText(question) !== '未作答';

const StepDetail: React.FC<{ step: StepResult; showScores?: boolean }> = ({
  step,
  showScores = true,
}) => {
  const percentage = step.maxScore > 0 ? (step.score / step.maxScore) * 100 : 0;
  const isWeak = percentage < 60;

  return (
    <div className="border border-industrial-fg/10 bg-white">
      <div className="relative w-full flex items-center justify-between px-3 py-2">
        <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider truncate">{step.name}</div>
          </div>
          {showScores && (
            <div className="flex items-center justify-end gap-2">
              {step.unanswered && (
                <span className="border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 whitespace-nowrap">
                  未答题
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 border font-mono text-[10px] font-bold whitespace-nowrap",
                isWeak ? "border-red-300 bg-red-50 text-red-600" : "border-green-300 bg-green-50 text-green-700"
              )}>
                得分 {step.score} / {step.maxScore} 分
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-industrial-fg/10 bg-industrial-bg/5">
            <div className="p-2 space-y-2">
              {step.questions.map((q) => {
                const isAnswered = isQuestionAnswered(q);
                const showDetail = !q.correct && isAnswered;
                const userAnswerText = formatUserAnswerText(q);
                const correctAnswerText = q.correctAnswer || '详见评分规则';
                const analysisText = q.analysis || q.explanation || '暂无解析，请参考标准答案与评分规则。';

                return (
                  <div key={q.id} className="relative bg-white border border-industrial-fg/10 text-[10px]">
                    <div className={cn(
                      "relative flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-industrial-fg/10 px-2 py-1.5 bg-industrial-bg/20",
                      !showDetail && "border-b-0"
                    )}>
                      <div className="flex items-center space-x-2 w-[120px] md:w-[160px] shrink-0">
                        {(showScores || (isAnswered && q.correct)) && (
                          q.correct
                            ? <CheckCircle2 size={12} className="shrink-0 text-green-500" />
                            : showScores
                              ? <XCircle size={12} className="shrink-0 text-red-500" />
                              : null
                        )}
                        <span className="truncate font-bold">{q.label}</span>
                      </div>
                      
                      <span className="font-mono opacity-30 shrink-0">|</span>
                      
                      <span className="min-w-0 flex-1 font-mono opacity-60 break-words">
                        你的答案：{userAnswerText}
                      </span>
                      
                      {showScores && (
                        <>
                          <span className="font-mono opacity-30 shrink-0">|</span>
                          <span className="w-[60px] shrink-0 text-right font-mono opacity-60">
                            {formatItemScore(q.score, q.maxScore)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {showDetail && (
                      <div className="relative grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
                        <div className="relative border border-green-200 bg-green-50 px-2 py-1.5">
                          <div className="text-[8px] font-bold uppercase tracking-widest text-green-700/50 mb-1">标准答案</div>
                          <div className="font-bold text-green-700 break-words">{correctAnswerText}</div>
                        </div>
                        <div className="relative border-l-2 border-industrial-fg/30 bg-industrial-bg/10 px-2 py-1.5 leading-snug">
                          <div className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">解析</div>
                          <div className="opacity-75 break-words">{analysisText}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      </div>
    </div>
  );
};

// --- Main Report Component ---

export const ReportPage: React.FC<{
  data: ReportData;
  onBack: () => void;
  variant?: 'exam' | 'practice';
  subtitle?: string;
}> = ({ data, onBack, variant = 'exam', subtitle }) => {
  const [showRequirements, setShowRequirements] = useState(false);
  const isPractice = variant === 'practice';
  const showScores = !isPractice;

  return (
    <div className="min-h-screen bg-industrial-bg/20 py-12 px-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
      <div className="space-y-8 bg-white border-2 border-industrial-fg p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] print:shadow-none print:border-none">
        
        {/* Header */}
        <div className={cn(
          'relative border-b-4 border-industrial-fg pb-8',
          isPractice ? 'space-y-3' : 'flex flex-col md:flex-row justify-between items-start md:items-center gap-8',
        )}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tighter">
                  {isPractice ? '练习报告' : '成绩报告'}
                </h1>
                {!isPractice && (
                  <div className="mt-1 text-xs font-bold tracking-wider opacity-60">
                    深基坑深层水平位移监测实训
                  </div>
                )}
              </div>
            </div>
            {isPractice ? (
              <div className="text-[11px] font-mono opacity-60">
                提交时间: {data.exam.endTime}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] font-mono">
                <div>学生姓名: {data.student.name}</div>
                <div>学号: {data.student.studentId}</div>
                <div>班级: {data.student.className}</div>
                <div>完成时间: {data.exam.endTime}</div>
              </div>
            )}
          </div>
          {!isPractice && (
            <ScoreCircle score={data.exam.totalScore} maxScore={data.exam.totalMaxScore} />
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          <h3 className="technical-label">{isPractice ? '操作记录' : '得分明细'}</h3>
          <div className="space-y-1">
            {data.modules.flatMap(module => module.steps).map((step) => (
              <StepDetail key={step.id} step={step} showScores={showScores} />
            ))}
          </div>
        </div>

        {isPractice && (
          <div className="flex justify-center pt-2">
            <Button variant="secondary" onClick={onBack} className="px-6">
              返回练习系统
            </Button>
          </div>
        )}

      </div>
      </div>

      {/* Requirements Overlay */}
      {showRequirements && <RequirementsOverlay onClose={() => setShowRequirements(false)} defaultPage="score-report" />}
    </div>
  );
};
