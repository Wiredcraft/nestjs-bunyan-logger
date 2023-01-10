import { isMatch } from '../src';

describe('logger utils', () => {
  const isMatchTargetStr = 'quick fox jumps over the lazy dog';

  describe(`isMatch (${isMatchTargetStr})`, () => {
    it.each([
      // empty
      [false, undefined],
      [false, null],

      // string only
      [false, 'quick'],
      [true, isMatchTargetStr],

      // regexp only
      [true, /fox/],
      [false, /^fox/],
      [true, /dog$/],

      // array of string or regexp
      [true, [isMatchTargetStr]],
      [true, [/dog/]],
      [true, [isMatchTargetStr, /dog/]],
      [true, [/dog/, isMatchTargetStr]],
      [false, ['']],
      [true, [/dog/, '']],
      [true, [isMatchTargetStr, '']],
      [true, ['', /dog/]],
      [true, ['', isMatchTargetStr]],
    ])('should return %s for %s', (expected, pattern) => {
      expect(isMatch(isMatchTargetStr, pattern)).toBe(expected);
    });
  });
});
