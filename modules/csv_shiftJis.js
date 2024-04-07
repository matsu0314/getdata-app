const fs = require("fs");
const iconv = require("iconv-lite");
const csv = require("csv");
// const read_csv_shiftjis = require('./readCsvShiftjis');

const write_csv_shiftjis = (path, data) => {
  return new Promise(async (resolve, reject) => {
    const data_to_csv = (array) => {
      return new Promise((resolve, reject) => {
        csv.stringify(array, (err, output) => {
          if (err) {
            console.log("エラーが発生しました。" + err);
            resultItem.errMessage.push("CSVの書き込みでエラーが発生しました。");
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
            resultItem.errMessage.push(err);
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

const csvWrite = async (csvPath, resultObjAry) => {
  const resultAry = [["スラッグ", "タイトル", "記事ID", "サムネイル", "URL"]];

  await Promise.all(
    resultObjAry.map(async (resultObj) => {
      const { slug, postTitle, postId, thumbName, url } = resultObj;

      resultAry.push([slug, postTitle, postId, thumbName, url]);
    })
  );

  await write_csv_shiftjis(csvPath, resultAry);
};

module.exports = csvWrite;
