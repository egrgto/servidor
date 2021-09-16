const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const RetencionSchema = mongoose.Schema({
    transaccion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion'
    },
    tipo:{
        type:String,
        trim:true,
        required:true
    },
    porcentaje: {
        type:Number,
        required:true
    },
    monto:{
        type:Number,
        required:true
    },
    registro:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model('Retencion',RetencionSchema);