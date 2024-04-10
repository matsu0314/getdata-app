import { Router } from "express";
import getItems from "../modules/getItems";

const router = Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.post("/", (req, res) => {
  const inputItemcodes = req.body.inputItemcodes;

  // 検索結果取得
  getItems(inputItemcodes, res);
});

router.get("/result", (req, res) => {
  res.render("result");
});

export default router;
