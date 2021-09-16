const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const ComisionSchema = mongoose.Schema({
    transaccion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion'
    },
    monto: { //CRYPTO
        type:Number
    },
    porcentaje:{ //Binance, etc.
        type:Number
    },
    registro:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model('Comision',ComisionSchema);