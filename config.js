const fs = require("fs");

const config_file = "config.json"

const config = {
    mqtt_broker: "",
    topic: {
        command: "device/pc/cmd",
        state: "device/pc/state"
    },
    state_refresh_interval: 0,
    allow_custom_commands: false
}

function readAndValidateConfig() {
    if (!fs.existsSync(config_file)) {
        // dumping entire config
        fs.writeFileSync(config_file, JSON.stringify(config, null, 2))

        console.log(`Config file not found. Created ${config_file} file. Please edit and update broker info.`)
        return null
    }

    // no error handling - assuming user didn't mess up JSON
    let user_config = JSON.parse(fs.readFileSync(config_file).toString())
    // override local config properties
    Object.assign(config, user_config)

    if (!config.mqtt_broker) {
        console.error("The mqtt_broker is not set in configuration! Please update " + config_file)
        return null
    }

    return config
}

module.exports = {
    read: readAndValidateConfig
}