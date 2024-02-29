const express = require('express');
const router = express.Router();

const getItems = require('../modules/getItems');

router.get('/', (req, res) => {
  res.render('index');
});

router.post('/', (req, res) => {

  const inputItemcodes = req.body.inputItemcodes;

  // 検索結果取得
  getItems(inputItemcodes, res);
});

router.get('/result', (req, res) => {
  res.render('result')
})

module.exports = router;