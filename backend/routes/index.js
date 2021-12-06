var express = require('express');
var router = express.Router();


//import des modeles
var userModel = require('../modules/users');
var messageModel = require('../modules/messages');
var missionModel = require( '../modules/missions');
var deliveryModel = require( '../modules/deliveries');


/* GET home page. */
router.get('/', async function(req, res, next) {

  var user = await deliveryModel.findById('61ade704aa1d49805ebbd627').populate('expeditor_id').exec();
  
  console.log(user.expeditor_id)

  res.render('index', { title: 'Express' });
});


module.exports = router;
