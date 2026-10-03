export const SYSTEM_MESSAGES = {
  welcome: '夜間監視を開始しました。受信案件を調査し、適切な区分を選択してください。',
  saved: '判定を記録しました。監視時刻を更新します。',
  futureLog: '解析中に時刻整合性エラーを検出しました。',
  allOffline: '04:14:07 // 全監視回線が切断されました。',
  pending: '未処理の案件が1件あります。',
};

export const JUDGEMENT_LABELS = {
  normal: '正常',
  observe: '要観察',
  police: '警察へ通報',
  anomaly: '怪異認定',
  destroy: '記録を破棄する',
} as const;
