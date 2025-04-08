import {Stream} from "../database/models/Stream";
import {Playlist} from "../database/models/Playlist";
import {Track} from "../database/models/Track";
import {UnbreakableStream} from "./UnbreakableStream";
import {STREAM_BITRATE, STREAM_FFMPEG_BIN} from "../config/icecast";
import {discardStreamInfo, storeStreamInfo} from "../redis/stream-store";


class StreamManager {
    private streamService: UnbreakableStream = new UnbreakableStream(
        STREAM_FFMPEG_BIN,
        STREAM_BITRATE,
        storeStreamInfo
    );

    public async startStream(streamId: string): Promise<void> {
        const stream: Stream = await this.fetchStream(streamId);
        await this.streamService.startStream(stream);
        await storeStreamInfo(this.streamService.getStreamStatus(stream))
    }

    public async stopStream(streamId: string): Promise<void> {
        const stream: Stream = await this.fetchStream(streamId);
        this.streamService.stopStream(stream);
        await discardStreamInfo(streamId);
    }

    private async fetchStream(streamId: string) {
        const stream: Stream = await Stream.findByPk(streamId, {
            include: [{
                model: Playlist,
                include: [Track],
                order: [[Track, 'sortOrder', 'ASC']]
            }]
        });
        if (!stream) {
            throw new Error(`Stream ${streamId} not found!`);
        }
        if (!stream.playlist) {
            throw new Error(`Stream ${stream.name} does not have a playlist attached!`);
        }
        if (!stream.playlist.tracks.length) {
            throw new Error(`Stream ${stream.name}, with playlist ${stream.playlist.name} does not have tracks!`)
        }
        return stream;
    }
}

export const streamManager: StreamManager = new StreamManager();