process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const path = require("path");
const fs = require("fs");
const client = require("cheerio-httpcli");
const zipFiles = require("./zipFiles");
const downloadFile = require("./downloadFile");
const csvWrite = require("./csv_shiftJis");
const deleteDirectoryWithAllContents = require("./deleteDirectory");
const sleep = require("./sleep");

module.exports = async (inputpostIds, res) => {
  // 現在時刻（タイムタンプ）を取得
  const dateNowString = Date.now();
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
  fs.readdir(path.join(__dirname, "../static/result/"), (e, files) => {
    console.log("resultディレクトに残っているファイル", files);
    files.map((thumbName) => {
      if (Number(dateNowString) - millisecondsIn24Hours > thumbName) {
        const filePath = path.join(__dirname, "../static/result/", thumbName);
        deleteDirectoryWithAllContents(filePath);
      }
    });
  });

  // スクレイピングするアイテム
  const itemURLAll = await inputpostIds.trim().replace(/,$/g, "").split(",");
  const itemLength = itemURLAll.length;
  const baseURL = "https://m-kenomemo.com/";

  // タイムスタンプのディレクトリを作成
  await fs.promises.mkdir(
    path.join(__dirname, "../", "static", `/result/${dateNowString}/posts/`),
    { recursive: true },
  );
  console.log("ディレクトリが作成されました");

  // 雛形CSVをコピーする
  await fs.promises.copyFile(
    path.join(__dirname, "../", `posts_info.csv`),
    path.join(__dirname, "../", `static`, `/result/${dateNowString}/posts_info.csv`),
  );
  console.log("ファイルをコピーしました");

  // CSVのディレクトリパス
  const csvPath = path.join(
    __dirname,
    "../",
    `static`,
    `/result/${dateNowString}/posts_info.csv`
  );

  // サムネイルをダウンロード
  const getThumbnail = async (url, dirName) => {
    let pathList = url.split("/");
    let thumbName = pathList[pathList.length - 1].replace(/\?.*/, "");
    const dest = path.join(
      __dirname,
      "../",
      "static",
      `/result/${dirName}/posts/${thumbName}`
    )
    await downloadFile(url, dest)
  }
  getThumbnail().catch((err) => {
    console.log(err, "サムネイルの取得に失敗しました。");
    return "Error!";
  }) 

  const getInfoData = async () => {
    await Promise.all(
      itemURLAll.map(async (itemURL) => {
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
          const result = await client.fetch(`${baseURL}${itemURL}/`);
          const { $ } = result;

          const pageTitle = $("title").text();
          const targetThumb = $(".eye-catch img");

          resultItem.slug = itemURL;
          resultItem.url = `${baseURL}${itemURL}/`;

          try {
            // サムネイル画像がある場合
            if (targetThumb.first().length > 0) {
              resultItem.thumbName = await getThumbnail(targetThumb.attr("src"), dateNowString)
            } else {
              resultItem.thumbName = "Error!";
            }

            const pathList = targetThumb.first().attr("src").split("/");
            const postTitle = pageTitle.trim().split("|")[0];
            const postId = $('[id^="post-"]')
              .first()
              .attr("id")
              .replace("post-", "");
            const thumbName = pathList[pathList.length - 1];

            // 商品情報取得
            resultItem.postTitle = postTitle;
            resultItem.postId = postId;
            resultItem.thumbName = thumbName;

            // 取得情報を配列に追加
            resultItemAry.push(resultItem);
          } catch (err) {
            console.log(err, "データの取得に失敗しました。");
            for (let key in resultItem) {
              if (resultItem.hasOwnProperty(key) && resultItem[key] === "") {
                resultItem[key] = "Error!";
              }
            }
            resultItem.isError = true;
            resultItemAry.push(resultItem);
          }
        } catch (err) {
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
      })
    );

    console.log("すべてのアイテム取得完了");

    // CSVファイルに書き込み
    await csvWrite(csvPath, resultItemAry);
    // すべての画像のダウンロードが完了したらzip処理を実行する
    await zipFiles(dateNowString);
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
    } else {
      // アイテムが取得できない場合、エラーページへ
      res.render("errorpage", {
        message: "取得できるデータが１件もありませんでした。",
      });
    }
  };

  // データ取得を開始
  await exec();
};
