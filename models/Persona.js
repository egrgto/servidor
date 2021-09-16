const mongoose = require('mongoose');

// mongoosejs.com/docs/schematypes.html
const PersonaSchema = mongoose.Schema({
    nombre: {
        type:String,
        trim:true
    },
    apellido:{
        type:String,
        trim:true
    },
    razonSocial:{
        type:String,
        trim:true
    },
    documento:[{
        tipo:{
            type:String,
            trim:true
        },
        numero:{
            type:Number,
            unique:true
        }
    }],
    direccion:[{
        tipo:{
            type:String,
            trim:true
        },
        calle:{
            type:String,
            trim:true
        },
        numero:{
            type:String,
            trim:true
        },
        piso:{
            type:String,
            trim:true
        },
        departamento:{
            type:String,
            trim:true
        },
        localidad:{
            type:String,
            trim:true
        },
        provincia:{
            type:String,
            trim:true
        },
        codigoPostal:{
            type:String,
            trim:true
        },
        pais:{
            type:String,
            trim:true
        }
    }],
    telefono:[{
        tipo:{
            type:String,
            trim:true
        },
        numero:{
            type:String,
            trim:true
        }
    }],
    email:[{
        type:String,
        trim:true
    }],
    fechaCreacion:{
        type:Date,
        required:true
    },
    ultimaModificacion:{
        type:Date,
        default:Date.now()
    },
    creador:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Usuario'
    }
})

module.exports = mongoose.model('Persona',PersonaSchema,'personas');