import axios from 'axios'
import net from 'net'
import { appConf, serverConf } from './configs/index.js'
import { Logger } from './services/logger.js'

async function getLocalIpAddress() {
  return new Promise((resolve) => {
    const socket = net.createConnection(80, 'https://io.adafruit.com')
    socket.on('connect', function () {
      const localAddress = socket.localAddress
      socket.end()
      Logger.info('Local IP address:', { localAddress })

      resolve(localAddress)
    })
  })
}

async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

let failRequests = 0

async function sendRequestToServer(requestId, localAddress) {
  const hostname = 'http://raspberrypi.local:8000/webhook?serviceKey=820be8ab-c2b8-4d0b-bba2-1063fb15372b'

  try {
    Logger.info('Send request to server', { requestId })
    await axios.post(hostname, { packet: requestId })
  } catch (error) {
    failRequests += 1
    Logger.error('Cannot send request to server', { requestId })
  }
}

async function main() {
  // const localAddress = await getLocalIpAddress()
  const promise = Array(appConf.packetNumber)
    .fill(null)
    .map(async (_, index) => sendRequestToServer(index + 1, null))

  await Promise.all(promise)
  // for (let i = 0; i < appConf.packetNumber; i++) {
  //   await sendRequestToServer(i + 1)
  // }

  Logger.warn('Total fail request', { failRequests })
}

main()
