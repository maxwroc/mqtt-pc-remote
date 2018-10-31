const cp = require('child_process')
const mqtt = require("mqtt")
const exitHook = require("async-exit-hook")
const shutdownCmd = require("cross-platform-shutdown")

class Client {
    constructor(config) {
        this.isConnected = false
        this.config = config
    }

    start() {
        this.initMqtt()
        exitHook(callback => this.onExit(callback))
        return this
    }

    initMqtt() {
        this.mqtt = mqtt.connect(this.config.mqtt_broker)
        this.mqtt.on("connect", () => this.onConnect())
        this.mqtt.on("message", (topic, message, packet) => this.onMessage(topic, message, packet))
    }

    onConnect() {
        this.mqtt.subscribe(this.config.topic.command, err => this.onSubscribe(err))

        if (this.config.state_refresh_interval > 0) {
            setInterval(() => this.sendStatus("online"), this.config.state_refresh_interval)
        }
    }

    onSubscribe(err) {
        if (err) {
            this.mqtt.end()
            throw new Error(`Failed to subscribe ${this.config.topic.command}\n${err}`)
        }

        this.connected = true
        console.log("subscribed to " + this.config.topic.command)
        this.sendStatus("online")
    }

    onMessage(topic, message, packet) {
        if (topic != this.config.topic.command) {
            // we should get messages only from topic to which we have subscribed
            console.error("Unsupported topic: " + topic)
            return
        }

        if (packet.retain) {
            console.warn(`Wrn: Retain packet received - ignoring (${topic}): ${message.toString()}`);
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
            console.log("Message content:", message.toString())
        }
    }

    onExit(callback) {
        if (!this.connected) {
            callback()
            return
        }

        // publishing LWM
        this.sendStatus("offline", () => callback())
    }

    sendStatus(status, callback) {
        this.mqtt.publish(
            this.config.topic.state,
            status,
            { retain: this.config.state_refresh_interval === 0 },
            callback)
    }
}

module.exports = {
    start: config => (new Client(config)).start()
}