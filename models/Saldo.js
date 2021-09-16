const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const SaldosSchema = mongoose.Schema({
    transaccion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion'
    },
    tipo: { //FIAT o CRYPTO
        type:String,
        trim:true,
        required:true
    },
    cuenta:{ //Santander o MP o Binance etc.
        type:String,
        trim:true,
        required:true
    },
    token:{ //ARS, USDT, BTC, ETH...
        type:String,
        trim:true,
        required:true
    },
    monto:{
        type:Number,
        required:true
    },
    registro:{
        type:Date,
        required:true
    }
})

module.exports = mongoose.model('Saldo',SaldosSchema);