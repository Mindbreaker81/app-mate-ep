const shouldLogToConsole =
  (import.meta.env.DEV && import.meta.env.MODE !== 'test') ||
  import.meta.env.VITE_ENABLE_BROWSER_LOGS === 'true';

type LoggerArgs = unknown[];

const noop = () => undefined;

const callConsole = (method: 'debug' | 'info' | 'warn' | 'error', args: LoggerArgs) => {
  if (!shouldLogToConsole || typeof console === 'undefined') {
    return;
  }

  const target = console[method];
  if (typeof target === 'function') {
    target(...args);
  }
};

export const logger = {
  debug: (...args: LoggerArgs) => callConsole('debug', args),
  info: (...args: LoggerArgs) => callConsole('info', args),
  warn: (...args: LoggerArgs) => callConsole('warn', args),
  error: (...args: LoggerArgs) => callConsole('error', args),
  silent: noop,
};
