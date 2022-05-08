#!/usr/bin/env zx

await $`npm install`;
await $`npm run build`;

console.log('*** WebPresenter.chromium: Creating web store package');

const DES = 'dist/build/WebPresenter.chromium';

await $`rm -rf ${DES}`;
await $`mkdir -p ${DES}`;

console.log('*** WebPresenter.chromium: Copying common files...');

await $`npx zx script/copy-common-files.mjs --directory ${DES}`;

console.log('*** WebPresenter.chromium: Copying chromium-specific files...');

await $`cp platform/chromium/*.json ${DES}`;

console.log('*** WebPresenter.chromium: Package done');
