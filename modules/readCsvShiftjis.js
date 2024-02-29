const fs = require('fs');
const csv = require('csv');
const iconv = require('iconv-lite');

const read_csv_shiftjis = path => {
    return new Promise(resolve => {
        fs.createReadStream(path)
            .pipe(iconv.decodeStream('Shift_JIS'))
            .pipe(
                csv.parse((err, data) => {
                    resolve(data);
                })
            );
    });
};

module.exports = read_csv_shiftjis;