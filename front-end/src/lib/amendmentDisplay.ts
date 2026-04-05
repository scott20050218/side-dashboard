/** 解析修改申请 payload，拆分原因与拟修改字段（供审批页展示） */
export function formatAmendmentPayload(payload: string): { reason: string | null; proposedJson: string } {
  try {
    const o = JSON.parse(payload) as Record<string, unknown>;
    const reason =
      typeof o.reason === 'string'
        ? o.reason.trim()
        : typeof o.requestReason === 'string'
          ? o.requestReason.trim()
          : '';
    const rest = { ...o };
    delete rest.reason;
    delete rest.requestReason;
    return {
      reason: reason || null,
      proposedJson: JSON.stringify(rest, null, 2),
    };
  } catch {
    return { reason: null, proposedJson: payload };
  }
}

export function summarizeAmendmentProposed(payload: string): string {
  try {
    const o = JSON.parse(payload) as Record<string, unknown>;
    const kind = o.kind === 'income' ? '收入' : o.kind === 'expense' ? '支出' : '流水';
    const title = typeof o.title === 'string' ? o.title : '';
    const amt = o.amount !== undefined ? Number(o.amount) : NaN;
    const amtStr = Number.isFinite(amt) ? `¥${Math.abs(amt).toFixed(2)}` : '';
    const date = typeof o.date === 'string' ? o.date : '';
    const parts = [kind, title || '（无标题）', amtStr, date].filter(Boolean);
    return parts.join(' · ');
  } catch {
    return '（无法解析申请内容）';
  }
}
