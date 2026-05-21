/**
 * 产品需求文档数据
 * 从 CSV 文件加载 Markdown 格式的需求内容
 */

import pagesCSV from './requirements/pages.csv?raw';

export type RequirementPage = 
  | 'score-report'
  | 'training-steps'
  | 'data-processing'
  | 'multi-period-analysis';

export interface RequirementSection {
  id: string;
  title: string;
  content: string; // Markdown 内容
}

export interface RequirementPageData {
  id: RequirementPage;
  title: string;
  subtitle: string;
  docPath: string;
  content: string; // 完整的 Markdown 内容
  sections: RequirementSection[];
}

// CSV 解析辅助函数
function parseCSV(csv: string): string[][] {
  const lines = csv.trim().split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 转义的引号
          current += '"';
          i++;
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 字段分隔符
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current);
    result.push(row);
  }
  
  return result;
}

// 解析 Markdown 内容为章节
function parseMarkdownSections(markdown: string): RequirementSection[] {
  const sections: RequirementSection[] = [];
  const lines = markdown.split('\n');
  
  let currentSection: RequirementSection | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    // 检测二级标题（## 标题）
    if (line.startsWith('## ')) {
      // 保存上一个章节
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      
      // 创建新章节
      const title = line.substring(3).trim();
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: title,
        content: '',
      };
      currentContent = [];
    } else if (currentSection) {
      // 添加内容到当前章节
      currentContent.push(line);
    }
  }
  
  // 保存最后一个章节
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }
  
  return sections;
}

// 加载需求数据
function loadRequirementsData(): Record<RequirementPage, RequirementPageData> {
  const rows = parseCSV(pagesCSV);
  const result: Record<string, RequirementPageData> = {};
  
  // 跳过表头
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const pageId = row[0] as RequirementPage;
    const title = row[1];
    const subtitle = row[2];
    const docPath = row[3];
    const content = row[4] || '';
    
    result[pageId] = {
      id: pageId,
      title,
      subtitle,
      docPath,
      content,
      sections: parseMarkdownSections(content),
    };
  }
  
  return result as Record<RequirementPage, RequirementPageData>;
}

// 导出需求数据
export const requirementsData: Record<RequirementPage, RequirementPageData> = loadRequirementsData();
