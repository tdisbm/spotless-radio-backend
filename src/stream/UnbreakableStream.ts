import {ChildProcess, spawn} from 'child_process';
import {PassThrough} from 'stream';
import {ActiveStreamInfo} from "./ActiveStreamInfo";
import {Stream} from "../database/models/Stream";
import path from "node:path";
import {parseFile} from "music-metadata";

export class UnbreakableStream {
    private activeStreams: Map<string, ActiveStreamInfo> = new Map<string, ActiveStreamInfo>();
    private isStopping: boolean = false;

    constructor(
        private ffmpegPath: string = 'ffmpeg',
        private bitrate: string = '128k',
        private trackChangeHook: (streamInfo: ActiveStreamInfo) => {}
    ) {}

    async startStream(stream: Stream): Promise<void> {
        if (this.activeStreams.has(stream.id)) {
            throw new Error(`Stream ${stream.id} is already running`);
        }

        const audioBuffer: PassThrough = new PassThrough();
        const ffmpegProcess: ChildProcess = this.createOutputProcess(stream, audioBuffer);

        this.activeStreams.set(stream.id, {
            streamId: stream.id,
            process: ffmpegProcess,
            currentTrackIndex: 0,
            currentTrackMetadata: null,
            currentEncoder: null,
            playlist: stream.playlist,
            audioBuffer: audioBuffer,
            startTime: new Date(),
            lastError: null,
        });

        await this.playNextTrack(stream);
    }

    private createOutputProcess(stream: Stream, audioBuffer: PassThrough): ChildProcess {
        const args = [
            '-re',
            '-f', 'mp3',
            '-i', 'pipe:0',
            '-c:a', 'copy',
            '-content_type', 'audio/mpeg',
            '-f', 'mp3',
            `icecast://${stream.username}:${stream.password}@${stream.host}:${stream.port}/${stream.endpoint}`
        ];

        const ffmpeg = spawn(this.ffmpegPath, args, {
            windowsHide: true,
            detached: true,
            stdio: ['pipe', 'ignore', 'pipe']
        });

        audioBuffer.pipe(ffmpeg.stdin);

        ffmpeg.stderr.on('data', (data: Buffer) => {
            const message = data.toString();
            if (this.isError(message)) {
                this.handleStreamError(stream.id, new Error(message));
            }
        });

        ffmpeg.on('error', (err) => {
            this.handleStreamError(stream.id, err);
        });

        ffmpeg.on('exit', (code, signal) => {
            if (!this.isStopping) {
                this.handleStreamError(stream.id, new Error(`Process exited with code ${code}, signal ${signal}`));
            }
        });

        return ffmpeg;
    }

    private isError(message: string): boolean {
        return message.toLowerCase().includes('error') ||
            message.toLowerCase().includes('failed') ||
            message.toLowerCase().includes('warning');
    }

    private handleStreamError(streamId: string, error: Error): void {
        const streamInfo = this.activeStreams.get(streamId);
        if (!streamInfo) return;

        streamInfo.lastError = error;
        console.error(`[Stream ${streamId}] Error:`, error.message);

        if (!this.isStopping) {
            setTimeout(() => {
                if (this.activeStreams.has(streamId)) {
                    this.recoverStream(streamId);
                }
            }, 3000);
        }
    }

    private async recoverStream(streamId: string): Promise<void> {
        const streamInfo = this.activeStreams.get(streamId);
        if (!streamInfo) return;

        console.log(`[Stream ${streamId}] Attempting recovery...`);
        this.cleanupProcesses(streamInfo);
        this.activeStreams.delete(streamId);

        // In a real implementation, you would re-fetch the stream data here
        // For now we'll reuse the existing config
        const streamConfig = {
            id: streamId,
            ...streamInfo
        };

        try {
            await this.startStream(streamConfig as unknown as Stream);
        } catch (err) {
            console.error(`[Stream ${streamId}] Recovery failed:`, err);
        }
    }

    private async playNextTrack(stream: Stream) {
        const streamInfo: ActiveStreamInfo = this.activeStreams.get(stream.id);
        if (!streamInfo) return;

        const { playlist, currentTrackIndex } = streamInfo;
        const tracks = playlist.tracks;

        if (currentTrackIndex >= tracks.length) {
            if (stream.isRecursive) {
                streamInfo.currentTrackIndex = 0;
                await this.playNextTrack(stream);
            } else {
                this.stopStream(stream);
            }
            return;
        }

        const track = tracks[currentTrackIndex];
        const trackAbsolutePath = path.normalize(track.location);
        streamInfo.currentTrackMetadata = await parseFile(trackAbsolutePath)
        console.log(`[Stream ${stream.id}] Playing track ${currentTrackIndex + 1}/${tracks.length}: ${path.basename(trackAbsolutePath)}`);

        const encoder: ChildProcess = spawn(this.ffmpegPath, [
            '-re',
            '-i', trackAbsolutePath,
            '-c:a', 'libmp3lame',
            '-b:a', this.bitrate,
            '-f', 'mp3',
            '-'
        ], {
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        streamInfo.currentEncoder = encoder;
        this.trackChangeHook(streamInfo);
        encoder.stdout.pipe(streamInfo.audioBuffer, { end: false });
        encoder.stderr.on('data', (data: Buffer) => {
            const message = data.toString();
            if (this.isError(message)) {
                console.error(`[Stream ${stream.id}] Encoder error:`, message);
            }
        });
        encoder.on('error', (err) => {
            console.error(`[Stream ${stream.id}] Encoder process error:`, err);
        });
        encoder.on('exit', (code) => {
            if (code !== 0) {
                console.error(`[Stream ${stream.id}] Encoder exited with code ${code}`);
            }
            streamInfo.currentTrackIndex++;
            this.playNextTrack(stream);
        });
    }

    stopStream(stream: Stream): void {
        const streamInfo = this.activeStreams.get(stream.id);
        if (!streamInfo) return;

        this.isStopping = true;
        this.cleanupProcesses(streamInfo);
        this.activeStreams.delete(stream.id);
        this.isStopping = false;
    }

    private cleanupProcesses(streamInfo: ActiveStreamInfo): void {
        try {
            if (streamInfo.currentEncoder) {
                streamInfo.currentEncoder.kill('SIGTERM');
            }
            streamInfo.process.kill('SIGTERM');
            streamInfo.audioBuffer.destroy();
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }

    getActiveStreams(): Map<string, ActiveStreamInfo> {
        return this.activeStreams;
    }

    getStreamStatus(stream: Stream): ActiveStreamInfo | undefined {
        return this.activeStreams.get(stream.id);
    }
}