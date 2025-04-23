import {SourceConfig} from "../types";

export interface Source {
    config: SourceConfig

    write(buffer: any);

    fadeIn(duration: number, volume: number);

    fadeOut(duration: number, volume: number);

    open();

    close();

    destroy();

    args(): string[];
}