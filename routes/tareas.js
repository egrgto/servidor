// Rutas para gestionar tareas
const express = require ('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')

//Gestionar tareas
// /api/tareas
router.post('/',
    //Validar usuario autenticado
    auth,

    //Validacion de campos
    [
        check('nombre','El nombre de la tarea es obligatorio').not().isEmpty(),
        check('proyecto','El proyecto de la tarea es obligatorio').not().isEmpty()
    ],

    //Crear proyecto
    tareaController.crearTarea
);

router.get('/',
    auth,
    tareaController.obtenerTareas
);

router.put('/:id',
    auth,
    tareaController.actualizarTarea
);

router.delete('/:id',
    auth,
    tareaController.eliminarTarea
);

module.exports = router;