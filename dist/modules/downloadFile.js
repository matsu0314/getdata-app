"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const downloadFile = async function download(url, dest) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    await fs_1.default.promises.writeFile(dest, Buffer.from(buffer));
};
// const main = async () => {
//   const url = 'https://blog.koh.dev/ogimg/2023-07-03-monorepo.png'
//   const dest = path.resolve(import.meta.dirname, 'image.png')
//   await download(url, dest) 
// }
// main().catch(console.error)
exports.default = downloadFile;
//# sourceMappingURL=downloadFile.js.map