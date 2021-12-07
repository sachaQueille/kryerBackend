var express = require('express');
var router = express.Router();

//format date
function formatDate (date){
  return ('0'+date.getDate()).slice(-2)+'/'+ ('0'+parseInt(date.getMonth()+1)).slice(-2)+'/'+date.getFullYear();
};

//import des modeles
var userModel = require('../modules/users');
var messageModel = require('../modules/messages');
var missionModel = require( '../modules/missions');
var deliveryModel = require( '../modules/deliveries');


/* GET home page. */
router.get('/', async function(req, res, next) {

  res.render('index', { title: 'Express' });
});

router.post('/searchKryer', async function(req,res,next){

  var missionList = await missionModel.find({departure_journey:req.body.departure,arrival_journey:req.body.arrival});
  console.log(missionList);
  //missionList = missionList.filter(e => e.date_journey >= req.body.date);
  
  var result = false;
  if(missionList){
    result = missionList;
  }

  res.json(result)
})


module.exports = router;
