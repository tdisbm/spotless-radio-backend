import {ChildProcess, spawn} from "child_process";
import {Source} from "./Source";
import {MixerConfig} from "../types";


export abstract class SourceMixer {
    protected mixerProcess: ChildProcess = null;
    protected sourcesMap: Map<number, Source>;
    protected config: MixerConfig;

    constructor(
        {
            sources,
            config
        }: {
            sources: Source[],
            config: MixerConfig,
        }
    ) {
        this.sourcesMap = this.generateSourceMap(sources);
        this.config = config;
    }

    public open() {
        this.mixerProcess = this.spawnProcess();
        this.mixerProcess.on('spawn', () => {this.onOpen()})
        this.mixerProcess.stderr.on('data', (data) => this.onData(data));
        this.mixerProcess.on('exit', (code) => {
            this.onExit(code);
            this.mixerProcess = null;
        });
    }

    public close() {
        this.mixerProcess.kill('SIGINT');
        this.mixerProcess = null;
    }

    private spawnProcess(): ChildProcess {
        const processOpts: { stdio } = {stdio: ['pipe', 'pipe', 'pipe']}
        const processArgs: string[] = [
            ...this.argsSourcesArray(),
            ...this.argsComplexFilter(),
            ...this.argsExtra(),
            '-ac', String(this.config.channels),
            '-ar', String(this.config.sampleRate),
            '-c:a', String(this.config.codec),
            '-b:a', String(this.config.bitrate),
            '-f', String(this.config.format),
            this.config.output
        ]
        console.log(`[Mixer spawn]: ${this.config.bin} ${processArgs.join(' ')}`)
        return spawn(
            this.config.bin,
            processArgs,
            processOpts
        );
    }

    private generateSourceMap(sources: Source[]): Map<number, Source> {
        const sourcesMap: Map<number, Source> = new Map<number, Source>();
        for (let i = 0; i < sources.length; i++) {
            sourcesMap.set(i, sources[i]);
        }
        return sourcesMap;
    }

    protected argsSourcesArray(): string[] {
        const sourcesArray: string[] = [];
        for (const source of this.sourcesMap.values()) {
            sourcesArray.push(...source.args());
        }
        return sourcesArray;
    }

    protected argsComplexFilter(): string[] {
        return []
    };

    protected argsExtra(): string[] {
        return [];
    };

    protected onOpen(): void {};

    protected onData(data): void {};

    protected onExit(code): void {};
}