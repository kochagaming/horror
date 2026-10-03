import type { ResearchDocument } from './types';

export const DOCUMENTS: ResearchDocument[] = [
  {
    id: 'doc-observation-dependent',
    code: 'K-7/OBS-DEPENDENT',
    title: '観測依存型異常現象について',
    classification: '機密区分 III／複製禁止',
    unlockHint: '02:37以降に自動解放',
    body: [
      '対象は観測以前に固定された外見・性質を持たない可能性が高い。',
      '複数の観測者が同一の特徴を記録した場合、その一致率に比例して対象の性質が安定する。',
      '調査記録の相互参照は、現象の理解ではなく現象そのものの形成に寄与するおそれがある。',
      '【警告】監視員は分類名を与えてはならない。分類は存在を証明する。',
      '【補記】観測対象と観測者の同一性が二件以上の事案で確認され、異常度が規定値を超えた場合、緊急手順 K-7/DENIAL を解放する。',
    ],
  },
  {
    id: 'doc-night-shift',
    code: 'HR/NIGHT-00',
    title: '夜間監視員の取扱い',
    classification: '人事課保管／閲覧制限',
    unlockHint: '監視員記録の調査後に解放',
    body: [
      '職員ID 00-714 は人員ではなく、監視継続性を担保するための運用上の識別子である。',
      '当該識別子の勤務者について、採用・給与・研修記録を作成してはならない。',
      '交代時刻に着席者が存在しない場合も、勤務完了として扱うこと。',
    ],
  },
];

export const getDocument = (id: string) => DOCUMENTS.find((doc) => doc.id === id);
