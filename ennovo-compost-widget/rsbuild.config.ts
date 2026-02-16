import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {pluginModuleFederation} from '@module-federation/rsbuild-plugin';
import ConcatenatePlugin from './ConcatenatePlugin.ts';

// ── Change this to rename your widget everywhere ──
const WIDGET_NAME = 'EnnovoCompostWidget';

const mfConfig = {
    name: WIDGET_NAME,
    remotes: {
        customer_site: 'customer_site@[window.dooverAdminSite_remoteUrl]',
    },
    exposes: {
        [`./${WIDGET_NAME}`]: `./src/${WIDGET_NAME}`,
    },
    shared: {
        react: {singleton: true, requiredVersion: '^18.3.1', eager: true},
        'react-dom': {singleton: true, requiredVersion: '^18.3.1', eager: true},
        'react-router': {singleton: true, requiredVersion: '^7.7.0', eager: true},
        'customer_site/hooks': {singleton: true, requiredVersion: false},
        'customer_site/RemoteAccess': {singleton: true, requiredVersion: false},
        'customer_site/queryClient': {singleton: true, requiredVersion: false},
        '@refinedev/core': {singleton: true, eager: true, requiredVersion: false},
        '@tanstack/react-query': {singleton: true, eager: true, requiredVersion: false},
    },
};

export default defineConfig({
    tools: {
        rspack: {
            plugins: [
                new ConcatenatePlugin({
                    source: './dist',
                    destination: '../assets',
                    name: `${WIDGET_NAME}.js`,
                    ignore: ['main.js'],
                }),
            ],
        },
    },
    output: {
        injectStyles: true,
    },
    plugins: [
        pluginReact(),
        pluginModuleFederation(mfConfig),
    ],
    performance: {
        chunkSplit: {
            strategy: 'all-in-one',
        },
    },
});
