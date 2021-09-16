// Rutas para gestionar proyectos
const express = require ('express');
const router = express.Router();
const proyectoController = require('../controllers/proyectoController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')

//Crear un usuario
// /api/proyectos
router.post('/',
    //Validar usuario autenticado
    auth,

    //Validacion de campos
    [
        check('nombre','El nombre del proyecto es obligatorio').not().isEmpty()
    ],

    //Crear proyecto
    proyectoController.crearProyecto
);
router.get('/',
    auth,
    proyectoController.obtenerProyectos
);

router.put('/:id',
    auth,
    [
        check('nombre','El nombre del proyecto es obligatorio').not().isEmpty(),
        check('params.id','El id es incorrecto').isLength()
    ],
    proyectoController.actualizarProyecto
);

router.delete('/:id',
    auth,
    proyectoController.eliminarProyecto
);

module.exports = router;
