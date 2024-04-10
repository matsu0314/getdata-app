import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const zipFiles = (dateNowString: string) => {
    return new Promise((resolve, reject) => {

        // 出力先のzipファイル名
        var zip_file_name = "thumbnail.zip";

        // ストリームを生成して、archiverと紐付ける
        var archive = archiver.create('zip', {});
        var output =  fs.createWriteStream(path.join(__dirname, "../", 'static', `/result/${dateNowString}/` + zip_file_name));

        archive.pipe(output);


        // 圧縮対象のファイル及びフォルダ
        archive.glob("**/*.jpg", { cwd: path.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.jpeg", { cwd: path.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.png", { cwd: path.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.gif", { cwd: path.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });
        archive.glob("**/*.weps", { cwd: path.join(__dirname, "../", 'static', `/result/${dateNowString}/`) });

        // zip圧縮実行
        archive.finalize();

        // finalize() の完了を待つため、finalize() のコールバック内で resolve() を呼び出す
        archive.on('finish', () => {
            var archive_size = archive.pointer();
            console.log(`complete! total size : ${archive_size} bytes`);
            resolve(archive_size);
        });

        // エラーハンドリング
        archive.on('error', (err) => {
            reject(err);
        });

    })
}

export default zipFiles;