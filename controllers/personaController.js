const mongoose = require('mongoose');

//Retrieve db models
const Persona = require('../models/Persona')
const UploadSantanderUltimosMovimientos = require('../models/UploadSantanderUltimosMovimientos')
const UploadMercadopagoReportesCobros = require('../models/UploadMercadopagoReportesCobros')
const UploadBinanceOrderHistory = require('../models/UploadBinanceOrderHistory')

//Transform id to ObjectId mongodb
const ObjectId = mongoose.Types.ObjectId;

//Get HTML person data
const {dateasAxios,cuitonlineAxios} = require('../config/axios')

//Interceptores, crear delay en request
dateasAxios.interceptors.request.use((config) =>{
    if (config.delayed) {
      return new Promise(resolve => setTimeout(() => resolve(config), 600));
    }
    return config;
});

cuitonlineAxios.interceptors.request.use((config) =>{
    if (config.delayed) {
        return new Promise(resolve => setTimeout(() => resolve(config), 600));
    }
    return config;
});

//Parse HTML
const jsdom = require('jsdom');
const { JsonWebTokenError } = require('jsonwebtoken');
const { JSDOM } = jsdom;

//Funciones para formateo de datos
const onlyNumberInt = (t) => {
    if(t.trim()===''){
        return 0
    } else {
        return parseInt(t.replace(/\D/g,''));
    }
}

const onlyNumberInt2 = (t) => {
    return parseInt(t.match(/\d{8,11}/g)[0]);
}

