export function canRestoreUrls(currentUrlCount, undoUrlCount) {
  return Number(currentUrlCount) === 0 && Number(undoUrlCount) > 0;
}
