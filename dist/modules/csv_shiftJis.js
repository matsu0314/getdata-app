"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const csv_1 = __importDefault(require("csv"));
const write_csv_shiftjis = (path, data) => {
    return new Promise(async (resolve, reject) => {
        const data_to_csv = (array) => {
            return new Promise((resolve, reject) => {
                csv_1.default.stringify(array, (err, output) => {
                    if (err) {
                        console.log("エラーが発生しました。" + err);
                        reject(err);
                        return;
                    }
                    resolve(output);
                });
            });
        };
        try {
            const _csv_data = await data_to_csv(data);
            // CSVファイルにデータを追記
            fs_1.default.writeFile(path, iconv_lite_1.default.encode(_csv_data, "shift_jis"), { flag: "w" }, (err) => {
                if (err) {
                    console.log("エラーが発生しました。" + err);
                    reject(err);
                    return;
                }
                resolve();
            });
        }
        catch (err) {
            reject(err);
        }
    });
};
const csvWrite = async (csvPath, resultObjAry) => {
    const resultAry = [["スラッグ", "タイトル", "記事ID", "サムネイル", "URL"]];
    await Promise.all(resultObjAry.map(async (resultObj) => {
        const { slug, postTitle, postId, thumbName, url, isError } = resultObj;
        if (!isError) {
            resultAry.push([slug, postTitle, postId, thumbName, url]);
        }
    }));
    await write_csv_shiftjis(csvPath, resultAry);
};
exports.default = csvWrite;
//# sourceMappingURL=csv_shiftJis.js.map