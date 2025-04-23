import {FifoSourceMixer} from "./component/source/FifoSourceMixer";
import {FifoPlayerSource} from "./FifoPlayerSource";
import {FifoMicSource} from "./FifoMicSource";


export interface MixerBundle {
    mixer: FifoSourceMixer;
    player: FifoPlayerSource;
    mic: FifoMicSource;
}
