import { cli } from 'gunshi'
import pkg from './package.json'

const command = {
  name: 'hello',
  description: 'A Hello, world! command',
  run: () => {
    console.log('Hello, world!')
  },
}

await cli(process.argv.slice(2), command, {
  name: pkg.name,
  version: pkg.version,
})
