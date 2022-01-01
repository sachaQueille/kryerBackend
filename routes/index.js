var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var uid2 = require("uid2");
var uniqid = require("uniqid");
var request = require("sync-request");
var fs = require("fs");
var mongoose = require("mongoose");

var cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dcjze5qvx",
  api_key: "354945478671377",
  api_secret: "Qx13Gn87zsegWOrV2PeJcWPSYew",
});



//import des modeles

var userModel = require("../modules/users");
var messageModel = require("../modules/messages");
var missionModel = require("../modules/missions");
var deliveryModel = require("../modules/deliveries");
const { discriminator } = require("../modules/users");

/* GET home page. */
router.get("/", async function (req, res, next) {
 
  res.render("index", { title: "kryer" });
});


// authentification


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
      avatar:"https://cdn.icon-icons.com/icons2/1879/PNG/512/iconfinder-3-avatar-2754579_120516.png"
    });

    saveUser = await newUser.save();

    if (saveUser) {
      result = true;
      token = saveUser.token;
      saveUser = {
        _id:saveUser._id,
        firstName: saveUser.firstName,
        lastName: saveUser.lastName,
        token:saveUser.token,
        avatar:saveUser.avatar,
        email: saveUser.email,
        phone: saveUser.phone

      }
    }
  }

  res.json({ result, saveUser, error, token });
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

  user = {
    _id:user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    token: user.token,
    avatar: user.avatar,
    email: user.email,
    phone: user.phone

  }

  res.json({ result, user, error, token });
});

// route pour recuperer le user grace au token du storage lors du chargement de l'app

router.get("/getUser", async function (req, res, next) {
  var user = await userModel.find({ token: req.query.token });


  user = {
    _id:user[0]._id,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    token: user[0].token,
    avatar: user[0].avatar,
    email: user[0].email,
    phone: user[0].phone

  }
  console.log(user)
  res.json(user );
});


// changer l'avatar du user

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



