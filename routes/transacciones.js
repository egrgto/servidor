// Rutas para gestionar proyectos
const express = require ('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')

//Gestionar transacciones
// /api/transacciones
router.post('/',
    //Validar usuario autenticado
    auth,
    
    transaccionController.crearTransaccion
);

router.post('/facturaB/:id',
    auth,
    transaccionController.facturaB
);

router.get('/',
    auth,
    transaccionController.obtenerTransacciones
)

module.exports = router;