/**
 * Formats game numbers compactly for HUD and UI (K, M, B, T)
 * Examples:
 *   950 -> '950'
 *   1,450 -> '1.5K'
 *   25,000 -> '25K'
 *   1,000,000 -> '1M'
 *   1,450,000 -> '1.5M'
 *   1,200,000,000 -> '1.2B'
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  const val = Math.floor(num)
  const abs = Math.abs(val)

  if (abs >= 1_000_000_000) {
    const formatted = (val / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)
    return formatted.replace(/\.0$/, '') + 'B'
  }
  if (abs >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)
    return formatted.replace(/\.0$/, '') + 'M'
  }
  if (abs >= 10_000) {
    return Math.floor(val / 1_000).toString() + 'K'
  }
  if (abs >= 1_000) {
    const formatted = (val / 1_000).toFixed(1)
    return formatted.replace(/\.0$/, '') + 'K'
  }
  return val.toString()
}

/**
 * Formats a number with standard thousand separators
 * Example: 1450230 -> '1,450,230'
 */
export function formatFullNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Math.floor(num).toLocaleString()
}