router.post("/saveMission", async function (req, res, next) {

  var user = await userModel.find({token:req.body.tokenKryer});
  
  user = await userModel.findById(user[0]._id).populate('missions').exec();
  

  let newMission = new missionModel({
    date_delivery: req.body.deliveryDate,
    place_delivery: req.body.deliveryPlace,
    date_receipt: req.body.recuperationDate,
    place_receipt: req.body.recuperationPlace,
    pricePerKg: req.body.pricePerKg ,
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

  
  user.missions.push(missionSave._id);

 var userSave =  await user.save();

  
  res.json({ result: userSave ?  true : false });
});


// route pour save le colis dans bdd

router.post("/saveDelivery", async function (req, res, next) {
  var result = false;

  var user = await userModel.find({token:req.body.expeditorToken});

  var newDelivery = new deliveryModel({
    expeditor_id: user[0]._id,
    url_image: req.body.urlDelivery,
    weigth: req.body.weight,
    measures: {
      heigth: req.body.height,
      width: req.body.width,
      length: req.body.length,
    },
    coordinates_recipient: {
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
    },
    infoExpeditor: {
      firstName: req.body.firstNameExp,
      lastName: req.body.lastNameExp,
      avatar: req.body.avatarExp,
    },
    delivery_status: "supportedDelivery",
    price: (req.body.price != "null" ) ? req.body.price : 0,
    isValidate: "notYet",
    verifCode: uniqid(),
  });

  var deliverySave = await newDelivery.save();

  var mission = await missionModel.findById(req.body.idMission);

  mission.delivery_id.push(deliverySave._id);

  missionSave = await mission.save();

  if (missionSave) {
    result = true;
  }

  res.json(result);
});



router.post("/searchKryer", async function (req, res, next) {

  var missionList = await missionModel.find({
    departure_journey: req.body.departure,
    arrival_journey: req.body.arrival,
  });



 //filtre la date
function formatDateToCompare(date){

  date = date.split('/');
  date = date[2]+'-'+date[1]+'-'+date[0];
  date = Date.parse(date)
  return date
}

 
  missionList = missionList.filter(e => formatDateToCompare(e.date_journey) >= formatDateToCompare(req.body.date));
 

  //filtre sur le poid du colis
  missionList = missionList.filter(
    (e) => e.transport_capacity_rest >= req.body.weight
  );

  //filtre sur le status
  missionList = missionList.filter((e) => e.newMissionStatus == true);



  // je recupere seulement les informations qui m'interessent pour les envoyer dans le front (j'aurais pu envoyer missionList et calculer le prix dans le front)
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







router.post("/loadMissions", async function (req, res, next) {
  var result = false;

 // recupere les missions du user
  var kryer = await userModel.find({token:req.body.token})
 
  kryer = await userModel.findById(kryer[0]._id).populate("missions").exec();

  var missions = kryer.missions;


  // filtre les missions en fonction de leur statut selon le bouton sur lequel on press
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

  // recupere tous les colis propre a une mission
  var mission = await missionModel
    .findById(req.body.idMission)
    .populate("delivery_id")
    .exec();
  var deliveries = mission.delivery_id;


  // filtre des colis selon si la demande est accepté ou pas , si c'est annulé ou si le colis est livré ou pas.
  if (req.body.status == "newMission") {
    deliveries = deliveries.filter((e) => e.isValidate == "notYet");
  } else if (req.body.status == "currentMission") {
    deliveries = deliveries.filter((e) => e.isValidate == "accept" && e.delivery_status != "delivered"
    );
  } else if (req.body.status == "finishMission") {
    deliveries = deliveries.filter((e) => e.delivery_status == "delivered");
  }

 // pourcentage de la capacité detransport  
  var etatCapacity = 100 - (mission.transport_capacity_rest * 100) / mission.transport_capacity_total;

 // calcul de la cagnote
  var totalCagnotte = 0;
  deliveries.map((e) => (totalCagnotte += e.price));

  if (deliveries) {
    result = deliveries;
  }

  res.json({ result, etatCapacity, cagnotte: totalCagnotte });
});



router.post("/loadMyDeliveries", async function (req, res, next) {

  var user = await userModel.find({token:req.body.token});
  var deliveries = await deliveryModel.find({ expeditor_id: user[0]._id});
 
  var dbDeliveries = [];
  for (var i = 0; i < deliveries.length; i++) {
    var missions = await missionModel.find({ delivery_id: deliveries[i]._id });
    if (missions.length !== 0) {
      for (var j = 0; j < missions.length; j++) {
        dbDeliveries.push({
          _id: deliveries[i]._id,
          weight: deliveries[i].weigth,
          price: deliveries[i].price,
          delivery_status: deliveries[i].delivery_status,
          validateStatus: deliveries[i].isValidate,
          verifCode: deliveries[i].verifCode,
          departure_journey: missions[j].departure_journey,
          arrival_journey: missions[j].arrival_journey,
          date_receipt: missions[j].date_receipt,
        });
      }
    }
  }

  var result = false;
  if (deliveries) {
    result = true;
  }
  res.json({ result, deliveries: dbDeliveries });
});


// change status 


router.post("/changeStatusValidate", async function (req, res, next) {

  var mission = await missionModel.findById(req.body.idMission);

  // si la capacité de transport est null , la mission n'est plus dispo lors de la recherche d'un kryer
  if (mission.transport_capacity_rest == 0) {
    mission.newMissionStatus = false;
  }

  var delivery = await deliveryModel.findById(req.body.idDelivery);

  // si je suis dans le screen nouvelle mission , la mission devient dispo dans missions en cours, 
  //et le colis a un status de demande accepté
  //si la capcité de transport le permet alors je lui soustrait le poid du nouveau colis 
  //sinon je renvoie une erreur a true qui est traité dans le front

  if (delivery.isValidate == "notYet") {
    mission.currentMissionStatus = true;
    delivery.isValidate = "accept";
    if (mission.transport_capacity_rest >= req.body.weigth) {
      mission.transport_capacity_rest -= parseInt(req.body.weigth);
    } else {
      res.json({ err: true });
      return;
    }

  // si je suis dans le screen  mission en cours  
  } else if (delivery.isValidate == "accept") {
    mission.finishMissionStatus = true;
    delivery.delivery_status = "delivered";
  }

  var missionSave = await mission.save();
  
  await delivery.save();

  var deliveries = await missionModel
    .findById(req.body.idMission)
    .populate("delivery_id")
    .exec();

  // si dans une mission le nombre de colis accepté = le nombre de colis livré , 
  //alors la mission est completement Accompli, elle n'est donc plus dispo, a part dans mission accompli

  if (
    deliveries.delivery_id.filter((e) => e.delivery_status == "delivered").length ==
    deliveries.delivery_id.filter((e) => e.isValidate == "accept").length)
     {
    mission.currentMissionStatus = false;
    mission.newMissionStatus = false;
    missionSave = await mission.save();
  }

  res.json(missionSave ? true : false);
});


router.post("/changeStatusCancel", async function (req, res, next) {

  var result = false;
  var delivery = await deliveryModel.findById(req.body.idDelivery);

  delivery.isValidate = "cancel";

  var deliverySave = await delivery.save();

  // si la demande est accepté , je rajoute le poid du colis a la capacite de trnsp de la mission
  if (delivery.isValidate == "accept") {
    var mission = await missionModel.findById(req.body.idMission);

    if(req.body.weight){
      mission.transport_capacity_rest += parseInt(req.body.weigth);
      await mission.save();
    }
   
  }

  if (deliverySave) {
    result = true;
  }

  res.json(result);
});

router.post("/changeStatusTransit", async function (req, res, next) {
  var result = false;
  var delivery = await deliveryModel.findById(req.body.idDelivery);
  delivery.delivery_status = "inTransitDelivery";
  var deliverySave = await delivery.save();

  if (deliverySave) {
    result = true;
  }

  res.json(result);
});



// message 


router.post("/addMessageAccept", async function (req, res, next) {

  var user = await userModel.find({token:req.body.expeditorToken});

  let newMessage = new messageModel({
    expeditor_id: user[0]._id,
    recipient_id: req.body.recipient,
    message:
      "Bonjour, je viens d'accepter votre demande, nous pouvons échanger ici pour les détails",
    date: req.body.date,
  });

  let messageSave = await newMessage.save();
 
  res.json({ result: true });
});


// recupere les differents interlocuteurs
router.post("/loadLastMessage", async function (req, res, next) {

  var userId = await userModel.findOne({ token: req.body.token });

  /* get distinct destinataires*/
  // on passe les Id en string pour mieux les manipuler puis on les repasse en objectId a la fin.

  var distinctDest1 = await messageModel
    .find({ recipient_id: userId._id })
    .distinct("expeditor_id");
  distinctDest1 = distinctDest1.toString().split(',');
  
 
 
  var distinctDest2 = await messageModel
    .find({ expeditor_id: userId._id })
    .distinct("recipient_id")
    distinctDest2 = distinctDest2.toString().split(',');

    var distinctDest3 = [];

    distinctDest3 = [...distinctDest1,...distinctDest2];
    
    // enleve les doublons si il y en a
    var distinctDest3String2 = [... new Set(distinctDest3)];
    
    var distinctDest = new Array(distinctDest3String2.length);
    
    // enleve les chaine de caractere vide (c'est le cas lorqu'il n'y a un destinataire avec un seul message)
    distinctDest = distinctDest.filter(e=> e != '');

    for(var i=0; i<distinctDest3String2.length; i++){
        distinctDest[i] = mongoose.Types.ObjectId(distinctDest3String2[i])
    }

  // recherge des messages  avec chaque interlocuteur pour recuperer le dernier et l'afficher dans le front
  var messages = new Array(distinctDest.length);
  for (var i = 0; i < distinctDest.length; i++) {
   
       var msgExp = await messageModel.find({
      $or: [
        {
          $and: [
            { expeditor_id: userId._id },
            { recipient_id: distinctDest[i] },
          ],
        },
        {
          $and: [
            { expeditor_id: distinctDest[i] },
            { recipient_id: userId._id },
          ],
        },
      ],
    });
    
   
    var destInfos = await userModel.find({ _id: distinctDest[i] });
    
    messages[i] = {
      id_msg: msgExp[msgExp.length - 1]._id,
      id_dest: destInfos[0]._id,
      firstName_dest: destInfos[0].firstName,
      lastName_dest: destInfos[0].lastName,
      msg: msgExp[msgExp.length - 1].message.slice(0, 40) + "...",
      avatarUrl: destInfos[0].avatar,
      timeStamp: msgExp[msgExp.length - 1].date,
    };
  }

  var result = false;
  if (messages) {
    result = true;
  }
  res.json({ result, messages });
});

// recupere les messages avec une personnes
router.post("/loadMessages", async function (req, res, next) {
  var userId = await userModel.findOne({ token: req.body.token });

  var messages = await messageModel.find({
    $or: [
      {
        $and: [
          { expeditor_id: userId._id },
          { recipient_id: req.body.idRecipient },
        ],
      },
      {
        $and: [
          { expeditor_id: req.body.idRecipient },
          { recipient_id: userId._id },
        ],
      },
    ],
  });

  var result = false;
  if (messages) {
    result = true;
  }
  res.json({ result, messages });
});


router.post("/sendMessage", async function (req, res, next) {
  let newMessage = new messageModel({
    expeditor_id: req.body.expeditor,
    recipient_id: req.body.recipient,
    message: req.body.message,
    date: req.body.date,
  });

  let messageSave = await newMessage.save();
  var result = "false";
  if (messageSave) {
    result = true;
  }
 
  res.json({ result, newMessage });
});


router.post("/uploadPhoto", async function (req, res, next) {
  var imagePath = "./tmp/" + uniqid() + ".jpg";
  var copyPhoto = await req.files.photo.mv(imagePath);

  var resultCloudinary = await cloudinary.uploader.upload(imagePath);

  fs.unlinkSync(imagePath);

  if (!copyPhoto) {
    res.json({ result: true, message: "File uploaded!", resultCloudinary });
  } else {
    res.json({ result: false });
  }
});


router.delete("/deleteMyDelivery/:verifcode", async function (req, res, next) {
  var returnDb = await deliveryModel.deleteOne({
    verifCode: req.params.verifcode,
  });
 
  var result = false;
  if (returnDb) {
    result = true;
  }
 
  res.json({ result });
});


module.exports = router;
