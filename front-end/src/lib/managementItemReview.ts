/** 与后端一致：新建或历史「待处理」均视为待老板审批 */
export function isManagementItemPendingReview(status: string): boolean {
  return status === '待审批' || status === '待处理';
}
