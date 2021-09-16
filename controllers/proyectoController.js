const Proyecto = require('../models/Proyecto')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { ValidatorsImpl } = require('express-validator/src/chain')

exports.crearProyecto = async (req, res) =>{
    
    //Revisar si hay errores
    const errores = validationResult(req);
    if(!errores.isEmpty()){
        return res.status(400).json({errores:errores.array()})
    }
    
    //Extraer datos del req
    
    try {
        //Crear nuevo proyecto
        const proyecto = new Proyecto(req.body);

        //Guardamos el creador via JWT
        proyecto.creador = req.usuario.id

        //Guardamos el proyecto
        proyecto.save();
        res.json(proyecto);

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}

//Obtiene todos los proyectos del usuario actual
exports.obtenerProyectos = async (req,res) => {
    try {
        const proyectos = await Proyecto.find({creador:req.usuario.id}).sort({creado:-1});
        res.json({proyectos})
    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}

//Actualizar proyecto via ID
exports.actualizarProyecto = async (req,res) => {
    //Revisar si hay errores
    let errores = validationResult(req);
    if(!errores.isEmpty()){
        return res.status(400).json({errores:errores.array()})
    }

    //Extraer datos del req
    const {nombre} = req.body;
    const nuevoProyecto = {};

    if(nombre){
        nuevoProyecto.nombre = nombre
    }

    
    try {
        //Recuperar el proyecto
        let proyecto = await Proyecto.findById(req.params.id);

        //si el proyecto existe o no
        if(!proyecto){
            return res.status(404).json({msg:'Proyecto no encontrado'})
        }

        //verifica el creador del proyecto (si tiene permisos o no)
        if(proyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        //actualizar
        proyecto = await Proyecto.findOneAndUpdate({_id:req.params.id},{$set:nuevoProyecto},{new:true});

        res.json({proyecto})

        
    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Error en el servidor'});
    }

}

exports.eliminarProyecto = async (req,res)=>{
    try {
        //Recuperar el proyecto
        let proyecto = await Proyecto.findById(req.params.id);

        //si el proyecto existe o no
        if(!proyecto){
            return res.status(404).json({msg:'Proyecto no encontrado'})
        }

        //verifica el creador del proyecto (si tiene permisos o no)
        if(proyecto.creador.toString() !== req.usuario.id){
            return res.status(401).json({msg:'No autorizado'})
        }

        //Eliminar el proyecto
        await Proyecto.findOneAndRemove({ _id : req.params.id})
        
        res.json({msg:'Proyecto eliminado'})


    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Error en el servidor'});
    }
}