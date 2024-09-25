export enum NegotiationStatus {
  INITIAL_EDIT = 'INITIAL_EDIT', // 未通知指定容量（可編輯）
  NEGOTIATING = 'NEGOTIATING', // 等待充電站回覆
  NEGOTIATING_FAILED = 'NEGOTIATING_FAILED', // 指定容量通知失敗
  EXTRA_REQUEST = 'EXTRA_REQUEST', // CSMS 申請額外可用容量
  EXTRA_REPLY_EDIT = 'EXTRA_REPLY_EDIT', // 待確認變更容量（可編輯）
  EXTRA_REPLY_FINISH = 'EXTRA_REPLY_FINISH', // 協商結束（管理員回覆額外申請）
  EXTRA_REPLY_AUTO = 'EXTRA_REPLY_AUTO', // 協商結束（未於 16:00 前回覆，系統自動回覆）
  EXTRA_REPLY_FAILED = 'EXTRA_REPLY_FAILED', // 協商結束（額外申請失敗）
  FINISH = 'FINISH', // 協商結束
}