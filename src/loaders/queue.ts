class Queue<T> {
    items: T[];

    constructor() {
        this.items = [];
    }

    enqueue(item: T): void {
        this.items.push(item);
    }

    dequeue(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.shift() || null;
    }

    dequeueBatch(batchSize: number): T[] {
        const batch: T[] = [];
        while (batchSize > 0 && !this.isEmpty()) {
            const item = this.dequeue();
            if (item !== null) {
                batch.push(item);
            }
            batchSize--;
        }
        return batch;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }
}

export default Queue;
