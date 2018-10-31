
const config = require("./config");
const client = require("./client")

const user_config = config.read()

if (!user_config) {
    // config is missing or not valid
    return
}

client.start(user_config)