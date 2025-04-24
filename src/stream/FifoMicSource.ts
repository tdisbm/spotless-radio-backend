import {FifoSource} from "./component/source/FifoSource";
import {SourceConfig} from "./component/types";


export class FifoMicSource extends FifoSource {
    constructor(config: SourceConfig) {
        super(config);
        this.notifier.next(null);  // The mic is not active by default
        this.buffer.setOnStarve(() => this.close());
    }

    async write(buffer: any) {
        if (this.notifier.getValue() === null)
            this.notifier.next({  // Notifying write action
                cid: this.config.cid,
                isActive: true
            });
        this.buffer.resume();
        this.buffer.feed(buffer);
    }

    async open() {

    }

    async close() {
        this.notifier.next(null);  // Close the mic event
        this.buffer.pause();
    }

    public args(): string[] {
        return [
            '-thread_queue_size', '512',
            '-f', String(this.config.encoding),
            '-ar', String(this.config.sampleRate),
            '-ac', String(this.config.channels),
            '-i', String(this.fifo),
        ];
    }
}