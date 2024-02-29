const fs = require('fs');

const deleteDirectoryWithAllContents = async (path) => {
  // ファイルの存在チェック
  if (fs.existsSync(path)) {
    // ファイル（ディレクトリ）を再帰的に削除する
    await fs.rm(path, { recursive: true }, () => {
      console.log("削除が完了しました");
    });
  }
};

module.exports = deleteDirectoryWithAllContents;
