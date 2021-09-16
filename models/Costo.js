const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const CostoSchema = mongoose.Schema({
    transaccion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion'
    },
    tipo: { //CRYPTO
        type:String,
        trim:true,
        required:true
    },
    cuenta:{ //Binance, etc.
        type:String,
        trim:true,
        required:true
    },
    token:{ //USDT, BTC, ETH...
        type:String,
        trim:true,
        required:true
    },
    precioCosto:{
        type:Number,
        required:true
    },
    registro:{
        type:Date,
        required:true
    }
})

module.exports = mongoose.model('Costo',CostoSchema);