const { buildToolkitConfig } = require('chayns-toolkit');
const { pluginUmd } = require('@rsbuild/plugin-umd');

module.exports = buildToolkitConfig({
    development: {
        host: '0.0.0.0',
        port: 8081,
    },
    output: {
        filename: {
            js: '[name].js',
        },
        entryPoints: {
            ['chayns-api']: {
                pathIndex: './src/umd.index.js',
            },
        },
        path: 'dist',
    },
    webpack(config) {
        config.plugins.push(pluginUmd({
            name: 'ChaynsApi',
        }));
        config.output.sourceMap = false;
        return config;
    },
});
