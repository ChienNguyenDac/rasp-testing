import winston from 'winston'
import { appConf } from '../configs/index.js'

const LoggerLevel = {
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Debug: 'debug',
}

const PathFileError = `tmp/packet_${appConf.packetNumber}.log`
const myWinstonOptions = {
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    winston.format.splat(),
    // eslint-disable-next-line no-unused-vars
    winston.format.printf(({ timestamp, message, level, ms, ...data }) => {
      data = JSON.stringify(data[Symbol.for('splat')]?.[0], null, 2)
      const isEmptyData = !data || data == '{}'
      return `[${appConf.name}] [${timestamp}] ${message} ${ms} ${!isEmptyData ? '\n' + data : ''}`
    }),
    winston.format.colorize({
      all: true,
      colors: {
        [LoggerLevel.Error]: 'red',
        [LoggerLevel.Warn]: 'yellow',
        [LoggerLevel.Info]: 'cyan',
        [LoggerLevel.Debug]: 'green',
      },
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: PathFileError, level: LoggerLevel.Debug, tailable: false }),
  ],
}

export const Logger = winston.createLogger(myWinstonOptions)
