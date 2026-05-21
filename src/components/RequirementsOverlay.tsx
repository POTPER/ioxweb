import React, { useState, useEffect } from 'react';
import { X, FileText, ChevronDown, ChevronRight, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { requirementsData, type RequirementPage } from '../data/requirementsData';

interface RequirementsOverlayProps {
  onClose: () => void;
  defaultPage?: RequirementPage;
}

export { type RequirementPage } from '../data/requirementsData';

export const RequirementsOverlay: React.FC<RequirementsOverlayProps> = ({ onClose, defaultPage = 'score-report' }) => {
  const [currentPage, setCurrentPage] = useState<RequirementPage>(defaultPage);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'elements', 'features', 'modules']));
  const [showPageList, setShowPageList] = useState(false);

  // 当 defaultPage 改变时更新当前页面
  useEffect(() => {
    setCurrentPage(defaultPage);
  }, [defaultPage]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const currentConfig = requirementsData[currentPage];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white border-2 border-industrial-fg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-industrial-fg px-6 py-4 bg-industrial-bg/5">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2 bg-industrial-fg text-industrial-bg">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold uppercase tracking-wider">{currentConfig.title}</h2>
              <div className="text-[10px] font-mono opacity-50 mt-0.5">{currentConfig.subtitle}</div>
            </div>
          </div>
          
          {/* 页面切换按钮 */}
          <div className="relative mr-4">
            <button
              onClick={() => setShowPageList(!showPageList)}
              className="flex items-center space-x-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 border-industrial-fg bg-white hover:bg-industrial-bg transition-all"
            >
              <List size={14} />
              <span>切换页面</span>
            </button>
            
            {/* 页面列表下拉 */}
            {showPageList && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] z-10">
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40 border-b border-industrial-fg/20 px-3 py-2">
                  选择需求文档
                </div>
                {Object.values(requirementsData).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setCurrentPage(page.id);
                      setShowPageList(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs border-b border-industrial-fg/10 transition-colors",
                      currentPage === page.id
                        ? "bg-blue-100 border-l-4 border-l-blue-600 font-bold"
                        : "hover:bg-industrial-bg/10"
                    )}
                  >
                    <div className="font-bold">{page.title}</div>
                    <div className="text-[10px] opacity-50 mt-0.5">{page.subtitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-industrial-bg transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {currentConfig.sections.map((section) => (
            <Section
              key={section.id}
              id={section.id}
              title={section.title}
              expanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            >
              <MarkdownContent content={section.content} />
            </Section>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-industrial-fg px-6 py-3 bg-industrial-bg/5 flex items-center justify-between">
          <div className="text-[10px] font-mono opacity-40">
            文档路径: <code className="bg-white px-1 py-0.5">{currentConfig.docPath}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-industrial-fg bg-industrial-fg text-industrial-bg hover:bg-industrial-bg hover:text-industrial-fg transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, expanded, onToggle, children }) => {
  return (
    <div className="border border-industrial-fg/20 bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-industrial-bg/5 hover:bg-industrial-bg/10 transition-colors"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {expanded && (
        <div className="px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Markdown 内容渲染组件
interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentSubsection: { title: string; items: string[] } | null = null;
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 text-xs mb-4">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              <span className="opacity-80">
                <InlineMarkdown text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  
  const flushSubsection = () => {
    if (currentSubsection && currentSubsection.items.length > 0) {
      elements.push(
        <div key={`subsection-${elements.length}`} className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
            {currentSubsection.title}
          </h4>
          <ul className="list-disc list-inside space-y-1 opacity-80 text-xs">
            {currentSubsection.items.map((item, idx) => (
              <li key={idx}>
                <InlineMarkdown text={item} />
              </li>
            ))}
          </ul>
        </div>
      );
      currentSubsection = null;
    }
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushList();
      flushSubsection();
      continue;
    }
    
    // 三级标题（### 标题）
    if (trimmed.startsWith('### ')) {
      flushList();
      flushSubsection();
      const title = trimmed.substring(4);
      currentSubsection = { title, items: [] };
    }
    // 列表项（- 开头）
    else if (trimmed.startsWith('- ')) {
      const item = trimmed.substring(2);
      if (currentSubsection) {
        currentSubsection.items.push(item);
      } else {
        currentList.push(item);
      }
    }
    // 普通段落
    else {
      flushList();
      flushSubsection();
      elements.push(
        <p key={`p-${elements.length}`} className="leading-relaxed opacity-80 mb-4">
          <InlineMarkdown text={trimmed} />
        </p>
      );
    }
  }
  
  flushList();
  flushSubsection();
  
  return <>{elements}</>;
};

// 行内 Markdown 渲染（支持代码和加粗）
interface InlineMarkdownProps {
  text: string;
}

const InlineMarkdown: React.FC<InlineMarkdownProps> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let current = '';
  let i = 0;
  
  while (i < text.length) {
    // 代码片段 `code`
    if (text[i] === '`') {
      if (current) {
        parts.push(current);
        current = '';
      }
      i++;
      let code = '';
      while (i < text.length && text[i] !== '`') {
        code += text[i];
        i++;
      }
      parts.push(
        <code key={parts.length} className="px-1 py-0.5 bg-industrial-bg/10 font-mono text-[10px]">
          {code}
        </code>
      );
      i++;
    }
    // 加粗 **text**
    else if (text[i] === '*' && text[i + 1] === '*') {
      if (current) {
        parts.push(current);
        current = '';
      }
      i += 2;
      let bold = '';
      while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '*')) {
        bold += text[i];
        i++;
      }
      parts.push(
        <strong key={parts.length} className="font-bold text-green-700">
          {bold}
        </strong>
      );
      i += 2;
    }
    else {
      current += text[i];
      i++;
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return <>{parts}</>;
};
