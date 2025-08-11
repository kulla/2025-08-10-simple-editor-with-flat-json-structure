export class ValueStorage<Value = unknown> {
  private map = new FlatStorage()
  private rootKey: Key
  private updateListeners: (() => void)[] = []

  constructor(value: Value) {
    this.rootKey = this.map.insert(value)
  }

  addUpdateListener(listener: () => void): void {
    this.updateListeners.push(listener)
  }

  removeUpdateListener(listener: () => void): void {
    this.updateListeners = this.updateListeners.filter((l) => l !== listener)
  }

  getValue(): Value {
    return this.getValueByKey(this.rootKey)
  }
}

class FlatStorage {
  private map = new EntryMap()

  insert<V>(value: V): Key<V> {
    if (value == null)
      throw new Error('`null` and `undefined` values are not allowed')

    if (isArray(value)) {
      const children = value.map((item) => this.insert(item))
      return this.map.addArray(children) as Key<V>
    }

    if (typeof value === 'object') {
      const objectNode: ObjectEntry<V> = { type: 'object', key, value: {} }

      for (const [k, v] of Object.entries(value)) {
        const itemKey = this.insert(v)
        objectNode.value[k] = itemKey
      }

      this.map.set(key, objectNode)

      return key
    }

    if (isPrimitive(value)) {
      return this.map.addPrimitive(value)
    }

    throw new Error(`Unsupported value type: ${typeof value}`)
  }
}

type A = Entry<unknown[]>

class EntryMap {
  private lastKey = 0
  private map = new Map<string, unknown>()

  get<V>(key: Key<V>): Entry<V> | undefined {
    return this.map.get(key) as Entry<V> | undefined
  }

  addArray<V extends ArrayType>(value: EntryValue<V>): Key<V> {
    const key = this.generateKey<V>()
    this.map.set(key, { type: 'array', key, value })
    return key
  }

  add<V>(value: EntryValue<V>): Key<V> {
    if (isArray(value)) {
      const key = this.generateKey<V>()
      this.set(key, { type: 'array', key, value })
      return key
    }
    this.map.set(key, { type: 'primitive', key, value })
    return key
  }

  private set<V>(key: Key<V>, entry: Entry<V>): void {
    this.map.set(key, entry)
  }

  private generateKey<V>(): Key<V> {
    return (this.lastKey++).toString() as Key<V>
  }
}

function isObject(value: unknown): value is ObjectType {
  return value !== null && typeof value === 'object' && !isArray(value)
}

function isArray(value: unknown): value is ArrayType {
  return Array.isArray(value)
}

function isPrimitive(value: unknown): value is PrimitiveType {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

type Entry<V> = V extends PrimitiveType
  ? PrimitiveEntry<V>
  : V extends Array<infer E>
    ? ArrayEntry<E[]>
    : V extends object
      ? ObjectEntry<V>
      : never

interface ObjectEntry<V extends object> extends BaseEntry<V> {
  type: 'object'
}

interface ArrayEntry<V extends Array<unknown>> extends BaseEntry<V> {
  type: 'array'
}

interface PrimitiveEntry<V extends PrimitiveType> extends BaseEntry<V> {
  type: 'primitive'
}

interface BaseEntry<V> {
  key: Key<V>
  value: EntryValue<V>
}

type Key<V> = NewType<string, V>
type EntryValue<V> = V extends PrimitiveType
  ? V
  : V extends ArrayType
    ? Key<V[number]>[]
    : V extends ObjectType
      ? { [P in keyof V]: Key<V[P]> }
      : never

type ObjectType = object & { length?: never }
type ArrayType = Array<unknown>
type PrimitiveType = string | number | boolean
type NewType<Base, Brand> = Base & { readonly __brand: Brand }
