import { HttpException, HttpStatus } from '@nestjs/common';

interface ErrorMapping {
  errorType: any;
  status: HttpStatus;
  message: string;
}

export function handleSpecificErrors(error: any, mappings: ErrorMapping[]): HttpException {
  for (const mapping of mappings) {
    if (error instanceof mapping.errorType) {
      return new HttpException(mapping.message, mapping.status);
    }
  }
  return new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
}
