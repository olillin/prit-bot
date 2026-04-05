import { defineConfig } from 'rolldown'
// import json from '@rollup/plugin-json'

export default defineConfig({
    input: 'out/main.js',
    platform: 'node',
    output: {
        dir: 'bundle',
        format: 'es',
    },
    // plugins: [json()],
})
