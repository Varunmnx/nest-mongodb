import { Injectable } from '@nestjs/common';
import { classNameOf, parseSafe, stringifySafe } from '../utils/utils';

/**
 * Formats parameters by safely converting them to strings.
 * @param params - The parameters to format.
 * @returns An array of formatted parameters.
 */
const formattParams = (params: any) => {
  const param = [];

  try {
    if (params) {
      for (let i = 0; i < params.length; i++) {
        param.push(parseSafe(stringifySafe(params[i])));
      }
    }
    return param;
  } catch (error) {
    return param;
  }
};

/**
 * Provides a logging service with different log levels and colored output.
 * This service can be used to log messages at various levels such as 'log', 'info', 'error', 'debug', and 'warn'.
 * Each log level is associated with a specific text color for easy differentiation.
 */
@Injectable()
export class LoggerService {
  /**
   * The name of the application.
   */
  public static APPLICATION_NAME = 'reservation-ai-api-service';

  /**
   * ANSI escape codes for log colors.
   */
  private logColors = {
    log: '\x1b[32m', // Green for log
    info: '\x1b[34m', // Blue for info
    error: '\x1b[31m', // Red for error
    debug: '\x1b[36m', // Cyan for debug
    warn: '\x1b[33m', // Yellow for warn
  };

  /**
   * ANSI escape code to reset text color to default.
   */
  private resetColor = '\x1b[0m';

  /**
   * Log a message with the 'log' level.
   * @param context - The context or source of the log message.
   * @param message - The log message.
   * @param params - Additional parameters to log.
   */
  public log(context: any, message: any, ...params: any) {
    try {
      console.log(this._buildLog(context, 'log', message, null, params));
    } catch (error) {
      console.log('LoggerService.log.error ', error);
    }
  }

  /**
   * Log a message with the 'info' level.
   * @param context - The context or source of the log message.
   * @param message - The log message.
   * @param params - Additional parameters to log.
   */
  public info(context: any, message: any, ...params: any) {
    if (!message) message = '';
    if (!context) context = '';

    try {
      console.log(this._buildLog(context, 'info', message, null, params));
    } catch (error) {
      console.log('LoggerService.info.error ', error);
    }
  }

  /**
   * Log an error message with the 'error' level.
   * @param context - The context or source of the log message.
   * @param message - The error message.
   * @param trace - Stack trace information (optional).
   * @param params - Additional parameters to log.
   */
  public error(context: any, message: any, trace?: any, ...params: any) {
    if (!message) message = '';
    if (!context) context = '';
    if (!trace) trace = '';

    try {
      console.log(this._buildLog(context, 'error', message, trace, params));
    } catch (error) {
      console.log('LoggerService.error.error ', error);
    }
  }

  /**
   * Log a message with the 'debug' level.
   * @param context - The context or source of the log message.
   * @param message - The log message.
   * @param params - Additional parameters to log.
   */
  public debug(context: any, message: any, ...params: any) {
    try {
      console.log(this._buildLog(context, 'debug', message, null, params));
    } catch (error) {
      console.log('LoggerService.debug.error ', error);
    }
  }

  /**
   * Log a warning message with the 'warn' level.
   * @param context - The context or source of the log message.
   * @param message - The warning message.
   * @param params - Additional parameters to log.
   */
  public warn(context: any, message: any, ...params: any) {
    try {
      console.log(this._buildLog(context, 'warn', message, null, params));
    } catch (error) {
      console.log('LoggerService.warn.error ', error);
    }
  }

  /**
   * Builds a log message with metadata and color codes.
   * @param context - The context or source of the log message.
   * @param logLevel - The log level (e.g., 'log', 'info', 'error', 'debug', 'warn').
   * @param message - The log message.
   * @param trace - Stack trace information (optional).
   * @param params - Additional parameters to log.
   * @returns The formatted log message with color.
   */
  private _buildLog(context: any, logLevel: string, message: any, trace: any, params: any): any {
    try {
      if (!message) message = '';
      if (!context) context = '';

      if (trace) {
        try {
          trace = {
            ...trace,
            stack: trace['stack'],
          };
        } catch (error) {
          trace = '';
        }
      } else {
        trace = '';
      }

      const logColor = this.logColors[logLevel] || ''; // Get the color for the log level

      const logval = {
        '@timestamp': new Date().toString(),
        '@APPLICATION_NAME': LoggerService.APPLICATION_NAME,
        '@CLASS_NAME': classNameOf(context),
        '@LOG_LEVEL': logLevel,
        '@MESSAGE': message,
        '@PARAMS': formattParams(params),
        '@TRACE': trace,
      };

      const logMessage = `${logColor}${stringifySafe(logval)}${this.resetColor}`; // Add color to log message

      return logMessage;
    } catch (error) {
      return '';
    }
  }
}
