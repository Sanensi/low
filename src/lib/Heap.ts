export type Comparer<T> = (a: T, b: T) => number;

export class Heap<T> {
  private readonly heap = new Array<T>();
  private readonly compare: Comparer<T>;

  get isEmpty() {
    return this.heap.length === 0;
  }

  get length() {
    return this.heap.length;
  }

  private get lastIndex() {
    return this.length - 1;
  }

  constructor(compare: Comparer<T>) {
    this.compare = compare;
  }

  peek() {
    return this.heap[0];
  }

  push(element: T) {
    this.heap.push(element);
    this.percolateUp(this.lastIndex);
  }

  pop(): T {
    const element = this.peek();
    this.heap[0] = this.heap[this.lastIndex];
    this.heap.pop();
    this.percolateDown(0);
    return element;
  }

  private percolateUp(index: number) {
    const element = this.heap[index];
    let parentIndex = this.parentIndexOf(index);

    while (index > 0 && this.compare(this.heap[parentIndex], element) < 0) {
      this.heap[index] = this.heap[parentIndex];
      index = parentIndex;
      parentIndex = this.parentIndexOf(index);
    }

    this.heap[index] = element;
  }

  private percolateDown(index: number) {
    const leftChildIndex = this.leftChildIndexOf(index);
    const rightChildIndex = this.rightChildIndexOf(index);

    let priority = index;

    if (
      leftChildIndex < this.length &&
      this.compare(this.heap[leftChildIndex], this.heap[priority]) > 0
    ) {
      priority = leftChildIndex;
    }
    if (
      rightChildIndex < this.length &&
      this.compare(this.heap[rightChildIndex], this.heap[priority]) > 0
    ) {
      priority = rightChildIndex;
    }

    if (priority !== index) {
      this.swap(index, priority);
      this.percolateDown(priority);
    }
  }

  private swap(i: number, j: number) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  private parentIndexOf(index: number) {
    return Math.floor((index - 1) / 2);
  }

  private leftChildIndexOf(index: number) {
    return 2 * index + 1;
  }

  private rightChildIndexOf(index: number) {
    return 2 * index + 2;
  }
}
