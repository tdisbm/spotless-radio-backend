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
    private readonly status: {currentTrack, startTime, isPaused};

    constructor(settings: SourceConfig) {
        super(settings);
        this.buffer.setOnStarve(async () => await this.playNext());
        this.status = {currentTrack: null, startTime: null, isPaused: true};
        this.notifier.next(this.status);
    }

    public async open() {
        this.buffer.resume();
        this.status.isPaused = false;
        this.notifier.next(this.status);
    }

    public pause() {
        this.buffer.pause();
        this.status.isPaused = true;
        this.notifier.next(this.status);
    }

    public resume() {
        this.buffer.resume();
        this.status.isPaused = false;
        this.notifier.next(this.status);
    }

    public close() {
        this.buffer.flush();
        this.buffer.pause();
        this.status.isPaused = true;
        this.status.currentTrack = null;
        this.status.startTime = null;
        this.notifier.next(this.status);
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
            '-thread_queue_size', '512',
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
            this.status.isPaused = true;
            this.status.startTime = null;
            this.status.currentTrack = null;
            this.notifier.next(this.status);
            this.close();
            console.log('[AudioStreamer] Playlist finished.');
            return;
        }

        this.status.currentTrack = track.dataValues;
        this.status.startTime = new Date();
        this.status.isPaused = false;
        this.notifier.next(this.status);

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
