var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var uid2 = require("uid2");
var uniqid = require("uniqid");
var request = require('sync-request');
var fs = require('fs')


var cloudinary = require('cloudinary').v2;


cloudinary.config({
 cloud_name: 'dcjze5qvx',
 api_key: '354945478671377',
 api_secret: 'Qx13Gn87zsegWOrV2PeJcWPSYew' 
});


//format date
function formatDate(date) {
  return (
    ("0" + date.getDate()).slice(-2) +
    "/" +
    ("0" + parseInt(date.getMonth() + 1)).slice(-2) +
    "/" +
    date.getFullYear()
  );
}

//import des modeles
var userModel = require("../modules/users");
var messageModel = require("../modules/messages");
var missionModel = require("../modules/missions");
var deliveryModel = require("../modules/deliveries");

/* GET home page. */
router.get("/", async function (req, res, next) {
  var user = await deliveryModel
    .findById("61ade704aa1d49805ebbd627")
    .populate("expeditor_id")
    .exec();

  res.render("index", { title: "Express" });
});

router.post("/saveMission", async function (req, res, next) {
  let newMission = new missionModel({
    date_delivery: req.body.deliveryDate,
    place_delivery: req.body.deliveryPlace,
    date_receipt: req.body.recuperationDate,
    place_receipt: req.body.recuperationPlace,
    pricePerKg: req.body.pricePerKg,
    departure_journey: req.body.departure,
    arrival_journey: req.body.arrival,
    transport_capacity_total: req.body.weight,
    transport_capacity_rest: req.body.weight,
    date_journey: req.body.dateJourney,
    newMissionStatus: true,
    currentMissionStatus: false,
    finishMissionStatus: false,
    avatarKryer: req.body.avatarKryer,
    firstNameKryer: req.body.firstNameKryer,
    lastNameKryer: req.body.lastNameKryer,
  });

  var missionSave = await newMission.save();

  var user = await userModel.findById(req.body.idKryer);
  user.missions.push(missionSave._id);

  await user.save();

  res.json({ result: true });
});

router.post("/searchKryer", async function (req, res, next) {
  var missionList = await missionModel.find({
    departure_journey: req.body.departure,
    arrival_journey: req.body.arrival,
  });

  //missionList = missionList.filter(e => e.date_journey >= req.body.date);

  //filtre sur le poid du colis
  missionList = missionList.filter(
    (e) => e.transport_capacity_rest >= req.body.weight
  );

  missionList = missionList.filter(e => e.newMissionStatus == true);

  missionList = missionList.filter(e => e.newMissionStatus == true);

  // je recupere seulement les informations qui m'interessent pour les envoyer dans le front
  kryerList = [];
  missionList.map(function (e) {
    kryerList.push({
      departure: e.departure_journey,
      arrival: e.arrival_journey,
      date: e.date_journey,
      price: parseInt(e.pricePerKg) * parseInt(req.body.weight),
      id: e.id,
      date_delivery: e.date_delivery,
      place_delivery: e.place_delivery,
      date_receipt: e.date_receipt,
      place_receipt: e.place_receipt,
      infoKryer: {
        avatar: e.avatarKryer,
        firstName: e.firstNameKryer,
        lastName: e.lastNameKryer,
      },
    });
  });

  var result = false;
  if (kryerList) {
    result = kryerList;
  }

  res.json(result);
});

router.get("/getMission", async function (req, res, next) {
  var missions = await missionModel.find();

  var result = false;
  if (missions) {
    result = true;
  }
  res.json({result, missions});
});

router.post("/signIn", async function (req, res, next) {
  var result = false;
  var user = null;
  var error = [];
  var token = null;

  if (req.body.emailFromFront == "" || req.body.passwordFromFront == "") {
    error.push("champs vides");
  }

  if (error.length == 0) {
    user = await userModel.findOne({
      email: req.body.emailFromFront,
    });

    if (user) {
      if (bcrypt.compareSync(req.body.passwordFromFront, user.password)) {
        result = true;
        token = user.token;
      } else {
        result = false;
        error.push("mot de passe incorrect");
      }
    } else {
      error.push("email incorrect");
    }
  }
  res.json({ result, user, error, token });
});

router.post("/signUp", async function (req, res, next) {
  var error = [];
  var result = false;
  var saveUser = null;
  var token = null;

  const data = await userModel.findOne({
    email: req.body.emailFromFront,
  });

  if (data != null) {
    error.push("utilisateur déjà présent");
  }

  if (
    req.body.usernameFromFront == "" ||
    req.body.emailFromFront == "" ||
    req.body.passwordFromFront == ""
  ) {
    error.push("champs vides");
  }

  if (error.length == 0) {
    var hash = bcrypt.hashSync(req.body.passwordFromFront, 10);
    var newUser = new userModel({
      firstName: req.body.firstNameFromFront,
      lastName: req.body.lastNameFromFront,
      phone: req.body.phoneFromFront,
      email: req.body.emailFromFront,
      password: hash,
      token: uid2(32),
    });

    saveUser = await newUser.save();

    if (saveUser) {
      result = true;
      token = saveUser.token;
    }
  }

  res.json({ result, saveUser, error, token });
});

