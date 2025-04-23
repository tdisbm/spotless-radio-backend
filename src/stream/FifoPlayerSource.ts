import {FifoSource} from './component/source/FifoSource';
import {orderedTrackSelector} from './TrackSelector';
import {Track} from "../database/models/Track";
import {ChildProcessWithoutNullStreams, spawn} from "node:child_process";
import {SourceConfig} from "./component/types";


interface TrackOptions {
    seekSeconds?: number;
    fadeInSec?: number;
    fadeOutSec?: number;
}

export class FifoPlayerSource extends FifoSource {
    private encoder: ChildProcessWithoutNullStreams | null = null;

    constructor(settings: SourceConfig) {
        super(settings);
        this.buffer.setOnStarve(async () => await this.playNext());
    }

    public async open() {
        this.buffer.resume();
    }

    public pause() {
        this.buffer.pause();
    }

    public resume() {
        this.buffer.resume();
    }

    public close() {
        this.buffer.flush();
        this.buffer.pause();
        if (this.encoder) {
            this.encoder.kill('SIGTERM');
            this.encoder = null;
        }
    }

    public write(buffer: any) {
        this.buffer.feed(buffer);
    }

    public args(): string[] {
        return [
            '-f', String(this.config.encoding),
            '-ar', String(this.config.sampleRate),
            '-ac', String(this.config.channels),
            '-i', String(this.fifo),
        ];
    }

    public async playNext(trackId: string = null) {
        const currentTrackId: string = trackId || this.notifier.getValue()?.currentTrack?.id;
        const track: Track = await orderedTrackSelector(this.config.cid, currentTrackId);
        if (!track) {
            this.notifier.next(null);
            this.close();
            console.log('[AudioStreamer] Playlist finished.');
            return;
        }

        this.notifier.next({
            currentTrack: track.dataValues,
            startTime: new Date(),
        });

        this.buffer.flush();
        this.encoder = spawn(
            this.config.audioProcBin,
            this.buildEncoderArgs(track, {
                fadeInSec: 3,
                fadeOutSec: 1.5,
            })
        );

        this.encoder.stdout.on('data', chunk => {
            this.buffer.feed(chunk);
        });
        this.encoder.stderr.on('data', err => {
            console.error(`[${this.constructor.name} error]`, err.toString());
            this.close();
        });
    }

    private buildEncoderArgs(track: Track, options: TrackOptions): string[] {
        const args: string[] = [
            '-hide_banner',
            '-loglevel', 'error',
        ];
        if (options?.seekSeconds) {
            args.push('-ss', options.seekSeconds.toString());
        }
        args.push('-i', track.location);

        const filters: string[] = [];
        if (options?.fadeInSec) {
            filters.push(`afade=t=in:st=0:d=${options.fadeInSec}`);
        }
        if (options?.fadeOutSec) {
            filters.push(`afade=t=out:st=999999:d=${options.fadeOutSec}`);
        }

        args.push('-af', filters.join(','));
        args.push(
            '-f', this.config.encoding,
            '-acodec', `pcm_${this.config.encoding}`,
            '-ar', this.config.sampleRate.toString(),
            '-ac', this.config.channels.toString(),
            'pipe:1'
        );
        return args;
    }
}
