import {FifoSourceMixer} from "./component/source/FifoSourceMixer";
import {Stream} from "../database/models/Stream";
import {STREAM_FFMPEG_BIN, STREAM_FFMPEG_BITRATE, STREAM_FFMPEG_SAMPLE_RATE} from "../config/icecast";
import {FifoMicSource} from "./FifoMicSource";
import {FifoPlayerSource} from "./FifoPlayerSource";
import {MixerBundle} from "./types";


class StreamManager {
    private bundles: Map<string, MixerBundle> = new Map<string, MixerBundle>();

    async openMixer(streamId: string) {
        const stream: Stream = await Stream.findByPk(streamId);
        const isCreated: boolean = !this.bundles.has(stream.id)
        const bundle: MixerBundle = isCreated ?
            this.createMixerBundle(stream) :
            this.bundles.get(stream.id);
        if (isCreated) {
            bundle.mixer.open();
            this.bundles.set(streamId, bundle);
        }
        return {
            isCreated,
            bundle,
        };
    }

    async closeMixer(streamId: string) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Close mixer ${streamId}`)
            bundle.mixer.close();
            bundle.mic.destroy();
            bundle.player.destroy();
            this.bundles.delete(streamId)
        }
    }

    async openPlayer(streamId: string, trackId: string = null) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Open player ${streamId}`);
            if (trackId) {
                await bundle.player.playNext(trackId)
            } else {
                await bundle.player.open();
            }
        }
    }

    async closePlayer(streamId: string) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Close player ${streamId}`)
            bundle.player.close();
        }
    }

    async pausePlayer(streamId: string) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Pause player ${streamId}`)
            bundle.player.pause();
        }
    }

    async resumePlayer(streamId: string) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Resume player ${streamId}`)
            bundle.player.resume();
        }
    }

    async writeMic(streamId: string, buffer: Buffer) {
        const bundle: MixerBundle = this.bundles.get(streamId);
        if (bundle) {
            console.log(`Write mic ${streamId}`)
            await bundle.mic.write(buffer);
        }
    }

    createMixerBundle(stream: Stream) {
        const mic: FifoMicSource = new FifoMicSource({
            cid: stream.id,
            name: 'mic',
            audioProcBin: STREAM_FFMPEG_BIN,
            sampleRate: Number(STREAM_FFMPEG_SAMPLE_RATE),
            sampleBytes: 3,
            sampleDurationMs: 100,
            channels: 2,
            starveTimeoutMs: 1500,
            encoding: 's24le'
        });
        const player: FifoPlayerSource = new FifoPlayerSource({
            cid: stream.id,
            name: 'player',
            audioProcBin: STREAM_FFMPEG_BIN,
            sampleRate: Number(STREAM_FFMPEG_SAMPLE_RATE),
            sampleBytes: 3,
            sampleDurationMs: 100,
            channels: 2,
            starveTimeoutMs: 1500,
            encoding: 's24le'
        });
        const mixer: FifoSourceMixer = new FifoSourceMixer({
            sources: [mic, player],
            config: {
                cid: stream.id,
                name: `stream-mixer-${stream.id}`,
                bin: STREAM_FFMPEG_BIN,
                bitrate: STREAM_FFMPEG_BITRATE,
                sampleRate: STREAM_FFMPEG_SAMPLE_RATE,
                codec: 'libopus',
                format: 'ogg',
                channels: 2,
                output: stream.connectionUrl(),
            }
        });
        return {
            mixer,
            player,
            mic
        }
    }
}

export const streamManager: StreamManager = new StreamManager();