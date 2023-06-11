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
  try {
    const ipAddresses = `192.168.0.${requestId}`
    const username = serverConf.ioUsername
    const feedKey = serverConf.ioFeedKey
    Logger.info('Send request to server', { requestId })
    await axios.post(
      `https://io.adafruit.com/api/v2/${username}/feeds/${feedKey}/data`,
      {
        value: `packet-${requestId}`,
      },
      {
        headers: {
          'X-Forwarded-For': ipAddresses,
          'X-Real-IP': ipAddresses,
          ['X-AIO-Key']: serverConf.ioKey,
        },
        // lo
      },
    )
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
