"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zipFiles = (dateNowString) => {
    return new Promise((resolve, reject) => {
        var zip_file_name = "thumbnail.zip";
        var targetDir = path_1.default.join(__dirname, `../../static/result/${dateNowString}/`);
        var archive = archiver_1.default.create("zip", {
            zlib: { level: 9 },
        });
        var output = fs_1.default.createWriteStream(path_1.default.join(targetDir, zip_file_name));
        output.on("error", (err) => {
            reject(err);
        });
        output.on("close", () => {
            var archive_size = archive.pointer();
            console.log(`complete! total size : ${archive_size} bytes`);
            resolve(archive_size);
        });
        archive.on("error", (err) => {
            reject(err);
        });
        archive.glob("**", { cwd: path_1.default.join(targetDir, "posts/") });
        archive.pipe(output);
        archive.finalize();
    });
};
exports.default = zipFiles;
