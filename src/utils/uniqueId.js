/**
 * High-performance, monotonic collision-free unique ID generator.
 * Eliminates IEEE-754 double precision float truncation collisions
 * (which happen with `Date.now() + Math.random()`) by combining
 * monotonic 32-bit counter, millisecond timestamp, and base-36 random token.
 */
let _globalIdCounter = 0

export function generateUniqueId(prefix = 'id') {
  _globalIdCounter = (_globalIdCounter + 1) & 0x7fffffff
  return `${prefix}_${Date.now()}_${_globalIdCounter}_${Math.random().toString(36).slice(2, 9)}`
}
