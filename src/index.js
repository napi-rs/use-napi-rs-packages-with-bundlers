import { hash } from '@node-rs/argon2'

async function main() {
  const hashed = await hash('password', {
    timeCost: 3
  })
  console.info(hashed)
}

main().catch((err) => {
  console.error(err)
})
