import fs from 'fs';

const deleteDirectoryWithAllContents = async (path:string) => {
  // ファイルの存在チェック
  if (fs.existsSync(path)) {
    // ファイル（ディレクトリ）を再帰的に削除する
    await fs.rm(path, { recursive: true }, () => {
      console.log("削除が完了しました");
    });
  }
};

export default deleteDirectoryWithAllContents;
