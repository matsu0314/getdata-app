process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const path = require("path");
const fs = require("fs");
const client = require("cheerio-httpcli");
const zipFiles = require("./zipFiles");
const csvWrite = require("./csv_shifJis");
const deleteDirectoryWithAllContents = require("./deleteDirectory");
const sleep = require("./sleep");

module.exports = async (inputItemcodes, res) => {
  // 現在時刻（タイムタンプ）を取得
  const dateNowString = Date.now();
  // 24時間のミリ秒数
  const millisecondsIn24Hours = 86400000;
  // 全てのアイテム出力結果を格納（初期値）
  let resultItemAry = [];
  // １アイテム出力結果を格納（初期値）
  let resultObj = {};
  // カウント用変数
  let imgCount = 0;
  let errorCount = 0;

  // キャッシュクリア
  console.log("キャッシュクリア");
  delete require.cache[require.resolve("./zipFiles")];
  delete require.cache[require.resolve("./csv_shifJis")];
  client.download.clearCache();

  // 過去24時間前のダウンロードファイル削除
  console.log("過去24時間前のダウンロードファイル削除");
  fs.readdir(path.join(__dirname, "../static/result/"), (e, files) => {
    console.log("resultディレクトに残っているファイル", files);
    files.map((fileName) => {
      if (Number(dateNowString) - millisecondsIn24Hours > fileName) {
        const filePath = path.join(__dirname, "../static/result/", fileName);
        deleteDirectoryWithAllContents(filePath)
      }
    })
  });

  // スクレイピングするアイテム
  const itemURLAll = await inputItemcodes.trim().replace(/,$/g, "").split(",");
  const itemLength = itemURLAll.length;
  const baseURL = "https://m-kenomemo.com/";

  // タイムスタンプのディレクトリを作成
  await fs.promises.mkdir(
    path.join(__dirname, "../", "static", `/result/${dateNowString}/goods/S`),
    { recursive: true },
  );
  console.log("ディレクトリが作成されました");

  // 雛形CSVをコピーする
  await fs.promises.copyFile(
    path.join(__dirname, "../", `goods_img.csv`),
    path.join(__dirname, "../", `static`, `/result/${dateNowString}/goods_img.csv`),
  );
  console.log("ファイルをコピーしました");

  // CSVのディレクトリパス
  const csvPath = path.join(
    __dirname,
    "../",
    `static`,
    `/result/${dateNowString}/goods_img.csv`
  );

  const getInfoData = async () => {
    await Promise.all(
      itemURLAll.map(async (itemURL) => {
        // 初期化
        resultObj = {};
        let resutItem = {
          ATT_GRP_ID: "",
          itemName: "",
          itemCode: "",
          fileName: "",
          url: "",
          isError: false,
        };

        const result = await client.fetch(`${baseURL}${itemURL}/`);
        const { $ } = result;

        try {
          const pageTitle = $("title").text();
          const targetThumb = $(".eye-catch img");

          resutItem.ATT_GRP_ID = itemURL;
          resutItem.url = `${baseURL}${itemURL}/`;

          // サムネイルをダウンロードマネージャーに登録
          targetThumb.first().download();

          try {
            // サムネイル画像が見つからない場合
            if (targetThumb.first().length === 0) {
              resutItem.itemName = "Error!";
              resutItem.itemCode = "Error!";
              resutItem.fileName = "Error!";
              throw new Error(
                "ページが存在しない、もしくはサムネイル画像の掲載がないページです。"
              );
            }

            const pathList = targetThumb
              .first()
              .attr("src")
              .split("/");
            const itemName = pageTitle.trim().split("|")[0];
            const itemCode = $('[id^="post-"]').first().attr("id").replace("post-", "");
            const fileName = pathList[pathList.length - 1];

            console.log(itemCode);

            // 商品情報取得
            resutItem.itemName = itemName;
            resutItem.itemCode = itemCode;
            resutItem.fileName = fileName;

            // 取得情報をオブジェクトに格納
            resultObj = { itemCode, fileName };
            // 取得情報を配列に追加
            resultItemAry.push(resutItem);

          } catch (err) {
            console.log(err, "HTMLパースできませんでした。");
            resutItem.isError = true;
            resultItemAry.push(resutItem);
          }

        } catch (err) {
          console.log(err, "fetchに失敗しました。");
          resutItem.ATT_GRP_ID = itemURL;
          resutItem.itemName = "Error!";
          resutItem.itemCode = "Error!";
          resutItem.fileName = "Error!";
          resutItem.url = `${baseURL}/${itemURL}/`;
          resutItem.isError = true;
          resultItemAry.push(resutItem);
        };

        if (resutItem.isError) {
          errorCount++;
          console.log(errorCount, "エラー件数")
        }

        await sleep(1000);

      })
    );

    console.log("finish", client.download.state);
    console.log("すべてのアイテム取得完了")

    // CSVファイルに書き込み
    await Promise.all(resultItemAry.map(async (resultObj) => {
      await csvWrite(csvPath, resultObj);
    }));

    // 結果ページに遷移
    res.render("result", { resultItemAry, dateNowString, itemLength, imgCount, errorCount });
  };

  let exec = async () => {
    await getInfoData();
    // アイテムが取得できない場合、エラーページへ
    if (resultItemAry.length === 0) {
      res.render("result", { resultItemAry, dateNowString, itemLength, imgCount, errorCount });
    }
  };

  // データ取得を開始
  (async () => {
    await exec();
  })();


  // ダウンロードマネージャー
  client.download
    .on("ready", async function (stream) {
      // URL取得をpromiseで待つ
      let pathPromiseList = new Promise((resolve) => {
        resolve(stream.url.href.split("/"));
      })
      // 取得したURLの最後のディレクトリを取得
      let pathList = await pathPromiseList;
      let fileName = await pathList[pathList.length - 1].replace(/\?.*/, "");

      console.log("ready", this.state)

      // 保存先ファイルのストリーム作成
      let write = fs.createWriteStream(
        path.join(
          __dirname,
          "../",
          "static",
          `/result/${dateNowString}/goods/S/${fileName}`
        )
      );
      write
        .on("finish", function () {
          console.log(stream.url.href + "をダウンロードしました");

          imgCount++;
        })
        .on("error", console.error);
      // ダウンロードストリームからデータを読み込んでファイルストリームに書き込む
      stream
        .on("data", function (chunk) {
          write.write(chunk);
        })
        .on("end", function () {
          write.end();
        });
    })
    .on("error", function (err) {
      console.error(err.url + "をダウンロードできませんでした: " + err.message);
    })
    .on("end", async function () {
      console.log("ダウンロードが完了しました");
      // すべての画像のダウンロードが完了したらzip処理を実行する
      await zipFiles(dateNowString);
    })

  // ④並列ダウンロード制限の設定
  client.download.parallel = 4;
};
