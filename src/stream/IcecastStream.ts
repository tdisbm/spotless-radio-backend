import {ChildProcess, spawn} from 'child_process';
import {PassThrough} from 'stream';
import {StreamEventHandler, StreamInfoBundle, StreamProcessBundle} from "./types";
import {Stream} from "../database/models/Stream";
import path from "node:path";
import {parseFile} from "music-metadata";
import {Track} from "../database/models/Track";


export class IcecastStream {
    private streamProcesses: Map<string, StreamProcessBundle> = new Map<string, StreamProcessBundle>();
    private streamInfo: Map<string, StreamInfoBundle> = new Map<string, StreamInfoBundle>();
    private isStopping: boolean = false;


    constructor(
        private ffmpegPath: string = 'ffmpeg',
        private bitrate: string = '128k',
        private onTrackChange: StreamEventHandler,
        private onTrackSelect: StreamEventHandler,
        private onStreamEnd: StreamEventHandler
    ) {}

    public async streamStart(stream: Stream) {
        this.isStopping = false;
        await this.streamKill(stream);
        await this.playNextTrack(stream);
        return this.streamInfo.has(stream.id);
    }

    public async streamStop(stream: Stream) {
        this.isStopping = true;
        await this.streamKill(stream);
        return !this.streamInfo.has(stream.id);
    }

    private async playNextTrack(stream: Stream) {
        const streamInfo: StreamInfoBundle = this.getStreamInfo(stream);
        const track: Track = await this.onTrackSelect(streamInfo);
        if (track === null) {
            await this.streamKill(stream);
            return;  // Stream ended!
        }
        const streamProcessBundle: StreamProcessBundle = this.getStreamProcessBundle(stream);
        const encoder: ChildProcess = await this.spawnTrackProcess(track);

        streamInfo.currentTrackMetadata = await parseFile(path.normalize(track.location))
        streamInfo.currentTrackId = track.id;
        console.log(`[Stream ${stream.name}] Playing track: ${path.basename(track.location)}`);

        this.onTrackChange(streamInfo);
        streamProcessBundle.encoder = encoder;
        encoder.stdout.pipe(streamProcessBundle.buffer, { end: false });
        encoder.stderr.on('data', (data: Buffer) => this.handleStreamEvent(stream, String(data), false));
        encoder.on('error', (data) => this.handleStreamEvent(stream, String(data), false));
        encoder.on('exit', (code) => {
            if (code !== 0) {
                const errorMessage = `Encoder exited with code ${code}`;
                this.handleStreamEvent(stream, errorMessage, false);
            }
            this.playNextTrack(stream);
        });
    }

    private getStreamInfo(stream: Stream): StreamInfoBundle {
        let streamInfo: StreamInfoBundle = this.streamInfo.get(stream.id);
        if (!streamInfo) {
            streamInfo = {
                streamId: stream.id,
                currentTrackId: null,
                currentTrackMetadata: null,
                playlist: stream.playlist.dataValues,
                startTime: new Date(),
                lastError: null
            }
            this.streamInfo.set(
                stream.id,
                streamInfo
            );
        }
        return streamInfo;
    }

    private getStreamProcessBundle(stream: Stream): StreamProcessBundle {
        let processesBundle: StreamProcessBundle = this.streamProcesses.get(stream.id);
        if (!processesBundle) {
            processesBundle = {
                buffer: new PassThrough(),
                output: this.spawnOutputProcess(stream),
                encoder: null,
            }
            processesBundle.buffer.pipe(processesBundle.output.stdin);
            processesBundle.output.on('data', (data) => this.handleStreamEvent(stream, String(data)))
            processesBundle.output.on('error', (data) => this.handleStreamEvent(stream, String(data)))
            processesBundle.output.on('exit', (code, signal) => {
                if (!this.isStopping) {
                    this.handleStreamEvent(stream, `Process exited with code ${code}, signal ${signal}`)
                }
            })
            this.streamProcesses.set(stream.id, processesBundle);
        }
        return processesBundle;
    }

    private async handleStreamEvent(stream: Stream, data: string, recover: boolean = true) {
        const isError: boolean = data.toLowerCase().includes('error') ||
            data.toLowerCase().includes('failed') ||
            data.toLowerCase().includes('warning');
        if (isError && recover) {
            console.error(`[Stream ${stream.name}] Error ${data}`)
            console.log(`[Stream ${stream.name}] Attempting recovery...`);
            await this.streamStart(stream);
        }
    }

    private async streamKill(stream: Stream) {
        try {
            const streamProcesses: StreamProcessBundle = this.streamProcesses.get(stream.id);
            if (streamProcesses) {
                streamProcesses?.encoder?.kill('SIGTERM');
                streamProcesses?.output?.kill('SIGTERM');
                streamProcesses?.buffer?.destroy();
                this.streamProcesses.delete(stream.id);
            }
            await this.onStreamEnd(this.getStreamInfo(stream));
            this.streamInfo.delete(stream.id);
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }

    private spawnOutputProcess(stream: Stream): ChildProcess {
        const args = [
            '-re',
            '-f', 'mp3',
            '-i', 'pipe:0',
            '-c:a', 'copy',
            '-content_type', 'audio/mpeg',
            '-f', 'mp3',
            `icecast://${stream.username}:${stream.password}@${stream.host}:${stream.port}/${stream.endpoint}`
        ];

        return spawn(this.ffmpegPath, args, {
            windowsHide: true,
            detached: true,
            stdio: ['pipe', 'ignore', 'pipe']
        });
    }

    private async spawnTrackProcess(track: Track) {
        const trackAbsolutePath = path.normalize(track.location);
        return spawn(this.ffmpegPath, [
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
    }
}
