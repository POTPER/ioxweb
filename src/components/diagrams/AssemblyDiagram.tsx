import React from 'react';
import { cn } from '../../lib/utils';

/**
 * IMG-3-1 测斜管拼装示意图
 * 水平排列7个部件框：侧斜管×2、连接处×3、连接头、底盖
 * 未来开发时替换为真实图片。
 */

interface AssemblyDiagramProps {
  viewed: Record<string, boolean>;
  completed: Record<string, boolean>;
  answers: Record<string, any>;
  tubeOptions: { id: string; text: string }[];
  connectorOptions: { id: string; text: string }[];
  bottomCapOptions: { id: string; text: string }[];
  jointOptions: { id: string; text: string }[];
  onHotspotClick: (id: string) => void;
  onQuestionClick: (id: string) => void;
}

interface BoxProps {
  flex: string;
  label: string;
  hotspotId?: string;
  viewed?: boolean;
  completed?: boolean;
  borderClass?: string;
  labelSize?: string;
  onClick?: () => void;
  onQuestionClick?: () => void;
  resultText?: string;
}

const PartBox: React.FC<BoxProps> = ({
  flex, label, hotspotId, viewed, completed, borderClass = '', labelSize = 'text-xs',
  onClick, onQuestionClick, resultText,
}) => (
  <div className={flex + ' flex flex-col items-center'}>
    <div
      onClick={onClick}
      className={cn(
        "w-full h-24 transition-all duration-200 flex flex-col items-center justify-center group relative",
        borderClass,
        onClick && "cursor-pointer hover:-translate-y-0.5",
        viewed ? "border-industrial-fg bg-industrial-fg/5" : "border-industrial-fg/60 hover:border-industrial-fg",
      )}
    >
      <span className={cn(labelSize, "font-bold opacity-70 group-hover:opacity-100 transition-opacity",
        labelSize === 'text-[8px]' && 'writing-vertical'
      )}>{label}</span>
      {hotspotId && viewed && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuestionClick?.(); }}
          className={cn(
            "font-bold text-[10px] mt-1",
            !completed ? "text-industrial-fg animate-breathing" : "text-green-600",
            labelSize === 'text-sm' && "absolute top-1 right-1 text-sm mt-0"
          )}
        >
          {!completed ? '[?]' : '[v]'}
        </button>
      )}
    </div>
    <div className="w-full min-h-[3rem] px-0.5 pt-1">
      {completed && resultText && (
        <p className="text-[10px] leading-snug text-center opacity-70 break-all">{resultText}</p>
      )}
    </div>
  </div>
);

export const AssemblyDiagram: React.FC<AssemblyDiagramProps> = ({
  viewed, completed, answers,
  tubeOptions, connectorOptions, bottomCapOptions, jointOptions,
  onHotspotClick, onQuestionClick,
}) => {
  return (
    <div className="flex items-start gap-0 w-full">
      {/* #1 侧斜管（左段） */}
      <PartBox
        flex="flex-[5]" label="侧斜管" hotspotId="tube" labelSize="text-sm"
        viewed={viewed['tube']} completed={completed['tube']}
        borderClass="rounded-l-lg border-[3px] border-r-[1.5px] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] hover:shadow-[3px_3px_0px_0px_rgba(20,20,20,0.3)]"
        onClick={() => onHotspotClick('tube')}
        onQuestionClick={() => onQuestionClick('tube')}
        resultText={tubeOptions.find(o => o.id === answers.tube)?.text}
      />

      {/* #2 连接处2（左） */}
      <PartBox
        flex="flex-[0.6]" label="连接处" hotspotId="joint" labelSize="text-[8px]"
        viewed={viewed['joint']} completed={completed['joint']}
        borderClass="border-y-[3px] border-x-[1.5px]"
        onClick={() => onHotspotClick('joint')}
        onQuestionClick={() => onQuestionClick('joint')}
        resultText={jointOptions.find(o => o.id === answers.joint)?.text}
      />

      {/* #3 连接头 */}
      <PartBox
        flex="flex-[1.5]" label="连接头" hotspotId="connector" labelSize="text-xs"
        viewed={viewed['connector']} completed={completed['connector']}
        borderClass="border-[3px] border-x-[1.5px] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] hover:shadow-[3px_3px_0px_0px_rgba(20,20,20,0.3)]"
        onClick={() => onHotspotClick('connector')}
        onQuestionClick={() => onQuestionClick('connector')}
        resultText={connectorOptions.find(o => o.id === answers.connector)?.text}
      />

      {/* #4 连接处2（右） */}
      <PartBox
        flex="flex-[0.6]" label="连接处" hotspotId="joint" labelSize="text-[8px]"
        viewed={viewed['joint']} completed={completed['joint']}
        borderClass="border-y-[3px] border-x-[1.5px]"
        onClick={() => onHotspotClick('joint')}
        onQuestionClick={() => onQuestionClick('joint')}
        resultText={jointOptions.find(o => o.id === answers.joint)?.text}
      />

      {/* #5 侧斜管（右段） */}
      <PartBox
        flex="flex-[5]" label="侧斜管" hotspotId="tube" labelSize="text-sm"
        viewed={viewed['tube']} completed={completed['tube']}
        borderClass="border-[3px] border-x-[1.5px] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] hover:shadow-[3px_3px_0px_0px_rgba(20,20,20,0.3)]"
        onClick={() => onHotspotClick('tube')}
        onQuestionClick={() => onQuestionClick('tube')}
        resultText={tubeOptions.find(o => o.id === answers.tube)?.text}
      />

      {/* #6 连接处1 */}
      <PartBox
        flex="flex-[0.6]" label="连接处" hotspotId="bottomCap" labelSize="text-[8px]"
        viewed={viewed['bottomCap']} completed={completed['bottomCap']}
        borderClass="border-y-[3px] border-x-[1.5px]"
        onClick={() => onHotspotClick('bottomCap')}
        onQuestionClick={() => onQuestionClick('bottomCap')}
        resultText={bottomCapOptions.find(o => o.id === answers.bottomCap)?.text}
      />

      {/* #7 底盖（纯视觉，不可点击） */}
      <div className="flex-[1.5] flex flex-col items-center">
        <div className="w-full h-24 rounded-r-lg border-[3px] border-l-[1.5px] transition-all duration-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] border-industrial-fg/60">
          <span className="text-xs font-bold writing-vertical opacity-70">底盖</span>
        </div>
        <div className="w-full min-h-[3rem]" />
      </div>
    </div>
  );
};
