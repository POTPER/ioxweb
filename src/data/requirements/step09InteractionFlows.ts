/**
 * Step9 读数仪 LCD 逐屏交互说明 — 单一事实来源
 * 供 .doc/读数仪交互逻辑.md 与 docs/step09-instrument-interaction.html 共用
 */

export type InteractionControl = {
  control: string;
  action: string;
};

export type InteractionTransition = {
  to: string;
  when: string;
};

export type InteractionScreen = {
  id: string;
  order: number;
  title: string;
  lcdScreen: string;
  wireframeRefs?: string;
  mockupLines: string[];
  highlightLine?: number;
  initialState: string[];
  interactions: InteractionControl[];
  transitions: InteractionTransition[];
  webAreaNotes?: string[];
};

export const STEP9_LAYOUT_ZONES = [
  {
    id: 'D',
    label: 'D1–D3 测斜管剖面图',
    cols: 7,
    items: ['深度刻度 0–20 m', '探头位置动画', '测量间距按钮', '▲ 上提 / ▼ 下放', '📋 采集表'],
    unlock: 'fieldUnlocked=true 后可操作',
  },
  {
    id: 'M',
    label: 'M1–M3 测斜管平面图',
    cols: 5,
    items: ['探头旋转 ±90°', '确定朝向', 'N/E/S/W 靠齐热点'],
    unlock: 'fieldUnlocked=true 后可操作',
  },
  {
    id: 'I',
    label: 'I1–I7 读数仪本体',
    cols: 5,
    items: ['LCD 屏', '← OK ↑ ↓ 导航键', 'DC 充电口', '探头口（线材）', 'USB 口', '⏻ 电源键'],
    unlock: '始终可操作（关机时仅电源/探头口）',
  },
] as const;

export const STEP9_PHYSICAL_CONTROLS: InteractionControl[] = [
  { control: '← 返回', action: 'params/probe/time/remeasure/confirm 屏返回主菜单；收工阶段无效' },
  { control: 'OK 确认', action: '进入子菜单、保存参数、开始测量、稳定后记点' },
  { control: '↑ / ↓', action: '主菜单/字段列表移动光标；编辑态下增减数值或切换选项' },
  { control: '⏻ 电源', action: '开机（3s 启动画面）/ 关机；phase≥5 收工时先关机' },
  { control: '探头口', action: '未连接时打开线材选型弹窗；phase≥5 收工时拔线' },
  { control: '剖面 ▲ 上提', action: '上提提示态下推进下一手测点；否则浏览深度' },
  { control: '剖面 ▼ 下放', action: '浏览深度（自动采集中可改显示，不记读数）' },
  { control: '平面图热点', action: '确认朝向后点击 N/E/S/W 选择线材靠齐方位' },
];

/** 与参考图差异说明 */
export const STEP9_REFERENCE_DIFFS = [
  '现版无 + / − / 红色 Record 键；参数调节用 ↑↓',
  '菜单为「测孔参数设置」「探头设置」，非参考图中的测站/传感器参数',
  '记点动作为稳定倒计时结束后按 OK，非 Record 键',
  '现场布置（朝向、靠齐、间距）在 Web 平面图/剖面区完成，非 LCD 内设置',
];

