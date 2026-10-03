import { INCIDENTS, getIncident, getIncidentAfter } from '@/data/incidents';
import type { GameEvent, GameState, Judgement } from '@/data/types';
import { SYSTEM_MESSAGES } from '@/data/messages';

export const SAVE_KEY = 'kaii-monitor-center-save-v1';

export const createInitialState = (): GameState => ({
  version: 1,
  phase: 'playing',
  currentIncidentId: INCIDENTS[0].id,
  currentTime: INCIDENTS[0].time,
  processedIncidents: [],
  incidentJudgements: {},
  flags: {},
  unlockedDocuments: [],
  anomalyLevel: 0,
  endingFlags: {},
  viewedEvidence: {},
  systemLog: [SYSTEM_MESSAGES.welcome],
  endingId: null,
});

export function applyEvents(state: GameState, events: GameEvent[] = []): GameState {
  return events.reduce((next, event) => {
    if (event.type === 'setFlag') return { ...next, flags: { ...next.flags, [event.key]: event.value ?? true } };
    if (event.type === 'unlockDocument') return { ...next, unlockedDocuments: Array.from(new Set([...next.unlockedDocuments, event.documentId])) };
    if (event.type === 'addLog') return { ...next, systemLog: [...next.systemLog, event.message].slice(-12) };
    if (event.type === 'glitch') return { ...next, flags: { ...next.flags, glitchActive: true }, systemLog: event.message ? [...next.systemLog, event.message] : next.systemLog };
    if (event.type === 'increaseAnomaly') return { ...next, anomalyLevel: Math.min(10, next.anomalyLevel + event.amount) };
    return next;
  }, state);
}

export function openIncident(state: GameState): GameState {
  const incident = getIncident(state.currentIncidentId);
  if (!incident || state.flags[`opened:${incident.id}`]) return state;
  const firstEvidenceId = incident.evidence[0]?.id;
  const opened = {
    ...state,
    flags: { ...state.flags, [`opened:${incident.id}`]: true },
    viewedEvidence: firstEvidenceId
      ? { ...state.viewedEvidence, [incident.id]: [firstEvidenceId] }
      : state.viewedEvidence,
  };
  return applyEvents(opened, incident.onOpen);
}

export function markEvidenceViewed(state: GameState, evidenceId: string): GameState {
  if (!state.currentIncidentId) return state;
  const seen = state.viewedEvidence[state.currentIncidentId] ?? [];
  if (seen.includes(evidenceId)) return state;
  return {
    ...state,
    viewedEvidence: { ...state.viewedEvidence, [state.currentIncidentId]: [...seen, evidenceId] },
  };
}

function endingFor(judgement: Judgement) {
  if (judgement === 'anomaly') return 'existence-proof';
  if (judgement === 'observe') return 'observer';
  if (judgement === 'destroy') return 'unobserved';
  return 'normal';
}

function hasRecordBreakPrerequisites(state: GameState) {
  return state.anomalyLevel >= 5
    && state.incidentJudgements['incident-06'] === 'anomaly'
    && state.incidentJudgements['incident-07'] === 'anomaly';
}

export function judgeIncident(state: GameState, judgement: Judgement): GameState {
  const incident = getIncident(state.currentIncidentId);
  if (!incident || !incident.allowedJudgements.includes(judgement)) return state;
  let next: GameState = {
    ...state,
    incidentJudgements: { ...state.incidentJudgements, [incident.id]: judgement },
    processedIncidents: [...state.processedIncidents, incident.id],
    systemLog: [...state.systemLog, `${incident.number} を「${judgement}」として記録`].slice(-12),
  };
  next = applyEvents(next, incident.onJudge?.[judgement]);
  if (incident.id === 'incident-07' && hasRecordBreakPrerequisites(next)) {
    next = {
      ...next,
      flags: { ...next.flags, recordBreakReady: true },
      systemLog: [...next.systemLog, 'K-7/DENIAL // 緊急手順を解放'].slice(-12),
    };
  }
  if (incident.final) {
    return { ...next, phase: 'ending', endingId: endingFor(judgement), endingFlags: { ...next.endingFlags, [endingFor(judgement)]: true } };
  }
  const following = getIncidentAfter(incident.id);
  if (!following) return next;
  next = { ...next, currentIncidentId: following.id, currentTime: following.time, flags: { ...next.flags, glitchActive: false } };
  if (incident.id === 'incident-05') {
    next = { ...next, currentTime: '03:21', unlockedDocuments: Array.from(new Set([...next.unlockedDocuments, 'doc-observation-dependent'])), systemLog: [...next.systemLog, '02:37 内部資料 K-7 を解放'] };
  }
  return openIncident(next);
}

export function canUseJudgement(state: GameState, judgement: Judgement) {
  if (judgement !== 'destroy') return true;
  return Boolean(state.flags.recordBreakReady);
}

export function loadState(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null;
    if (parsed?.version !== 1) return null;
    if (hasRecordBreakPrerequisites(parsed) && !parsed.flags.recordBreakReady) {
      return { ...parsed, flags: { ...parsed.flags, recordBreakReady: true } };
    }
    return parsed;
  } catch { return null; }
}

export function persistState(state: GameState) {
  if (typeof window !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearSave() {
  if (typeof window !== 'undefined') localStorage.removeItem(SAVE_KEY);
}
