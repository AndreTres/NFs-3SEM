function info(message: string): void {
  console.log(`[INFO] ${message}`);
}

function warn(message: string): void {
  console.warn(`[WARN] ${message}`);
}

function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}

export const logger = {
  info,
  warn,
  error,
};
