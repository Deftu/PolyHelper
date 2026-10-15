import chalk from 'chalk';
import { Logger, createLogger, format, transports } from 'winston';
import { access, readFile } from 'node:fs/promises';
import { getErrorString } from '../utils/miscUtils.ts';
import { getTimestamp, replaceVariables, titleCase } from '../utils/stringUtils.ts';
import type { LogData } from '../types/misc.ts';

const otherLog = { level: 'other', background: chalk.bgCyan.black, color: chalk.reset.cyan };
const logs: LogData[] = [
  { level: 'discord', background: chalk.bgMagenta.black, color: chalk.reset.magenta },
  { level: 'scripts', background: chalk.bgBlue.black, color: chalk.reset.blue },
  otherLog,
  { level: 'warn', background: chalk.bgYellow.black, color: chalk.reset.yellow },
  { level: 'error', background: chalk.bgRedBright.black, color: chalk.reset.redBright },
  { level: 'max', background: chalk.bgBlack.black, color: chalk.reset.black }
];

function logSomething(message: string, log: LogData): void {
  console.log(log.background(`[${getTimestamp()}] ${titleCase(log.level)} >${log.color(` ${message}`)}`));
}

let useDefault = false;
try {
  await access('config.json');
} catch {
  const log = logs.find((log) => log.level === 'warn') || otherLog;
  logSomething('`config.json` does not exist. Using default values for the logger. Please use create a config', log);
  useDefault = true;
}
const config = JSON.parse(await readFile(useDefault ? 'config.example.json' : 'config.json', 'utf-8'));

const defaultPath = replaceVariables(config?.logger?.location ?? './data/logs/{timestamp}', {
  timestamp: new Date().toISOString()
});
const fileLoggingEnabled = config?.logger?.saveToFiles ?? true;
const fullTransport = fileLoggingEnabled
  ? new transports.File({ level: 'max', filename: `${defaultPath}/full.log` })
  : undefined;
const loggers: { [key: string]: Logger } = {};
logs.forEach((log) => {
  loggers[log.level] = createLogger({
    level: log.level,
    levels: logs.reduce(
      (acc, name, index) => {
        acc[name.level] = index;
        return acc;
      },
      {} as Record<string, number>
    ),
    format: format.combine(
      format.printf(({ message }) => {
        return `[${getTimestamp()}] ${titleCase(log.level)} > ${message}`;
      })
    ),
    transports: fileLoggingEnabled
      ? [
          new transports.File({ level: log.level, filename: `${defaultPath}/${log.level}.log` }),
          fullTransport as transports.FileTransportInstance
        ]
      : []
  });
});

console.discord = (message: string): void => {
  const log = logs.find((log) => log.level === 'discord') || otherLog;
  logSomething(message, log);
  const logger = loggers[log.level];
  if (logger) logger.log(log.level, message);
};

console.scripts = (message: string): void => {
  const log = logs.find((log) => log.level === 'scripts') || otherLog;
  logSomething(message, log);
  const logger = loggers[log.level];
  if (logger) logger.log(log.level, message);
};

console.other = (message: string): void => {
  const log = logs.find((log) => log.level === 'other') || otherLog;
  logSomething(message, log);
  const logger = loggers[log.level];
  if (logger) logger.log(log.level, message);
};

console.warn = (message: string): void => {
  const log = logs.find((log) => log.level === 'warn') || otherLog;
  logSomething(message, log);
  const logger = loggers[log.level];
  if (logger) logger.log(log.level, message);
};

console.error = (message: Error): void => {
  const log = logs.find((log) => log.level === 'error') || otherLog;
  const errorString = getErrorString(message);
  logSomething(errorString, log);
  const logger = loggers[log.level];
  if (logger) logger.log(log.level, errorString);
};
