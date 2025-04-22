import {FifoSource} from './component/source/FifoSource';
import {orderedTrackSelector} from './TrackSelector';
import {StreamInfoBundle} from './types';
import {parseFile} from 'music-metadata';
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
    private streamInfoBundle: StreamInfoBundle;

    constructor(settings: SourceConfig) {
        super(settings);
        this.buffer.setOnStarve(async () => await this.playNext());
    }

    async open() {
        this.streamInfoBundle = {
            cid: this.config.cid,
            currentTrackId: null,
            currentTrackMetadata: null,
            startTime: new Date(),
            lastError: null,
        };
        this.buffer.resume();
    }

    private async playNext() {
        const track = await orderedTrackSelector(this.streamInfoBundle);
        if (!track) {
            this.close();
            console.log('[AudioStreamer] Playlist finished.');
            return;
        }

        this.streamInfoBundle.currentTrackId = track.id;
        this.streamInfoBundle.currentTrackMetadata = await parseFile(track.location);

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

    pause() {
        this.buffer.pause();
    }

    resume() {
        this.buffer.resume();
    }

    close() {
        this.streamInfoBundle = null;
        this.buffer.flush();
        this.buffer.pause();
        if (this.encoder) {
            this.encoder.kill('SIGTERM');
            this.encoder = null;
        }
    }

    write(buffer: any) {
        this.buffer.feed(buffer);
    }

    args(): string[] {
        return [
            '-f', String(this.config.encoding),
            '-ar', String(this.config.sampleRate),
            '-ac', String(this.config.channels),
            '-i', String(this.fifo),
        ];
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

        const filters: string[] = [
            // 'aresample=async=1:min_hard_comp=0.150:first_pts=0',
            // 'asetpts=N/SR/TB'
        ];
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
