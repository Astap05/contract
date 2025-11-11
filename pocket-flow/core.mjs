/**
 * Pocket Flow – крошечное ядро (≈120 строк) по мотивам оригинального проекта.
 * Мы моделируем процесс как ориентированный граф из узлов (Node)
 * с общей памятью (SharedStore). Каждый узел получает контекст с ресурсами
 * и ссылку на общее хранилище, может класть в него данные и передавать их дальше.
 */

export class SharedStore {
  constructor(initial = {}) {
    this.data = { ...initial }
  }

  read(key) {
    return this.data[key]
  }

  write(key, value) {
    this.data[key] = value
  }

  merge(obj) {
    Object.assign(this.data, obj)
  }

  snapshot() {
    return structuredClone(this.data)
  }
}

export class NodeContext {
  constructor({ store, resources }) {
    this.store = store
    this.resources = resources
  }

  read(key) {
    return this.store.read(key)
  }

  write(key, value) {
    this.store.write(key, value)
  }

  merge(obj) {
    this.store.merge(obj)
  }

  getResource(name) {
    return this.resources?.[name]
  }
}

export class Node {
  constructor({ id, description, run }) {
    this.id = id
    this.description = description
    this.run = run
  }
}

export class Graph {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
  }

  addNode(node) {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node ${node.id} already registered`)
    }
    this.nodes.set(node.id, node)
    this.edges.set(node.id, [])
    return this
  }

  connect(fromId, toId) {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error(`Unknown nodes in edge ${fromId} -> ${toId}`)
    }
    this.edges.get(fromId).push(toId)
    return this
  }

  /**
   * Выполняем граф в ширину начиная с заданных узлов.
   * Каждая вершина ожидает завершения своей run-функции и
   * передаёт управление детям.
   */
  async execute({ entryPoints, store = new SharedStore(), resources = {} }) {
    const ctx = new NodeContext({ store, resources })
    const queue = [...entryPoints]
    const visited = new Set()

    while (queue.length > 0) {
      const nodeId = queue.shift()
      const node = this.nodes.get(nodeId)
      if (!node) continue

      await node.run(ctx)
      visited.add(nodeId)

      const nextIds = this.edges.get(nodeId) || []
      for (const nextId of nextIds) {
        if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      }
    }

    return store.snapshot()
  }
}

/**
 * Утилиты, помогающие быстро определить узлы.
 */
export function createNode(id, description, run) {
  return new Node({ id, description, run })
}

export function createGraph(definitionFn) {
  const graph = new Graph()
  definitionFn(graph)
  return graph
}


