var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

const authRouter = require('./auth');
router.use("/auth", authRouter);

const homeworkRouter = require('./homework');
router.use("/homework", homeworkRouter);

module.exports = router;