// route pour recuperer le user grace au token du storage lors du chargement de l'app
router.get("/getUser", async function (req, res, next) {
  var user = await userModel.find({ token: req.query.token });

  //console.log("user", user);

  res.json({ user });
});

router.get("/getUserById", async function (req, res, next) {
  var user = await userModel.findById(req.query.id);

  res.json({ user });
});

// route pour save le colis dans bdd
router.post('/saveDelivery',async function(req,res,next){

    var result = false;
     
    var newDelivery = new deliveryModel({
      expeditor_id:req.body.expeditorId,
      url_image:req.body.urlDelivery,
      weigth:req.body.weight,
      measures:{
        heigth:req.body.height,
        width:req.body.width,
        length:req.body.length
      },
      coordinates_recipient:{
        firstName:req.body.firstname,
        lastName:req.body.lastname,
        email:req.body.email,
        phone:req.body.phone
      },
      infoExpeditor:{
        firstName:req.body.firstNameExp,
        lastName:req.body.lastNameExp,
        avatar:req.body.avatarExp
      },
      delivery_status:"supportedDelivery",
      price:req.body.price,
      isValidate:"notYet",
      verifCode:uniqid()
    })



  var deliverySave = await newDelivery.save();

  var mission = await missionModel.findById(req.body.idMission);

  mission.delivery_id.push(deliverySave._id);

  missionSave = await mission.save();

  if (missionSave) {
    result = true;
  }

  res.json(result);
});

router.post("/updateInfos", async function (req, res, next) {
  let userExist = await userModel.findOne({ token: req.body.token });

  if (userExist) {
    userExist.avatar = req.body.avatar;
    userExist = await userExist.save();
    res.json(userExist);
  } else {
    res.status(500).send("user not found");
  }
});

router.post("/loadMissions", async function (req, res, next) {
  var result = false;

  var kryer = await userModel
    .findById(req.body.idKryer)
    .populate("missions")
    .exec();
  var missions = kryer.missions;

  if (req.body.status == "newMission") {
    missions = missions.filter((e) => e.newMissionStatus == true);
  } else if (req.body.status == "currentMission") {
    missions = missions.filter((e) => e.currentMissionStatus == true);
  } else if (req.body.status == "finishMission") {
    missions = missions.filter((e) => e.finishMissionStatus == true);
  }

  if (missions) {
    result = missions;
  }

  res.json(missions);
});

router.post("/loadDeliveries", async function (req, res, next) {
  var result = false;

  var mission = await missionModel
    .findById(req.body.idMission)
    .populate("delivery_id")
    .exec();

  var deliveries = mission.delivery_id;

  if(req.body.status == "newMission"){
    deliveries = deliveries.filter(e=>e.isValidate == "notYet");
  }else if (req.body.status == "currentMission"){
    deliveries = deliveries.filter(e=>e.isValidate == "accept" && e.delivery_status != "delivered");
  }else if (req.body.status == "finishMission"){
    deliveries = deliveries.filter(e=>e.delivery_status == "delivered");
  }

 console.log(mission.transport_capacity_rest)
 console.log(mission.transport_capacity_total)

  var etatCapacity = 100 - (mission.transport_capacity_rest * 100 / mission.transport_capacity_total);

  console.log(etatCapacity);

  var totalCagnotte = 0;
  deliveries.map(e => totalCagnotte += e.price);
 

  if (deliveries) {
    result = deliveries;
  }

  res.json({result, etatCapacity, cagnotte: totalCagnotte});
});

router.post("/loadMyDeliveries", async function (req, res, next) {
  var deliveries = await deliveryModel.find({ expeditor_id: req.body.userId });

  var dbDeliveries = [];
  for (var i = 0; i < deliveries.length; i++) {
    var missions = await missionModel.find({ delivery_id: deliveries[i]._id });
    if (missions.length !== 0) {
      for (var j = 0; j < missions.length; j++) {
        dbDeliveries.push({
          _id: deliveries[i]._id,
          weight: deliveries[i].weigth,
          price: deliveries[i].price,
          status_delivery: deliveries[i].delivery_status,
          verifCode: deliveries[i].verifCode,
          departure_journey: missions[j].departure_journey,
          arrival_journey: missions[j].arrival_journey,
          date_receipt: missions[j].date_receipt,
        });
      }
    }
  }

  
  console.log("mydata", dbDeliveries);

  var result = false;
  if (deliveries) {
    result = true;
  }
  res.json({ result, deliveries: dbDeliveries });
});

