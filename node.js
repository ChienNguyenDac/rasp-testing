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

let isChecked = {}
let totalPackets = {}
const packets = {}
let timeouts = {}

function checkPacket(packetNumber, nodeHeader) {
  if (isChecked[nodeHeader]) return
  isChecked[nodeHeader] = true
  const failPackets = []
  let totalFailPacket = 0
  packets[nodeHeader].forEach((e, index) => {
    console.log(e)
    let convertPacket = { packet: null }
    try {
      convertPacket = JSON.parse(e)
    } catch (error) {
      convertPacket = { packet: null }
    }

    console.log('convert', convertPacket)
    if (convertPacket.packet < 1 || convertPacket.packet > packetNumber) {
      totalFailPacket += 1
      failPackets.push(e)
    }
  })

  Logger.warn(`Node#${nodeHeader} total packets expected ${packetNumber}`)
  Logger.debug(`Node#${nodeHeader} total packets expected ${packetNumber}`)

  Logger.warn(`Node#${nodeHeader} total packets receive ${packets[nodeHeader].length}`)
  Logger.debug(`Node#${nodeHeader} total packets receive ${packets[nodeHeader].length}`)

  Logger.warn(`Node#${nodeHeader} fail packets ${totalFailPacket}`)
  Logger.debug(`Node#${nodeHeader} fail packets ${totalFailPacket}`)

  failPackets.forEach((e, idx) => {
    Logger.warn(`Node#${nodeHeader} fail packets ${idx + 1} th: ${e}`)
  })
}

function processData(message, packetNumber, nodeHeader) {
  Logger.warn(`Node#${nodeHeader} receive packet: "${message}"`)
  Logger.debug(`Node#${nodeHeader} receive packet: "${message}"`)

  if (!totalPackets[nodeHeader]) {
    totalPackets[nodeHeader] = 1
  } else {
    totalPackets[nodeHeader] += 1
  }

  message = message.replace(`${nodeHeader}:`, '')
  if (!packets[nodeHeader]) {
    packets[nodeHeader] = [message]
  } else {
    packets[nodeHeader].push(message)
  }

  if (!timeouts[nodeHeader]) {
    timeouts[nodeHeader] = setTimeout(() => checkPacket(packetNumber, nodeHeader), 5000)
  } else {
    clearTimeout(timeouts[nodeHeader])
    timeouts[nodeHeader] = setTimeout(() => checkPacket(packetNumber, nodeHeader), 5000)
  }

  if (totalPackets[nodeHeader] >= packetNumber || message === '{"packet":"finished"}') {
    totalPackets[nodeHeader] = 0
    if (message === '{"packet":"finished"}') {
      packets[nodeHeader].pop()
    }
    checkPacket(packetNumber, nodeHeader)
  }
}

const modules = ['zigbee']
const nodes = ['czuwb2']

async function main() {
  const promises = [serialConf.path1].map(async (path, index) => {
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
      let message = ''
      console.info(`Port ${serialClient.path} have been opened`)

      // for (let i = 0; i < appConf.packetNumber; i++) {
      //   const requestId = i + 1
      //   const name = Array(20).fill('packet').join('')
      //   const message = `!${nodes[index]}:${name}${requestId}#`
      //   Logger.info(`Send packet#${modules[index]}#${requestId}`, { message })
      //   serialClient.write(message)
      //   console.time('Delay time between packet')
      //   await sleep(200)
      //   console.timeEnd('Delay time between packet')
      // }

      // await sleep(1000)
      // serialClient.write(`!${nodes[index]}:finished#`)
      // console.log('message !td93rr:OK#')
      // serialClient.write('!td93rr:OK#')
      serialClient.on('data', function (data) {
        message += data.toString()

        while (message.includes('!') && message.includes('#')) {
          const startIndex = message.indexOf('!')
          const endIndex = message.indexOf('#')
          processData(message.substring(startIndex + 1, endIndex), appConf.packetNumber, nodes[index])
          message = message.slice(endIndex + 1)
        }
      })
    })
  })

  await Promise.all(promises)
}

main()
