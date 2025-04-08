import {ChildProcess} from "node:child_process";
import {PassThrough} from "stream";
import {Playlist} from "../database/models/Playlist";
import {IAudioMetadata} from "music-metadata";


export interface ActiveStreamInfo {
    streamId: string;
    process: ChildProcess;
    currentTrackIndex: number;
    currentTrackMetadata: IAudioMetadata;
    currentEncoder: ChildProcess;
    playlist: Playlist;
    audioBuffer: PassThrough;
    startTime: Date;
    lastError: Error;
}