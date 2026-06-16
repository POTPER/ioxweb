import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  InstrumentSetting,
  type InstrumentSettingHandle,
} from '../steps/Step9_InstrumentSetting';
import { Modal, Button } from '../Common';
import { ReportPage, generatePracticeReport, type ReportData } from '../ReportPage';
import { PracticePageShell } from './PracticePageShell';
import { savePracticeProgress, savePracticeResult } from '../../lib/practiceStorage';
import { trainingStepsByAppId } from '../../data/trainingContent';
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

  const taskDescription =
    instrument?.appStepId
      ? trainingStepsByAppId[instrument.appStepId]?.taskDescription ?? ''
      : '';

  const handlePracticeProgress = (data: any) => {
    if (data) {
      savePracticeProgress(instrumentId, data);
    }
  };

  const handlePracticeSubmit = (data: any) => {
    if (data) {
      savePracticeResult(instrumentId, data);
      setReportData(generatePracticeReport(instrument!.name, data));
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
    >
      <main className="flex-1 overflow-y-auto px-6 pb-10 md:px-8">
        <div className="max-w-[1440px] mx-auto">
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
                practicePanel={
                  <div className="flex flex-col h-full min-h-0 p-6 md:p-8">
                    <div className="border-b border-industrial-fg pb-3 mb-4 shrink-0">
                      <h2 className="text-sm font-bold tracking-[0.15em] uppercase">任务说明</h2>
                    </div>
                    <p className="flex-1 min-h-0 overflow-y-auto text-[13px] leading-relaxed">{taskDescription}</p>
                    <div className="pt-4 mt-4 border-t border-industrial-fg/10 shrink-0">
                      <Button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="w-full py-3 text-[10px] tracking-[0.2em]"
                      >
                        提交练习
                      </Button>
                    </div>
                  </div>
                }
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
          <div className="p-3 bg-amber-50 border border-amber-300">
            <div className="font-bold text-sm">是否确认提交本次练习？</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)} className="px-5">
              取消
            </Button>
            <Button onClick={handleConfirmSubmit} className="px-5">
              确认提交
            </Button>
          </div>
        </div>
      </Modal>
    </PracticePageShell>
  );
};
