const mongoose = require('mongoose');

//Models
const Transaccion = require('../models/Transaccion')
const Saldo = require('../models/Saldo')
const Costo = require('../models/Costo')
const Comision = require('../models/Comision')
const Retencion = require('../models/Retencion')
const Factura = require('../models/Factura')
const UploadBinanceOrderHistory = require('../models/UploadBinanceOrderHistory')
const Persona = require('../models/Persona')

//Facturacion
const Afip = require('@afipsdk/afip.js');
const pdf = require('html-pdf'); //Crear Facturas de Venta

const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

//Transform id to ObjectId mongodb
const ObjectId = mongoose.Types.ObjectId;

exports.crearTransaccionesBinance = async (req, res) =>{
    try {
        const query = [
            {
                $match: { 
                    $and:[
                        {creador: ObjectId(req.usuario.id)},
                        {numDocumento:{$ne:null}}
                    ]
                }
            },
            {
                $project : {
                    _id:1,

                }
            }
        ]

        const transacciones = await UploadBinanceOrderHistory.aggregate(query)

        
        //Armar transaccion en base a Binance
        const transaccion = new Transaccion();
        
        if(t.OrderType === "Sell"){
            const v = await Persona.findOne({creador: ObjectId(req.usuario.id),"documento.numero":30716897970})
            if(v){
                transaccion.tipoTransaccion = "Venta"
                transaccion.vendedor = v._id
            }
        }

    } catch (error) {
        
    }
}

