
import { useState, useEffect } from 'react';
import { ProjectInfo, FeasibilityReport, NavigationState, HistoryEntry } from './types';
import Sidebar from './components/Sidebar';
import ProjectForm from './components/ProjectForm';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import History from './components/History';
import { generateFeasibilityReport, generateBlueprintVisual, predictDynamicRisks } from './services/geminiService';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<NavigationState['currentStep']>('conception');
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [report, setReport] = useState<FeasibilityReport | null>(null);
  const [blueprint, setBlueprint] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Risk states
  const [situation, setSituation] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState('');
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  // Simple Tips Feed
  const [aiUpdates, setAiUpdates] = useState([
    { title: "Local Cache", text: "Storing your data securely in your browser.", icon: "save" },
    { title: "Safety Scan", text: "Checking building rules.", icon: "shield" }
  ]);

  // Load history from localStorage on mount
  useEffect(() => {
    setIsHistoryLoading(true);
    try {
      const saved = localStorage.getItem('build_history');
      if (saved) {
        setHistory(JSON.parse(saved));
        setAiUpdates(prev => [
          { title: "Storage Ready", text: "Your past plans are loaded locally.", icon: "database" },
          ...prev.slice(1)
        ]);
      }
    } catch (e) {
      console.error("Local storage load failed", e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (report && project) {
      setAiUpdates([
        { title: "Time Saver", text: `Start foundations early to save 2 weeks.`, icon: "bolt" },
        { title: "Local Alert", text: `The weather in ${project.location} is perfect for concrete today.`, icon: "sun" },
        { title: "Budget Tip", text: `Materials might get 5% more expensive next month. Buy now.`, icon: "money" }
      ]);
    }
  }, [report, project]);

  const handleProjectSubmit = async (data: ProjectInfo) => {
    setIsLoading(true);
    setError(null);
    setBlueprint('');
    
    try {
      setProject(data);
      const reportData = await generateFeasibilityReport(data);
      setReport(reportData);
      setActiveStep('dashboard');
      setIsLoading(false); 

      // Visuals in background
      let finalBlueprint = '';
      try {
        finalBlueprint = await generateBlueprintVisual(data);
        setBlueprint(finalBlueprint);
      } catch (e) { console.warn(e); }

      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        project: data,
        report: reportData,
        blueprint: finalBlueprint
      };
      
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('build_history', JSON.stringify(updatedHistory));
      
    } catch (err: any) {
      setError("AI is busy. Please try again in a few seconds.");
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setProject(entry.project);
    setReport(entry.report);
    setBlueprint(entry.blueprint || '');
    setActiveStep('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('build_history', JSON.stringify(updated));
  };

  const handlePredictRisk = async () => {
    if (!project || !situation.trim()) return;
    setIsRiskLoading(true);
    try {
      const result = await predictDynamicRisks(project, situation);
      setRiskAnalysis(result);
    } catch (err: any) {
      setError("Could not analyze this risk right now.");
    } finally {
      setIsRiskLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeStep) {
      case 'conception':
        return <ProjectForm onSubmit={handleProjectSubmit} isLoading={isLoading} />;
      case 'dashboard':
        return report && project ? <Dashboard report={report} project={project} blueprint={blueprint} /> : null;
      case 'planning':
        return report ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32 lg:pb-12">
             <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 border-b pb-6">
                <div>
                   <span className="text-[10px] font-black uppercase text-orange-500">Plan View</span>
                   <h1 className="text-3xl font-black text-black">Work Schedule</h1>
                </div>
                <div className="bg-black text-white px-6 py-3 rounded-2xl">
                   <p className="text-[10px] opacity-50 font-bold uppercase">Total Time</p>
                   <p className="text-xl font-black">{report.timelineWeeks} Weeks</p>
                </div>
             </header>
             <Timeline phases={report.phases} />
          </div>
        ) : null;
      case 'risk_ai':
        return project ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32">
             <header className="border-b pb-6">
                <span className="text-[10px] font-black uppercase text-red-500">SafeCheck AI</span>
                <h1 className="text-3xl font-black text-black">Risk Analysis</h1>
             </header>
             <div className="max-w-3xl bg-white p-6 md:p-10 rounded-[32px] shadow-sm border">
                <h3 className="text-xl font-black mb-2">Test a Problem</h3>
                <p className="text-slate-500 text-sm mb-6">Type a situation (like "Heavy Rain") to see how it hits your plan.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                   <input 
                      type="text" 
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="e.g. Workers are on strike..."
                      className="flex-1 px-6 py-4 rounded-xl border-2 focus:border-black outline-none font-bold"
                   />
                   <button 
                      onClick={handlePredictRisk}
                      disabled={isRiskLoading}
                      className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-xs hover:bg-orange-500 transition-all active:scale-95"
                   >
                      {isRiskLoading ? "Analyzing..." : "Test"}
                   </button>
                </div>
                {riskAnalysis && (
                  <div className="mt-8 p-6 bg-orange-50 border border-orange-100 rounded-2xl animate-in slide-in-from-top-2">
                     <p className="text-black font-medium leading-relaxed">{riskAnalysis}</p>
                  </div>
                )}
             </div>
          </div>
        ) : null;
      case 'history':
        return <History entries={history} onSelect={handleSelectHistory} onDelete={handleDeleteHistory} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <Sidebar currentStep={activeStep} setStep={setActiveStep} />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 transition-all duration-500 max-w-[1600px] mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
            <p className="text-sm font-bold">{error}</p>
            <button onClick={() => setError(null)} className="font-black text-lg">&times;</button>
          </div>
        )}
        {isHistoryLoading && activeStep === 'history' && (
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-black rounded-full animate-spin"></div>
          </div>
        )}
        {renderContent()}
      </main>

      {/* Right Tips Panel - Desktop only */}
      {project && report && activeStep !== 'conception' && activeStep !== 'history' && (
        <aside className="w-[300px] bg-white border-l p-8 hidden 2xl:block sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-orange-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest">Smart Tips</h3>
          </div>
          <div className="space-y-4">
            {aiUpdates.map((update, idx) => (
               <div key={idx} className="p-4 bg-slate-50 rounded-2xl border hover:border-black transition-all group">
                  <span className="text-[9px] font-black text-orange-500 uppercase block mb-1">{update.title}</span>
                  <p className="text-xs text-slate-600 font-bold leading-tight">{update.text}</p>
               </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;