router.post('/changeStatusValidate',async function(req,res,next){



  var mission = await missionModel.findById(req.body.idMission);

  
  if (mission.transport_capacity_rest == 0) {
    mission.newMissionStatus = false;
  }

  var delivery = await deliveryModel.findById(req.body.idDelivery);

  

  if(delivery.isValidate == "notYet"){
    mission.currentMissionStatus = true;
    delivery.isValidate = "accept";
    if(mission.transport_capacity_rest >= req.body.weigth){
      mission.transport_capacity_rest -= parseInt(req.body.weigth);
     
          
    }else{
      
      res.json({err:true});
      return;
      
    };

  } else if (delivery.isValidate== "accept"){
    mission.finishMissionStatus = true;
    delivery.delivery_status = "delivered";
  }
 



  var missionSave = await mission.save();

  console .log(missionSave);
  await delivery.save();


  var deliveries = await missionModel.findById(req.body.idMission).populate('delivery_id').exec();
 

  if (deliveries.delivery_id.filter(e=>e.delivery_status == "delivered").length == deliveries.delivery_id.filter(e=>e.isValidate == "accept").length){
    mission.currentMissionStatus = false;
    mission.newMissionStatus = false;
    missionSave = await mission.save();
  }

 

  res.json(missionSave ? true : false);
});

router.post("/addMessageAccept", async function (req, res, next) {
  let newMessage = new messageModel({
    expeditor_id: req.body.expeditor,
    recipient_id: req.body.recipient,
    message:
      "Bonjour, je viens d'accepter votre demande, nous pouvons échanger ici pour les détails",
    date: req.body.date,
  });


  let messageSave = await newMessage.save();
  console.log(messageSave);
  res.json({result: true});
});


router.post("/changeStatusCancel", async function(req,res,next){
  var result = false;
  var delivery = await deliveryModel.findById(req.body.idDelivery);
  
  delivery.isValidate = "cancel";

  var deliverySave = await delivery.save();

  if(deliverySave.isValidate == "cancel"){
    var mission = await missionModel.findById(req.body.idMission);

    mission.transport_capacity_rest += parseInt(req.body.weigth);
    await mission.save();
  }
  

  if(deliverySave){
    result = true;
  }

  res.json(result)
});



router.post("/loadLastMessage", async function (req, res, next) {

  var userId = await userModel.findOne({ token: req.body.token });

  /* get distinct destinataires*/
  var distinctDest = await messageModel.find({expeditor_id:userId._id}).distinct("recipient_id");
 
  var messages = new Array(distinctDest.length);
  for(var i=0; i<distinctDest.length; i++){
    var msgExp = await messageModel.find({$and:[{expeditor_id:userId._id},{recipient_id:distinctDest[i]}]});
    var destInfos = await userModel.find({_id:distinctDest[i]});

      messages[i] = 
        {id_dest: destInfos[0]._id,
         firstName_dest:destInfos[0].firstName,
         lastName_dest:destInfos[0].lastName,
         msg: msgExp[msgExp.length-1].message.slice(0,40) + "...",
         avatarUrl: destInfos[0].avatar,
         timeStamp: "12:47 PM"
        }
      }
  var result = false;
  if (messages) {
    result = true;
  }
  res.json({result, messages});
});


router.post("/loadMessages", async function (req, res, next) {
  var userId = await userModel.findOne({ token: req.body.token });
  var messages = await messageModel.find({$and:[{expeditor_id:userId._id},{recipient_id:req.body.idRecipient}]});
  var result = false;
  if (messages) {
    result = true;
  }
  console.log("Mes messages",messages);
  res.json({result, messages});
});

router.post('/changeStatusTransit',async function(req,res,next){

  var result = false
  var delivery = await deliveryModel.findById(req.body.idDelivery);
  delivery.delivery_status = "inTransitDelivery";
  var deliverySave = delivery.save();

 

  if(deliverySave){
    result=true;
  }

  res.json(result)
});



router.post('/uploadPhoto', async function(req, res, next) {
  var imagePath = './tmp/'+uniqid()+'.jpg';
  var copyPhoto = await req.files.photo.mv(imagePath);
 
  var resultCloudinary = await cloudinary.uploader.upload(imagePath);
  

  fs.unlinkSync(imagePath);

  if(!copyPhoto) {
    res.json({result: true, message: 'File uploaded!',resultCloudinary} );      
  } else {
    res.json({result: false, message: resultCopy} );
  }
  
});

module.exports = router;
