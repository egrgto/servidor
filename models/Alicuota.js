const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const AlicuotaSchema = mongoose.Schema({
    Factura:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Factura'
    },
    Id:{
        type:Number,
        required:true
    },
    BaseImp:{
        type:Number,
        required:true
    },
    Importe:{
        type:Number,
        required:true
    },
    registro:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model('Alicuota',AlicuotaSchema);