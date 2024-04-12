import archiver from "archiver";
import fs from "fs";
import path from "path";

const zipFiles = (dateNowString: string) => {
  return new Promise((resolve, reject) => {
    var zip_file_name = "thumbnail.zip";
    var targetDir = path.join(
      __dirname,
      `../../static/result/${dateNowString}/`
    );

    var archive = archiver.create("zip", {
      zlib: { level: 9 },
    });
    var output = fs.createWriteStream(path.join(targetDir, zip_file_name));

    output.on("error", (err) => {
      reject(err);
    });

    output.on("close", () => {
      var archive_size = archive.pointer();
      console.log(`complete! total size : ${archive_size} bytes`);
      resolve(archive_size);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.glob("**", { cwd: path.join(targetDir, "posts/") });
    archive.pipe(output);
    archive.finalize();
  });
};

export default zipFiles;
