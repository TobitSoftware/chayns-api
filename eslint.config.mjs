import config from '@chayns-toolkit/eslint-config';

import hooksPlugin from 'eslint-plugin-react-hooks';

// Enable rules for react-compiler which are not enabled by default
const rule = config.find(rule => rule.plugins?.['react-hooks']);
Object.assign(rule.rules, hooksPlugin.configs['recommended-latest'][0].rules);

export default config;
