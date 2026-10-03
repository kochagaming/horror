'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Archive, Camera, FileText, LogOut, MessageSquare, Phone, RotateCcw, ScanEye, Volume2, VolumeX } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DOCUMENTS, getDocument } from '@/data/documents';
import { ENDINGS } from '@/data/endings';
import { INCIDENTS, getIncident } from '@/data/incidents';
import { JUDGEMENT_LABELS } from '@/data/messages';
import { getReportScene } from '@/data/report-scenes';
import type { EvidenceKind, GameState, Judgement } from '@/data/types';
import { canUseJudgement, clearSave, createInitialState, judgeIncident, loadState, markEvidenceViewed, openIncident, persistState } from '@/lib/game-engine';

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

const EVIDENCE_TABS: Array<{ kind: EvidenceKind; label: string; icon: typeof Camera }> = [
  { kind: 'camera', label: '監視映像', icon: Camera },
  { kind: 'social', label: 'SNS', icon: MessageSquare },
  { kind: 'call', label: '通報', icon: Phone },
  { kind: 'log', label: 'ログ', icon: FileText },
  { kind: 'document', label: '資料', icon: Archive },
];

const READINGS: Record<string, string> = {
  庇: 'ひさし',
  俯瞰: 'ふかん',
  遡及: 'そきゅう',
  復路: 'ふくろ',
  終端: 'しゅうたん',
  不整合: 'ふせいごう',
};

const READING_PATTERN = /(不整合|俯瞰|遡及|復路|終端|庇)/g;

const JUDGEMENT_HELP: Record<Judgement, string> = {
  normal: '既知の事故・体調・機器不良などで説明でき、継続監視を必要としない。',
  observe: '情報が不足している、または食い違いがあるが、怪異とは断定できない。',
  police: '犯罪・事故・人命危険の可能性があり、現場での対応を優先する。',
  anomaly: '物理法則や通常の記録では説明できない現象が、複数の資料で確認できる。',
  destroy: '観測そのものが危険と判断し、対象に関する全記録を消去する。',
};

function ReadingText({ children }: { children: string }) {
  return <>{children.split(READING_PATTERN).map((part, index) => READINGS[part]
    ? <ruby key={`${part}-${index}`}>{part}<rt>{READINGS[part]}</rt></ruby>
    : part)}</>;
}

function TitleScreen({ saved, onNew, onContinue, onReset }: { saved: GameState | null; onNew: () => void; onContinue: () => void; onReset: () => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
  const hasSave = Boolean(saved);
  const processed = saved?.processedIncidents.length ?? 0;
  const remaining = saved?.phase === 'ending' ? 0 : Math.max(0, INCIDENTS.length - processed);

  return (
    <main className="boot-screen">
      <section className="boot-terminal" aria-labelledby="game-title">
        <div className="boot-kicker">市危機管理局／特異事象監視室</div>
        <h1 id="game-title">怪異監視センター</h1>
        <p className="boot-code">NIGHT SHIFT CONTROL SYSTEM // BUILD 04.14.07</p>
        <div className="boot-rule" />
        <p className="boot-copy">夜間監視員 ID: 00-714<br />勤務時間 22:00 — 05:00{saved && <><br />最終記録 {saved.currentTime} ／ 処理済 {processed}件</>}</p>
        <div className="boot-actions">
          <button type="button" onClick={() => hasSave ? setConfirmNew(true) : onNew()}>PROLOGUE / NEW GAME</button>
          <button type="button" onClick={onContinue} disabled={!hasSave}>CONTINUE</button>
        </div>
        <div className="title-foot">
          <p className="boot-status"><span /> SYSTEM ONLINE　未処理案件: {remaining}</p>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={!hasSave} />}><RotateCcw /> RESET SAVE</AlertDialogTrigger>
            <AlertDialogContent className="terminal-dialog">
              <AlertDialogHeader><AlertDialogTitle>セーブデータを初期化しますか</AlertDialogTitle><AlertDialogDescription>現在の勤務記録と判定結果を端末から削除します。</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onReset}>削除する</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <AlertDialog open={confirmNew} onOpenChange={setConfirmNew}>
          <AlertDialogContent className="terminal-dialog">
            <AlertDialogHeader><AlertDialogTitle>新しい夜勤を始めますか</AlertDialogTitle><AlertDialogDescription>現在の勤務記録があります。プロローグ後に夜間監視を開始すると、いまの進行状況は上書きされます。</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>続きへ戻る</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { setConfirmNew(false); onNew(); }}>新しく始める</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}

