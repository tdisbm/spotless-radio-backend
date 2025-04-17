import {Stream} from "../database/models/Stream";
import {Playlist} from "../database/models/Playlist";
import {Track} from "../database/models/Track";
import {IcecastStream} from "./IcecastStream";
import {STREAM_BITRATE, STREAM_FFMPEG_BIN} from "../config/icecast";
import {discardStreamInfo, storeStreamInfo} from "../redis/stream-store";
import {orderedTrackSelector} from "./TrackSelector";
import {StreamInfoBundle} from "./types";
import {fetchStream} from "../database/repository/StreamRepository";


class StreamManager {
    private streamService: IcecastStream = new IcecastStream(
        STREAM_FFMPEG_BIN,
        STREAM_BITRATE,
        storeStreamInfo,
        orderedTrackSelector,
        (streamInfo: StreamInfoBundle) => discardStreamInfo(streamInfo.streamId)
    );

    public async streamStart(streamId: string): Promise<boolean> {
        const stream: Stream = await fetchStream(streamId);
        this.validateStream(stream)
        return await this.streamService.streamStart(stream);
    }

    public async streamStop(streamId: string): Promise<boolean> {
        const stream: Stream = await fetchStream(streamId);
        this.validateStream(stream);
        await discardStreamInfo(streamId);
        return await this.streamService.streamStop(stream);
    }

    private validateStream(stream: Stream) {
        if (!stream)
            throw new Error(`Stream not found!`);
        if (!stream.playlist)
            throw new Error(`Stream ${stream.name} does not have a playlist attached!`);
        if (!stream.playlist.tracks.length)
            throw new Error(`Stream ${stream.name}, with playlist ${stream.playlist.name} does not have tracks!`)
        return stream;
    }

}

export const streamManager: StreamManager = new StreamManager();