export const step09InteractionScreens: InteractionScreen[] = [
  {
    id: 'S01',
    order: 1,
    title: '关机 / 线材连接',
    lcdScreen: 'off',
    wireframeRefs: 'I1-I7',
    mockupLines: ['（LCD 熄灭）', '', '探头口: ○ 未连接'],
    initialState: [
      'phase = 1',
      'isPoweredOn = false，lcdScreen = off',
      'isConnected = false',
      '剖面图 / 平面图灰色禁用（fieldUnlocked = false）',
    ],
    interactions: [
      { control: '点击探头口', action: '打开线材选型弹窗（四选一图文卡）' },
      { control: '弹窗确认', action: 'isConnected = true，探头口变蓝 ●；记录 acq.instrument.cable' },
      { control: '⏻ 电源（未接线）', action: '可开机但记录 powerBeforeConnect（错误顺序）' },
      { control: '⏻ 电源（已接线）', action: '记录 connectBeforePower（正确顺序），进入启动画面' },
    ],
    transitions: [
      { to: '启动画面', when: '已接线后按电源键开机' },
      { to: '线材弹窗', when: '点击未连接的探头口' },
    ],
  },
  {
    id: 'S02',
    order: 2,
    title: '启动画面',
    lcdScreen: 'boot',
    wireframeRefs: 'I1-I7',
    mockupLines: ['', '欢迎使用', '数字式测斜仪', ''],
    initialState: [
      'booting = true，约 3 秒',
      '导航键无效',
    ],
    interactions: [
      { control: '（无）', action: '自动计时，不可操作' },
    ],
    transitions: [
      { to: '主菜单', when: '3 秒后自动进入 main' },
    ],
  },
  {
    id: 'S03',
    order: 3,
    title: '主菜单',
    lcdScreen: 'main',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '欢迎使用          MM-DD HH:MM',
      '> 1. 开始新的测量',
      '  2. 测孔参数设置',
      '  3. 探头设置',
      '  4. 补测数据点',
      '  5. 时间设置',
    ],
    highlightLine: 1,
    initialState: [
      'phase ≥ 2（已开机；接线+开机后自动 phase 2）',
      'cursor = 0，fieldUnlocked = false',
      'paramsSaved / probeSaved 未齐时仍可浏览菜单',
    ],
    interactions: [
      { control: '↑ / ↓', action: '在五项菜单间移动光标（循环）' },
      { control: 'OK · 1', action: '清空采集表 → confirm-fwd，fieldUnlocked = true' },
      { control: 'OK · 2', action: '进入测孔参数设置 params' },
      { control: 'OK · 3', action: '进入探头设置 probe' },
      { control: 'OK · 4', action: '进入补测 remeasure' },
      { control: 'OK · 5', action: '进入时间设置 time-setting' },
    ],
    transitions: [
      { to: '测孔参数', when: 'cursor=1，OK' },
      { to: '探头设置', when: 'cursor=2，OK' },
      { to: '正测确认', when: 'cursor=0，OK' },
      { to: '补测', when: 'cursor=3，OK' },
      { to: '时间设置', when: 'cursor=4，OK' },
    ],
    webAreaNotes: [
      'phase 2 且 paramsSaved && probeSaved 后自动进入 phase 3',
    ],
  },
  {
    id: 'S04',
    order: 4,
    title: '测孔参数设置',
    lcdScreen: 'params',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '测孔参数设置      MM-DD HH:MM',
      '> 测区编号:        01',
      '  孔  号:          01',
      '  孔  深:          25 m',
      '      [保存]',
    ],
    highlightLine: 1,
    initialState: [
      '默认测区 01 / 孔 01 / 孔深 25 m（故意错误）',
      '任务正确值：03 / 06 / 20 m',
      'cursor = 0，editingField = null',
    ],
    interactions: [
      { control: '↑ / ↓', action: '在四个焦点（三字段 + 保存）间移动' },
      { control: 'OK（字段）', action: '进入编辑态 editingField = cursor' },
      { control: '↑ / ↓（编辑）', action: '测区 01–05、孔号 01–10、孔深 1–50 增减' },
      { control: 'OK（编辑）', action: '退出编辑态' },
      { control: 'OK（保存）', action: '记录 area/hole/depth，paramsSaved=true，回主菜单' },
      { control: '←', action: '不保存，回主菜单 cursor=1' },
    ],
    transitions: [
      { to: '主菜单', when: '保存或 ← 返回' },
    ],
  },
  {
    id: 'S05',
    order: 5,
    title: '探头设置',
    lcdScreen: 'probe',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '探头设置          MM-DD HH:MM',
      '> 方向:            向下',
      '  校正:            0.00',
      '  步长:            1.0m',
      '      [保存]',
    ],
    highlightLine: 1,
    initialState: [
      '默认方向向下、步长 1.0 m（故意错误）',
      '任务正确值：向上 / 0.5 m',
      '校正默认 0.00，范围 ±9.99',
    ],
    interactions: [
      { control: '↑ / ↓', action: '在四个焦点间移动' },
      { control: 'OK（字段）', action: '进入编辑态' },
      { control: '↑ / ↓（方向）', action: '切换 向上 / 向下' },
      { control: '↑ / ↓（校正）', action: '步进 ±0.01' },
      { control: '↑ / ↓（步长）', action: '在 0.5 / 1.0 / 1.5 / 2.0 m 循环' },
      { control: 'OK（保存）', action: '记录 probeDirection/stepLength，probeSaved=true，回主菜单' },
      { control: '←', action: '不保存，回主菜单 cursor=2' },
    ],
    transitions: [
      { to: '主菜单', when: '保存或 ← 返回；两参数均已保存后 phase→3' },
    ],
  },
  {
    id: 'S06',
    order: 6,
    title: '时间设置',
    lcdScreen: 'time-setting',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '时间设置          MM-DD HH:MM',
      '> 年:              2026',
      '  月:              06',
      '  日:              04',
      '  时:              12',
      '  分:              00',
      '      [确认]',
    ],
    highlightLine: 1,
    initialState: [
      '显示系统当前时间（只读，不可编辑）',
      '不参与评分',
    ],
    interactions: [
      { control: '↑ / ↓', action: '在六个时间字段与 [确认] 间移动光标' },
      { control: 'OK（确认）', action: '回主菜单 cursor=4' },
      { control: '←', action: '回主菜单 cursor=4' },
    ],
    transitions: [
      { to: '主菜单', when: '确认或 ←' },
    ],
  },
  {
    id: 'S07',
    order: 7,
    title: '正向测量确认',
    lcdScreen: 'confirm-fwd',
    wireframeRefs: 'M1-M3, D1-D3, I1-I7',
    mockupLines: [
      '即将进行         MM-DD HH:MM',
      '',
      '    正向测量',
      '',
      '  按OK键开始测量',
      '  请先完成现场布置',
    ],
    initialState: [
      'fieldUnlocked = true',
      'probeRotation = 0°，rotationConfirmed = false',
      'cableAlignment = null，monitorInterval 未设',
      '未完成布置时 OK 无效，LCD 显示红色提示',
    ],
    interactions: [
      { control: '平面图 ±90°', action: '调整探头旋转 0/90/180/270°' },
      { control: '平面图 确定', action: 'rotationConfirmed = true，显示 N/E/S/W 热点' },
      { control: '热点 N/E/S/W', action: '二次确认后写入 cableAlignment（正测正确：W）' },
      { control: '剖面 测量间距', action: '弹窗单选 0.5/1.0/1.5/2.0 m（正确 0.5 m）' },
      { control: 'OK（布置完成）', action: '记录朝向/靠齐/间距 → collect，phase→4，深度 20.0 m，启动 30s 稳定' },
      { control: '←', action: '回主菜单，fieldUnlocked = false' },
    ],
    transitions: [
      { to: '正向采集', when: 'rotationConfirmed && cableAlignment && monitorInterval，按 OK' },
      { to: '主菜单', when: '← 返回' },
    ],
    webAreaNotes: [
      '正测要求 A 向（0°）+ W 靠齐 + 0.5 m 间距',
    ],
  },
  {
    id: 'S08',
    order: 8,
    title: '正向采集',
    lcdScreen: 'collect',
    wireframeRefs: 'D1-D3, I1-I7',
    mockupLines: [
      '正向测量         MM-DD HH:MM',
      ' 20.0m              孔06',
      ' +0.42°             组01',
      ' +3.65mm            ☒01',
    ],
    initialState: [
      'measureType = forward，manualPoint = 0',
      '手测 5 点：20.0 / 19.5 / 19.0 / 18.5 / 18.0 m',
      '首点稳定 30 s，其余各 5 s；稳定前读数带抖动',
    ],
    interactions: [
      { control: '（等待）', action: '倒计时结束 → isStable = true' },
      { control: 'OK（稳定后）', action: '记录当前深度读数到采集表' },
      { control: '剖面 ▲ 上提', action: 'showMovePrompt 时出现；推进下一测点并重启倒计时' },
      { control: 'OK（上提提示态）', action: '亦可确认（与 ▲ 配合）' },
      { control: '第 5 点 OK 后', action: '自动采集剩余深度（约 1.5 s）' },
    ],
    transitions: [
      { to: '上提提示', when: 'manualPoint < 4，记点后' },
      { to: '反向确认', when: '第 5 点记点后 autoCollect 完成' },
    ],
    webAreaNotes: [
      '深度公式（向上）：currentDepth = 20 − manualPoint × stepLength',
      '读数来源：monitoringPeriodData 第 6 期 A+',
    ],
  },
  {
    id: 'S09',
    order: 9,
    title: '反向测量确认',
    lcdScreen: 'confirm-rev',
    wireframeRefs: 'M1-M3, D1-D3, I1-I7',
    mockupLines: [
      '即将进行         MM-DD HH:MM',
      '',
      '    反向测量',
      '',
      '  按OK键开始测量',
      '  请重新选择靠齐方位',
    ],
    initialState: [
      '正测 autoCollect 后约 1.5 s 自动进入',
      'probeRotation = 180°，rotationConfirmed = true（A−）',
      'cableAlignment 已清空，需重新选择',
      'monitorInterval 可沿用正测已设值',
    ],
    interactions: [
      { control: '平面图热点', action: '重新选择靠齐方位' },
      { control: 'OK（靠齐已选）', action: '开始反测 collect；深度 20.0 m，30s 稳定' },
      { control: '←', action: '回主菜单' },
    ],
    transitions: [
      { to: '反向采集', when: 'cableAlignment 已选，按 OK' },
    ],
  },
  {
    id: 'S10',
    order: 10,
    title: '反向采集 / 自动补全',
    lcdScreen: 'collect',
    wireframeRefs: 'D1-D3, I1-I7',
    mockupLines: [
      '反向测量         MM-DD HH:MM',
      '',
      '  正在测量剩余测点…',
      '  （autoCollecting）',
    ],
    initialState: [
      '手测 5 点流程同正测，读数取 A−',
      '12.5 m 反测读数故意 +8 mm（校验和超 5 mm）',
      '第 5 点记点后 autoCollect 填充全部反测列',
    ],
    interactions: [
      { control: '手测阶段', action: '同正向采集（OK 记点 + ▲ 上提）' },
      { control: 'autoCollecting', action: 'LCD 显示「正在测量剩余测点…」，导航键无效' },
      { control: '完成后', action: '回主菜单，phase→5，fieldUnlocked=false' },
    ],
    transitions: [
      { to: '主菜单', when: '反测 autoCollect 完成' },
      { to: '补测', when: '学员发现 12.5 m 校验和异常，主菜单选「补测数据点」' },
    ],
    webAreaNotes: [
      '校验和 = round(正测 + 反测, 2) mm；阈值 5 mm',
      '可点 📋 采集表查看全表 41 行',
    ],
  },
  {
    id: 'S11',
    order: 11,
    title: '补测数据点',
    lcdScreen: 'remeasure',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '补测位点          MM-DD HH:MM',
      '> 组号:            05',
      '  深度:            3.0m',
      '  方向:            正测',
      '    [开始补测]',
    ],
    highlightLine: 1,
    initialState: [
      '默认组号 05 / 深度 3.0 m / 方向 正测（故意偏离）',
      '任务正确：05 组 / 12.5 m / 反测',
      'phase ≥ 5 可用',
    ],
    interactions: [
      { control: '↑ / ↓', action: '在组号/深度/方向/[开始补测] 间移动' },
      { control: 'OK（字段）', action: '进入编辑；组号 01–99，深度 0–20 步进 0.5 m' },
      { control: '↑ / ↓（方向）', action: '切换 正测 / 反测' },
      { control: 'OK（开始补测）', action: '记录三组参数 → collect 模拟 5 s → 用无偏差真值覆盖 → 回主菜单' },
      { control: '←', action: '回主菜单 cursor=3' },
    ],
    transitions: [
      { to: '采集（模拟）', when: '开始补测' },
      { to: '主菜单', when: '补测完成或 ←' },
    ],
  },
  {
    id: 'S12',
    order: 12,
    title: '收工',
    lcdScreen: 'main / off',
    wireframeRefs: 'I1-I7',
    mockupLines: [
      '（phase 5 完成后）',
      '点击「进入收工阶段」→ phase 6',
      '',
      '1. ⏻ 关机 → LCD 熄灭',
      '2. 探头口拔线 → ○',
      '→ 自动提交本步成绩',
    ],
    initialState: [
      '反测完成且回主菜单后 phase = 5',
      '点击收工按钮后 phase = 6',
      'cleanupDone.power / cable 均为 false',
    ],
    interactions: [
      { control: '进入收工阶段', action: 'phase → 6（Web 区按钮）' },
      { control: '⏻ 电源', action: '关机，记录「关闭电源」' },
      { control: '探头口', action: '拔线，记录「拔除线材」' },
      { control: '顺序要求', action: '必须先关机再拔线（cleanupOrder）' },
    ],
    transitions: [
      { to: '自动提交', when: '关机且拔线均完成 → onNext()' },
    ],
  },
];

