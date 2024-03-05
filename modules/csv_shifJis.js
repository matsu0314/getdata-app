const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv');
const read_csv_shiftjis = require('./readCsvShiftjis');

  const write_csv_shiftjis = (path, data) => {
    return new Promise(async (resolve, reject) => {
      const data_to_csv = array => {
        return new Promise((resolve, reject) => {
          csv.stringify(array, (err, output) => {
            if (err) {
              console.log('エラーが発生しました。' + err);
              resutItem.errMessage.push("CSVの書き込みでエラーが発生しました。");
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
        fs.writeFile(path, iconv.encode(_csv_data, 'shift_jis'), {flag: "w"},  err => {
          if (err) {
            console.log('エラーが発生しました。' + err);
            resutItem.errMessage.push(err);
            reject(err);
            return;
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const csvWrite = async (csvPath, resultObjAry) => {
    const resultAry = [
      ['商品コード', 'Ｓ画像ファイル', 'Ｓ画像説明', 'Ｌ画像ファイル', 'Ｌ画像説明', 'Ｃ画像ファイル', 'Ｃ画像説明', '１画像ファイル', '１画像説明', '２画像ファイル', '２画像説明', '３画像ファイル', '３画像説明', '４画像ファイル', '４画像説明', '５画像ファイル', '５画像説明', '６画像ファイル', '６画像説明', '７画像ファイル', '７画像説明', '８画像ファイル', '８画像説明', '９画像ファイル', '９画像説明', 'D1画像ファイル', 'D1画像説明', 'D2画像ファイル', 'D2画像説明', 'D3画像ファイル', 'D3画像説明', 'D4画像ファイル', 'D4画像説明', 'D5画像ファイル', 'D5画像説明', 'D6画像ファイル', 'D6画像説明', 'D7画像ファイル', 'D7画像説明', 'D8画像ファイル', 'D8画像説明', 'D9画像ファイル', 'D9画像説明', 'D10画像ファイル', 'D10画像説明'],
    ];

    // CSVをパースする
    // const _csv = await read_csv_shiftjis(csvPath);

    await Promise.all(resultObjAry.map(async (resultObj) => {
      const { itemCode, fileName } = resultObj;

      resultAry.push([itemCode, fileName, '', '', '', fileName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', fileName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    }));

    await write_csv_shiftjis(csvPath, resultAry);
 
  };

  module.exports = csvWrite;
