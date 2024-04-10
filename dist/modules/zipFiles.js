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
        // 出力先のzipファイル名
        var zip_file_name = "thumbnail.zip";
        // ストリームを生成して、archiverと紐付ける
        var archive = archiver_1.default.create('zip', {});
        var output = fs_1.default.createWriteStream(path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/` + zip_file_name));
        archive.pipe(output);
        // 圧縮対象のファイル及びフォルダ
        archive.glob("**/*.jpg", { cwd: path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.jpeg", { cwd: path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.png", { cwd: path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.gif", { cwd: path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.weps", { cwd: path_1.default.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        // zip圧縮実行
        archive.finalize();
        // finalize() の完了を待つため、finalize() のコールバック内で resolve() を呼び出す
        archive.on('finish', () => {
            var archive_size = archive.pointer();
            console.log(`complete! total size : ${archive_size} bytes`);
            resolve(archive_size);
        });
        // エラーハンドリング
        archive.on('error', (err) => {
            reject(err);
        });
    });
};
exports.default = zipFiles;
