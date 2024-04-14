import fs from "fs";
import iconv from "iconv-lite";
import csv from "csv";
// const read_csv_shiftjis = require('./readCsvShiftjis');

type ResultItem = {
  slug: string;
  postTitle: string;
  postId: string;
  thumbName: string;
  url: string;
  isError: boolean;
}

const write_csv_shiftjis = (path:string, data:string[][]) => {
  return new Promise<void>(async (resolve, reject) => {
    const data_to_csv = (array:string[][]) => {
      return new Promise<string>((resolve, reject) => {
        csv.stringify(array, (err, output) => {
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
      fs.writeFile(
        path,
        iconv.encode(_csv_data, "shift_jis"),
        { flag: "w" },
        (err) => {
          if (err) {
            console.log("エラーが発生しました。" + err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

const csvWrite = async (csvPath:string, resultObjAry:ResultItem[] ) => {
  const resultAry = [["スラッグ", "タイトル", "記事ID", "サムネイル", "URL"]];

  await Promise.all(
    resultObjAry.map(async (resultObj) => {
      const { slug, postTitle, postId, thumbName, url, isError } = resultObj;
      if(!isError) {
        resultAry.push([slug, postTitle, postId, thumbName, url]);
      }
    })
  );

  await write_csv_shiftjis(csvPath, resultAry);
};

export default csvWrite;
