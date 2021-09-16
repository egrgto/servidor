const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const FacturaSchema = mongoose.Schema({
    PtoVta: {
        type:Number,
        required:true
    },
    CbteTipo:{
        type:Number,
        required:true
    },
    Concepto:{
        type:Number,
        required:true
    },
    DocTipo:{
        type:Number,
        required:true
    },
    DocNro:{
        type:Number,
        required:true
    },
    CbteDesde:{
        type:Number,
        required:true
    },
    CbteHasta:{
        type:Number,
        required:true
    },
    CbteFch:{
        type:Date,
        required:true
    },
    ImpTotal:{
        type:Number,
        required:true
    },
    ImpTotConc:{
        type:Number,
        required:true
    },
    ImpNeto:{
        type:Number,
        required:true
    },
	ImpOpEx:{
        type:Number,
        required:true
    },
	ImpIVA:{
        type:Number,
        required:true
    },
	ImpTrib:{
        type:Number,
        required:true
    },
	MonId:{
        type:String,
        required:true
    },
	MonCotiz:{
        type:Number,
        required:true
    },
	FchServDesde:{
        type:Date,
        required:true
    },
    FchServHasta:{
        type:Date,
        required:true
    },
    FchVtoPago:{
        type:Date,
        required:true
    },
    CAE:{
        type:Number
    },
    CAEFchVto:{
        type:Number
    },
    digitoVerificador:{
        type:Number
    },
    codigoBarras:{
        type:Number
    },
    transaccion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Transaccion',
        required:true
    },
    documentoFisico:{
        type:String
    },
    registro:{
        type:Date,
        default:Date.now()
    }
    
})

module.exports = mongoose.model('Factura',FacturaSchema);