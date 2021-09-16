const Tarea = require('../models/Tarea')
const { validationResult } = require('express-validator');
const Proyecto = require('../models/Proyecto');

exports.crearTarea = async (req, res) =>{
    
    //Revisar si hay errores
    const errores = validationResult(req);
    if(!errores.isEmpty()){
        return res.status(400).json({errores:errores.array()})
    }

    //Extraer datos del req
    const { proyecto } = req.body

    try {
        
        //Revisar si existe el proyecto
        const existeProyecto = await Proyecto.findById(proyecto)
        if(!existeProyecto) {
            return res.status(404).json({msg:'Proyecto no encontrado'})
        }

        //Revisar si el proyecto actual pertenece al usuario autenticado
        if(existeProyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        //Creamos la tarea
        const tarea = new Tarea(req.body);
        tarea.estado=false;
        
        await tarea.save();
        res.json({tarea})

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}

exports.obtenerTareas = async (req, res) =>{
    
    

    try {
        //Extraer datos del req
        const { proyecto } = req.body
        
        //Revisar si existe el proyecto
        const existeProyecto = await Proyecto.findById(proyecto)
        if(!existeProyecto) {
            return res.status(404).json({msg:'Proyecto no encontrado'})
        }

        //Revisar si el proyecto actual pertenece al usuario autenticado
        if(existeProyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        //Obtener las tareas del proyecto
        const tareas=await Tarea.find({ proyecto});
        res.json({tareas});



    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}

exports.actualizarTarea = async (req, res) =>{
    try {
        //Extraer datos del req
        const { proyecto,nombre,estado } = req.body;
        
        //Revisar si la tarea existe
        let tarea = await Tarea.findById(req.params.id)
        
        if(!tarea) {
            return res.status(404).json({msg:'Tarea no existe'})
        }

        //Si la tarea existe entonces existe el proyecto
        const existeProyecto = await Proyecto.findById(proyecto)
        
        //Revisar si el proyecto actual pertenece al usuario autenticado
        if(existeProyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        //Crear un objeto con la nueva información
        const nuevaTarea = {};
        if(nombre) nuevaTarea.nombre = nombre;
        if(estado) nuevaTarea.estado = estado;

        //Guardar la tarea
        tarea = await Tarea.findOneAndUpdate({_id:req.params.id},nuevaTarea,{new:true});

        res.json({tarea});
        
    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}

exports.eliminarTarea = async (req, res) =>{
    try {
        //Extraer datos del req
        const { proyecto } = req.body;
        
        //Revisar si la tarea existe
        const tarea = await Tarea.findById(req.params.id)
        
        if(!tarea) {
            return res.status(404).json({msg:'Tarea no existe'})
        }

        //Si la tarea existe entonces existe el proyecto
        const existeProyecto = await Proyecto.findById(proyecto)
        
        //Revisar si el proyecto actual pertenece al usuario autenticado
        if(existeProyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        // Eliminar la tarea
        await Tarea.findOneAndRemove({_id:req.params.id});

        res.json({msg:'Tarea Eliminada'})

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}