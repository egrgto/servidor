const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const ConciliacionSchema = mongoose.Schema({
    transaccion_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion'
    },
    binance_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadBinanceOrderHistory'
    },
    mercadopago_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadMercadopagoReportesCobros'
    },
    santander_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadSantanderUltimosMovimientos'
    },
    estado:{
        type:String,
        required:true,
        trim:true
    },
    creador:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Usuario'
    },
    registro:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model('Conciliacion',ConciliacionSchema,'conciliaciones');