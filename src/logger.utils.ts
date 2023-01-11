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

export function isMatch(
  str: string,
  pattern?: string | RegExp | (string | RegExp)[],
) {
  if (typeof pattern === 'string') {
    return pattern === str;
  } else if (pattern instanceof RegExp) {
    return pattern.test(str);
  } else if (Array.isArray(pattern)) {
    return pattern.some(isMatch.bind(undefined, str));
  }
  return false;
}
