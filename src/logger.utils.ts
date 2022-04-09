import * as Bunyan from 'bunyan';

export function mapLevelToName(level: number) {
  let res = '';
  switch (level) {
    case Bunyan.TRACE:
      res = 'DEBUG';
      break;
    case Bunyan.DEBUG:
      res = 'DEBUG';
      break;
    case Bunyan.INFO:
      res = 'INFO';
      break;
    case Bunyan.WARN:
      res = 'WARN';
      break;
    case Bunyan.ERROR:
      res = 'ERROR';
      break;
    case Bunyan.FATAL:
      res = 'FATAL';
      break;
  }
  return res;
}
