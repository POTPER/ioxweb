import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2 } from 'lucide-react';
import {
  InstrumentSetting,
  type InstrumentSettingHandle,
} from '../steps/Step9_InstrumentSetting';
import { Modal, Button } from '../Common';
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
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pendingScoreData, setPendingScoreData] = useState<any>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<string>('');

  const handlePracticeProgress = (data: any) => {
    if (data) {
      savePracticeProgress(instrumentId, data);
      setPendingScoreData(data);
    }
  };

  const handlePracticeSubmit = (data: any) => {
    if (data) {
      savePracticeResult(instrumentId, data);
      const score = data.totalScore ?? data.scores?.total ?? '—';
      setScoreSummary(typeof score === 'number' ? `${score} 分` : String(score));
    }
    onComplete(instrumentId);
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
    setShowSuccessModal(true);
  };

  const handleConfirmSubmit = () => {
    step9Ref.current?.submit();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onBack();
  };

  const previewScore =
    pendingScoreData?.totalScore ?? pendingScoreData?.scores?.total ?? '—';

  const submitFooter = (
    <div className="max-w-6xl mx-auto px-6 md:px-8 flex justify-center">
      <Button
        onClick={() => setShowSubmitConfirm(true)}
        disabled={!canSubmit || isSubmitted}
        title={!canSubmit ? '请先完成收工流程' : undefined}
        className="px-6 py-2 text-[10px] tracking-[0.2em] flex items-center gap-1.5"
      >
        <Award size={12} />
        {isSubmitted ? '已提交' : '提交练习'}
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
                onSubmitReady={setCanSubmit}
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
                提交后成绩将记录，不可修改。
              </div>
              {canSubmit && (
                <div className="text-[11px] font-mono opacity-80 pt-1">
                  当前得分：{typeof previewScore === 'number' ? `${previewScore} 分` : previewScore}
                </div>
              )}
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

      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="练习完成"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-300">
            <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">{instrument.name}练习已提交</div>
              <div className="opacity-70 leading-relaxed">
                您的练习成绩已成功记录。
                {scoreSummary && (
                  <span className="block mt-1 font-mono text-green-700">得分：{scoreSummary}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSuccessClose} className="px-6">
              返回练习系统
            </Button>
          </div>
        </div>
      </Modal>
    </PracticePageShell>
  );
};
