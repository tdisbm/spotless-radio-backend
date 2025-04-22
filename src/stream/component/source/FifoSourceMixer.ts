import {SourceMixer} from "./SourceMixer";
import {FifoSource} from "./FifoSource";


export class FifoSourceMixer extends SourceMixer {
    argsComplexFilter(): string[] {
        let filter: string = '';
        let inputs: string = '';

        for (const [channel, source] of this.sourcesMap as Map<number, FifoSource>) {
            const label: string = `${source.config.name}${channel}`;
            filter += `[${channel}:a]volume=1.0[${label}];`;
            inputs += `[${label}]`;
        }

        return [
            '-filter_complex',
            `${filter}${inputs}amix=inputs=${this.sourcesMap.size}:` +
            `duration=longest:dropout_transition=1000,` +
            `aresample=async=1:min_hard_comp=0.100:first_pts=0[out]`,
            '-map', '[out]'
        ];
    }

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

    onExit(code): void {
        console.log(`[Mixer end]: ${code}`)
    }

    protected onData(data) {
        console.log(String(data));
    }
}
