let idx = 0

export function v4() {
  return `00000000-0000-0000-0000-00000000000${idx++}`
}

export function __reset() {
  idx = 0
}
