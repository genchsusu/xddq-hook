class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.shift();
    }

    dequeueBatch(batchSize) {
        const batch = [];
        while (batchSize > 0 && !this.isEmpty()) {
            batch.push(this.dequeue());
            batchSize--;
        }
        return batch;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

export { Queue };