export const STEP9_LCD_FLOW_MERMAID = `flowchart LR
  off["关机 off"] --> boot["启动 boot"]
  boot --> main["主菜单 main"]
  main --> params["测孔参数 params"]
  main --> probe["探头设置 probe"]
  main --> time["时间 time-setting"]
  main --> remeasure["补测 remeasure"]
  main --> cfwd["正测确认 confirm-fwd"]
  params --> main
  probe --> main
  time --> main
  remeasure --> main
  cfwd --> collF["正向采集 collect"]
  collF --> crev["反测确认 confirm-rev"]
  crev --> collR["反向采集 collect"]
  collR --> main
  main --> cleanup["收工 phase6"]
  cleanup --> submit["自动提交"]`;

/** 生成 Markdown 逐屏章节 */
export function renderScreenMarkdown(screen: InteractionScreen): string {
  const mockup = screen.mockupLines.map((line, i) => {
    const prefix = i === screen.highlightLine ? '│' : '│';
    return `${prefix} ${line}`;
  }).join('\n');

  const interactions = screen.interactions
    .map(i => `| ${i.control} | ${i.action} |`)
    .join('\n');

  const transitions = screen.transitions
    .map(t => `- → **${t.to}**：${t.when}`)
    .join('\n');

  const webNotes = screen.webAreaNotes?.length
    ? `\n**Web 区补充**\n\n${screen.webAreaNotes.map(n => `- ${n}`).join('\n')}\n`
    : '';

  return `### 4.${screen.order} ${screen.title}（\`${screen.lcdScreen}\`）

**屏显**

\`\`\`
┌─────────────────────────┐
${mockup}
└─────────────────────────┘
[←] [OK] [↑] [↓]
\`\`\`

**初始状态**

${screen.initialState.map(s => `- ${s}`).join('\n')}

**交互说明**

| 操作 | 行为 |
|------|------|
${interactions}

**界面跳转**

${transitions}
${webNotes}`;
}

