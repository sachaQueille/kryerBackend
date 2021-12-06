var mongoose = require ('mongoose');

var missionSchema = mongoose.Schema({
    delivery_id:[{type: mongoose.Schema.Types.ObjectId, ref:'deliveries'}],
    transport_capacity_total:Number,
    transport_capacity_rest:Number,
    date_delivery:Date,
    place_delivery:Date,
    date_receipt:Date,
    place_receipt:Date,
    pricePerKg:Number,
    departure_journey:String,
    arrival_journey:String,
    date_journey:Date,
    sattus_mission:String
});

var missionModel = mongoose.model('missions', missionSchema);


module.exports = missionModel;