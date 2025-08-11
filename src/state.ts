import isEqual from 'lodash/isEqual'
import { useRef, useSyncExternalStore } from 'react'

export function useStateStorage<State>(state: State) {
  const storage = useRef(new StateStorage<State>(state)).current
  const cachedResult = useRef({ state, storage })

  return useSyncExternalStore(
    (callback) => {
      storage.addUpdateListener(callback)

      return () => storage.removeUpdateListener(callback)
    },
    () => {
      const result = { state: storage.getState(), storage }

      if (isEqual(cachedResult.current.state, result.state)) {
        return cachedResult.current
      }

      return result
    },
  )
}

class StateStorage<State = unknown> {
  private map = new FlatStorage()
  private rootKey: Key
  private updateListeners: (() => void)[] = []

  constructor(state: State) {
    this.rootKey = this.map.insert(state)
  }

  addUpdateListener(listener: () => void): void {
    this.updateListeners.push(listener)
  }

  removeUpdateListener(listener: () => void): void {
    this.updateListeners = this.updateListeners.filter((l) => l !== listener)
  }

  getState(): State {
    return this.map.read(this.rootKey) as State
  }

  getEntries(): [Key, Entry][] {
    return this.map.getEntries()
  }
}

class FlatStorage {
  private lastKey = 0
  private map = new Map<Key, Entry>()

  insert(value: unknown): Key {
    const key = this.generateKey()

    if (value == null)
      throw new Error('`null` and `undefined` values are not allowed')

    if (Array.isArray(value)) {
      const children = value.map((item) => this.insert(item))
      this.map.set(key, { type: 'array', key, value: children })
    } else if (typeof value === 'object') {
      const objectNode: ObjectEntry = { type: 'object', key, value: {} }

      for (const [k, v] of Object.entries(value)) {
        const itemKey = this.insert(v)
        objectNode.value[k] = itemKey
      }

      this.map.set(key, objectNode)
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      this.map.set(key, { type: 'primitive', key, value })
    } else {
      throw new Error(`Unsupported value type: ${typeof value}`)
    }

    return key
  }

  read(key: Key): unknown {
    const entry = this.map.get(key)

    if (!entry) {
      throw new Error(`No entry found for key: ${key}`)
    }

    switch (entry.type) {
      case 'object':
        return Object.fromEntries(
          Object.entries(entry.value).map(([k, vKey]) => [k, this.read(vKey)]),
        )
      case 'array':
        return entry.value.map((vKey) => this.read(vKey))
      case 'primitive':
        return entry.value
    }
  }

  getEntries(): [Key, Entry][] {
    return Array.from(this.map.entries())
  }

  private generateKey(): Key {
    return (this.lastKey++).toString()
  }
}

type Entry = ObjectEntry | ArrayEntry | PrimitiveEntry

interface ObjectEntry extends BaseEntry<Record<string, Key>> {
  type: 'object'
}

interface ArrayEntry extends BaseEntry<Key[]> {
  type: 'array'
}

interface PrimitiveEntry extends BaseEntry<boolean | number | string> {
  type: 'primitive'
}

interface BaseEntry<V> {
  key: Key
  value: V
}

type Key = string