/** 生成完整 Markdown 文档正文（不含页眉元信息） */
export function exportStep09InteractionMarkdownBody(): string {
  const screens = step09InteractionScreens.map(renderScreenMarkdown).join('\n\n');
  const controls = STEP9_PHYSICAL_CONTROLS
    .map(c => `| ${c.control} | ${c.action} |`)
    .join('\n');
  const diffs = STEP9_REFERENCE_DIFFS.map(d => `- ${d}`).join('\n');
  const layout = STEP9_LAYOUT_ZONES.map(z =>
    `| ${z.label} | ${z.items.join('、')} | ${z.unlock} |`
  ).join('\n');

  return `## 1. 整体界面布局

| 区域 | 内容 | 解锁条件 |
|------|------|----------|
${layout}

**fieldUnlocked**：进入「开始新的测量」或正/反测确认后解锁剖面图与平面图；此前灰色禁用。

## 2. 与参考图的差异

${diffs}

## 3. 物理控件一览

| 控件 | 作用 |
|------|------|
${controls}

## 4. LCD 界面总流转

\`\`\`mermaid
${STEP9_LCD_FLOW_MERMAID}
\`\`\`

## 5. 逐屏交互说明

${screens}

## 6. 现场布置（Web 区，非 LCD）

| 步骤 | 操作 | 正测要求 |
|------|------|----------|
| 1 | 平面图旋转 ±90° 后点「确定」 | A 向（0°） |
| 2 | 点击 N/E/S/W 热点并确认 | W 靠齐 |
| 3 | 剖面区点「测量间距」弹窗 | 0.5 m |
| 反测 | 靠齐方位清空，需重新选择 | 朝向自动 180°（A−） |

## 7. 采集表与校验和

- 行数：\`20 / stepLength + 1\`（步长 0.5 m → 41 行，0.0–20.0 m）
- 列：深度、组号（05）、正测、反测、校验和
- 校验和 = \`round(正测 + 反测, 2)\` mm
- **12.5 m 反测**故意 +8 mm，使校验和 > 5 mm，引导补测（05 组 / 12.5 m / 反测）

## 8. 读数显示（简）

- 真值：\`monitoringPeriodData.csv\` 第 6 期 A+ / A−
- 抖动与角度公式详见 [jitter-formula-playground.html](../docs/jitter-formula-playground.html)

## 9. 任务正确配置速查

| 项目 | 值 |
|------|-----|
| 线材 | 5 针圆形航空插头（A） |
| 开机顺序 | 先接线，后开机 |
| 测区 / 孔号 / 孔深 | 03 / 06 / 20 m |
| 探头方向 / 步长 | 向上 / 0.5 m |
| 正测朝向 / 靠齐 / 间距 | A 向(0°) / W / 0.5 m |
| 手测深度 | 20.0 → 18.0 m（5 点） |
| 补测 | 05 组 / 12.5 m / 反测 |
| 收工顺序 | 先关电源，再拔线 |
`;
}

/** 供 HTML 内嵌的 JSON 序列化 */
export function exportStep09InteractionJson(): string {
  return JSON.stringify({
    layoutZones: STEP9_LAYOUT_ZONES,
    physicalControls: STEP9_PHYSICAL_CONTROLS,
    referenceDiffs: STEP9_REFERENCE_DIFFS,
    flowMermaid: STEP9_LCD_FLOW_MERMAID,
    screens: step09InteractionScreens,
  }, null, 2);
}
