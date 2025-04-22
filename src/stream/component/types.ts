export interface MixerConfig {
    cid: string;
    name: string;
    bin?: string;
    bitrate?: string | number;
    sampleRate?: string | number;
    codec: string;
    format: string;
    channels: number;
    output: string;
}

export interface SourceConfig {
    cid: string;
    name: string;
    audioProcBin: string;
    sampleRate: number;
    sampleBytes: number;
    sampleDurationMs: number;
    channels: number;
    starveTimeoutMs: number;
    encoding: string;
}