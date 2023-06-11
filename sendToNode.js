import mqtt from 'async-mqtt'
import { serverConf, appConf } from './configs/index.js'
import { Logger } from './services/logger.js'

let totalPackets = 0
let isChecked = false
const packets = []

function checkPacket() {
  isChecked = true
  let totalFailPacket = 0
  packets.forEach((e, index) => {
    const requestId = index + 1
    const expectedPacket = `packet${requestId}`
    Logger.debug(`Packet #${requestId}`, {
      receivedPacket: e,
      expectedPacket,
    })

    if (e !== expectedPacket) {
      totalFailPacket += 1
    }
  })

  Logger.warn('Total packets receive ' + packets.length)
  Logger.debug('Total packets receive ' + packets.length)
  Logger.warn('Fail packets ' + totalFailPacket)
  Logger.debug('Fail packets ' + totalFailPacket)
}

function processData(message) {
  Logger.warn(`Receive packet: "${message}"`)
  Logger.debug(`Receive packet: "${message}"`)
  totalPackets += 1
  packets.push(message)

  if (totalPackets >= appConf.packetNumber) {
    totalPackets = 0
    checkPacket()
  }
}

const hostname = 'mqtts://io.adafruit.com'
const options = {
  port: 8883,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
  rejectUnauthorized: false,
  clean: true,
  username: serverConf.ioUsername,
  password: serverConf.ioKey,
}

async function main() {
  const mqttClient = await mqtt.connectAsync(hostname, options, true)
  Logger.info('Connect to server success')
  const topics = 'ndc/feeds/sas-door'
  mqttClient.subscribe(topics)
  mqttClient.on('message', async (_, payload) => {
    const data = payload.toString()
    console.log(totalPackets)
    processData(data)
  })
}

main()
