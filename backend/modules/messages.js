var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({

    expeditor_id: [{type: mongoose.Schema.Types.ObjectId, ref:'users'}],
    recipient_id:[{type: mongoose.Schema.Types.ObjectId, ref:'users'}],
    message:String,
    date:Date
});

var messageModel = mongoose.model('messages',messageSchema);

module.exports = messageModel;

