import { useRef, useSyncExternalStore } from 'react'

export function useStateStorage<State extends object>(state: State) {
  const storage = useRef(new StorageManager<State>(state)).current

  return useSyncExternalStore(
    (callback) => {
      storage.addUpdateListener(callback)

      return () => storage.removeUpdateListener(callback)
    },
    () => storage,
  )
}

abstract class StorageValue<V = unknown> {
  constructor(
    protected manager: StorageManager,
    protected key: Key,
  ) {}

  getKey() {
    return this.key
  }

  read(): V {
    return this.manager.getStorage().read(this.key) as V
  }
}

abstract class ContainerValue<V> extends StorageValue<V> {
  createChildValue<V = unknown>(childKey: Key): StateValue<V> {
    const entry = this.manager.getStorage().getEntry(childKey)

    switch (entry.type) {
      case 'object':
        return new ObjectValue(this.manager, childKey) as StateValue<V>
      case 'array':
        return new ArrayValue(this.manager, childKey) as StateValue<V>
      case 'boolean':
        return new BooleanValue(this.manager, childKey) as StateValue<V>
      case 'string':
        return new StringValue(this.manager, childKey) as StateValue<V>
      case 'number':
        return new NumberValue(this.manager, childKey) as StateValue<V>
    }
  }
}

class ObjectValue<
  ObjectType extends object,
> extends ContainerValue<ObjectType> {
  get<P extends keyof ObjectType>(name: P): StateValue<ObjectType[P]> {
    const entry = this.manager.getStorage().getEntry(this.key)

    if (entry.type !== 'object') {
      throw new Error(`Key ${this.key} is not an object`)
    }

    const childKey = entry.value[name as string]

    if (childKey === undefined) {
      throw new Error(`Property ${String(name)} not found in object`)
    }

    return this.createChildValue(childKey)
  }
}

class ArrayValue<A extends ArrayType> extends ContainerValue<ArrayType> {
  map<B>(callback: (value: StateValue<A[number]>, index: number) => B): B[] {
    return this.getValues().map((value, index) => callback(value, index))
  }

  getValues(): StateValue<A[number]>[] {
    const entry = this.manager.getStorage().getEntry(this.key)

    if (entry.type !== 'array') {
      throw new Error(`Key ${this.key} is not an array`)
    }

    return entry.value.map((childKey) => this.createChildValue(childKey))
  }
}

abstract class PrimitiveValue<P extends PrimitiveType> extends StorageValue<P> {
  getValue(): P {
    return this.read()
  }
}

class StringValue extends PrimitiveValue<string> {}
class NumberValue extends PrimitiveValue<number> {}
class BooleanValue extends PrimitiveValue<boolean> {}

export type StateValue<V> = V extends boolean
  ? BooleanValue
  : V extends number
    ? NumberValue
    : V extends string
      ? StringValue
      : V extends ArrayType
        ? ArrayValue<V>
        : V extends object
          ? ObjectValue<V>
          :
              | BooleanValue
              | NumberValue
              | StringValue
              | ArrayValue<unknown[]>
              | ObjectValue<object>

type ObjectType = object & { length?: never }
type ArrayType = Array<unknown>
type PrimitiveType = boolean | number | string

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
      case 'boolean':
      case 'string':
      case 'number':
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
    } else if (typeof value === 'string') {
      this.map.set(key, { type: 'string', key, value })
    } else if (typeof value === 'boolean') {
      this.map.set(key, { type: 'boolean', key, value })
    } else if (typeof value === 'number') {
      this.map.set(key, { type: 'number', key, value })
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

type Entry = ObjectEntry | ArrayEntry | BooleanEntry | StringEntry | NumberEntry

interface ObjectEntry extends BaseEntry<Record<string, Key>> {
  type: 'object'
}

interface ArrayEntry extends BaseEntry<Key[]> {
  type: 'array'
}

interface BooleanEntry extends BaseEntry<boolean> {
  type: 'boolean'
}

interface NumberEntry extends BaseEntry<number> {
  type: 'number'
}

interface StringEntry extends BaseEntry<string> {
  type: 'string'
}

interface BaseEntry<V> {
  key: Key
  value: V
}

type Key = string
