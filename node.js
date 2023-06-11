/* eslint-disable no-console */
import { SerialPort } from 'serialport'
import { appConf, serialConf } from './configs/index.js'
import { Logger } from './services/logger.js'

// const ports = await SerialPort.list()
// Logger.info('List port available', ports)

async function sleep(miliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, miliseconds)
  })
}

let totalPackets = 0
const packets = []

function checkPacket() {
  let totalFailPacket = 0
  packets.forEach((e, index) => {
    const requestId = index + 1
    const expectedPacket = `packet-${requestId}`
    Logger.debug(`Packet #${requestId}`, {
      receivedPacket: e,
      expectedPacket,
    })

    if (e !== expectedPacket) {
      totalFailPacket += 1
    }
  })

  Logger.debug('Total packets receive ' + packets.length)
  Logger.debug('Fail packets ' + totalFailPacket)
}

function processData(message) {
  Logger.warn('Receive packet', { message })
  Logger.debug('Receive packet: ', { message })
  totalPackets += 1
  packets.push(message)

  if (totalPackets >= appConf.packetNumber * 2) {
    totalPackets = 0
    checkPacket()
  }
}
const modules = ['zigbee', 'lora']
const nodes = ['czuwb2', 'ulbyxs']

async function main() {
  const promises = [serialConf.path1, serialConf.path2].map(async (path, index) => {
    if (index == 0) return
    const serialClient = new SerialPort({
      path,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    })
    serialClient.on('close', () => {
      console.warn(`Port ${serialClient.path} have been closed`)
    })

    serialClient.on('error', (err) => {
      console.error(`Error in serial port ${serialClient.path}`, err)
    })

    serialClient.on('open', async () => {
      // let message = ''
      console.info(`Port ${serialClient.path} have been opened`)

      // for (let i = 0; i < appConf.packetNumber; i++) {
      //   const requestId = i + 1
      //   const message = `!${nodes[index]}:packet${requestId}#`
      //   Logger.info(`Send packet#${modules[index]}#${requestId}`, { message })
      //   serialClient.write(message)
      //   await sleep(100)
      // }

      // await sleep(1000)
      // serialClient.write(`!${nodes[index]}:finished#`)
      console.log('message !td93rr:OK#')
      serialClient.write('!td93rr:OK#')
      // serialClient.on('data', function (data) {
      //   message += data.toString()

      //   while (message.includes('!') && message.includes('#')) {
      //     const startIndex = message.indexOf('!')
      //     const endIndex = message.indexOf('#')
      //     processData(message.substring(startIndex + 1, endIndex))
      //     message = message.slice(endIndex + 1)
      //   }
      // })
    })
  })

  await Promise.all(promises)
}

main()
