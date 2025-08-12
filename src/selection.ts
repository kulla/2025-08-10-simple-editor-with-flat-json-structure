import type { Key } from './state'

export function getCursor(selection: Selection | null): Cursor | null {
  if (selection == null) return null

  const { anchorNode, focusNode, anchorOffset, focusOffset } = selection

  const anchorKeys = getKeys(anchorNode)
  const focusKeys = getKeys(focusNode)

  if (anchorKeys == null || focusKeys == null) return null

  return {
    anchor: { keys: anchorKeys, offset: anchorOffset },
    focus: { keys: focusKeys, offset: focusOffset },
  }
}

function getKeys(node: Node | null): Key[] | null {
  const result: Key[] = []
  let currentNode = node

  while (currentNode !== null) {
    if (currentNode instanceof HTMLElement) {
      const key = currentNode.dataset.key

      if (key != null) {
        result.push(key as Key)
      }
    }

    currentNode = currentNode.parentNode
  }

  return result.length > 0 ? result : null
}

export interface Cursor {
  anchor: Position
  focus: Position
}

export interface Position {
  keys: Key[]
  offset: number
}
