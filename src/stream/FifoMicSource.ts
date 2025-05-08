import {FifoSource} from "./component/source/FifoSource";
import {SourceConfig} from "./component/types";


export class FifoMicSource extends FifoSource {
    private readonly status: {isActive: boolean, cid: string};

    constructor(config: SourceConfig) {
        super(config);
        this.buffer.setOnStarve(() => this.close());
        this.status = {isActive: false, cid: this.config.cid};
        this.notifier.next(this.status);  // The mic is not active by default
    }

    async write(buffer: any) {
        if (this.notifier.getValue() === null) {
            this.status.isActive = true;
            this.notifier.next(this.status);
        }
        this.buffer.resume();
        this.buffer.feed(buffer);
    }

    async open() {

    }

    async close() {
        this.status.isActive = false;
        this.notifier.next(this.status);  // Close the mic event
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