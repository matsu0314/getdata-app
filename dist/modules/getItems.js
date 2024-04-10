"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cheerio_httpcli_1 = __importDefault(require("cheerio-httpcli"));
const zipFiles_1 = __importDefault(require("./zipFiles"));
const downloadFile_1 = __importDefault(require("./downloadFile"));
const csv_shiftJis_1 = __importDefault(require("./csv_shiftJis"));
const deleteDirectory_1 = __importDefault(require("./deleteDirectory"));
const getItems = async (inputpostIds, res) => {
    // 現在時刻（タイムタンプ）を取得
    const dateNowString = String(Date.now());
    // 24時間のミリ秒数
    const millisecondsIn24Hours = 86400000;
    // 全てのアイテム出力結果を格納（初期値）
    let resultItemAry = [];
    // カウント用変数
    let errorCount = 0;
    // キャッシュクリア
    console.log("キャッシュクリア");
    delete require.cache[require.resolve("./zipFiles")];
    delete require.cache[require.resolve("./csv_shiftJis")];
    // 過去24時間前のダウンロードファイル削除
    console.log("過去24時間前のダウンロードファイル削除");
    fs_1.default.readdir(path_1.default.join(__dirname, "../static/result/"), (e, files) => {
        console.log("resultディレクトに残っているファイル", files);
        files.map((thumbName) => {
            if (Number(dateNowString) - millisecondsIn24Hours > Number(thumbName)) {
                const filePath = path_1.default.join(__dirname, "../static/result/", thumbName);
                (0, deleteDirectory_1.default)(filePath);
            }
        });
    });
    // スクレイピングするアイテム
    const itemURLAll = inputpostIds.trim().replace(/,$/g, "").split(",");
    const itemLength = itemURLAll.length;
    const baseURL = "https://m-kenomemo.com/";
    // タイムスタンプのディレクトリを作成
    await fs_1.default.promises.mkdir(path_1.default.join(__dirname, "../", "static", `/result/${dateNowString}/posts/`), { recursive: true });
    console.log("ディレクトリが作成されました");
    // 雛形CSVをコピーする
    await fs_1.default.promises.copyFile(path_1.default.join(__dirname, "../", `posts_info.csv`), path_1.default.join(__dirname, "../", `static`, `/result/${dateNowString}/posts_info.csv`));
    console.log("ファイルをコピーしました");
    // CSVのディレクトリパス
    const csvPath = path_1.default.join(__dirname, "../", `static`, `/result/${dateNowString}/posts_info.csv`);
    // サムネイルをダウンロード
    const getThumbnail = async (url, dirName) => {
        try {
            let pathList = url.split("/");
            let thumbName = pathList[pathList.length - 1].replace(/\?.*/, "");
            const dest = path_1.default.join(__dirname, "../", "static", `/result/${dirName}/posts/${thumbName}`);
            (0, downloadFile_1.default)(url, dest);
        }
        catch (err) {
            console.log(err, "サムネイルの取得に失敗しました。");
            return "Error!";
        }
    };
    const getInfoData = async () => {
        await Promise.all(itemURLAll.map(async (itemURL) => {
            var _a, _b, _c;
            // 初期化
            let resultItem = {
                slug: "",
                postTitle: "",
                postId: "",
                thumbName: "",
                url: "",
                isError: false,
            };
            try {
                const result = await cheerio_httpcli_1.default.fetch(`${baseURL}${itemURL}/`);
                const { $ } = result;
                const pageTitle = $("title").text();
                const targetThumb = $(".eye-catch img");
                let pathList = [];
                let postTitle = "";
                let postId = "";
                let thumbName = "";
                resultItem.slug = itemURL;
                resultItem.url = `${baseURL}${itemURL}/`;
                try {
                    // サムネイル情報取得
                    if (targetThumb.first().length > 0) {
                        resultItem.thumbName = (_a = targetThumb.attr("src")) !== null && _a !== void 0 ? _a : "";
                        pathList = resultItem.thumbName.split("/");
                        thumbName = pathList[pathList.length - 1];
                        await getThumbnail(resultItem.thumbName, dateNowString);
                    }
                    else {
                        resultItem.thumbName = "Error!";
                    }
                    // タイトル取得
                    postTitle = pageTitle.trim().split("|")[0];
                    // 記事ID取得
                    const postElement = $('[id^="post-"]').first();
                    if (postElement && postElement.length > 0) {
                        postId = (_c = (_b = postElement.attr("id")) === null || _b === void 0 ? void 0 : _b.replace("post-", "")) !== null && _c !== void 0 ? _c : "";
                    }
                    // 商品情報をオブジェクトに格納
                    resultItem.postTitle = postTitle;
                    resultItem.postId = postId;
                    resultItem.thumbName = thumbName;
                    // 取得情報を配列に追加
                    resultItemAry.push(resultItem);
                }
                catch (err) {
                    console.log(err, "データの取得に失敗しました。");
                    for (let key in resultItem) {
                        if (resultItem.hasOwnProperty(key) && resultItem[key] === "") {
                            resultItem[key] = "Error!";
                        }
                    }
                    resultItem.isError = true;
                    resultItemAry.push(resultItem);
                }
            }
            catch (err) {
                console.log(err, "fetchに失敗しました。");
                resultItem.slug = itemURL;
                resultItem.url = `${baseURL}${itemURL}/`;
                for (let key in resultItem) {
                    if (resultItem.hasOwnProperty(key) && resultItem[key] === "") {
                        resultItem[key] = "Error!";
                    }
                }
                resultItem.isError = true;
                resultItemAry.push(resultItem);
            }
            if (resultItem.isError) {
                errorCount++;
                console.log(errorCount, "エラー件数");
            }
            // await sleep(1000);
        }));
        console.log("すべてのアイテム取得完了");
        // CSVファイルに書き込み
        await (0, csv_shiftJis_1.default)(csvPath, resultItemAry);
        // すべての画像のダウンロードが完了したらzip処理を実行する
        await (0, zipFiles_1.default)(dateNowString);
    };
    let exec = async () => {
        await getInfoData();
        if (resultItemAry.length > 0) {
            // 結果ページに遷移
            res.render("result", {
                resultItemAry,
                dateNowString,
                itemLength,
                errorCount,
            });
        }
        else {
            // アイテムが取得できない場合、エラーページへ
            res.render("errorpage", {
                message: "取得できるデータが１件もありませんでした。",
            });
        }
    };
    // データ取得を開始
    await exec();
};
exports.default = getItems;
