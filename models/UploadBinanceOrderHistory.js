const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const UploadBinanceOrderHistorySchema = mongoose.Schema({
    OrderNumber:{
        type:String,
        required:true,
        trim:true,
        index:true,
        unique:true
    },
    AdID:{
        type:String,
        required:true,
        trim:true
    },
    UserID:{
        type:String,
        required:true,
        trim:true
    },
    OrderType:{
        type:String,
        required:true,
        trim:true
    },
    PaymentMethod:{
        type:String,
        required:true,
        trim:true
    },
    Recipient:{
        type:String,
        trim:true
    },
    Account:{
        type:String,
        trim:true
    },
    AssetType:{
        type:String,
        required:true,
        trim:true
    },
    Quantity:{
        type:Number,
        required:true
    },
    Price:{
        type:Number,
        required:true
    },
    Amount:{
        type:Number,
        required:true
    },
    Status:{
        type:String,
        required:true,
        trim:true
    },
    ExchangeRate:{
        type:Number,
        required:true
    },
    MatchTimeUTC:{
        type:Date,
        required:true
    },
    TradeDescription:{
        type:String,
        trim:true
    },
    BuyerName:{
        type:String,
        required:true,
        trim:true
    },
    BuyerPhone:{
        type:String,
        trim:true
    },
    SellerName:{
        type:String,
        trim:true
    },
    SellerPhone:{
        type:String,
        trim:true
    },
    OrderSource:{
        type:String,
        required:true,
        trim:true
    },
    numDocumentoParcial:{
        type:String,
        trim:true
    },
    numDocumento:{
        type:Number
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

module.exports = mongoose.model('UploadBinanceOrderHistory',UploadBinanceOrderHistorySchema);