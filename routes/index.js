var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

const authRouter = require('./auth');
router.use("/auth", authRouter);

const userRouter = require('./user');
router.use("/user", userRouter);

module.exports = router;
