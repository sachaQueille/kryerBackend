var mongoose = require("mongoose");

var missionSchema = mongoose.Schema({
  delivery_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "deliveries" }],
  transport_capacity_total: Number,
  transport_capacity_rest: Number,
  date_delivery: String,
  place_delivery: String,
  date_receipt: String,
  place_receipt: String,
  pricePerKg: Number,
  departure_journey: String,
  arrival_journey: String,
  date_journey: String,
  mission_status: String,
});

var missionModel = mongoose.model("missions", missionSchema);

module.exports = missionModel;
