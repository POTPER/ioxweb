# 需求文档浮层使用说明

## 功能概述

独立的需求文档浮动按钮（REQ），可以根据当前所在界面自动显示对应的需求文档，支持多页面切换查看。

## 核心特性

### 1. **智能默认页面**
根据当前所在界面，自动打开对应的需求文档：
- **成绩报告页面** → 成绩报告需求
- **步骤 10（数据处理）** → 数据处理需求
- **步骤 12（多期分析）** → 多期数据分析需求
- **其他实训步骤** → 实训步骤需求

### 2. **多页面支持**
支持查看多个模块的需求文档：
- 成绩报告
- 实训步骤
- 数据处理
- 多期数据分析

### 3. **页面切换**
在需求文档浮层中，点击"切换页面"按钮，可以查看其他模块的需求文档。

## 使用方法

### 1. 打开需求文档

**方式一：点击 REQ 按钮**
- 在页面右下角找到蓝色的 **REQ** 浮动按钮
- 点击按钮即可打开需求说明浮层
- 自动显示当前界面对应的需求文档

**方式二：使用快捷键**
- 按下 `Ctrl + Shift + Alt + R` 显示/隐藏 REQ 按钮

### 2. 切换需求页面

在需求文档浮层中：
1. 点击右上角的 **"切换页面"** 按钮
2. 在下拉列表中选择要查看的需求文档
3. 当前页面会高亮显示（蓝色背景）

### 3. 拖拽移动按钮

- 按住 REQ 按钮可以拖拽移动到任意位置
- 避免遮挡重要内容

### 4. 浮层功能

- **可折叠章节**：点击章节标题展开/收起内容
- **滚动查看**：支持滚动查看完整文档
- **关闭浮层**：点击右上角 ✕ 或底部"关闭"按钮

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Shift + Alt + K` | 显示/隐藏 DEV 按钮 |
| `Ctrl + Shift + Alt + R` | 显示/隐藏 REQ 按钮 |

## 按钮位置

- **DEV 按钮**：右下角（黑色）
- **REQ 按钮**：右下角，DEV 按钮左侧（蓝色）

两个按钮可以独立拖拽移动，互不干扰。

## 需求文档页面

### 1. 成绩报告
- **概述**：功能总体说明
- **元素**：报告总览区、步骤汇总区、题目标题栏
- **验收标准**：功能验收清单

### 2. 实训步骤
- **概述**：实训流程说明
- **功能特性**：步骤解锁、进度保存、交互操作等

### 3. 数据处理
- **概述**：数据处理与分析说明
- **功能特性**：数据导入、预处理、报表生成等

### 4. 多期数据分析
- **概述**：多期数据对比分析说明
- **功能特性**：多期曲线、变化率计算、趋势分析等

## 智能默认页面逻辑

```typescript
// 在主应用中
if (showReport) {
  defaultPage = 'score-report';  // 成绩报告页面
} else if (currentStep === '10') {
  defaultPage = 'data-processing';  // 数据处理步骤
} else if (currentStep === '12') {
  defaultPage = 'multi-period-analysis';  // 多期分析步骤
} else {
  defaultPage = 'training-steps';  // 其他实训步骤
}
```

## 设计特点

- 🎨 **工业风格**：与应用整体设计风格一致
- 🔵 **独立按钮**：蓝色 REQ 按钮，与 DEV 按钮区分
- 🖱️ **可拖拽**：支持拖拽移动到任意位置
- 🧠 **智能默认**：根据当前界面自动显示对应需求
- 📑 **多页面支持**：支持查看多个模块的需求文档
- 🔄 **快速切换**：通过下拉列表快速切换页面
- 📱 **响应式**：适配不同屏幕尺寸
- 🔍 **易读性**：清晰的层次结构和排版
- ⚡ **快速访问**：无需切换窗口或打开文件
- 🖨️ **打印友好**：在打印时自动隐藏 REQ 按钮

## 技术实现

### 数据源
- **数据文件**：`src/data/requirementsData.ts`
- **组件文件**：`src/components/RequirementsOverlay.tsx`
- **集成位置**：
  - `src/App.tsx` - 主应用中的 REQ 按钮
  - `src/components/ReportPage.tsx` - 成绩报告页面中的 REQ 按钮

### 数据结构
```typescript
export interface RequirementPageData {
  id: RequirementPage;
  title: string;
  subtitle: string;
  docPath: string;  // 对应的文档路径（仅用于显示）
  sections: RequirementSection[];
}

export interface RequirementSection {
  id: string;
  title: string;
  items?: string[];  // 直接列表项
  subsections?: {    // 子章节
    title: string;
    items: string[];
  }[];
  description?: string;  // 描述文字
}
```

### 内容格式支持
- **普通文本**：直接显示
- **代码片段**：使用反引号 \`code\` 包裹，自动渲染为代码样式
- **加粗文本**：使用 \*\*text\*\* 包裹，自动渲染为加粗绿色文本
- **列表项**：自动添加绿色勾选图标
- **子章节**：支持多级结构

## 扩展建议

### 添加新的需求文档页面

1. **在 `src/data/requirementsData.ts` 中添加新的页面类型**：
```typescript
export type RequirementPage = 
  | 'score-report'
  | 'training-steps'
  | 'data-processing'
  | 'multi-period-analysis'
  | 'your-new-page';  // 新增
```

2. **在 `requirementsData` 中添加配置**：
```typescript
'your-new-page': {
  id: 'your-new-page',
  title: '新功能',
  subtitle: '新功能需求文档',
  docPath: 'doc/your-new-page-requirements.md',
  sections: [
    {
      id: 'overview',
      title: '概述',
      description: '功能说明...',
    },
    {
      id: 'features',
      title: '功能特性',
      items: [
        '特性 1：说明',
        '特性 2：使用 `代码` 标记',
        '**重要特性**：加粗显示',
      ],
    },
    {
      id: 'details',
      title: '详细说明',
      subsections: [
        {
          title: '子章节 1',
          items: ['项目 1', '项目 2'],
        },
        {
          title: '子章节 2',
          items: ['项目 3', '项目 4'],
        },
      ],
    },
  ],
}
```

3. **在 `App.tsx` 中添加智能默认逻辑**：
```typescript
if (某个条件) {
  setCurrentRequirementPage('your-new-page');
}
```

### 内容编写技巧

1. **使用代码标记**：
   - 在文本中使用反引号包裹代码：\`你的答案：xxx\`
   - 自动渲染为灰色背景的代码样式

2. **使用加粗强调**：
   - 使用双星号包裹重要文本：\*\*重要说明\*\*
   - 自动渲染为加粗绿色文本

3. **组织结构**：
   - 使用 `description` 添加概述性文字
   - 使用 `items` 添加列表项（自动带勾选图标）
   - 使用 `subsections` 添加子章节（带标题的列表组）

4. **保持简洁**：
   - 每个章节聚焦一个主题
   - 列表项简短明了
   - 避免过长的段落

## 最佳实践

1. **保持需求文档简洁**：每个页面聚焦一个功能模块
2. **使用可折叠章节**：方便用户快速定位信息
3. **提供验收标准**：明确功能的验收条件
4. **及时更新文档**：功能变更时同步更新需求文档
5. **使用代码示例**：在需求中使用 `<code>` 标签展示格式
