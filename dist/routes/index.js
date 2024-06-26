"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const getItems_1 = __importDefault(require("../modules/getItems"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.render("index");
});
router.post("/", (req, res) => {
    const inputItemcodes = req.body.inputItemcodes;
    // 検索結果取得
    (0, getItems_1.default)(inputItemcodes, res);
});
router.get("/result", (req, res) => {
    res.render("result");
});
exports.default = router;
//# sourceMappingURL=index.js.map