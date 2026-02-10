
export type ProjectType = 'residential' | 'commercial' | 'industrial';

export interface ProjectInfo {
  name: string;
  type: ProjectType;
  area: number;
  floors: number;
  budget: number;
  timeline: number;
  location: string;
}

export interface CostBreakdown {
  materials: number;
  labor: number;
  overhead: number;
  contingency: number;
}

export interface RiskFactor {
  category: string;
  level: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface TimelinePhase {
  phase: string;
  startWeek: number;
  duration: number;
  dependencies: string[];
}

export interface FeasibilityReport {
  score: number;
  summary: string;
  detailedCost: CostBreakdown;
  timelineWeeks: number;
  phases: TimelinePhase[];
  risks: RiskFactor[];
  recommendations: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  project: ProjectInfo;
  report: FeasibilityReport;
  blueprint?: string;
}

export interface NavigationState {
  currentStep: 'conception' | 'planning' | 'procurement' | 'risk_ai' | 'dashboard' | 'history';
}
