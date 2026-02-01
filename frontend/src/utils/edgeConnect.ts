/**
 * Build updated content with an appended @{targetId} mention.
 * Returns the new content string, or null if the mention already exists (duplicate).
 */
export function appendMentionIfNew(
  content: string,
  targetId: string
): string | null {
  const mentionPattern = new RegExp(`@\\{${escapeRegExp(targetId)}\\}`);
  if (mentionPattern.test(content)) {
    return null;
  }
  return `${content}\n@{${targetId}}`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
