var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var uid2 = require("uid2");
var uniqid = require("uniqid");

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
    mission_status: "newMission"
  });

  var missionSave = await newMission.save();

  var user = await userModel.findById(req.body.idKryer);
  console.log(user);
  user.missions.push(missionSave._id)

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

  console.log("missions", missions);
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

  console.log("user", user);

  res.json({user})
});

router.get('/getUserById',async function(req,res,next){

  var user = await userModel.findById(req.query.id);

  res.json({user})
});

// route pour save le colis dans bdd
router.post('/saveDelivery',async function(req,res,next){

    var result = false;
     
    var newDelivery = new deliveryModel({
      expeditor_id:req.body.expeditorId,
      url_image:"",
      weigth:req.body.weight,
      measures:{
        heigth:req.body.height,
        width:req.body.width,
        length:req.body.length
      },
      coordinates_recipient:{
        firstname:req.body.firstname,
        lastName:req.body.lastname,
        email:req.body.email,
        phone:req.body.phone
      },
      delivery_status:"ask",
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
    console.log(userExist);
    res.json(userExist);
  } else {
    res.status(500).send("user not found");
  }
});


router.post("/loadMissions",async function(req,res,next){

  var result = false;

  var kryer = await userModel.findById(req.body.idKryer).populate("missions").exec();
  var missions = kryer.missions;
  missions = missions.filter(e=>e.mission_status == req.body.status);

  if(missions){
    result=missions;
  }

  res.json(missions);
});


router.post("/loadDeliveries",async function(req,res,next){

  var result = false;

  var mission = await missionModel.findById(req.body.idMission).populate("delivery_id").exec();
 
  var deliveries = mission.delivery_id;

  

  if(req.body.status == "newMission"){
    deliveries = deliveries.filter(e=>e.delivery_status == "ask");
  }else if (req.body.status == "currentMission"){
    deliveries = deliveries.filter(e=>e.delivery_status == "accepted");
  }else if (req.body.status == "finishMission"){
    deliveries = deliveries.filter(e=>e.delivery_status == "terminate");
  }

console.log(deliveries)

  if(deliveries){
    result=deliveries;
  }

  res.json(result);
});

module.exports = router;
