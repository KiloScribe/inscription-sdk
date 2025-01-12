export class Logger {
  private static instance: Logger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }
}
