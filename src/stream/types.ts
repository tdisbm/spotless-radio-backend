import {ChildProcess} from "node:child_process";
import {PassThrough} from "stream";
import {Playlist} from "../database/models/Playlist";
import {IAudioMetadata} from "music-metadata";


export interface StreamInfoBundle {
    streamId: string;
    currentTrackId: string;
    currentTrackMetadata: IAudioMetadata;
    playlist: Playlist;
    startTime: Date;
    lastError: Error | string;
}


export interface StreamProcessBundle {
    buffer: PassThrough;
    encoder: ChildProcess;
    output: ChildProcess;
}

export type StreamEventHandler = (streamInfo: StreamInfoBundle) => any;