import type { Judgement } from './types';

type ReportScene = {
  code: string;
  title: string;
  lines: string[];
  hook: string;
  nextLabel: string;
};

const SCENES: Record<string, ReportScene> = {
  'incident-01': {
    code: '22:11 // REPORT ACCEPTED',
    title: '受話器の向こうで、店員が息をついた。',
    lines: [
      '報告を送ると、コンビニ前の映像は処理済みフォルダへ移された。男はまだ庇の下で眠っている。',
      '画面が暗転する寸前、店内のガラスに誰かの白い顔が映った。現場にいた人数は、一人と記録されている。',
    ],
    hook: '23:18、中央駅東口から自動追跡警報。同じ女性が、七分おきに同じ方向へ通過している。',
    nextLabel: '次の案件を受信',
  },
  'incident-02': {
    code: '23:24 // REPORT ACCEPTED',
    title: '女性は、また同じ方向へ歩いていった。',
    lines: [
      '分類結果の送信と同時に、三つの映像が停止した。どの画面でも女性の右足が、まったく同じ角度で宙に浮いている。',
      '復路の映像は、最後まで見つからなかった。代わりに端末の背後で、靴音が一度だけ鳴った。',
    ],
    hook: 'その直後、駅構内から通報音声を受信。交換台には、着信した記録が存在しない。',
    nextLabel: '次の案件を受信',
  },
  'incident-03': {
    code: '00:38 // REPORT ACCEPTED',
    title: '通話は切れている。それでも呼吸音は残った。',
    lines: [
      '報告済みの表示に変わっても、ヘッドセットの波形だけが動き続けている。誰かが、こちらの呼吸に合わせて息をしている。',
      '音声入力元には「特異事象監視室」と表示された。室内にいるのは、あなた一人のはずだった。',
    ],
    hook: '閉鎖済みの陸橋駅で入場記録を検出。通報音声の背景と同じ認証音が含まれている。',
    nextLabel: '次の案件を受信',
  },
  'incident-04': {
    code: '01:23 // REPORT ACCEPTED',
    title: '無人の改札が、もう一度だけ開いた。',
    lines: [
      '判定記録の保存時刻と同じ秒に、三番ゲートの入場数がひとつ増えた。映像には誰も映っていない。',
      '遠くで交通系カードの認証音が鳴る。監視室の扉の向こうからだった。',
    ],
    hook: '市内十七地点から顔照合警報が同時発生。検出されたのは、すべて同じ女性だった。',
    nextLabel: '次の案件を受信',
  },
  'incident-05': {
    code: '02:20 // REPORT ACCEPTED',
    title: '十七人全員が、同時に笑った。',
    lines: [
      '送信完了の表示とともに、十七の映像すべてで女性の口元がわずかに動いた。音声のない映像なのに、名前を呼ばれた気がした。',
      '過去案件のサムネイルにも、同じ女性が追加されている。最初からそこにいたかのように。',
    ],
    hook: '監視網に未登録カメラ「CAM-00」が出現。設置場所は、この監視室と表示されている。',
    nextLabel: '次の案件を受信',
  },
  'incident-06': {
    code: '03:29 // REPORT ACCEPTED',
    title: 'CAM-00の監視員が、こちらを振り返った。',
    lines: [
      '未来時刻の映像の中で、あなたと同じ制服を着た人物がゆっくり椅子を回す。その顔だけは黒く潰れて見えない。',
      '人物は机に一枚の紙を置いた。拡大すると、いま送信したばかりの報告書だった。',
    ],
    hook: '職員照合システムが異常を通知。現在の監視員 ID 00-714 に、採用記録が存在しない。',
    nextLabel: '次の案件を受信',
  },
  'incident-07': {
    code: '03:56 // REPORT ACCEPTED',
    title: '職員記録は更新されなかった。',
    lines: [
      '端末は報告を受理したが、ID 00-714 の採用日は空欄のままだった。過去の勤務記録だけが、さらに一行増えている。',
      '「次回勤務 04/14」とある。年の欄には、何も書かれていない。',
    ],
    hook: '全監視回線が切断。四十三秒後、CAM-00 だけが復旧し、未処理案件「#0000」を送信した。',
    nextLabel: '最後の案件を開く',
  },
  'incident-final': {
    code: '04:14:07 // FINAL REPORT ACCEPTED',
    title: '端末は、あなたの判定を受理した。',
    lines: [
      'すべての監視画面が一斉に消える。暗いガラスの中に、椅子へ座った誰かの輪郭だけが残った。',
      '最後の処理が始まる。あなたが分類したものだけが、この夜の記録として残る。',
    ],
    hook: '夜間監視終了処理を開始。観測記録に基づき、監視員の存在判定を確定する。',
    nextLabel: '最終処理を確認',
  },
};

const JUDGEMENT_LINES: Record<Judgement, string> = {
  normal: 'システムは「異常性なし」と記録した。警告灯がひとつ消える。',
  observe: '監視は継続される。対象を見ているあいだ、対象もこちらを見ている。',
  police: '現場対応が要請された。到着確認の返信は、まだない。',
  anomaly: '事案は怪異として登録された。端末の異常度表示が静かに上昇する。',
  destroy: '記録の削除が始まった。消えたのが記録だけかは、確認できない。',
};

export function getReportScene(incidentId: string, judgement: Judgement): ReportScene {
  const scene = SCENES[incidentId] ?? SCENES['incident-01'];
  return { ...scene, lines: [JUDGEMENT_LINES[judgement], ...scene.lines] };
}
