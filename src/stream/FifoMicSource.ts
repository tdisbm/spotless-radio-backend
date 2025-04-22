import {FifoSource} from "./component/source/FifoSource";
import {SourceConfig} from "./component/types";


export class FifoMicSource extends FifoSource {
    constructor(config: SourceConfig) {
        super(config);
        this.buffer.setOnStarve(() => this.close());
    }
    async write(buffer: any) {
        this.buffer.resume();
        this.buffer.feed(buffer);
    }

    async open() {

    }

    async close() {
        this.buffer.pause();
    }

    public args(): string[] {
        return [
            '-f', String(this.config.encoding),
            '-ar', String(this.config.sampleRate),
            '-ac', String(this.config.channels),
            '-i', String(this.fifo),
        ];
    }
}