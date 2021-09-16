const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const TransaccionSchema = mongoose.Schema({
    fecha: {
        type:Date,
        required:true
    },
    tipoTransaccion:{
        type:String,
        trim:true,
        required:true
    },
    retenciones:[{
        tipo:{type:String,trim:true},
        porc:{type:Number}
    }],
    vendedor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Persona'
    },
    comprador:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Persona'
    },
    medioPago:{
        type:String,
        trim:true
    },
    order_id_binance:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadMercadopagoReportesCobros'
    }],
    payment_id_mp:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadMercadopagoReportesCobros'
    }],
    payment_id_santander:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UploadSantanderUltimosMovimientos'
    }],
    monto:{
        type:Number
    },
    token:{
        type:String,
        trim:true
    },
    cantidad:{
        type:Number
    },
    broker:{
        type:String,
        trim:true
    },
    precio:{
        type:Number
    },
    estado:{
        type:String,
        required:true
    },
    creador:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Usuario'
    },
    registro:{
        type:Date,
        required:true
    }
})

module.exports = mongoose.model('Transaccion',TransaccionSchema,'transacciones');