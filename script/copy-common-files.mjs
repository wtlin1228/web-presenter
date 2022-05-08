#!/usr/bin/env zx

const DES = argv.directory;

await $`cp -R dist/build/js ${DES}`;
await $`cp -R src/html ${DES}`;
await $`cp -R src/css ${DES}`;
await $`cp -R src/img ${DES}`;
await $`cp -R src/web_accessible_resources ${DES}`;
