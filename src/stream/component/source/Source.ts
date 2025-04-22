export interface Source {
    write(buffer: any);
    open();
    close();
    destroy();
    args(): string[];
}