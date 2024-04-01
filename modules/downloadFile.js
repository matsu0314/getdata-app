const fs = require("fs");

const downloadFile = async function download(url, dest) {
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  await fs.promises.writeFile(dest, Buffer.from(buffer))
}

// const main = async () => {
//   const url = 'https://blog.koh.dev/ogimg/2023-07-03-monorepo.png'
//   const dest = path.resolve(import.meta.dirname, 'image.png')
  
//   await download(url, dest) 
// }

// main().catch(console.error)

module.exports = downloadFile;