"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use(express_1.default.static("public"));
app.use(express_1.default.static("node_modules"));
app.use((0, morgan_1.default)('combined'));
// フォームの値を解析する
app.use(body_parser_1.default.urlencoded({ extended: false }));
// 静的フォルダを設定する
app.use('/static', express_1.default.static(path_1.default.join(__dirname, 'static')));
// ejsテンプレートエンジンを設定
app.set('view engine', 'ejs');
// viewsディレクトリの名称変更
app.set('views', path_1.default.join(__dirname, 'templates'));
app.use(routes_1.default);
app.get('*', (req, res) => {
    res.render('errorpage', { message: 'ページが存在しません。' });
});
// Connecting to port
const port = process.env.PORT || 8000;
// Connecting to port
app.listen(port, () => {
    console.log('server running');
});
