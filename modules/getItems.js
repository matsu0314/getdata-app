process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const path = require("path");
const fs = require("fs");
const client = require("cheerio-httpcli");
const zipFiles = require("./zipFiles");
const csvWrite = require("./csv_shifJis");
const sleep = require("./sleep");

module.exports = async (inputItemcodes, res) => {
  // キャッシュクリア
  console.log("キャッシュクリア")
  delete require.cache[require.resolve("./zipFiles")];
  delete require.cache[require.resolve("./csv_shifJis")];
  client.download.clearCache();

  // 現在時刻（タイムタンプ）を取得
  const dateNowString = Date.now();
  // 出力結果を格納（初期値）
  let resultItemAry = [];
  // カウント用変数
  let imgCount = 0;
  let errorCount = 0;

  // スクレイピングするアイテム
  const itemURLAll = await inputItemcodes.trim().replace(/,$/g,"").split(",");
  const itemLength = itemURLAll.length;
  const baseURL = "https://m-kenomemo.com/";

  // タイムスタンプのディレクトリを作成
  fs.mkdirSync(
    path.join(__dirname, "../", "static", `/result/${dateNowString}/goods/S`),
    { recursive: true },
    (err) => {
      if (err) {
        throw err;
      }
      console.log("ディレクトリが作成されました");
    }
  );
  // 雛形CSVをコピーする
  fs.copyFile(
    path.join(__dirname, "../", `goods_img.csv`),
    path.join(__dirname, "../", `static`, `/result/${dateNowString}/goods_img.csv`),
    (err) => {
      if (err) throw err;
      console.log("ファイルをコピーしました");
    }
  );

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
        var resutItem = {
          ATT_GRP_ID: "",
          itemName: "",
          itemCode: "",
          fileName: "",
          url: "",
          isError: false,
        };

        await client
          .fetch(`${baseURL}${itemURL}/`)
          .then(async (result) => {
            const { $ } = result;
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
              const itemCode = $('[id^="post-"]').first().attr("id").replace("post-","");
              const fileName = pathList[pathList.length - 1];

              console.log(itemCode);

              // 商品情報取得
              resutItem.itemName = itemName;
              resutItem.itemCode = itemCode;
              resutItem.fileName = fileName;

              // CSVファイルに書き込み
              const resultObj = { itemCode, fileName };
              await csvWrite(csvPath, resultObj);

              // スクレイピング結果を追加
              resultItemAry.push(resutItem);

            } catch (err) {
              console.log(err, "HTMLパースできませんでした。");
              resutItem.isError = true;
              resultItemAry.push(resutItem);
            }
          })
          .catch(function (err) {
            console.log(err, "fetchに失敗しました。");
            resutItem.ATT_GRP_ID = itemURL;
            resutItem.itemName = "Error!";
            resutItem.itemCode = "Error!";
            resutItem.fileName = "Error!";
            resutItem.url = `${baseURL}/${itemURL}/`;
            resutItem.isError = true;
            resultItemAry.push(resutItem);
          });

        if (resutItem.isError) {
          errorCount++;
          console.log(errorCount, "エラー件数")
        }

        await sleep(1000);

      })
    );
    console.log("finish", client.download.state); 
    console.log("すべてのアイテム取得完了")

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

  exec();

  // ダウンロードマネージャー
  client.download
    .on("ready", function (stream) {
      let pathList = stream.url.href.split("/");
      let fileName = pathList[pathList.length - 1].replace(/\?.*/, "");

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
