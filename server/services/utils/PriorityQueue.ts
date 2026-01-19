export class PriorityQueue<T> {
  private items: T[] = []
  private compare: (a: T, b: T) => number

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare
  }

  enqueue(item: T): void {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  dequeue(): T | undefined {
    if (this.items.length === 0) return undefined
    if (this.items.length === 1) return this.items.pop()!
    
    const top = this.items[0]
    this.items[0] = this.items.pop()!
    this.bubbleDown(0)
    return top
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  peek(): T | undefined {
    return this.items[0]
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(this.items[index], this.items[parentIndex]) <= 0) break
      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let largest = index

      if (leftChild < this.items.length && 
          this.compare(this.items[leftChild], this.items[largest]) > 0) {
        largest = leftChild
      }

      if (rightChild < this.items.length && 
          this.compare(this.items[rightChild], this.items[largest]) > 0) {
        largest = rightChild
      }

      if (largest === index) break
      this.swap(index, largest)
      index = largest
    }
  }

  private swap(i: number, j: number): void {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]]
  }
}
