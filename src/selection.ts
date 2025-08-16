import { reverse, isEqual, last } from 'lodash'
import type { Key } from './state'

export function updateSelection(cursor: Cursor | null) {
  const selection = window.getSelection()

  if (selection == null) return
  if (isEqual(getCursor(selection), cursor)) return

  selection.removeAllRanges()

  if (cursor == null) return

  const { anchor, focus } = cursor

  const anchorNode = getElementByKey(last(anchor.keys))
  const focusNode = getElementByKey(last(focus.keys))

  if (anchorNode == null || focusNode == null) return

  const anchorText = anchorNode.firstChild
  const focusText = anchorNode.firstChild

  const range = document.createRange()

  if (anchorText?.nodeType === Node.TEXT_NODE) {
    range.setStart(anchorText, anchor.offset)
  } else {
    range.setStart(anchorNode, 0)
  }

  if (focusText?.nodeType === Node.TEXT_NODE) {
    range.setStart(focusText, anchor.offset)
  } else {
    range.setStart(focusNode, 0)
  }

  selection.addRange(range)
}

function getElementByKey(key: Key | null | undefined) {
  if (key == null) return null

  return document.querySelector(`[data-key="${key}"]`)
}

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

  return result.length > 0 ? reverse(result) : null
}

export interface Cursor {
  anchor: Position
  focus: Position
}

export interface Position {
  keys: Key[]
  offset: number
}
