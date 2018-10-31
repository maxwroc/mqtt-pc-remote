const cp = require('child_process')
const mqtt = require("mqtt")
const exitHook = require("async-exit-hook")
const shutdownCmd = require("cross-platform-shutdown")

const config = {
    mqtt_broker: "mqtt://192.168.2.103",
    topic: {
        command: "device/pc/cmd",
        state: "device/pc/cmd"
    },
    state_refresh_interval: 0
}

let clientConnected = false
const client = mqtt.connect(config.mqtt_broker)

client.on("connect", () => {
    client.subscribe(config.topic.command, (err) => {
        if (err) {
            console.error("Failed to subscribe " + config.topic.command, err)
            client.end()
            return
        }

        clientConnected = true
        console.log("subscribed to " + config.topic.command)
        sendStatus("online")
    })

    config.state_refresh_interval && setInterval(sendOnlineStatus, config.state_refresh_interval)
})

client.on("message", (topic, message) => {

    if (topic != config.topic.command) {
        // we should get messages only from topic to which we have subscribed
        console.error("Unsupported topic: " + topic)
        return
    }

    try {
        // message is Buffer
        let msg = JSON.parse(message.toString())

        if (!msg.command) {
            console.warn("No command in message")
            return
        }

        // check if command exists on shutdown plugin
        if (shutdownCmd[msg.command]) {
            // pass entire message as options
            console.log("command", msg)
            shutdownCmd[msg.command](msg)
        }
        else {
            // TODO try to execute command
            console.warn("Custom commands not supported yet", msg.command)
        }
    }
    catch (e) {
        console.error(e)
    }
})

const sendStatus = (status, callback) =>
    client.publish(config.topic.state, status, { retain: config.state_refresh_interval === 0 }, callback)

exitHook(callback => {
    if (clientConnected) {
        // publishing LWM
        sendStatus("offline", () => callback())
    }
})