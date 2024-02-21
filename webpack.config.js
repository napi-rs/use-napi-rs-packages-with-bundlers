import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = join(fileURLToPath(import.meta.url), '..')

/**
 * @returns {import('webpack').Configuration}
 */
export default () => ({
  entry: './src/index.js',
  target: 'node',
  output: {
    filename: 'bundled.cjs',
    path: join(__dirname, 'dist'),
    chunkFormat: 'commonjs'
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  stats: 'errors-only',
})
