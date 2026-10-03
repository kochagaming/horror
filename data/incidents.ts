import type { Incident } from './types';

export const INCIDENTS: Incident[] = [
  {
    id: 'incident-01', number: '#0101', time: '22:06', title: 'コンビニ前の人物',
    summary: '店員から、入口付近に長時間座り込む人物がいるとの連絡。初動分類を実施してください。',
    location: '北区七枝町／CV-12', priority: 'LOW', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence' },
    evidence: [
      { id: 'i1-cam', kind: 'camera', label: 'CAM-12 駐車場', timestamp: '22:04:31', source: 'CV-12', body: '店頭の庇の下に男性が座っている。時折顔を上げるが、周囲への危害行動はない。', meta: ['人物: 成人男性', '動作: 低活動', '映像整合性: 正常'] },
      { id: 'i1-call', kind: 'call', label: '店員通報', timestamp: '22:06:02', source: '110連携', body: '「酔っているみたいです。声をかけても寝てしまって。救急車という感じではないです」' },
      { id: 'i1-log', kind: 'log', label: '接続ログ', timestamp: '22:06:11', source: 'SYS-NET', body: 'CAM-12 / SIGNAL STABLE\nCAM-09 / SIGNAL STABLE\n02:14:07  CAM-00  CONNECTION ERROR', warning: '末尾に現在時刻より後の記録が含まれています。' },
    ],
    onOpen: [{ type: 'addLog', message: '02:14:07 CAM-00 CONNECTION ERROR' }],
  },
  {
    id: 'incident-02', number: '#0102', time: '23:18', title: '駅前を歩く女性',
    summary: '同一人物と思われる女性が、同じ歩道を繰り返し通過しています。復路映像は確認されていません。',
    location: '中央駅東口／ST-E', priority: 'MED', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-01' },
    evidence: [
      { id: 'i2-cam-a', kind: 'camera', label: '映像 A', timestamp: '23:03:00', source: 'CAM-ST03', body: '薄い色のコートを着た人物が、画面左から右へ歩く。顔は街灯の影で判別できない。', meta: ['進行方向: 東', '追跡終了: 23:03:12'] },
      { id: 'i2-cam-b', kind: 'camera', label: '映像 B', timestamp: '23:10:00', source: 'CAM-ST03', body: '同じ服装、同じ歩幅の人物が再び左から右へ通過する。', meta: ['差分一致率: 98.7%', '復路記録: なし'] },
      { id: 'i2-cam-c', kind: 'camera', label: '映像 C', timestamp: '23:17:00', source: 'CAM-ST03', body: '三度目の通過。直前の二映像と姿勢が完全に一致している。', meta: ['時間間隔: 00:07:00', '歩行周期差: 0.00秒'] },
      { id: 'i2-social', kind: 'social', label: '位置情報付き投稿', timestamp: '23:15', source: '@last_train_204', body: '駅前さっきから同じ人と何回もすれ違う。自分がぐるぐる回ってる？' },
    ],
    onJudge: { anomaly: [{ type: 'increaseAnomaly', amount: 2 }], observe: [{ type: 'increaseAnomaly', amount: 1 }] },
  },
  {
    id: 'incident-03', number: '#0103', time: '00:31', title: '存在しない通報',
    summary: '受信音声は保存されていますが、警察側交換台に受付履歴がありません。',
    location: '中央駅／回線不明', priority: 'HIGH', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-02' },
    evidence: [
      { id: 'i3-call', kind: 'call', label: '通報音声 00:18', timestamp: '00:18:44', source: 'CALL-UNKNOWN', body: '「駅に女の人がいます。ずっとこっちを見ています。電車が来ても、動きません」\n\n音声終端に、通報者とは別の呼吸音が記録されている。', meta: ['音声長: 00:00:27', '発信番号: NULL', 'ファイル作成: 02:14:07'] },
      { id: 'i3-log', kind: 'log', label: '交換台照合', timestamp: '00:29:12', source: 'POL-LINK', body: '照会結果: RECORD NOT FOUND\n同時刻の着信件数: 0\n転送元: 特異事象監視室', warning: '自室から転送された記録になっています。' },
    ],
    onOpen: [{ type: 'glitch', message: 'VOICE SOURCE // LOCAL' }],
    onJudge: { anomaly: [{ type: 'increaseAnomaly', amount: 2 }], observe: [{ type: 'increaseAnomaly', amount: 1 }] },
  },
  {
    id: 'incident-04', number: '#0104', time: '01:12', title: '誰もいない改札',
    summary: '終電後の閉鎖駅で、自動改札の入場記録だけが継続しています。',
    location: '南環状線・陸橋駅', priority: 'HIGH', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-03' },
    evidence: [
      { id: 'i4-cam', kind: 'camera', label: '改札俯瞰', timestamp: '01:16:03', source: 'CAM-GATE02', body: '照明を落とした無人の改札。三番ゲートのフラップだけが一度開閉する。人影はない。', meta: ['検出人数: 0', 'ゲート状態: OPEN → CLOSE'] },
      { id: 'i4-log', kind: 'log', label: 'IC入出場ログ', timestamp: '01:16:04', source: 'RAIL-IC', body: '01:02:00  GATE-03  ENTRY  CARD: 0000000\n01:09:00  GATE-03  ENTRY  CARD: 0000000\n01:16:00  GATE-03  ENTRY  CARD: 0000000\nEXIT RECORD: NONE' },
      { id: 'i4-social', kind: 'social', label: '削除済み投稿キャッシュ', timestamp: '01:08', source: '@platform_0', body: '改札の向こうにいる。七分待てばまた入れる。' },
    ],
    onJudge: { anomaly: [{ type: 'increaseAnomaly', amount: 2 }], observe: [{ type: 'increaseAnomaly', amount: 1 }] },
  },
  {
    id: 'incident-05', number: '#0105', time: '02:14:07', title: '17人の女性',
    summary: '市内17地点で同一人物が同時検出されました。顔照合結果はすべて一致しています。',
    location: '市内17地点／一斉受信', priority: 'CRITICAL', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-04' },
    evidence: [
      { id: 'i5-cam', kind: 'camera', label: '17画面同期表示', timestamp: '02:14:07', source: 'CITY-GRID', body: '駅、河川敷、商店街、病院、地下道。すべての映像中央に同じ女性が立ち、同時にカメラへ顔を向ける。', meta: ['同時刻差: 0.00秒', '顔照合: 100%', '推定移動速度: 算出不能'] },
      { id: 'i5-log', kind: 'log', label: '過去映像再解析', timestamp: '02:18:19', source: 'ARCHIVE', body: '事件01: コンビニ店内ガラスに女性の反射を検出\n事件02: 対象人物の顔照合を更新 100%\n事件03: 音声背景に同一人物の発話特徴を検出', warning: '保存済み資料の内容が初回閲覧時から変更されています。' },
      { id: 'i5-social', kind: 'social', label: '市内投稿ストリーム', timestamp: '02:14', source: '17 SOURCES', body: '「この人どこにでもいる」\n「さっき駅にいた女が病院にもいる」\n「写真を撮ったら前からアルバムに入ってた」' },
    ],
    onOpen: [{ type: 'glitch', message: 'OBSERVATION CONSENSUS: 17' }],
    onJudge: {
      normal: [{ type: 'increaseAnomaly', amount: 1 }],
      observe: [{ type: 'increaseAnomaly', amount: 2 }],
      police: [{ type: 'increaseAnomaly', amount: 2 }],
      anomaly: [{ type: 'increaseAnomaly', amount: 3 }],
    },
  },
  {
    id: 'incident-06', number: '#0106', time: '03:21', title: '監視員',
    summary: '未登録カメラ CAM-00 が自動追加されました。設置場所は現在の監視室です。',
    location: '特異事象監視室／CAM-00', priority: 'CRITICAL', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-05' },
    evidence: [
      { id: 'i6-cam', kind: 'camera', label: 'CAM-00 監視室', timestamp: '04:14:07', source: 'CAM-00', body: 'あなたと同じ服装の監視員が端末に向かっている。映像右上の時計は現在より53分先を示す。背後に、駅前の女性が立っている。', meta: ['映像時刻: 04:14:07', '距離: 1.2m', '監視員の反応: なし'], warning: '現在の室内に CAM-00 は存在しません。' },
      { id: 'i6-log', kind: 'log', label: '機器登録情報', timestamp: '03:21:01', source: 'DEVICE-MGR', body: 'CAM-00\nLOCATION: 特異事象監視室\nINSTALL DATE: 1961-04-14\nSTATUS: WATCHING' },
    ],
    onOpen: [{ type: 'setFlag', key: 'cam00Unlocked' }, { type: 'glitch', message: 'YOU ARE IN FRAME' }],
  },
  {
    id: 'incident-07', number: '#0107', time: '03:48', title: '監視員記録',
    summary: '職員照合システムが現在のログイン情報に不整合を検出しました。',
    location: '内部人事DB／ID 00-714', priority: 'CRITICAL', allowedJudgements: ['normal', 'observe', 'police', 'anomaly'],
    unlockCondition: { type: 'sequence', after: 'incident-06' },
    evidence: [
      { id: 'i7-document', kind: 'document', label: '職員基本情報', timestamp: '03:48:12', source: 'HR-CORE', body: '職員ID: 00-714\n氏名: （現在のログイン名）\n採用記録: なし\n給与記録: なし\n研修記録: なし\n在籍状態: 勤務中' },
      { id: 'i7-log', kind: 'log', label: '過去勤務照合', timestamp: '03:50:44', source: 'SHIFT-ARCHIVE', body: '1961/04/14  00-714  夜勤\n1978/04/14  00-714  夜勤\n1995/04/14  00-714  夜勤\n2012/04/14  00-714  夜勤\n本日        00-714  夜勤', warning: 'すべての記録に同一の顔写真が添付されています。' },
    ],
    onOpen: [{ type: 'unlockDocument', documentId: 'doc-night-shift' }],
    onJudge: { anomaly: [{ type: 'setFlag', key: 'selfClassified' }] },
  },
  {
    id: 'incident-final', number: '#0000', time: '04:14:07', title: '特別事案 #0000',
    summary: '全監視回線停止。CAM-00 のみ復旧。監視席は無人です。観測依存型異常現象の最終分類を要求します。',
    location: '特異事象監視室／分類待ち', priority: 'CRITICAL', allowedJudgements: ['normal', 'observe', 'anomaly', 'destroy'],
    unlockCondition: { type: 'sequence', after: 'incident-07' }, final: true,
    evidence: [
      { id: 'if-cam', kind: 'camera', label: 'CAM-00 最終映像', timestamp: '04:14:07', source: 'CAM-00', body: '監視席に誰もいない。椅子はゆっくりと回転を続けている。画面奥の暗がりに、こちらを見ている女性がいる。', meta: ['検出人数: 1', '監視員: 未検出', '観測対象: 確定待ち'] },
      { id: 'if-log', kind: 'log', label: '最終システムログ', timestamp: '04:14:07', source: 'SYSTEM', body: 'ALL CAMERA CONNECTION LOST\nCAM-00 CONNECTION RESTORED\nOPERATOR 00-714: RECORD NOT FOUND\n\n未処理の案件が1件あります。' },
      { id: 'if-document', kind: 'document', label: '分類命令', source: 'DIRECTIVE-0000', body: '対象の実在性について最終判定を入力してください。判定は全資料および今後の観測結果へ遡及適用されます。' },
    ],
    onOpen: [{ type: 'glitch', message: 'OBSERVER NOT FOUND' }, { type: 'addLog', message: '未処理の案件が1件あります。' }],
  },
];

export const getIncident = (id: string | null) => INCIDENTS.find((item) => item.id === id);
export const getIncidentAfter = (id: string) => INCIDENTS[INCIDENTS.findIndex((item) => item.id === id) + 1];
