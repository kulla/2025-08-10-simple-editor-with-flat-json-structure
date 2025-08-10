import { useState } from 'react'

class NodeMap {
  private lastKey = 0
  private map = new Map<Key, Node>()

  insert(value: unknown): Key {
    if (value == null)
      throw new Error('`null` and `undefined` values are not allowed')

    const key = this.nextKey()

    if (Array.isArray(value)) {
      const arrayNode: ArrayNode = { type: 'array', key, value: [] }

      for (const item of value) {
        const itemKey = this.insert(item)
        arrayNode.value.push(itemKey)
      }

      this.map.set(key, arrayNode)

      return key
    }

    if (typeof value === 'object') {
      const objectNode: ObjectNode = { type: 'object', key, value: {} }

      for (const [k, v] of Object.entries(value)) {
        const itemKey = this.insert(v)
        objectNode.value[k] = itemKey
      }

      this.map.set(key, objectNode)

      return key
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      this.map.set(key, { type: 'primitive', key, value })

      return key
    }

    throw new Error(`Unsupported value type: ${typeof value}`)
  }

  private nextKey(): Key {
    return (this.lastKey++).toString()
  }
}

type Node = ObjectNode | ArrayNode | PrimitiveNode

interface ObjectNode extends NodeBase {
  type: 'object'
  value: Record<string, Key | undefined>
}

interface ArrayNode extends NodeBase {
  type: 'array'
  value: Key[]
}

interface PrimitiveNode extends NodeBase {
  type: 'primitive'
  value: string | number | boolean
}

interface NodeBase {
  key: Key
}

type Key = string
