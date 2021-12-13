var mongoose = require("mongoose");

var measureSchema = mongoose.Schema({
  heigth: Number,
  width: Number,
  length: Number,
});

var recipientSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
});

var infoExpeditorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  avatar: String,
});

var deliverySchema = mongoose.Schema({
  expeditor_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  url_image: String,
  weigth: Number,
  measures: measureSchema,
  coordinates_recipient: recipientSchema,
  infoExpeditor: infoExpeditorSchema,
  delivery_status: String,
  price: Number,
  isValidate: String,
  verifCode: String,
});

var deliveryModel = mongoose.model("deliveries", deliverySchema);

module.exports = deliveryModel;
