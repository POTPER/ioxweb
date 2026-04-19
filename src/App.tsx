import { useState, useRef, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { StepId } from './types';
import { 
  TechnicalPreparation, 
  MaterialPickup, 
  TubeAssembly, 
  CageInstallation, 
  Inspection, 
  ConnectivityTest, 
  InitialMeasurement,
  PrepAndSafety,
  InstrumentSetting,
  DataProcessing,
  ReportCompilation,
  MultiPeriodAnalysis
} from './components/steps';
import { ReportPage, generateMockReport } from './components/ReportPage';
import { StartPage } from './components/StartPage';
import { FrameworkGuide } from './components/FrameworkGuide';
import { MultiPeriodChart } from './components/MultiPeriodChart';
import { Modal, Button } from './components/Common';
import { WireframeProvider, useWireframe } from './components/WireframeContext';
import { Layout, ShieldCheck, Activity, FileText, Settings, ChevronRight, Award, FolderOpen, CheckCircle2, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function AppInner() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>('1');
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [materialTab, setMaterialTab] = useState<'bg' | 'instrument' | 'tube' | 'standard'>('bg');
  const [devVisible, setDevVisible] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showFrameworkGuide, setShowFrameworkGuide] = useState(false);
  const [showMultiPeriodChart, setShowMultiPeriodChart] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [allUnlocked, setAllUnlocked] = useState(false);
  const [devSkipToMeasure, setDevSkipToMeasure] = useState(false);
  const devPanelRef = useRef<HTMLDivElement>(null);
  const devDragOffset = useRef({ x: 0, y: 0 });
  const [devPos, setDevPos] = useState({ right: 20, bottom: 20 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDevVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDevDragStart = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    const el = devPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    devDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const onMove = (ev: MouseEvent) => {
      const x = ev.clientX - devDragOffset.current.x;
      const y = ev.clientY - devDragOffset.current.y;
      setDevPos({ right: window.innerWidth - x - rect.width, bottom: window.innerHeight - y - rect.height });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);
  const [showTransition, setShowTransition] = useState(false);

  const [stepData, setStepData] = useState<Record<string, any>>({});

  const handleFinish = () => {
    setReportData(generateMockReport("张三", stepData));
    setShowReport(true);
  };

  const steps: { id: StepId; label: string; section: string; description: string }[] = [
    { id: '1', label: '前期技术准备', section: '监测与准备', description: '任务说明：请在平面布置图中选择测斜管的布设位置，并填写测点间距。' },
    { id: '2', label: '取料区域', section: '监测与准备', description: '任务说明：测斜管材料已到场入库，请选择正确的存放区域前往领料。' },
    { id: '3', label: '管材拼装', section: '监测与准备', description: '任务说明：请完成测斜管的管材选型与拼装操作，点击图中各部件了解详情后完成配置。' },
    { id: '4', label: '导管安装到钢筋笼', section: '监测与准备', description: '任务说明：请在截面图中选择测斜管安装位置，然后在立面图中完成高度和绑扎设置。' },
    { id: '5', label: '管口验收', section: '监测与准备', description: '任务说明：请逐一检查各测斜孔的管口状态，识别缺陷并选择正确的处理方案。' },
    { id: '6', label: '通畅性测试', section: '监测与准备', description: '任务说明：对各测斜孔逐一进行通槽检测，点击孔位查看检测结果并判定结论。' },
    { id: '7', label: '初测(基准测量)', section: '监测与准备', description: '任务说明：请查看初测报告，确认测量条件并判断数据是否可作为监测基准。' },
    { id: '8', label: '测前准备与安全防护', section: '数据采集', description: '任务说明：请确认现场环境条件，选择合适的装备，完成出发前的准备。' },
    { id: '9', label: '读数仪设置与数据采集', section: '数据采集', description: '任务说明：请使用读数仪完成测孔CX-06的完整数据采集流程。' },
    { id: '10', label: '数据导入与预处理', section: '数据处理', description: '任务说明：请连接读数仪，选择03区06孔，分析数据并补全遗漏的累计位移。' },
    { id: '11', label: '监测日报表填写', section: '数据处理', description: '任务说明：请参照上期日报表，填写本期「深层水平位移监测日报表」。' },
    { id: '12', label: '多期数据分析与预警判断', section: '数据处理', description: '任务说明：对比多期监测曲线，分析变形趋势，标注预警数据并判断预警等级。' },
  ];

  const handleStepComplete = (data: any) => {
    if (data) {
      setStepData(prev => ({ ...prev, [currentStep]: data }));
    }
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep === '7') setShowTransition(true);
    // Note: 步骤12 完成后不再自动触发 handleFinish，改由侧栏「提交本次实操」按钮手动提交
  };

  const renderStep = () => {
    switch (currentStep) {
      case '1': return <TechnicalPreparation onNext={handleStepComplete} />;
      case '2': return <MaterialPickup onNext={handleStepComplete} />;
      case '3': return <TubeAssembly onNext={handleStepComplete} />;
      case '4': return <CageInstallation onNext={handleStepComplete} />;
      case '5': return <Inspection onNext={handleStepComplete} />;
      case '6': return <ConnectivityTest onNext={handleStepComplete} />;
      case '7': return <InitialMeasurement onNext={handleStepComplete} />;
      case '8': return <PrepAndSafety onNext={handleStepComplete} />;
      case '9': return <InstrumentSetting onNext={handleStepComplete} devAutoStart={devSkipToMeasure} />;
      case '10': return <DataProcessing onNext={handleStepComplete} />;
      case '11': return <ReportCompilation onNext={handleStepComplete} />;
      case '12': return <MultiPeriodAnalysis onNext={handleStepComplete} />;
      default: return <div>Step not implemented</div>;
    }
  };

  const currentStepInfo = steps.find(s => s.id === currentStep);

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  if (showReport && reportData) {
    return <ReportPage data={reportData} onBack={() => { setShowReport(false); setCurrentStep('1'); setHasStarted(false); }} />;
  }

  if (showTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border-2 border-industrial-fg p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] text-center space-y-6"
        >
          <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest">实操一已完成！</h2>
          <p className="text-sm opacity-70 leading-relaxed">
            即将进入专项实操二：测斜数据采集与处理
          </p>
          <Button 
            className="w-full py-4 text-sm font-bold uppercase tracking-widest"
            onClick={() => { setShowTransition(false); setCurrentStep('8'); }}
          >
            进入实操二 →
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-industrial-bg text-industrial-fg selection:bg-industrial-fg selection:text-industrial-bg">
      {/* Header */}
      <header className="h-14 border-b border-industrial-fg bg-white flex items-center px-6 sticky top-0 z-50 relative">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { if (window.confirm('确认退出实训？当前进度将不会保存。')) { /* 退出逻辑 */ } }}
            className="p-1 hover:bg-industrial-bg transition-colors opacity-40 hover:opacity-100"
            title="退出实训"
          >
            <LogOut size={18} />
          </button>
        </div>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold uppercase tracking-widest whitespace-nowrap">深层水平位移监测</h1>
        <div className="flex items-center space-x-4 ml-auto">
          <Button 
            variant="secondary" 
            className="flex items-center space-x-2 text-[10px] h-8"
            onClick={() => setShowMaterials(true)}
          >
            <FolderOpen size={14} />
            <span>项目资料</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] border-r border-industrial-fg bg-white overflow-hidden flex flex-col shrink-0">
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {Array.from(new Set(steps.map(s => s.section))).map(section => (
                  <div key={section} className="mb-4">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">{section}</div>
                    {steps.filter(s => s.section === section).map(step => {
                      const stepIndex = steps.findIndex(s => s.id === step.id);
                      const currentIndex = steps.findIndex(s => s.id === currentStep);
                      const isCompleted = completedSteps.has(step.id);
                      const isCurrent = currentStep === step.id;
                      const isNextReady = !isCurrent && stepIndex === currentIndex + 1 && completedSteps.has(currentStep);
                      const canNavigate = allUnlocked || isCompleted || isCurrent || isNextReady;
                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            if (!canNavigate) return;
                            setCurrentStep(step.id);
                          }}
                          disabled={!canNavigate}
                          className={cn(
                            "w-full text-left px-3 py-2 text-[11px] uppercase tracking-wider transition-all flex items-center justify-between group",
                            isCurrent
                              ? "bg-industrial-fg text-industrial-bg font-bold"
                              : isNextReady
                                ? "bg-green-100 border-l-2 border-green-600 font-bold animate-pulse cursor-pointer"
                                : canNavigate
                                  ? "hover:bg-industrial-bg opacity-70 hover:opacity-100 cursor-pointer"
                                  : "opacity-30 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{step.label}</span>
                            {isCompleted && !isNextReady && <CheckCircle2 size={12} className="text-green-600" />}
                            {isNextReady && <ChevronRight size={12} className="text-green-600" />}
                          </div>
                          {isCurrent && <ChevronRight size={12} />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>

              {/* 提交本次实操按钮（底部固定，任意时间可点击） */}
              <div className="p-3 border-t-2 border-industrial-fg bg-industrial-bg/5">
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 bg-industrial-fg text-industrial-bg border-industrial-fg hover:bg-industrial-bg hover:text-industrial-fg cursor-pointer"
                >
                  <Award size={14} />
                  提交
                </button>
              </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="border-l-[3px] border-industrial-fg bg-industrial-fg/5 px-4 py-3 mb-6 text-[12px] font-medium">
              <span className="text-industrial-fg">{currentStepInfo?.description}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Modal 
        isOpen={showMaterials} 
        onClose={() => setShowMaterials(false)} 
        title="项目资料"
        maxWidth="max-w-4xl"
      >
        {/* Tab Bar */}
        <div className="flex border-b border-industrial-fg/20 mb-4 -mx-6 px-6">
          {([
            { key: 'bg' as const, label: '工程背景' },
            { key: 'instrument' as const, label: '仪器使用说明书' },
            { key: 'tube' as const, label: '测斜管使用说明书' },
            { key: 'standard' as const, label: '规范参考' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMaterialTab(tab.key)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px]",
                materialTab === tab.key
                  ? "border-industrial-fg text-industrial-fg"
                  : "border-transparent text-industrial-fg/40 hover:text-industrial-fg/70"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
          {materialTab === 'bg' && (
            <div className="space-y-4">
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ['项目名称', 'XX市轨道交通X号线XX站深基坑工程'],
                    ['基坑概况', '基坑长120m，宽25m，开挖深度20m，围护结构采用地下连续墙+内支撑体系'],
                    ['监测要求', '根据设计要求，需在围护结构内侧布设测斜管，监测基坑开挖过程中围护结构的水平位移变化'],
                    ['地质条件', '上部填土层5m，粉质黏土层8m，砂质粉土层7m，地下水位埋深3m'],
                  ].map(([field, content]) => (
                    <tr key={field} className="border-b border-industrial-fg/10">
                      <td className="py-2 pr-4 font-bold whitespace-nowrap align-top w-24">{field}</td>
                      <td className="py-2 opacity-80">{content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {materialTab === 'instrument' && (
            <div className="space-y-4">
              <div className="bg-industrial-bg/30 border border-industrial-fg/10 p-3 mb-4">
                <div className="font-bold text-sm mb-1">CX-READER V3.2 读数仪操作手册</div>
                <div className="text-[10px] opacity-60">配套探头：CX-S2 型滑动式测斜仪探头 | 测量精度：±0.125mm/500mm</div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-industrial-fg">
                    <th className="py-2 pr-4 text-left font-bold w-32">章节</th>
                    <th className="py-2 text-left font-bold">关键内容摘录</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['一、产品概述', 'CX-03E型滑动式测斜仪，用于监测土体或结构物的水平位移变化'],
                    ['二、技术参数', '精度指标：±0.125mm/500mm；测量范围：±53°；探头长度500mm'],
                    ['三、操作规程', '连接设备 → 选择测区 → 选择孔号 → 正测采集 → 反测采集 → 数据导出'],
                    ['四、累计位移计算', '累计位移 = (正测 + 反测) / 2，从孔底逐段累加至孔口'],
                    ['五、设备编号', 'YQ02125072，检定有效期至2027-01-15'],
                  ].map(([chapter, content]) => (
                    <tr key={chapter} className="border-b border-industrial-fg/10">
                      <td className="py-2 pr-4 font-bold whitespace-nowrap align-top">{chapter}</td>
                      <td className="py-2 opacity-80">{content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-3">
                <h4 className="font-bold text-xs border-b border-industrial-fg/20 pb-1">标准作业流程</h4>
                <div className="font-mono text-[10px] bg-industrial-bg/20 p-3 border border-industrial-fg/10 space-y-1">
                  <div>① 开机 → 按电源键，LCD亮屏</div>
                  <div>② 连接探头 → 5针线材插入测量口</div>
                  <div>③ 设置测孔参数 → 测区、孔号、孔深</div>
                  <div>④ 设置探头参数 → 方向(向上)、校正(0.00)、步长(0.5m)</div>
                  <div>⑤ 现场准备 → 确认导轮方向(A+面向基坑侧)</div>
                  <div>⑥ 正测 → 探头下放至管底 → 逐点上提采集</div>
                  <div>⑦ 反测 → 旋转探头180° → 重复正测流程</div>
                  <div>⑧ 检查数据 → 计算校验和</div>
                  <div>⑨ 补测（如需要）→ 对异常深度重新采集</div>
                  <div>⑩ 收工 → 提出探头、盖好管口、关机</div>
                </div>
              </div>

            </div>
          )}

          {materialTab === 'tube' && (
            <div className="space-y-4">
              <div className="bg-industrial-bg/30 border border-industrial-fg/10 p-3 mb-4">
                <div className="font-bold text-sm mb-1">CX-70A 测斜管使用手册</div>
                <div className="text-[10px] opacity-60">材质：工程级ABS | 外径70mm / 内径58mm / 壁厚6mm | 管节长度2m</div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-industrial-fg">
                    <th className="py-2 pr-4 text-left font-bold w-32">章节</th>
                    <th className="py-2 text-left font-bold">关键内容摘录</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['一、产品概述', 'PVC-U测斜管，内壁设有十字形导槽，用于引导测斜探头定向滑行'],
                    ['二、技术参数', '外径70mm，内径58mm，壁厚6mm，管节长度2m'],
                    ['三、安装说明', '管节间采用胶水粘接方式连接，连接时须保证相邻管节导槽对齐；底部安装底盖，底盖与管体胶水粘接'],
                    ['四、导槽方向', '安装时应使一对导槽方向对准基坑变形的主方向（即垂直于围护结构）'],
                    ['五、验收与保管', '(1) 到货后检查产品与装箱清单是否相符；(2) 轻拿轻放，切忌摔打碰撞；(3) 高精度测斜管应放在湿度小于85%的房间内保存，存放环境须干燥、通风；(4) 进场安装的测斜管，首先要对管体进行检验，扭曲变形的测斜管不允许进入安装程序'],
                  ].map(([chapter, content]) => (
                    <tr key={chapter} className="border-b border-industrial-fg/10">
                      <td className="py-2 pr-4 font-bold whitespace-nowrap align-top">{chapter}</td>
                      <td className="py-2 opacity-80">{content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-3">
                <h4 className="font-bold text-xs border-b border-industrial-fg/20 pb-1">管体截面示意</h4>
                <pre className="font-mono text-[10px] bg-industrial-bg/20 p-3 border border-industrial-fg/10 leading-relaxed">{`       A+ 导槽
       ┃
  ╔════╬════╗
  ║         ║
B+╫── 管腔 ──╫B-
  ║         ║
  ╚════╬════╝
       ┃
       A- 导槽`}</pre>
                <div className="text-[10px] opacity-70 space-y-1">
                  <div><strong>A+/A- 导槽对：</strong>垂直于围护结构方向，测量位移主方向</div>
                  <div><strong>B+/B- 导槽对：</strong>平行于围护结构方向，测量位移次方向</div>
                </div>
              </div>

            </div>
          )}

          {materialTab === 'standard' && (
            <div className="space-y-4">
              <h4 className="font-bold border-b border-industrial-fg/20 pb-1 mb-3">GB 50497-2019《建筑基坑工程监测技术标准》</h4>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-industrial-fg">
                    <th className="py-2 pr-4 text-left font-bold w-36">条文</th>
                    <th className="py-2 text-left font-bold">内容摘录</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['§6.1.5', '测斜管应在围护结构施工时预埋，管口应高出地面0.3~0.5m并加盖保护'],
                    ['§6.4.3', '测斜管埋设后应进行通畅性检测，确保测斜探头能在管内全程顺畅升降'],
                    ['§6.4.4', '基坑开挖前应进行初始值测量，作为后续各次测量的基准'],
                  ].map(([code, content]) => (
                    <tr key={code} className="border-b border-industrial-fg/10">
                      <td className="py-2 pr-4 font-mono font-bold whitespace-nowrap align-top">{code}</td>
                      <td className="py-2 opacity-80">{content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 className="font-bold border-b border-industrial-fg/20 pb-1 mb-3">JGJ 120-2012《建筑基坑支护技术规程》</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-industrial-fg">
                    <th className="py-2 pr-4 text-left font-bold w-36">条文</th>
                    <th className="py-2 text-left font-bold">内容摘录</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-industrial-fg/10">
                    <td className="py-2 pr-4 font-mono font-bold whitespace-nowrap align-top">§8.2.1</td>
                    <td className="py-2 opacity-80">基坑监测点应布设在围护结构变形最大处及有代表性的部位</td>
                  </tr>
                </tbody>
              </table>

            </div>
          )}
        </div>
      </Modal>

      {/* 提交本次实操 · 确认弹窗 */}
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
              <div className="font-bold text-sm">是否确认提交本次实操？</div>
              <div className="opacity-70 leading-relaxed">
                提交后系统将生成实操成绩报告，您的填写内容将不可更改。请确认所有步骤的答案填写无误。
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono opacity-60 border border-industrial-fg/10 px-3 py-2">
            已完成步骤：<span className="font-bold text-industrial-fg">{completedSteps.size} / {steps.length}</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)} className="px-5">
              取消
            </Button>
            <Button
              onClick={() => {
                setShowSubmitConfirm(false);
                handleFinish();
              }}
              className="px-5"
            >
              <CheckCircle2 size={14} className="inline mr-1" />
              确认提交
            </Button>
          </div>
        </div>
      </Modal>

      {/* Framework Guide */}
      {showFrameworkGuide && <FrameworkGuide onClose={() => setShowFrameworkGuide(false)} />}
      {/* Multi-Period Chart */}
      {showMultiPeriodChart && <MultiPeriodChart onClose={() => setShowMultiPeriodChart(false)} />}

      {/* DEV Floating Panel */}
      {devVisible && <div
        ref={devPanelRef}
        className="fixed z-[200] flex flex-col items-end space-y-2"
        style={{ right: devPos.right, bottom: devPos.bottom }}
      >
        {showDevPanel && (
          <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 w-52 space-y-2">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40 border-b border-industrial-fg/20 pb-2 mb-3">DEV TOOLS</div>
            <button
              onClick={handleFinish}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
            >
              查看评估报告
            </button>
            <button
              onClick={() => { setCurrentStep('1'); setCompletedSteps(new Set()); setAllUnlocked(false); setShowTransition(false); }}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
            >
              重置到步骤1
            </button>
            <button
              onClick={() => { setDevSkipToMeasure(true); setCurrentStep('9'); setShowDevPanel(false); }}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-red-300 bg-red-50 hover:bg-red-100 transition-colors text-red-700"
            >
              跳至 Step9 测量
            </button>
            <button
              onClick={() => setAllUnlocked(v => !v)}
              className={cn("w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors", allUnlocked && "bg-green-100 border-green-400")}
            >
              {allUnlocked ? '✓ 已全部解锁' : '全部解锁'}
            </button>
            <button
              onClick={() => { setShowFrameworkGuide(true); setShowDevPanel(false); }}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
            >
              界面框架
            </button>
            <button
              onClick={() => { setShowMultiPeriodChart(true); setShowDevPanel(false); }}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
            >
              多期曲线
            </button>
            <WireframeToggle />
          </div>
        )}
        <button
          onMouseDown={handleDevDragStart}
          onClick={() => setShowDevPanel(v => !v)}
          className="w-9 h-9 bg-industrial-fg text-industrial-bg flex items-center justify-center font-mono font-bold text-[10px] hover:opacity-80 transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)] cursor-move select-none"
          title="DEV — 拖拽移动"
        >
          DEV
        </button>
      </div>}
    </div>
  );
}

function WireframeToggle() {
  const { wireframeMode, setWireframeMode } = useWireframe();
  return (
    <button
      onClick={() => setWireframeMode(!wireframeMode)}
      className={cn("w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors", wireframeMode && "bg-yellow-100 border-yellow-400")}
    >
      {wireframeMode ? '◼ 线框模式 ON' : '线框模式'}
    </button>
  );
}

export default function App() {
  return (
    <WireframeProvider>
      <AppInner />
    </WireframeProvider>
  );
}
