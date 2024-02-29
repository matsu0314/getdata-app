const path = require('path');
const morgan = require('morgan');
const express = require('express');
const bodyParser = require('body-parser');

const routers = require('./routes');

const app = express();

app.use(express.static("public"));
app.use(express.static("node_modules"));

app.use(morgan('combined'));
// フォームの値を解析する
app.use(bodyParser.urlencoded({ extended: false }));
// 静的フォルダを設定する
app.use('/static', express.static(path.join(__dirname, 'static')));

// ejsテンプレートエンジンを設定
app.set('view engine', 'ejs');
// viewsディレクトリの名称変更
app.set('views', path.join(__dirname, 'templates'));

app.use(routers);

app.get('*', (req, res) => {
  res.render('errorpage', { message: 'ページが存在しません。' });
});

// Connecting to port
const port = process.env.PORT || 8000;
// Connecting to port
app.listen(port, () => {
  console.log('server running');
});