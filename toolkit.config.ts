/* eslint-disable no-param-reassign,import/no-extraneous-dependencies */
import { buildToolkitConfig } from 'chayns-toolkit';
import { pluginUmd } from '@rsbuild/plugin-umd';

export default buildToolkitConfig({
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
        config.plugins ??= [];
        config.plugins.push(pluginUmd({
            name: 'ChaynsApi',
        }));
        config.output ??= {};
        config.output.sourceMap = false;
        return config;
    },
});
