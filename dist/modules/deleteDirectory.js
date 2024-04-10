"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const deleteDirectoryWithAllContents = async (path) => {
    // ファイルの存在チェック
    if (fs_1.default.existsSync(path)) {
        // ファイル（ディレクトリ）を再帰的に削除する
        await fs_1.default.rm(path, { recursive: true }, () => {
            console.log("削除が完了しました");
        });
    }
};
exports.default = deleteDirectoryWithAllContents;
