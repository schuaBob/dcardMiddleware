var mongoose = require("mongoose")

var ipCountSchema = mongoose.Schema({
    ipv4: {
        type: String,
        required: True,
        unique:True
    },
    ipCounter: {
        type: Number,
        default: 1
    },
    lastReqTime: {
        type: Date,
        default: new Date()
    }
})
let ipCountObj = mongoose.model('ipCount', ipCountSchema)
module.exports = ipCountObj;