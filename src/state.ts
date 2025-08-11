import { useRef, useSyncExternalStore } from 'react'

export function useStateStorage<State extends object>(state: State) {
  const storage = useRef(new StorageManager<State>(state)).current

  return useSyncExternalStore(
    (callback) => {
      storage.addUpdateListener(callback)

      return () => storage.removeUpdateListener(callback)
    },
    () => {
      return storage
    },
  )
}

abstract class StorageValue<V = unknown> {
  constructor(
    protected manager: StorageManager,
    protected key: Key,
  ) {}

  get(): V {
    return this.manager.getStorage().read(this.key) as V
  }
}

class ObjectValue<ObjectType extends object> extends StorageValue<ObjectType> {}

class StorageManager<State extends object = object> {
  private storage = new WritableStorage()
  private rootKey: Key
  private updateListeners: (() => void)[] = []
  private depth = 0

  constructor(state: State) {
    this.rootKey = this.storage.insert(state)
  }

  addUpdateListener(listener: () => void): void {
    this.updateListeners.push(listener)
  }

  removeUpdateListener(listener: () => void): void {
    this.updateListeners = this.updateListeners.filter((l) => l !== listener)
  }

  update(updateFn: (map: WritableStorage) => void) {
    this.depth++
    updateFn(this.storage)
    this.depth--

    if (this.depth === 0) {
      for (const listener of this.updateListeners) {
        listener()
      }
    }
  }

  getStorage(): ReadonlyStorage {
    return this.storage
  }

  getRootValue() {
    return new ObjectValue<State>(this, this.rootKey)
  }

  getEntries(): [Key, Entry][] {
    return this.storage.getEntries()
  }
}

class ReadonlyStorage {
  protected map = new Map<Key, Entry>()

  getEntry(key: Key) {
    const entry = this.map.get(key)

    if (entry === undefined) throw new Error(`Entry for key ${key} not found`)

    return entry
  }

  getEntries(): [Key, Entry][] {
    return Array.from(this.map.entries())
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
}

class WritableStorage extends ReadonlyStorage {
  private lastKey = 0

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

  update<E extends Entry>(key: Key, changeEntry: (e: E) => E) {
    this.map.set(key, changeEntry(this.getEntry(key) as E))
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
