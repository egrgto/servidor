const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const TareaSchema = mongoose.Schema({
    nombre: {
        type:String,
        trim:true
    },
    estado:{
        type:Boolean
    },
    proyecto:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Proyecto'
    },
    creado:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model('Tarea',TareaSchema)