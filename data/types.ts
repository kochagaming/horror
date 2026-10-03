export type EvidenceKind = 'camera' | 'social' | 'call' | 'log' | 'document';
export type Judgement = 'normal' | 'observe' | 'police' | 'anomaly' | 'destroy';

export type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  label: string;
  timestamp?: string;
  source?: string;
  body: string;
  meta?: string[];
  warning?: string;
};

export type GameEvent =
  | { type: 'setFlag'; key: string; value?: boolean }
  | { type: 'unlockDocument'; documentId: string }
  | { type: 'addLog'; message: string }
  | { type: 'glitch'; message?: string }
  | { type: 'increaseAnomaly'; amount: number };

export type Incident = {
  id: string;
  number: string;
  time: string;
  title: string;
  summary: string;
  location: string;
  priority: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  evidence: EvidenceItem[];
  allowedJudgements: Judgement[];
  unlockCondition: { type: 'sequence'; after?: string };
  onOpen?: GameEvent[];
  onJudge?: Partial<Record<Judgement, GameEvent[]>>;
  final?: boolean;
};

export type ResearchDocument = {
  id: string;
  code: string;
  title: string;
  classification: string;
  body: string[];
  unlockHint: string;
};

export type GameState = {
  version: 1;
  phase: 'title' | 'playing' | 'ending';
  currentIncidentId: string | null;
  currentTime: string;
  processedIncidents: string[];
  incidentJudgements: Record<string, Judgement>;
  flags: Record<string, boolean>;
  unlockedDocuments: string[];
  anomalyLevel: number;
  endingFlags: Record<string, boolean>;
  viewedEvidence: Record<string, string[]>;
  systemLog: string[];
  endingId: string | null;
};
