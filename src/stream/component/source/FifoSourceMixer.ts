import {SourceMixer} from "./SourceMixer";


export class FifoSourceMixer extends SourceMixer {
    protected argsExtra(): string[] {
        return [
            '-application', 'audio',
            '-frame_duration', '20',
            '-vbr', 'off',
            '-compression_level', '0',
            '-fflags', '+nobuffer',
            '-flush_packets', '1',
            '-max_delay', '0',
            '-content_type', 'audio/ogg',
            '-legacy_icecast', '1'
        ];
    }

    protected onExit(code): void {
        console.log(`[Mixer closed]: Code - ${code}`);
    }

    protected onData(data) {
        console.log(String(data));
    }
}
