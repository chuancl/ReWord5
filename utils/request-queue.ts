
type Task = () => Promise<void>;

export class RequestQueue {
    private activeRequests = 0;
    private queue: Task[] = [];
    private concurrencyLimit: number;

    constructor(concurrencyLimit: number = 3) {
        this.concurrencyLimit = concurrencyLimit;
    }

    enqueue(task: Task) {
        this.queue.push(task);
        this.process();
    }

    private process() {
        if (this.activeRequests >= this.concurrencyLimit || this.queue.length === 0) return;

        const task = this.queue.shift();
        if (task) {
            this.activeRequests++;
            task().finally(() => {
                this.activeRequests--;
                this.process();
            });
        }
        
        // Try to schedule next immediately if slots available
        if (this.queue.length > 0) {
            this.process();
        }
    }

    get pendingCount() {
        return this.queue.length;
    }
}
