import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '../Common';
import { WireframePlaceholder } from '../WireframeOverlay';
import { acqSafetyScoringConfig } from '../../data/scoringConfig';
import type { ChoiceQuestionConfig } from '../../data/scoringConfig';
import { getUiLabel } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { CharacterPreview } from './prep-and-safety/CharacterPreview';
import { OptionSection } from './prep-and-safety/OptionSection';

const stepId = 'acq.safety';

const sectionMeta: Record<string, {
  titleKey: string;
  typeKey: string;
  statusKey: string;
  historyKey: string;
}> = {
  'acq.safety.weather': {
    titleKey: 'weatherSectionTitle',
    typeKey: 'weatherTypeLabel',
    statusKey: 'weatherConfirmedLabel',
    historyKey: 'weather',
  },
  'acq.safety.equipment': {
    titleKey: 'safetySectionTitle',
    typeKey: 'safetyTypeLabel',
    statusKey: 'safetySelectedLabel',
    historyKey: 'safety',
  },
  'acq.safety.instrument': {
    titleKey: 'instrumentSectionTitle',
    typeKey: 'instrumentTypeLabel',
    statusKey: 'instrumentEquippedLabel',
    historyKey: 'instrument',
  },
};

type ActiveModal = {
  questionId: string;
  optionId: string;
};

export const PrepAndSafety: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const questions = useMemo(
    () => acqSafetyScoringConfig.questions.filter((question): question is ChoiceQuestionConfig => (
      question.type === 'singleChoice' || question.type === 'multiChoice'
    )),
    []
  );

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [browseHistory, setBrowseHistory] = useState<Record<string, string[]>>({
    weather: [],
    safety: [],
    instrument: [],
  });

  const getQuestion = (questionId: string) => questions.find(question => question.questionId === questionId);

  const getOptionLabel = (question: ChoiceQuestionConfig, value?: string) => (
    question.options.find(option => option.value === value)?.label || ''
  );

  const getSelectedValue = (question: ChoiceQuestionConfig) => {
    const answer = selectedAnswers[question.questionId];
    return Array.isArray(answer) ? null : answer || null;
  };

  const getSelectedValues = (question: ChoiceQuestionConfig) => {
    const answer = selectedAnswers[question.questionId];
    return Array.isArray(answer) ? answer : answer ? [answer] : [];
  };

  const handleCardClick = (questionId: string, optionId: string) => {
    const meta = sectionMeta[questionId];
    setActiveModal({ questionId, optionId });
    setBrowseHistory(prev => ({
      ...prev,
      [meta.historyKey]: [...(prev[meta.historyKey] || []), optionId],
    }));
  };

  const handleSelect = () => {
    if (!activeModal) return;

    const question = getQuestion(activeModal.questionId);
    if (!question) return;

    setSelectedAnswers(prev => {
      if (question.type === 'multiChoice') {
        const current = Array.isArray(prev[question.questionId]) ? prev[question.questionId] : [];
        const next = current.includes(activeModal.optionId)
          ? current.filter(value => value !== activeModal.optionId)
          : [...current, activeModal.optionId];

        return {
          ...prev,
          [question.questionId]: next,
        };
      }

      return {
        ...prev,
        [question.questionId]: activeModal.optionId,
      };
    });
    setActiveModal(null);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(
      acqSafetyScoringConfig,
      questions.map(question => ({
        questionId: question.questionId,
        answer: selectedAnswers[question.questionId],
      }))
    );

    onNext({
      ...result,
      browseHistory,
    });
  };

  const canDepart = questions.every(question => getSelectedValues(question).length > 0);

  useEffect(() => {
    if (canDepart) {
      handleSubmit();
    }
  }, [canDepart]);

  const activeQuestion = activeModal ? getQuestion(activeModal.questionId) : undefined;
  const activeOption = activeQuestion?.options.find(option => option.value === activeModal?.optionId);
  const weatherQuestion = getQuestion('acq.safety.weather');
  const safetyQuestion = getQuestion('acq.safety.equipment');
  const instrumentQuestion = getQuestion('acq.safety.instrument');
  const selectedWeatherLabel = weatherQuestion ? getOptionLabel(weatherQuestion, getSelectedValue(weatherQuestion) || undefined) : undefined;
  const selectedSafetyLabels = safetyQuestion ? getSelectedValues(safetyQuestion).map(value => getOptionLabel(safetyQuestion, value)) : [];
  const selectedInstrumentLabel = instrumentQuestion ? getOptionLabel(instrumentQuestion, getSelectedValue(instrumentQuestion) || undefined) : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WireframePlaceholder label="L1-L4: 人物预览区（背景+角色+装备图层叠加）" className="min-h-0">
          <CharacterPreview 
            selectedWeatherLabel={selectedWeatherLabel}
            selectedSafetyLabels={selectedSafetyLabels}
            selectedInstrumentLabel={selectedInstrumentLabel}
          />
        </WireframePlaceholder>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {questions.map(question => {
            const meta = sectionMeta[question.questionId];
            const selectedValues = getSelectedValues(question);
            const selectedValue = getSelectedValue(question);
            const statusLabel = selectedValues.length > 0
              ? getUiLabel(stepId, meta.statusKey, {
                value: question.type === 'multiChoice'
                  ? selectedValues.length
                  : getOptionLabel(question, selectedValue || undefined),
              })
              : undefined;

            return (
              <OptionSection
                key={question.questionId}
                title={getUiLabel(stepId, meta.titleKey) || question.label}
                options={question.options.map(option => ({
                  id: option.value,
                  code: option.code,
                  name: option.label,
                  desc: option.desc,
                  image: option.image,
                }))}
                selectedIds={question.type === 'multiChoice' ? selectedValues : selectedValue}
                onCardClick={(id) => handleCardClick(question.questionId, id)}
                typeLabel={getUiLabel(stepId, meta.typeKey)}
                statusLabel={statusLabel}
              />
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeOption?.label || ''}
      >
        {activeOption && (
          <div className="space-y-6">
            <p className="text-xs leading-relaxed opacity-80">
              {activeOption.desc}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-industrial-fg/10">
              <Button 
                onClick={handleSelect}
                className="w-full"
              >
                {getUiLabel(stepId, 'selectButton')}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setActiveModal(null)}
                className="w-full"
              >
                {getUiLabel(stepId, 'cancelButton')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
