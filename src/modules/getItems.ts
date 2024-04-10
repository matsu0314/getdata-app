process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import client from "cheerio-httpcli";
import zipFiles from "./zipFiles";
import downloadFile from "./downloadFile";
import csvWrite from "./csv_shiftJis";
import deleteDirectoryWithAllContents from "./deleteDirectory";
import sleep from "./sleep";

type ResultItem = {
  slug: string;
  postTitle: string;
  postId: string;
  thumbName: string;
  url: string;
  isError: boolean;
};

const getItems = async (inputpostIds: string, res: Response) => {
  // 現在時刻（タイムタンプ）を取得
  const dateNowString = String(Date.now());
  // 24時間のミリ秒数
  const millisecondsIn24Hours = 86400000;
  // 全てのアイテム出力結果を格納（初期値）
  let resultItemAry: ResultItem[] = [];
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
      if (Number(dateNowString) - millisecondsIn24Hours > Number(thumbName)) {
        const filePath = path.join(__dirname, "../static/result/", thumbName);
        deleteDirectoryWithAllContents(filePath);
      }
    });
  });

  // スクレイピングするアイテム
  const itemURLAll = inputpostIds.trim().replace(/,$/g, "").split(",");
  const itemLength = itemURLAll.length;
  const baseURL = "https://m-kenomemo.com/";

  // タイムスタンプのディレクトリを作成
  await fs.promises.mkdir(
    path.join(__dirname, "../", "static", `/result/${dateNowString}/posts/`),
    { recursive: true }
  );
  console.log("ディレクトリが作成されました");

  // 雛形CSVをコピーする
  await fs.promises.copyFile(
    path.join(__dirname, "../", `posts_info.csv`),
    path.join(
      __dirname,
      "../",
      `static`,
      `/result/${dateNowString}/posts_info.csv`
    )
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
  const getThumbnail = async (url: string, dirName: string) => {
    try {
      let pathList = url.split("/");
      let thumbName = pathList[pathList.length - 1].replace(/\?.*/, "");
      const dest = path.join(
        __dirname,
        "../",
        "static",
        `/result/${dirName}/posts/${thumbName}`
      );
      downloadFile(url, dest);
    } catch (err: any) {
      console.log(err, "サムネイルの取得に失敗しました。");
      return "Error!";
    }
  };

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
          let pathList = [];
          let postTitle = "";
          let postId = "";
          let thumbName = "";

          resultItem.slug = itemURL;
          resultItem.url = `${baseURL}${itemURL}/`;

          try {
            // サムネイル情報取得
            if (targetThumb.first().length > 0) {
              resultItem.thumbName = targetThumb.attr("src") ?? "";
              pathList = resultItem.thumbName.split("/");
              thumbName = pathList[pathList.length - 1];

              await getThumbnail(resultItem.thumbName, dateNowString);
            } else {
              resultItem.thumbName = "Error!";
            }
            // タイトル取得
            postTitle = pageTitle.trim().split("|")[0];
            // 記事ID取得
            const postElement = $('[id^="post-"]').first();
            if (postElement && postElement.length > 0) {
              postId = postElement.attr("id")?.replace("post-", "") ?? "";
            }

            // 商品情報をオブジェクトに格納
            resultItem.postTitle = postTitle;
            resultItem.postId = postId;
            resultItem.thumbName = thumbName;

            // 取得情報を配列に追加
            resultItemAry.push(resultItem);
          } catch (err) {
            console.log(err, "データの取得に失敗しました。");
            for (let key in resultItem) {
              if (resultItem.hasOwnProperty(key) && resultItem[key] === "") {
                resultItem[objKey] = "Error!";
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

export default getItems;