exports.crearPersona = async (req, res) =>{
    
    //Revisar si hay errores
    

    //Extraer datos del req
    
    try {
        
        //Crear persona
        const persona = new Persona(req.body);
        
        //Guardamos el creador via JWT
        persona.creador = req.usuario.id
        
        persona.fechaCreacion = Date.now()
        persona.save();
        res.json(persona);

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.insertarPersonasMercadoPago = async (req, res) =>{
    
    //Revisar si hay errores
    

    //Extraer datos del req
    
    try {
        //Recuperar datos de personas del mismo creador
        const query = [
            {
                $match: { creador: ObjectId(req.usuario.id) }
            },
            {
                $group : {_id : {
                    counterpart_name:"$counterpart_name", 
                    counterpart_email:"$counterpart_email",
                    counterpart_phone_number:"$counterpart_phone_number",
                    buyer_document:"$buyer_document"
                }},
            },
            {
                $project : {
                    _id:0, 
                    counterpart_name:"$_id.counterpart_name", 
                    counterpart_email:"$_id.counterpart_email",
                    counterpart_phone_number:"$_id.counterpart_phone_number",
                    buyer_document:"$_id.buyer_document"
                }
            }
        ]

        //const personas = await UploadMercadopagoReportesCobros.find({creador:req.usuario.id},{'_id': 0}).select('counterpart_name counterpart_email counterpart_phone_number buyer_document')
        const personas = await UploadMercadopagoReportesCobros.aggregate(query)
        
        personas.map(async p => {
            try {
                
                //Verificar si existe persona con mismo documento

                let persona = await Persona.findOne(
                    {
                        creador:ObjectId(req.usuario.id),
                        'documento.numero':p.buyer_document
                    },{
                        'nombre':1,
                        'documento.$' : 1,
                        'telefono' : 1,
                        'email' : 1
                    }
                )
                
                if(persona){
                    let hayCambios = false;
                    //Actualizar info persona
                    if(!(persona.telefono.find(t=>t.tipo==="MercadoPago")) && p.counterpart_phone_number !== ''){
                        persona.telefono.push({tipo:"MercadoPago",numero:p.counterpart_phone_number});
                        hayCambios = true;
                    };
                    
                    if(!(persona.email.find(e=>e===p.counterpart_email)) && p.counterpart_email !== ''){
                        persona.email.push(p.counterpart_email);
                        hayCambios = true;
                    };

                    if(hayCambios){
                        persona.save()
                    }
                    
                } else {
                    //Crear persona
                
                    //Inicializamos
                    const persona = new Persona();

                    persona.nombre = p.counterpart_name
                    if(p.buyer_document!==''){
                        persona.documento[0] = {tipo:"DNI",numero:p.buyer_document}
                    }
                    if(p.counterpart_phone_number!==''){
                        persona.telefono[0] = {tipo:"MercadoPago",numero:p.counterpart_phone_number}
                    }
                    if(p.counterpart_email!==''){
                        persona.email[0] = p.counterpart_email
                    }
                    //Guardamos el creador via JWT
                    persona.creador = req.usuario.id

                    persona.fechaCreacion = Date.now()
            
                    persona.save();

                }

                
        
            } catch (error) {
                console.log(error);
                res.status(500).send({msg:error})
            }
        })
        
        res.json({personas})

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.insertarPersonasSantander = async (req, res) =>{
    
    
    try {
        //Recuperar datos de personas del mismo creador y transacciones de cobro
        const query = [
            {
                $match: { 
                    $and:[
                        {creador: ObjectId(req.usuario.id)},
                        {$or:[
                            {codOperativo: "2850"},
                            {codOperativo: "1257"},
                            {codOperativo: "1430"},
                            {codOperativo: "2767"},
                            {codOperativo: "4805"}
                        ]}
                    ]
                }
            },
            {
                $group : {
                    _id : null,
                    personas:{$addToSet:{nombre:"$nombre",numDocumento:"$numDocumento"}}
                },
            },
            {
                $project : {
                    _id:0, 
                    personas:1
                }
            }
        ]

        const personas = await UploadSantanderUltimosMovimientos.aggregate(query)

        //return res.json(personas[0].personas)

        personas[0].personas.map(async p=>{
            try {
                
                //Verificar si existe persona con mismo documento
                const queryP = [
                    {
                        $match: {
                            $and:[
                                {creador:ObjectId(req.usuario.id)},
                                {$or:[
                                    {'documento.numero':p.numDocumento},
                                    {'documento.numero':parseInt(p.numDocumento.toString().substr(2,8))}
                                ]}
                            ]
                        }
                    }
                ]

                const persona = await Persona.aggregate(queryP)

                if(persona){
                    console.log(persona[0].nombre + ' | ' + persona[0].documento[0].numero + ' | ' + p.numDocumento);
                    let hayCambios = false;
                    //Actualizar info persona
                    if(p.nombre !== '' && persona.nombre){
                        if((persona.nombre.trim().length() < p.nombre.trim().length() )){
                            persona.nombre = p.nombre;
                            hayCambios = true;
                        }
                    };

                    if(!(persona[0].documento.find(d=>d.numero===p.numDocumento))){
                        persona[0].documento.push({tipo:"CUIT",numero:p.numDocumento})
                        
                        hayCambios = true;
                    };

                    if(hayCambios){
                        await Persona.findOneAndUpdate({_id:persona[0]._id},{$set:persona[0]},{new:true})
                    }
                    
                } else {
                    //Crear persona
                
                    //Inicializamos
                    persona = new Persona();

                    persona.nombre = p.counterpart_name
                    if(p.numDocumento!==''){
                        persona.documento[0] = {tipo:"CUIT",numero:p.numDocumento}
                    }
                    if(p.nombre!==''){
                        persona.nombre = p.nombre
                    }

                    //Guardamos el creador via JWT
                    persona.creador = req.usuario.id

                    persona.fechaCreacion = Date.now()
            
                    persona.save();
                }

                
        
            } catch (error) {
                console.log(error);
                res.status(500).send({msg:error})
            }
        })

        res.json(personas)

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.insertarPersonasBinance = async (req, res) =>{
    
    const result = {regAct:0,regProc:0,actualizado:[],procesado:[],errores:[]}
    
    try {
        
        //Recuperar persona Binance
        //Recuperar datos de personas del mismo creador
        const query = [
            {
                $match: { 
                    $and:[
                        {creador: ObjectId(req.usuario.id)},
                        {numDocumentoParcial:{$ne:null}},
                        {numDocumento:null}
                    ]
                }
            },
            {
                $group : {
                    _id : null,
                    personas:{$addToSet:{id:"$_id",BuyerName:"$BuyerName",numDocumentoParcial:"$numDocumentoParcial"}}
                },
            },
            {
                $project : {
                    _id:0,
                    personas:1
                }
            }
        ]

        

        const personas = await UploadBinanceOrderHistory.aggregate(query)

        //return res.json(personas)

        // //Funcion para buscar resultados en la web cada X segundos.
        // async function timeout(ms) {
        //     try {
        //         return new Promise(resolve => setTimeout(resolve, ms));    
        //     } catch (error) {
        //         console.log(error);
        //     }
            
        // }

        // //Buscar en dateas.com -------------------------------------------
        // await Promise.all(
        //     personas[0].personas.map(async p => {
                
        //         //Buscar en dateas.com
        //         const resultado = await dateasAxios.get(`?name=${p.BuyerName.split(' ').join('+')}&cuit=`)
        //         const {document} = (new JSDOM(resultado.data)).window;
        //         const container = [...document.querySelectorAll('table.dataTable > tbody > tr')]

        //         container.map(p=>{
                    
        //             const razonSocial = [...p.querySelectorAll('td')][0].textContent
        //             const cuitCuilCdi = [...p.querySelectorAll('td')][1].textContent
        //             let dni = 0
                    
        //             if(cuitCuilCdi.substr(0,1)==='2'){
        //                 dni = onlyNumberInt2(cuitCuilCdi)
        //             }

        //             console.log(`${razonSocial} | ${cuitCuilCdi} | ${dni} | ${p.BuyerName} | ${p.numDocumentoParcial}`);


        //         })

        //         await new Promise(resolve => setTimeout(resolve, 10000));

        //     })
        // )


        //Buscar en cuitonline.com
        await Promise.all(
            personas[0].personas.map(async p => {
                
                //Buscar en cuitonline.com
                const resultado = await cuitonlineAxios.get(`?q=${p.BuyerName}`)
                
                const {document} = (new JSDOM(resultado.data)).window;
                
                const container = [...document.querySelectorAll('div.results > div.hit')]

                await Promise.all(
                    container.map( async hit => {
                        if(hit.querySelector('div.denominacion')){
                            const denominacion = hit.querySelector('div.denominacion').textContent
                            const cuit = hit.querySelector('div.doc-facets > span.linea-cuit-persona > span.cuit').textContent
                            if(cuit.includes(`${p.numDocumentoParcial}-`)){
                                try {
                                    const logProcesado = {}
                                    //console.log(p);
                                    const u = await UploadBinanceOrderHistory.findOneAndUpdate({_id:ObjectId(p.id)},{numDocumento:onlyNumberInt(cuit)},{new:true,upsert:false})
                                    if(u){
                                        result.actualizado.push({OrderNumber:u.OrderNumber})
                                        result.regAct++
                                        logProcesado.insertado=true;
                                    }
                                    logProcesado.id=p.id
                                    logProcesado.BuyerName=p.BuyerName
                                    logProcesado.numDocumentoParcial=p.numDocumentoParcial
                                    
                                    result.procesado.push(logProcesado)
                                    result.regProc++
                                    //console.log(`${denominacion} | ${onlyNumberInt(cuit)} | ${p.BuyerName} | ${p.numDocumentoParcial}`);
                                } catch (error) {
                                    result.errores.push(error)
                                }
                            }
                        }
                    })
                )

                //await new Promise(resolve => setTimeout(resolve, 10000));
                
            })
        )

        res.json(result)
        
    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }

}