import { Inject } from '@nestjs/common';

import { LOGGER } from './constants';
export const Logger = () => Inject(LOGGER);
