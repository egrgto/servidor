// Ruotas para cargar transacciones
const express = require ('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')

//Cargar transacciones
// /api/uploadfile
router.post('/',
    
    //Reglas de validación
    auth,
    uploadController.importBinanceOrderHistory
);
module.exports = router;
