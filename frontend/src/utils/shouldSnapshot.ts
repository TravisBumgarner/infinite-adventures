/** Time threshold in ms before a new snapshot is created (5 minutes). */
export const SNAPSHOT_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Determines whether a history snapshot should be taken for a note update.
 * Returns true when enough time has elapsed since the last snapshot (or if
 * no snapshot has been taken yet).
 */
export function shouldSnapshot(
  lastSnapshotAt: number | undefined,
  now: number = Date.now(),
  threshold: number = SNAPSHOT_THRESHOLD_MS,
): boolean {
  if (lastSnapshotAt === undefined) return true;
  return now - lastSnapshotAt > threshold;
}
