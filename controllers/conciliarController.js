const Conciliacion = require('../models/Conciliacion')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.binanceXsantander = async (req, res) =>{

    //Revisar si hay errores

    //extraer email y password

    try {

    } catch (error) {
        console.log(error);
        res.status(400).json({msg:'Hubo un error'})
    }
}