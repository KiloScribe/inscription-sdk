export declare class Logger {
    private static instance;
    private isProduction;
    private constructor();
    static getInstance(): Logger;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
