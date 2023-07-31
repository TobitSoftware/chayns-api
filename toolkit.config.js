const path = require('path');

module.exports = {
    development: {
        host: "0.0.0.0",
        port: 8081,
    },
    output: {
        singleBundle: true,
        filename: 'chayns-api.js'
    },
    webpack(config) {
        config.output.library = {
            name: 'chaynsApi',
            type: 'umd',
        }
        return config;
    }
};