const PROLOGUE_PAGES = [
  {
    code: '22:00 // PERSONNEL ENTRY',
    title: '今夜から、あなたが監視員です。',
    body: '市内の監視網には、ときどき説明のつかない記録が混ざります。夜が明けるまでに届いた案件を調べ、何が起きているのか分類してください。',
  },
  {
    code: '22:03 // HANDOVER RECORD',
    title: '前任者からの引き継ぎ',
    body: '案件ごとに監視映像、通報、SNS、ログが届きます。ひとつの資料だけで決めつけず、時刻や場所、記録同士の食い違いを確認すること。',
  },
  {
    code: '22:05 // CLASSIFICATION RULE',
    title: '確認して、分類する。',
    body: '中央で資料を読み、右側の「案件判定」から分類を選びます。判定は取り消せません。迷った案件をどう扱ったかで、夜明けの結末が変わります。',
  },
] as const;

function PrologueScreen({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const [page, setPage] = useState(0);
  const current = PROLOGUE_PAGES[page];
  const isLast = page === PROLOGUE_PAGES.length - 1;

  return (
    <main className="prologue-screen">
      <section className="prologue-card" aria-labelledby="prologue-title">
        <div className="prologue-topline"><span>機密区分：内部限り</span><b>{String(page + 1).padStart(2, '0')} / {String(PROLOGUE_PAGES.length).padStart(2, '0')}</b></div>
        <p className="prologue-code">{current.code}</p>
        <h1 id="prologue-title">{current.title}</h1>
        <p className="prologue-body">{current.body}</p>
        {isLast && (
          <ol className="prologue-flow" aria-label="基本操作">
            <li><span>01</span><div><b>資料を開く</b><small>タブと資料名を押して内容を確認</small></div></li>
            <li><span>02</span><div><b>食い違いを探す</b><small>時刻・場所・証言を照合</small></div></li>
            <li><span>03</span><div><b>案件を判定する</b><small>右側の分類をひとつ選択</small></div></li>
          </ol>
        )}
        <div className="prologue-actions">
          <button type="button" className="prologue-back" onClick={page === 0 ? onBack : () => setPage((value) => value - 1)}>{page === 0 ? 'タイトルへ戻る' : '前へ'}</button>
          <button type="button" className="prologue-next" onClick={isLast ? onStart : () => setPage((value) => value + 1)}>{isLast ? '夜間監視を開始' : '次へ'}</button>
        </div>
      </section>
    </main>
  );
}

function EndingScreen({ state, onTitle }: { state: GameState; onTitle: () => void }) {
  const ending = ENDINGS[(state.endingId ?? 'normal') as keyof typeof ENDINGS];
  return (
    <main className={`ending-screen ending-${state.endingId}`}>
      <section className="ending-card">
        <div className="ending-number">{ending.number}</div>
        {'counter' in ending && <div className="ending-counter">{ending.counter}</div>}
        <h1>{ending.title}</h1>
        <div className="ending-copy">{ending.lines.map((line) => <p key={line}>{line}</p>)}</div>
        <div className="ending-actions"><Button onClick={onTitle}>タイトルへ戻る</Button><span>勤務記録は保存されました</span></div>
      </section>
    </main>
  );
}

function ReportInterlude({ incidentId, judgement, protocolUnlocked, onContinue }: { incidentId: string; judgement: Judgement; protocolUnlocked: boolean; onContinue: () => void }) {
  const incident = getIncident(incidentId);
  const scene = getReportScene(incidentId, judgement);

  return (
    <main className="report-interlude">
      <section className="report-interlude-card" aria-labelledby="report-scene-title">
        <div className="report-stamp"><span>{scene.code}</span><b>CLASSIFICATION: {JUDGEMENT_LABELS[judgement]}</b></div>
        <div className="report-case">案件 {incident?.number ?? '----'}／{incident?.title ?? '処理済み案件'}</div>
        <h1 id="report-scene-title">{scene.title}</h1>
        <div className="report-story">{scene.lines.map((line) => <p key={line}><ReadingText>{line}</ReadingText></p>)}</div>
        <div className="next-case-hook">
          <span><i /> INCOMING CASE</span>
          <p><ReadingText>{scene.hook}</ReadingText></p>
        </div>
        {protocolUnlocked && (
          <div className="secret-protocol" role="status">
            <span>RESTRICTED PROTOCOL UNLOCKED</span>
            <b>K-7/DENIAL</b>
            <p>最終分類端末に「記録を破棄する」を追加しました。</p>
          </div>
        )}
        <div className="report-divider"><span>TRANSMISSION COMPLETE</span></div>
        <button type="button" onClick={onContinue}>{scene.nextLabel}</button>
      </section>
    </main>
  );
}

export function GameApp() {
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [pendingJudgement, setPendingJudgement] = useState<Judgement | null>(null);
  const [showGlitch, setShowGlitch] = useState(false);
  const [showPrologue, setShowPrologue] = useState(false);
  const [tutorialStage, setTutorialStage] = useState<number | null>(null);
  const [reportInterlude, setReportInterlude] = useState<{ incidentId: string; judgement: Judgement; nextState: GameState } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const stateRef = useRef<GameState | null>(null);
  const audioRef = useRef<{ context: AudioContext; oscillators: OscillatorNode[] } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSaved(loadState()); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (state) persistState(state); }, [state]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const stopAmbient = useCallback(() => {
    const rig = audioRef.current;
    if (!rig) return;
    rig.oscillators.forEach((oscillator) => { try { oscillator.stop(); } catch { /* already stopped */ } });
    void rig.context.close().catch(() => undefined);
    audioRef.current = null;
    setSoundEnabled(false);
  }, []);

  const toggleAmbient = useCallback(() => {
    if (audioRef.current) { stopAmbient(); return; }
    const context = new AudioContext();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.8);
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    filter.Q.value = 2.5;
    filter.connect(gain);
    gain.connect(context.destination);
    const low = context.createOscillator();
    low.type = 'sine';
    low.frequency.value = 46;
    const machine = context.createOscillator();
    machine.type = 'triangle';
    machine.frequency.value = 61;
    low.connect(filter);
    machine.connect(filter);
    low.start();
    machine.start();
    void context.resume().catch(() => undefined);
    audioRef.current = { context, oscillators: [low, machine] };
    setSoundEnabled(true);
  }, [stopAmbient]);

  useEffect(() => () => stopAmbient(), [stopAmbient]);

  const currentIncident = useMemo(() => getIncident(state?.currentIncidentId ?? null), [state?.currentIncidentId]);
  const visibleTabs = useMemo(() => EVIDENCE_TABS.filter((tab) => currentIncident?.evidence.some((item) => item.kind === tab.kind)), [currentIncident]);
  const currentEvidence = currentIncident?.evidence.find((item) => item.id === selectedEvidence) ?? currentIncident?.evidence[0];

  useEffect(() => {
    if (!state?.flags.glitchActive) return;
    const startTimer = window.setTimeout(() => setShowGlitch(true), 0);
    const timer = window.setTimeout(() => setShowGlitch(false), 900);
    return () => { window.clearTimeout(startTimer); window.clearTimeout(timer); };
  }, [state?.currentIncidentId, state?.flags.glitchActive]);

  const beginNew = useCallback(() => { const next = openIncident(createInitialState()); setState(next); setSaved(next); setSelectedEvidence(null); setShowPrologue(false); setTutorialStage(0); setReportInterlude(null); }, []);
  const startNew = useCallback(() => { setShowPrologue(true); }, []);
  const continueGame = useCallback(() => { const loaded = loadState(); if (loaded) { setState(loaded); setReportInterlude(null); } }, []);
  const returnTitle = useCallback(() => { stopAmbient(); setSaved(stateRef.current); setState(null); setShowPrologue(false); setTutorialStage(null); setReportInterlude(null); }, [stopAmbient]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const requireEmptyInput = (input: unknown) => {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 0) {
        throw new Error('Input must be an empty object.');
      }
    };
    const register = async () => {
      await context.registerTool({
        name: 'start_new_night_shift', title: '新しい夜勤を開始',
        description: '怪異監視センターのセーブを新規作成し、事件01から勤務を開始します。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => { requireEmptyInput(input); beginNew(); return { status: 'started', incidentId: 'incident-01', time: '22:06' }; },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'read_shift_status', title: '勤務状況を確認',
        description: '現在の時刻、案件、処理件数、異常度を読み取ります。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: (input: unknown) => { requireEmptyInput(input); return { time: stateRef.current?.currentTime ?? null, incidentId: stateRef.current?.currentIncidentId ?? null, processed: stateRef.current?.processedIncidents.length ?? 0, anomalyLevel: stateRef.current?.anomalyLevel ?? 0 }; },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [beginNew]);

  if (!hydrated) return <main className="boot-screen" aria-label="起動中" />;
  if (showPrologue && !state) return <PrologueScreen onStart={beginNew} onBack={() => setShowPrologue(false)} />;
  if (!state) return <TitleScreen saved={saved} onNew={startNew} onContinue={continueGame} onReset={() => { clearSave(); setSaved(null); }} />;
  if (reportInterlude) return <ReportInterlude incidentId={reportInterlude.incidentId} judgement={reportInterlude.judgement} protocolUnlocked={Boolean(reportInterlude.nextState.flags.recordBreakReady)} onContinue={() => { setState(reportInterlude.nextState); setSelectedEvidence(null); setReportInterlude(null); }} />;
  if (state.phase === 'ending') return <EndingScreen state={state} onTitle={returnTitle} />;
  if (!currentIncident) return null;

  const viewEvidence = (id: string) => { setSelectedEvidence(id); setState((old) => old ? markEvidenceViewed(old, id) : old); };
  const confirmJudgement = () => {
    if (!pendingJudgement) return;
    const judgement = pendingJudgement;
    const nextState = judgeIncident(state, judgement);
    setReportInterlude({ incidentId: currentIncident.id, judgement, nextState });
    setTutorialStage(null);
    setPendingJudgement(null);
  };
  const processedCount = state.processedIncidents.length;
  const progressValue = Math.round((processedCount / INCIDENTS.length) * 100);
  const viewedEvidenceIds = state.viewedEvidence[currentIncident.id] ?? [];
  const currentViewed = viewedEvidenceIds.length;
  const unreadEvidence = Math.max(0, currentIncident.evidence.length - currentViewed);

  return (
    <main className={`operations ${showGlitch ? 'is-glitching' : ''}`}>
      {showGlitch && <div className="glitch-message" aria-live="assertive">{state.systemLog.at(-1)}</div>}
      <header className="ops-header">
        <div className="agency"><ScanEye /><div><b>特異事象監視室</b><span>市危機管理局・夜間監視系</span></div></div>
        <div className="clock"><span>CURRENT TIME</span><strong>{state.currentTime}</strong></div>
        <div className="shift"><span className="online-dot" /> 勤務中 <small>ID 00-714</small><Button variant="ghost" size="icon-sm" aria-label={soundEnabled ? '環境音をオフ' : '環境音をオン'} title={soundEnabled ? '環境音 OFF' : '環境音 ON'} onClick={toggleAmbient}>{soundEnabled ? <Volume2 /> : <VolumeX />}</Button><Button variant="ghost" size="icon-sm" aria-label="タイトルへ戻る" onClick={returnTitle}><LogOut /></Button></div>
      </header>

      <aside className="incident-rail">
        <div className="rail-head"><span>受信案件</span><b>{INCIDENTS.length - processedCount}</b></div>
        <nav aria-label="事件一覧">
          {INCIDENTS.map((incident, index) => {
            const done = state.processedIncidents.includes(incident.id);
            const active = incident.id === currentIncident.id;
            const locked = !done && !active;
            return <div key={incident.id} className={`incident-row ${done ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}>
              <span className="incident-index">{String(index + 1).padStart(2, '0')}</span>
              <div><b>{locked ? '未受信' : incident.title}</b><small>{done ? '処理済' : active ? incident.time : '--:--'}</small></div>
            </div>;
          })}
        </nav>
        <div className="rail-progress"><Progress value={progressValue}><ProgressLabel>勤務進捗</ProgressLabel><ProgressValue>{(_formattedValue, value) => `${value ?? 0}%`}</ProgressValue></Progress></div>
      </aside>

      <section className="case-workspace">
        <div className="case-heading">
          <div><span className={`priority priority-${currentIncident.priority.toLowerCase()}`}>{currentIncident.priority}</span><span className="case-number">CASE {currentIncident.number}</span></div>
          <h2>{currentIncident.title}</h2>
          <p><ReadingText>{currentIncident.summary}</ReadingText></p>
          <dl><div><dt>受信</dt><dd>{currentIncident.time}</dd></div><div><dt>地点</dt><dd>{currentIncident.location}</dd></div><div><dt>資料</dt><dd>{currentViewed}/{currentIncident.evidence.length} 閲覧</dd></div></dl>
        </div>

        <div className={`evidence-shell ${tutorialStage === 0 ? 'tutorial-focus' : ''}`}>
          <Tabs defaultValue={visibleTabs[0]?.kind ?? 'camera'} key={currentIncident.id} onValueChange={(kind) => {
            const firstInTab = currentIncident.evidence.find((item) => item.kind === kind);
            if (firstInTab) viewEvidence(firstInTab.id);
          }}>
            <TabsList variant="line" className="evidence-tabs">
              {visibleTabs.map(({ kind, label, icon: Icon }) => <TabsTrigger key={kind} value={kind}><Icon />{label}<em>{currentIncident.evidence.filter((item) => item.kind === kind).length}</em></TabsTrigger>)}
            </TabsList>
            {visibleTabs.map(({ kind }) => (
              <TabsContent key={kind} value={kind} className="evidence-layout">
                <div className="evidence-list">
                  {currentIncident.evidence.filter((item) => item.kind === kind).map((item) => {
                    const viewed = viewedEvidenceIds.includes(item.id);
                    return <button key={item.id} className={`${item.id === currentEvidence?.id ? 'selected' : ''} ${viewed ? 'viewed' : ''}`} onClick={() => viewEvidence(item.id)}><span>{item.timestamp ?? 'FILE'}</span><b><ReadingText>{item.label}</ReadingText></b><small>{item.source}</small>{viewed && <i aria-label="確認済">確認済</i>}</button>;
                  })}
                </div>
                {currentEvidence?.kind === kind && <article className="evidence-view">
                  <div className={`feed-placeholder feed-${kind}`}><div className="reticle" /><span>{currentEvidence.source}</span><strong>{currentEvidence.timestamp}</strong>{kind === 'camera' && <div className="silhouette" />}</div>
                  <div className="evidence-copy"><h3><ReadingText>{currentEvidence.label}</ReadingText></h3><p><ReadingText>{currentEvidence.body}</ReadingText></p>{currentEvidence.meta && <ul>{currentEvidence.meta.map((meta) => <li key={meta}><ReadingText>{meta}</ReadingText></li>)}</ul>}{currentEvidence.warning && <div className="evidence-warning"><AlertTriangle /><ReadingText>{currentEvidence.warning}</ReadingText></div>}</div>
                </article>}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <aside className={`decision-panel ${tutorialStage !== null && tutorialStage >= 1 ? 'tutorial-focus' : ''}`} id="decision-panel">
        <div className="status-block"><span>ANOMALY INDEX</span><b>{String(state.anomalyLevel).padStart(2, '0')}</b><div className="meter"><i style={{ width: `${state.anomalyLevel * 10}%` }} /></div></div>
        <div className="decision-copy">
          <h3>案件判定</h3>
          <p>資料を確認し、現在の案件を分類してください。判定後は変更できません。</p>
          <div className={`evidence-check ${unreadEvidence > 0 ? 'has-unread' : 'is-complete'}`}>
            <span>{unreadEvidence > 0 ? '未確認資料' : '資料確認完了'}</span>
            <b>{unreadEvidence > 0 ? `${unreadEvidence}件` : `${currentViewed}/${currentIncident.evidence.length}`}</b>
          </div>
        </div>
        <details className="classification-guide">
          <summary>分類基準を確認</summary>
          <dl>
            {currentIncident.allowedJudgements.filter((choice) => canUseJudgement(state, choice)).map((choice) => <div key={choice}><dt>{JUDGEMENT_LABELS[choice]}</dt><dd>{JUDGEMENT_HELP[choice]}</dd></div>)}
          </dl>
        </details>
        <div className="judgement-grid">
          {currentIncident.allowedJudgements.filter((choice) => canUseJudgement(state, choice)).map((choice) => <button key={choice} className={`judgement judgement-${choice}`} onClick={() => setPendingJudgement(choice)}><span>{JUDGEMENT_LABELS[choice]}</span><small>{choice === 'normal' ? '異常性なし' : choice === 'observe' ? '監視継続' : choice === 'police' ? '実働対応' : choice === 'anomaly' ? '特異事案登録' : '全記録削除'}</small></button>)}
        </div>
        {processedCount > 0 && <details className="judgement-history">
          <summary>判定履歴 <span>{processedCount}件</span></summary>
          <ol>{state.processedIncidents.map((incidentId) => {
            const incident = getIncident(incidentId);
            const judgement = state.incidentJudgements[incidentId];
            return incident && judgement ? <li key={incidentId}><span>{incident.number}</span><div><b>{incident.title}</b><small>{JUDGEMENT_LABELS[judgement]}</small></div></li> : null;
          })}</ol>
        </details>}
        <div className="document-drawer"><h3>内部資料 <span>{state.unlockedDocuments.length}/{DOCUMENTS.length}</span></h3>{state.unlockedDocuments.length ? state.unlockedDocuments.map((id) => { const doc = getDocument(id); return doc ? <details key={id}><summary>{doc.code}<small>{doc.title}</small></summary><div>{doc.body.map((line) => <p key={line}>{line}</p>)}</div></details> : null; }) : <p>閲覧可能な資料はありません。</p>}</div>
        <div className="system-tail"><b>SYSTEM LOG</b>{state.systemLog.slice(-4).map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</div>
      </aside>

      {tutorialStage !== null && (
        <section className="tutorial-guide" aria-live="polite" aria-label="操作研修">
          <div className="tutorial-guide-head"><span>操作研修 {tutorialStage + 1}/3</span><button type="button" onClick={() => setTutorialStage(null)}>スキップ</button></div>
          {tutorialStage === 0 && <><h3>まず、案件の資料を確認</h3><p>中央のタブと資料名を押すと内容が切り替わります。映像だけでなく、通報やログも読み比べてください。</p></>}
          {tutorialStage === 1 && <><h3>次に、判定欄を確認</h3><p>資料を読み終えたら「案件判定」へ進みます。スマホでは画面の下にあります。</p></>}
          {tutorialStage === 2 && <><h3>分類をひとつ選ぶ</h3><p>正常・要観察・警察へ通報・怪異認定から選択します。確定後は戻せませんが、正解はひとつとは限りません。</p></>}
          <button type="button" className="tutorial-next" onClick={() => {
            if (tutorialStage === 0) setTutorialStage(1);
            else if (tutorialStage === 1) { setTutorialStage(2); document.getElementById('decision-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            else setTutorialStage(null);
          }}>{tutorialStage === 0 ? '資料の見方がわかった' : tutorialStage === 1 ? '判定欄へ進む' : '研修を終える'}</button>
        </section>
      )}

      <AlertDialog open={Boolean(pendingJudgement)} onOpenChange={(open) => !open && setPendingJudgement(null)}>
        <AlertDialogContent className="terminal-dialog">
          <AlertDialogHeader><AlertDialogTitle>{unreadEvidence > 0 ? '未確認の資料があります' : '判定を確定しますか'}</AlertDialogTitle><AlertDialogDescription>{unreadEvidence > 0 ? `まだ確認していない資料が${unreadEvidence}件あります。` : ''}案件 {currentIncident.number} を「{pendingJudgement ? JUDGEMENT_LABELS[pendingJudgement] : ''}」として保存します。この操作は取り消せません。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{unreadEvidence > 0 ? '資料へ戻る' : '再検討'}</AlertDialogCancel><AlertDialogAction onClick={confirmJudgement}>{unreadEvidence > 0 ? '未確認のまま記録' : '判定を記録'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
