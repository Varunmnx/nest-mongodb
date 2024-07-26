import { SetMetadata } from '@nestjs/common';

export const SERVER_ACCESS_KEY = 'serverAccess';
export const ServerAccess = () => SetMetadata(SERVER_ACCESS_KEY, true);
