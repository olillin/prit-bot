import { defineConfig } from 'rolldown'
// import json from '@rollup/plugin-json'

export default defineConfig({
    input: 'out/main.js',
    output: {
        dir: 'bundle',
        format: 'cjs',
    },
    // plugins: [json()],
})
