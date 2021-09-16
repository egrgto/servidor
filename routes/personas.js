// Rutas para gestionar proyectos
const express = require ('express');
const router = express.Router();
const personaController = require('../controllers/personaController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')

//Crear un usuario
// /api/personas
router.post('/',
    auth,
    personaController.crearPersona
);

router.post('/insertarPersonasMercadoPago',
    auth,  
    personaController.insertarPersonasMercadoPago
);

router.post('/insertarPersonasSantander',
    auth,  
    personaController.insertarPersonasSantander
);

router.post('/insertarPersonasBinance',
    auth,  
    personaController.insertarPersonasBinance
);

module.exports = router;
