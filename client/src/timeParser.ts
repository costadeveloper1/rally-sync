/**
 * Parses user input string into total seconds.
 * Supports:
 * - "30" or "30s" -> 30
 * - "1:15" or "01:15" -> 75
 * - "2:05:10" -> 7510
 * - "1m 30s" or "1m30" -> 90
 * - "5m" -> 300
 */
export function parseTimeStringToSeconds(input: string): number | null {
  if (!input) return null;
  const str = input.trim().toLowerCase();

  // Pattern 1: MM:SS or HH:MM:SS (e.g. "01:15" or "1:30")
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => p.trim());
    if (parts.some((p) => isNaN(Number(p)) || p === '')) return null;

    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return null;
  }

  // Pattern 2: e.g. "1m 20s" or "2m30" or "45s" or "5m"
  const mMatch = str.match(/(\d+)\s*m(?:in)?/);
  const sMatch = str.match(/(\d+)\s*s(?:ec)?/);

  if (mMatch || sMatch) {
    let total = 0;
    if (mMatch) total += parseInt(mMatch[1], 10) * 60;
    if (sMatch) total += parseInt(sMatch[1], 10);
    return total > 0 ? total : null;
  }

  // Pattern 3: Simple integer assumed to be seconds (e.g. "45")
  const num = parseInt(str, 10);
  if (!isNaN(num) && num > 0) {
    return num;
  }

  return null;
}

/**
 * Formats seconds into MM:SS (e.g. 75 -> "01:15", 360 -> "06:00")
 */
export function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats epoch timestamp into HH:MM:SS UTC
 */
export function formatUtcTime(timestampMs: number | null | undefined): string {
  if (!timestampMs) return '--:--:-- UTC';
  const d = new Date(timestampMs);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const s = d.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s} UTC`;
}
