import dotenv from 'dotenv'
dotenv.config()

export const serverConf = {
  ioUsername: process.env.IO_USERNAME,
  ioKey: process.env.IO_KEY,
  ioFeedKey: process.env.IO_FEED_KEY,
}

export const appConf = {
  name: process.env.APP_NAME,
  packetNumber: parseInt(process.env.PACKET_NUMBER || '0', 10),
}

export const serialConf = {
  path1: process.env.SERIAL_PATH1,
  path2: process.env.SERIAL_PATH2,
}
