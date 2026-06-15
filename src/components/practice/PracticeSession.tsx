import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2 } from 'lucide-react';
import {
  InstrumentSetting,
  type InstrumentSettingHandle,
} from '../steps/Step9_InstrumentSetting';
import { Modal, Button } from '../Common';
import { ReportPage, generatePracticeReport, type ReportData } from '../ReportPage';
import { PracticePageShell } from './PracticePageShell';
import { savePracticeProgress, savePracticeResult } from '../../lib/practiceStorage';
import {
  getPracticeInstrument,
  PRACTICE_BACK_CONFIRM_MESSAGE,
  type PracticeInstrumentId,
} from './practiceInstruments';

interface PracticeSessionProps {
  instrumentId: PracticeInstrumentId;
  onBack: () => void;
  onComplete: (instrumentId: PracticeInstrumentId) => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  instrumentId,
  onBack,
  onComplete,
}) => {
  const instrument = getPracticeInstrument(instrumentId);
  const step9Ref = useRef<InstrumentSettingHandle>(null);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handlePracticeProgress = (data: any) => {
    if (data) {
      savePracticeProgress(instrumentId, data);
    }
  };

  const handlePracticeSubmit = (data: any) => {
    if (data) {
      savePracticeResult(instrumentId, data);
      setReportData(generatePracticeReport(instrument.name, data));
    }
    if (!hasMarkedComplete) {
      onComplete(instrumentId);
      setHasMarkedComplete(true);
    }
    setShowSubmitConfirm(false);
    setShowReport(true);
  };

  const handleConfirmSubmit = () => {
    step9Ref.current?.submit();
  };

  const submitFooter = (
    <div className="max-w-6xl mx-auto px-6 md:px-8 flex justify-center">
      <Button
        onClick={() => setShowSubmitConfirm(true)}
        className="px-6 py-2 text-[10px] tracking-[0.2em] flex items-center gap-1.5"
      >
        <Award size={12} />
        提交练习
      </Button>
    </div>
  );

  if (!instrument?.appStepId) {
    return (
      <PracticePageShell onBack={onBack}>
        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <div className="text-center space-y-4">
            <p className="text-sm opacity-70">该仪器练习尚未开放</p>
            <Button onClick={onBack}>返回练习系统</Button>
          </div>
        </div>
      </PracticePageShell>
    );
  }

  if (showReport && reportData) {
    return (
      <ReportPage
        variant="practice"
        data={reportData}
        onBack={() => {
          setShowReport(false);
          onBack();
        }}
      />
    );
  }

  return (
    <PracticePageShell
      onBack={onBack}
      confirmOnBack
      confirmMessage={PRACTICE_BACK_CONFIRM_MESSAGE}
      footer={submitFooter}
    >
      <main className="flex-1 overflow-y-auto px-6 pb-10 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="border-l-[3px] border-industrial-fg bg-industrial-fg/5 px-4 py-3 mb-6 text-[12px] font-medium">
            <span className="text-industrial-fg">{instrument.name}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={instrumentId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InstrumentSetting
                ref={step9Ref}
                manualSubmit
                onNext={handlePracticeSubmit}
                onProgress={handlePracticeProgress}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="确认提交"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-300">
            <Award size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">是否确认提交本次练习？</div>
              <div className="opacity-70 leading-relaxed">
                提交后将生成练习报告（不计分），展示当前操作记录与参考答案。
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)} className="px-5">
              取消
            </Button>
            <Button onClick={handleConfirmSubmit} className="px-5">
              <CheckCircle2 size={14} className="inline mr-1" />
              确认提交
            </Button>
          </div>
        </div>
      </Modal>
    </PracticePageShell>
  );
};
