import {IAudioMetadata} from "music-metadata";
import {FifoSourceMixer} from "./component/source/FifoSourceMixer";
import {FifoPlayerSource} from "./FifoPlayerSource";
import {FifoMicSource} from "./FifoMicSource";


export interface StreamInfoBundle {
    cid: string,
    currentTrackId: string;
    currentTrackMetadata: IAudioMetadata;
    startTime: Date;
    lastError: Error | string;
}

export interface MixerBundle {
    mixer: FifoSourceMixer;
    player: FifoPlayerSource;
    mic: FifoMicSource;
}
