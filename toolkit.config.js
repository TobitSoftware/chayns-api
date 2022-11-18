/* eslint-disable import/no-extraneous-dependencies */
const packageJson = require('./package.json');
const webpack = require('webpack');
const { ModuleFederationPlugin } = webpack.container;
const path = require('path');

/**
 * Your `chayns-toolkit.json`-file was automatically converted into this
 * JavaScript configuration file, which will be the configuration format going
 * forward.
 */

module.exports = {
    development: {
        host: '0.0.0.0',
        port: parseInt(process.env.DEV_PORT, 10) || 8083,
        cert: '//fs1/ssl/tobitag.crt',
        key: '//fs1/ssl/tobitag.key',
    },
    webpack(config, { dev }) {
        config.output.uniqueName = `module-chayns-api`;

        config.plugins.push(
            new ModuleFederationPlugin({
                name: 'chayns_api_module2',
                filename: 'remoteEntry.js',
                exposes: {
                    './index': './src/index',
                    './ChaynsProvider': './src/components/ChaynsProvider'
                },
                shared: {
                    react: {
                        requiredVersion: packageJson.peerDependencies?.react || packageJson.dependencies?.react
                    },
                    'react-dom': {
                        requiredVersion: packageJson.peerDependencies?.["react-dom"] || packageJson.dependencies?.["react-dom"]
                    }
                }
            })
        )
        config.output.chunkLoadingGlobal = `webpackChunkchayns_api__${process.env.BUILD_ENV || process.env.NODE_ENV}__${process.env.VERSION}`;

        config.resolve.alias = {
            react: path.resolve('./node_modules/react'),
            //'react-dom': path.resolve('./node_modules/react-dom')
        };

        delete config.optimization.splitChunks;

        return config;
    }
};