exports.calcularCostos = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.crearTransaccion = async (req, res) =>{
    
    //Revisar si hay errores
    

    //Extraer datos del req
    
    try {
        //Recuperar última transacción
        const ultimaTransaccion = await Transaccion.findOne({},{},{sort:{'registro':-1}})

        if(ultimaTransaccion){
            //Crear nueva transacción
            const transaccion = new Transaccion(req.body);
            
            //Guardamos el creador via JWT
            transaccion.creador = req.usuario.id
            
            transaccion.registro=Date.now();
            transaccion.save();
            
            //Modulo de ventas
            if(transaccion.tipoTransaccion==="Venta"){
                //Generamos monto de comision para ventas
                //Cantidad vendida
                const cantidadVenta = Math.sqrt(transaccion.cantidad**2) //obtengo el módulo de la cantidad
                //Precio de venta
                const precioVenta = transaccion.precio
                //Obtener ultimo precio de costo
                const ultimoCosto = await Costo.findOne({tipo:'CRYPTO',cuenta:transaccion.broker,token:transaccion.token},{},{sort:{'registro':-1}})

                //Calculo el monto de comisión
                const montoComision = ((precioVenta - ultimoCosto.precioCosto) * cantidadVenta)

                const comision = new Comision()

                comision.transaccion = transaccion.id
                comision.monto = montoComision
                comision.porcentaje = (montoComision / transaccion.monto)
                comision.registro = Date.now()

                await comision.save()

                //------------------------------------------------------------
                //Calculamos y registramos las retenciones
                transaccion.retenciones.map(async r => {
                    const retencion = new Retencion()
                    retencion.transaccion = transaccion.id
                    retencion.tipo = r.tipo
                    retencion.porcentaje = r.porc
                    retencion.monto = transaccion.monto * r.porc
                    retencion.registro = Date.now()
                    await retencion.save()
                })

                //------------------------------------------------------------
                //Cargamos la información de facturas
                //Funciones
                //Funcion para redondear a 2 decimales
                function round(num, decimales = 2) {
                    var signo = (num >= 0 ? 1 : -1);
                    num = num * signo;
                    if (decimales === 0) //con 0 decimales
                        return signo * Math.round(num);
                    // round(x * 10 ^ decimales)
                    num = num.toString().split('e');
                    num = Math.round(+(num[0] + 'e' + (num[1] ? (+num[1] + decimales) : decimales)));
                    // x * 10 ^ (-decimales)
                    num = num.toString().split('e');
                    return signo * (num[0] + 'e' + (num[1] ? (+num[1] - decimales) : -decimales));
                }
                //Para consumidor final
                const factura = new Factura()
                factura.PtoVta = 2
                factura.CbteTipo = 6 //FacturaB
                factura.Concepto = 3 //Productos y Servicios
                factura.DocTipo = 99 //Consumidor Final
                factura.DocNro = 0 //Consumidor Final
                factura.CbteDesde=0 //Al facturar se recupera ultimo numero comprobante de afip + 1
                factura.CbteHasta=0 //Al facturar se recupera ultimo numero comprobante de afip + 1
                factura.CbteFch=transaccion.fecha
                //factura.CbteFch=transaccion.fecha.toISOString().replace(/-/, '').replace(/T.+/, '') USAR A LA HORA DE ENVIAR LA FACTURA A AFIP PARA DEJAR LA FECHA yyyymmdd
                factura.ImpTotal=round(montoComision)
                factura.ImpTotConc=0
                factura.ImpNeto=round(factura.ImpTotal/(1.21))
                factura.ImpOpEx=0
                factura.ImpIVA=factura.ImpTotal-factura.ImpNeto
                factura.ImpTrib=0
                factura.MonId='PES'
                factura.MonCotiz=1
                factura.FchServDesde=factura.CbteFch
                factura.FchServHasta=factura.CbteFch
                factura.FchVtoPago=factura.CbteFch
                factura.transaccion=transaccion.id
                factura.registro=Date.now()

                if(transaccion.generarCAE){
                    const CUIT = 30716897970;
                    const afip = new Afip({ CUIT: CUIT , production:true});
                    
                    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(PtoVta.WSASS,CbteTipo.facturaB);

                    factura.CbteDesde=lastVoucher+1;
                    factura.CbteHasta=lastVoucher+1;

                    let data={
                        'CantReg' 	: 1,  // Cantidad de comprobantes a registrar
                        'PtoVta' 	: factura.PtoVta,  // Punto de venta
                        'CbteTipo' 	: factura.CbteTipo,  // Tipo de comprobante (ver tipos disponibles) 
                        'Concepto' 	: factura.Concepto,  // Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
                        'DocTipo' 	: factura.DocTipo, // Tipo de documento del comprador (99 consumidor final, ver tipos disponibles)
                        'DocNro' 	: factura.datosFacturaB_CC,  // Número de documento del comprador (0 consumidor final)
                        'CbteDesde' : factura.CbteDesde,  // Número de comprobante o numero del primer comprobante en caso de ser mas de uno
                        'CbteHasta' : factura.CbteHasta,  // Número de comprobante o numero del último comprobante en caso de ser mas de uno
                        'CbteFch' 	: factura.CbteFch, // (Opcional) Fecha del comprobante (yyyymmdd) o fecha actual si es nulo
                        'ImpTotal' 	: factura.ImpTotal, // Importe total del comprobante
                        'ImpTotConc' 	: factura.ImpTotConc,   // Importe neto no gravado
                        'ImpNeto' 	: factura.ImpNeto, // Importe neto gravado
                        'ImpOpEx' 	: factura.ImpOpEx,   // Importe exento de IVA
                        'ImpIVA' 	: factura.ImpIVA,  //Importe total de IVA
                        'ImpTrib' 	: factura.ImpTrib,   //Importe total de tributos
                        'MonId' 	: factura.MonId, //Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos) 
                        'MonCotiz' 	: factura.MonCotiz,     // Cotización de la moneda usada (1 para pesos argentinos)  
                        'Iva' 		: [ // (Opcional) Alícuotas asociadas al comprobante
                            {
                                'Id' 		: 5, // Id del tipo de IVA (5 para 21%)(ver tipos disponibles) 
                                'BaseImp' 	: factura.ImpNeto, // Base imponible
                                'Importe' 	: factura.ImpIVA // Importe 
                            }
                        ],
                        'FchServDesde':factura.FchServDesde,
                        'FchServHasta':factura.FchServHasta,
                        'FchVtoPago':factura.FchVtoPago,
                    }

                    const res = await afip.ElectronicBilling.createVoucher(data);

                    factura.CAE=res['CAE'];
                    factura.CAEFchVto=res['CAEFchVto'];

                    //Codigo barras
                    //Funcion rellenar ceros a izquierda
                    function zfill(number, width) {
                        const numberOutput = Math.abs(number); /* Valor absoluto del número */
                        const length = number.toString().length; /* Largo del número */ 
                        const zero = "0"; /* String de cero */  
                        
                        if (width <= length) {
                            if (number < 0) {
                                 return ("-" + numberOutput.toString()); 
                            } else {
                                 return numberOutput.toString(); 
                            }
                        } else {
                            if (number < 0) {
                                return ("-" + (zero.repeat(width - length)) + numberOutput.toString()); 
                            } else {
                                return ((zero.repeat(width - length)) + numberOutput.toString()); 
                            }
                        }
                    }
                    
                    factura.codigoBarras=`${CUIT}${zfill(factura.CbteTipo,3)}${zfill(factura.PtoVta,5)}${factura.CAE}${factura.CAEFchVto}`

                    //Calcular digito verificador codigo de barras
                    //Etapa 1: Comenzar desde la izquierda, sumar todos los caracteres ubicados en las posiciones impares.
                    const sumaImpares=0;
                    //Etapa 2: Comenzar desde la izquierda, sumar todos los caracteres que están ubicados en las posiciones pares.
                    const sumaPares=0;
                    
                    let posicionImpar=true;
                    factura.codigoBarras.map(c => {
                        if(posicionImpar){
                            sumaImpares+=parseInt(c,10)
                        }else{
                            sumaPares+=parseInt(c,10)
                        }
                        posicionImpar=!(posicionImpar)
                    })

                    //Etapa 3: Multiplicar la suma obtenida en la etapa 1 por el número 3.
                    const etapa3=sumaImpares*3

                    //Etapa 4: Sumar los resultados obtenidos en las etapas 2 y 3.
                    const etapa4=sumaPares*etapa3

                    //Etapa 5: Buscar el menor número que sumado al resultado obtenido en la etapa 4 dé un número múltiplo de 10. Este será el valor del dígito verificador del módulo 10.
                    factura.digitoVerificador = 10 - ( etapa4 % 10 )

                    factura.codigoBarras=`${factura.codigoBarras}${factura.digitoVerificador}`

                }

                factura.save()

            }

            //Actualizar Saldo
            if(transaccion.medioPago){
                const saldo = new Saldo()
                saldo.transaccion=transaccion.id
                saldo.tipo="FIAT"
                saldo.cuenta=transaccion.medioPago
                saldo.token="ARS"
                
                //Recuperar último saldo y actualizarlo
                const ultimoSaldo = await Saldo.findOne({tipo:saldo.tipo,cuenta:saldo.cuenta,token:saldo.token},{},{sort:{'registro':-1}})
                
                let totalRetenciones = 0;
                if(transaccion.tipoTransaccion==="Venta"||(transaccion.tipoTransaccion==="Compra"&&!(transaccion.medioPago==="MP"))){ //Buscamos las retenciones en caso de transacciones de Venta o Compra (recepción o envío de dinero)
                    //Recuperar monto total de retenciones de la transaccion
                    totalRetenciones = await Retencion.aggregate(
                    [
                        {$match:{
                            transaccion:transaccion._id
                        }},
                        {$group:{
                                _id:null,
                                "totalRetencionesTransaccion" : {$sum:"$monto"}
                        }},
                        {$unset:["_id"]}
                    ]
                    )
                    totalRetenciones = totalRetenciones[0].totalRetencionesTransaccion;
                }
                
                
                if(ultimoSaldo){
                    saldo.monto=ultimoSaldo.monto + transaccion.monto - totalRetenciones
                }else{
                    saldo.monto=transaccion.monto - totalRetenciones
                }
                
                saldo.registro=Date.now()

                saldo.save()
            }

            if(transaccion.token){
                const saldo = new Saldo()
                saldo.transaccion=transaccion.id
                saldo.tipo="CRYPTO"
                saldo.cuenta=transaccion.broker
                saldo.token=transaccion.token

                //Recuperar último saldo y actualizarlo
                const ultimoSaldo = await Saldo.findOne({tipo:saldo.tipo,cuenta:saldo.cuenta,token:saldo.token},{},{sort:{'registro':-1}})
                if(ultimoSaldo){
                    saldo.monto=ultimoSaldo.monto + transaccion.cantidad
                }else{
                    saldo.monto=transaccion.cantidad
                }

                saldo.registro=Date.now()

                await saldo.save() //Esperamos a que se genere el nuevo registro
            }

            //Actualizar Costos
            if(!(transaccion.tipoTransaccion==="Venta")){
                const costo = new Costo()
                costo.transaccion = transaccion.id
                costo.tipo = "CRYPTO"
                costo.cuenta = transaccion.broker
                costo.token = transaccion.token
                
                //Calcular precioCosto
                //Obtener ultimo saldo de la crypto
                const ultimoSaldo = await Saldo.findOne({tipo:costo.tipo,cuenta:costo.cuenta,token:costo.token},{},{sort:{'registro':-1}})
                //Porcentaje de cantidad de crypto agregada
                const porcentajeNuevaCrypto = transaccion.cantidad / ultimoSaldo.monto
                //Prorata costo crypto para crypto agregada
                const prorataCostoNuevaCrypto = porcentajeNuevaCrypto * transaccion.precio
                
                //Obtener ultimo costo de la crypto
                const ultimoCosto = await Costo.findOne({tipo:costo.tipo,cuenta:costo.cuenta,token:costo.token},{},{sort:{'registro':-1}})
                //Porcentaje de cantidad de crypto actual
                const porcentajeCryptoActual = (1 - (transaccion.cantidad / ultimoSaldo.monto))
                //Prorata costo crypto para crypto actual
                const prorataCostoCryptoActual = porcentajeCryptoActual * ultimoCosto.precioCosto
                
                costo.precioCosto = prorataCostoNuevaCrypto + prorataCostoCryptoActual
                
                costo.registro = Date.now()
                costo.save()
            }

            res.json(transaccion);
        }else{ //Si es la primera transaccion de la base de datos
            //Crear nueva transacción
            const transaccion = new Transaccion(req.body);
            
            if(transaccion.tipoTransaccion==="Aporte"){
                
                //Guardamos el creador via JWT
                transaccion.creador = req.usuario.id

                transaccion.registro=Date.now();
                transaccion.save();
                
                //Crear saldo
                const saldo = new Saldo()

                saldo.transaccion=transaccion.id
                
                if(transaccion.medioPago){
                    saldo.tipo="FIAT"
                    saldo.cuenta=transaccion.medioPago
                    saldo.token="ARS"
                    saldo.monto=transaccion.monto
                    saldo.registro=Date.now()
                    saldo.save()
                }

                if(transaccion.token){
                    saldo.tipo="CRYPTO"
                    saldo.cuenta=transaccion.broker
                    saldo.token=transaccion.token
                    saldo.monto=transaccion.cantidad
                    saldo.registro=Date.now()
                    saldo.save()
                }

                //Actualizar Costos
                if(!(transaccion.tipoTransaccion==="Venta")){
                    const costo = new Costo()
                    costo.transaccion = transaccion.id
                    costo.tipo = "CRYPTO"
                    costo.cuenta = transaccion.broker
                    costo.token = transaccion.token
                    costo.precioCosto = transaccion.precio
                    costo.registro = Date.now()
                    costo.save()
                }
            }else{
                res.status(400).send({error:"La primera transaccion debe ser 'Aporte'"})
            }
            res.json(transaccion);
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({error:error})
    }
}

exports.facturaB = async (req, res) =>{
    //Recuperar datos de la transacción
    
    //Definimos el template
    const content = `
    <!doctype html>
    <html>
       <head>
          <meta charset="utf-8">
          <title>PDF Result Template</title>
          <style>
             .invoice-box {
             max-width: 800px;
             margin: auto;
             padding: 30px;
             border: 1px solid #eee;
             box-shadow: 0 0 10px rgba(0, 0, 0, .15);
             font-size: 16px;
             line-height: 24px;
             font-family: 'Helvetica Neue', 'Helvetica',
             color: #555;
             }
             .margin-top {
             margin-top: 50px;
             }
             .justify-center {
             text-align: center;
             }
             .invoice-box table {
             width: 100%;
             line-height: inherit;
             text-align: left;
             }
             .invoice-box table td {
             padding: 5px;
             vertical-align: top;
             }
             .invoice-box table tr td:nth-child(2) {
             text-align: right;
             }
             .invoice-box table tr.top table td {
             padding-bottom: 20px;
             }
             .invoice-box table tr.top table td.title {
             font-size: 45px;
             line-height: 45px;
             color: #333;
             }
             .invoice-box table tr.information table td {
             padding-bottom: 40px;
             }
             .invoice-box table tr.heading td {
             background: #eee;
             border-bottom: 1px solid #ddd;
             font-weight: bold;
             }
             .invoice-box table tr.details td {
             padding-bottom: 20px;
             }
             .invoice-box table tr.item td {
             border-bottom: 1px solid #eee;
             }
             .invoice-box table tr.item.last td {
             border-bottom: none;
             }
             .invoice-box table tr.total td:nth-child(2) {
             border-top: 2px solid #eee;
             font-weight: bold;
             }
             @media only screen and (max-width: 600px) {
             .invoice-box table tr.top table td {
             width: 100%;
             display: block;
             text-align: center;
             }
             .invoice-box table tr.information table td {
             width: 100%;
             display: block;
             text-align: center;
             }
             }
          </style>
       </head>
       <body>
          <div class="invoice-box">
             <table cellpadding="0" cellspacing="0">
                <tr class="top justify-center">
                    <td colspan="1">
                        <table>
                            <tr>
                                <td>
                                    ORIGINAL
                                </td>
                            </tr>
                        <table>
                    </td>
                </tr>
                <tr class="top">
                   <td colspan="2">
                      <table>
                         <tr>
                            <td class="title"><img  src="https://i2.wp.com/cleverlogos.co/wp-content/uploads/2018/05/reciepthound_1.jpg?fit=800%2C600&ssl=1"
                               style="width:100%; max-width:156px;"></td>
                            <td>
                               Datum: 
                            </td>
                         </tr>
                      </table>
                   </td>
                </tr>
                <tr class="information">
                   <td colspan="2">
                      <table>
                         <tr>
                            <td>
                               Customer name: 
                            </td>
                            <td>
                               Receipt number: 
                            </td>
                         </tr>
                      </table>
                   </td>
                </tr>
                <tr class="heading">
                   <td>Bought items:</td>
                   <td>Price</td>
                </tr>
                <tr class="item">
                   <td>First item:</td>
                   <td>123$</td>
                </tr>
                <tr class="item">
                   <td>Second item:</td>
                   <td>12333$$</td>
                </tr>
             </table>
             <br />
             <h1 class="justify-center">Total price: prueba$</h1>
          </div>
       </body>
    </html>
    `;

    try {
        pdf.create(content).toFile('./docs/facturasB/html-pdf.pdf', (error, r) => {
            if (error){
                console.log(e);
            }
            res.json(r)
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({error:error})
    }
}

exports.obtenerTransacciones = async (req, res) =>{
    try {
        const transacciones = await Transaccion.find({creador:req.usuario.id}).sort({registro:-1});
        res.json(transacciones)
    } catch (error) {
        console.log(error);
        res.status(500).send({msg:'Hubo un error'})
    }
}