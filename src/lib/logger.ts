export const logger = {
  info(message: string, ...meta: unknown[]) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
  },
  error(error: unknown, context?: string) {
    console.error(
      `[ERROR] ${new Date().toISOString()}${context ? ` - ${context}` : ''}`,
      error
    );
  },
};

export type Logger = typeof logger;
