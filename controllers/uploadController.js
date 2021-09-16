const fs = require('fs');
const excelToJson = require('convert-excel-to-json');
const pdf = require('pdf-parse');
const PDFParser = require("pdf2json");
const csv = require('fast-csv');
const UploadBinanceOrderHistory = require('../models/UploadBinanceOrderHistory')
const BinanceOrderHistory = require('../models/BinanceOrderHistory')

const UploadSantanderUltimosMovimientos = require('../models/UploadSantanderUltimosMovimientos')
const UploadMercadopagoReportesCobros = require('../models/UploadMercadopagoReportesCobros')

const Tesseract = require('tesseract.js')
 
const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
}


//Get Binance persons ids
const {getOrderMatchListByMerchantAxios} = require('../config/axios')

//Funciones para formateo de datos
const onlyNumberInt = (t) => {
    if(t.trim()===''){
        return 0
    } else {
        return parseInt(t.replace(/\D/g,''));
    }
}

const onlyNumberText = (t) => {
    if(t.trim()===''){
        return 0
    } else {
        return t.replace(/\D/g,'');
    }
}

const onlyNumberInt2 = (t) => {
    return parseInt(t.match(/\d{8,11}/g)[0]);
}

const onlyDNIText = (t) => {
    return t.match(/\d{2}[\.\,]{1}\d{3}[\.\,]{1}\d{3}/g)[0];
}

const onlyText = (t) => {
    return t.match(/\D/g).join('').trim().replace('/',' ').replace(',',' ');
}

const multiSearchAnd = (text, searchWords) => (
    searchWords.every((el) => {
        return text.match(new RegExp(el,"i"))
    })
)

const multiSearchOr = (text, searchWords) => (
    searchWords.some((el) => {
        return text.match(new RegExp(el,"i"))
    })
)

const toFloatPointSeparated = (t) => {
    if(multiSearchOr(t,[/-/g,/\(/g])){
        t = t.replace(/-/g,'')
        t = t.replace(/\(/g,'')
        t = t.replace(/\)/g,'')
        t = t.replace(/\$/g,'')
        t = t.replace(/\./g,'')
        t = t.replace(',','.')
        t = t.trim()
        return parseFloat('-' + t)
    } else {
        t = t.replace(/\$/g,'')
        t = t.replace(/\./g,'')
        t = t.replace(',','.')
        t = t.trim()
        return parseFloat(t)
    }
}

const textToFloat = (t) => {
    if(t.trim()===''){
        return 0
    } else {
        return parseFloat(t.trim())
    }
}

const parseDateDDMM20YY = d => {
    const parts = d.split('/')
    return new Date(`20${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`)
}

const parseDateDDMMYYYY = d => {
    const parts = d.split('/')
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`)
}

const parseDateDDMMYYYY_HHMMSS = d => {
    if(d!==''){
        const timestamp = d.split(' ')
        const date = timestamp[0].split('/')
        const time = timestamp[1].split(':')
        
        return new Date(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:${time[2]}Z`)
    } else {
        ''
    }
}

exports.importBinanceOrderHistory = async (req, res) =>{

    //Inicializar variables


    //Revisar si hay errores

    try {
        const result = {reg:0,data:[],errores:[]}
        let paginas = 1;
        const {rows,orderStatus,startDate,endDate} = req.body;
        const fechaIni = Date.parse(startDate);
        const fechaFin = Date.parse(endDate);
        
        const resultado = await getOrderMatchListByMerchantAxios.post('/getOrderMatchListByMerchant',
            { //body
                rows:rows,
                page:1,
                orderStatus:orderStatus,
                startDate:fechaIni,
                endDate:fechaFin
            },
            { //headers
                headers:{
                    csrftoken:req.headers.csrftoken,
                    cookie:req.headers.cookie,
                    'user-agent':req.headers['user-agent'],
                    'content-type':req.headers['content-type'],
                    clienttype:req.headers.clienttype,
                    'Content-Length':req.headers['Content-Length']
                }
            })
            
        if((resultado.data.total % rows) > 0){
            paginas = Math.trunc(resultado.data.total / rows) + 1;
        }else {
            paginas = resultado.data.total / rows;
        }

        const binanceOrderHistory={
            // OrderNumber,
            // Account,
            // AdID,
            // Amount,
            // AssetType,
            // BuyerName,
            // BuyerPhone,
            // ExchangeRate,
            // MatchTimeUTC,
            // OrderSource,
            // OrderType,
            // PaymentMethod,
            // Price,
            // Quantity,
            // Recipient,
            // SellerName,
            // SellerPhone,
            // Status,
            // TradeDescription,
            // UserID,
            // numDocumentoParcial,
            // numDocumento,
            // estado
        }

        await Promise.all(
            resultado.data.data.map(async o => {
                const {orderNumber,advOrderNumber,buyerName,payType,payAccount,orderStatus,asset,amount,price,totalPrice,fiatUnit,remark,createTime,idNumber,payee,sellerName,tradeType} = o

                binanceOrderHistory.OrderNumber = orderNumber
                binanceOrderHistory.Account = payAccount
                binanceOrderHistory.AdID = advOrderNumber
                binanceOrderHistory.Amount = parseFloat(totalPrice)
                binanceOrderHistory.AssetType = asset
                binanceOrderHistory.BuyerName = buyerName
                binanceOrderHistory.MatchTimeUTC = createTime
                binanceOrderHistory.OrderSource = "P2P"
                if(tradeType==="BUY"){
                    binanceOrderHistory.OrderType = "Sell"
                } else {
                    binanceOrderHistory.OrderType = "Buy"
                }
                binanceOrderHistory.PaymentMethod = payType 
                binanceOrderHistory.Price= parseFloat(price)
                binanceOrderHistory.Quantity=parseFloat(amount)
                binanceOrderHistory.Recipient=payee
                binanceOrderHistory.SellerName=sellerName
                binanceOrderHistory.Status=orderStatus
                binanceOrderHistory.TradeDescription=remark
                binanceOrderHistory.numDocumentoParcial=onlyNumberText(idNumber)
                binanceOrderHistory.estado="new"
                binanceOrderHistory.registro=Date.now()

                //Guardamos el creador via JWT
                binanceOrderHistory.creador = req.usuario.id

                const regActualizado = await BinanceOrderHistory.findOneAndUpdate({OrderNumber:orderNumber},{$set:binanceOrderHistory},{new:true,upsert:true});
        
                if(regActualizado){
                    result.data.push(regActualizado);
                    result.reg++
                    //console.log(`${orderNumber} | ${buyerName} | ${idNumber}`);
                } else {
                    null
                    //const { AdID,UserID,OrderType,PaymentMethod } = o
                }

            })
        )
        
        return res.json(result)

        //Paginado automático
        for (let i=1; i< paginas; i++) {

            const resultado = await getOrderMatchListByMerchantAxios.post('/getOrderMatchListByMerchant',
            { //body
                rows:rows,
                page:i+1,
                orderStatus:orderStatus
            },
            { //headers
                headers:{
                    csrftoken:req.headers.csrftoken,
                    cookie:req.headers.cookie,
                    'user-agent':req.headers['user-agent'],
                    'content-type':req.headers['content-type'],
                    clienttype:req.headers.clienttype,
                    'Content-Length':req.headers['Content-Length']
                }
            })

            await Promise.all(
                resultado.data.data.map(async o => {
                    const {orderNumber,buyerName} = o
        
                    const idNumber = onlyNumberText(o.idNumber)

                    const regActualizado = await UploadBinanceOrderHistory.findOneAndUpdate({OrderNumber:orderNumber,numDocumentoParcial:null},{$set:{numDocumentoParcial:idNumber}},{new:true});
        
                    if(regActualizado){
                        result.data.push(regActualizado);
                        result.reg++
                        //console.log(`${orderNumber} | ${buyerName} | ${idNumber}`);
                    }
                    
                })
            )
        }

        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.binanceOrderHistoryMultiple = async (req, res) =>{

    //Inicializar variables
    const estadosbinanceOrderHistory={terminado:'已完成'}
    const result = {reg:0,data:[],errores:[]}

    try {
        await Promise.all(
            req.files.map(async file => {
                //Extraer datos del req
                const filePath = process.env.UPLOADS + file.filename;
                
                // -> Read Excel File to Json Data
                const excelData = excelToJson({
                    sourceFile: filePath,
                    sheets:[{
                        // Excel Sheet Name
                        name: 'sheet1',
            
                        // Header Row -> be skipped and will not be present at our result object.
                        header:{
                        rows: 1
                        },
                
                        // Mapping columns to keys
                        columnToKey: {
                            A:'OrderNumber',
                            B:'AdID',
                            C:'UserID',
                            D:'OrderType',
                            E:'PaymentMethod',
                            F:'Recipient',
                            G:'Account',
                            H:'AssetType',
                            I:'Quantity',
                            J:'Price',
                            K:'Amount',
                            L:'Status',
                            M:'ExchangeRate',
                            N:'MatchTimeUTC',
                            O:'TradeDescription',
                            P:'BuyerName',
                            Q:'BuyerPhone',
                            R:'SellerName',
                            S:'SellerPhone',
                            T:'OrderSource'
                        }
                    }]
                });

                await Promise.all(
                    excelData.sheet1.map(async row => {
                        try {
                            //Estandarizar campos
                            row.MatchTimeUTC=Date.parse(row.MatchTimeUTC);
                            row.Amount=parseFloat(row.Amount);
                            row.Quantity=parseFloat(row.Quantity);
                            row.Price=parseFloat(row.Price);
                            if(row.ExchangeRate===''){
                                row.ExchangeRate=0;
                            } else {
                                row.ExchangeRate=parseFloat(row.ExchangeRate);
                            }
                            

                            if(row.Status === estadosbinanceOrderHistory.terminado){
                                
                                if(!(await UploadBinanceOrderHistory.findOne({OrderNumber:row.OrderNumber}))){
                                    const upload = new UploadBinanceOrderHistory(row)
                                    
                                    //Guardamos el creador via JWT
                                    upload.creador = req.usuario.id

                                    //Marcamos transaccion como nueva
                                    upload.estado = "new"
                                    
                                    upload.registro=Date.now()
                                    
                                    try {
                                        const u = await UploadBinanceOrderHistory.findOneAndUpdate({OrderNumber:upload.orderNumber},upload,{new:true,upsert:true})
                                        result.data.push({OrderNumber:u.OrderNumber})
                                        result.reg++
                                    } catch (error) {
                                        result.errores.push(error)
                                    }
                                    
                                    // if(reg===0){
                                    //     try {
                                    //         const ix = await UploadBinanceOrderHistory.ensureIndexes({OrderNumber:1})
                                    //         console.log(ix);    
                                    //     } catch (error) {
                                    //         res.json(error)
                                    //     }
                                    // }

                                }  
                            }
                                          
                        } catch (error) {
                            return res.status(500).send({msg:error})
                        }
                    })
                )

                fs.unlinkSync(filePath);
            })
        )

        res.json({
            msg: 'Files upload/import successfully!',result:result, files: req.files
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.binancePartialDocumentNumbers = async (req, res) =>{

    //Inicializar variables
    
    
    //Revisar si hay errores
    
    try {
        const result = {data:[],reg:0};
        let paginas = 1;
        const {rows,orderStatus,startDate,endDate} = req.body;
        const fechaIni = Date.parse(startDate);
        const fechaFin = Date.parse(endDate);
        
        const resultado = await getOrderMatchListByMerchantAxios.post('/getOrderMatchListByMerchant',
            { //body
                rows:rows,
                page:1,
                orderStatus:orderStatus,
                startDate:fechaIni,
                endDate:fechaFin
            },
            { //headers
                headers:{
                    csrftoken:req.headers.csrftoken,
                    cookie:req.headers.cookie,
                    'user-agent':req.headers['user-agent'],
                    'content-type':req.headers['content-type'],
                    clienttype:req.headers.clienttype,
                    'Content-Length':req.headers['Content-Length']
                }
            })
            
        if((resultado.data.total % rows) > 0){
            paginas = Math.trunc(resultado.data.total / rows) + 1;
        }else {
            paginas = resultado.data.total / rows;
        }

        await Promise.all(
            resultado.data.data.map(async o => {
                const {orderNumber,buyerName} = o

                const idNumber = onlyNumberText(o.idNumber)

                const regActualizado = await UploadBinanceOrderHistory.findOneAndUpdate({OrderNumber:orderNumber,numDocumentoParcial:null},{$set:{numDocumentoParcial:idNumber}},{new:true});
        
                if(regActualizado){
                    result.data.push(regActualizado);
                    result.reg++
                    //console.log(`${orderNumber} | ${buyerName} | ${idNumber}`);
                } else {
                    null
                    //const { AdID,UserID,OrderType,PaymentMethod } = o
                }

            })
        )

        //Paginado automático
        for (let i=1; i< paginas; i++) {

            const resultado = await getOrderMatchListByMerchantAxios.post('/getOrderMatchListByMerchant',
            { //body
                rows:rows,
                page:i+1,
                orderStatus:orderStatus
            },
            { //headers
                headers:{
                    csrftoken:req.headers.csrftoken,
                    cookie:req.headers.cookie,
                    'user-agent':req.headers['user-agent'],
                    'content-type':req.headers['content-type'],
                    clienttype:req.headers.clienttype,
                    'Content-Length':req.headers['Content-Length']
                }
            })

            await Promise.all(
                resultado.data.data.map(async o => {
                    const {orderNumber,buyerName} = o
        
                    const idNumber = onlyNumberText(o.idNumber)

                    const regActualizado = await UploadBinanceOrderHistory.findOneAndUpdate({OrderNumber:orderNumber,numDocumentoParcial:null},{$set:{numDocumentoParcial:idNumber}},{new:true});
        
                    if(regActualizado){
                        result.data.push(regActualizado);
                        result.reg++
                        //console.log(`${orderNumber} | ${buyerName} | ${idNumber}`);
                    }
                    
                })
            )
        }

        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.santanderDescargaUltimosMovimientos = async (req,res) => {
    try {
        const filePath = process.env.UPLOADS + req.file.filename;
        
        const data = fs.readFileSync(filePath,'latin1')

        const resultado = {
            cuenta:{},
            detalle:[{}]
            /*,
            codOperativo:[{
                concepto:[]
            }]
            */
        };
        const splitted = data.toString().split("\r\n");

        const flags = {
            lineaActual:0,
            ultimosMovimientos:{
                lineaTipoCuenta:2,
                lineaCabecera:4,
                lineaDetalle:5,
                activo:false
            }
        }
        
        splitted.map(async linea => {
            try {
                flags.lineaActual++
                if(linea==="Últimos Movimientos"){
                    flags.ultimosMovimientos.lineaTipoCuenta += flags.lineaActual
                    flags.ultimosMovimientos.lineaCabecera += flags.lineaActual
                    flags.ultimosMovimientos.lineaDetalle += flags.lineaActual
                    flags.ultimosMovimientos.activo = true
                }
                if(flags.ultimosMovimientos.activo && flags.lineaActual === flags.ultimosMovimientos.lineaTipoCuenta){
                    resultado.cuenta.tipo = linea.split('Nro.')[0].trim()
                    resultado.cuenta.numero = linea.split('Nro.')[1].trim()
                    if(linea.includes("Pesos")){
                        resultado.cuenta.moneda = "ARS"
                    }
                }
                if(flags.ultimosMovimientos.activo && flags.lineaActual === flags.ultimosMovimientos.lineaCabecera){
                    null
                }
                if(flags.ultimosMovimientos.activo && flags.lineaActual >= flags.ultimosMovimientos.lineaDetalle){
                    if(linea!==''){
                        //Parsear detalle
                        const det = linea.split('\t')

                        const detalle = {}
                    
                        detalle.tipoCuenta = resultado.cuenta.tipo
                        detalle.numeroCuenta = resultado.cuenta.numero
                        detalle.monedaCuenta = resultado.cuenta.moneda

                        detalle.fecha = parseDateDDMMYYYY(det[0])
                        detalle.sucOrigen = det[1]
                        detalle.descSuc = det[2]
                        detalle.codOperativo = det[3]
                        detalle.referencia = det[4]
                        detalle.concepto = det[5].trim()
                        detalle.importe = toFloatPointSeparated(det[6])
                        detalle.saldo = toFloatPointSeparated(det[7])
                        detalle.linea = flags.lineaActual
                        
                        //Recuperamos numero documento dependiendo el codigo operacion
                        const codOp = {
                            TransferenciaRecibidaBanelco:"2850",
                            DebitoPorCredin:"2794",
                            CreditoTransfPorOnlineBanking:"1257",
                            TransferenciaCtasMobileBanking:"1430",
                            CreditoCredin:"2767",
                            TransferenciasInmediatas:"4805"
                        }

                        switch(detalle.codOperativo) {
                            case codOp.TransferenciaRecibidaBanelco:
                            case codOp.TransferenciasInmediatas:
                                detalle.numDocumento = onlyNumberInt2(detalle.concepto)
                                detalle.nombre=onlyText(detalle.concepto.split('Originante')[1])
                                break
                            case codOp.TransferenciaCtasMobileBanking:
                                detalle.numDocumento = onlyNumberInt2(detalle.concepto)
                                detalle.nombre=onlyText(detalle.concepto.split('Ctas Mobile Banking  -')[1].split('Var')[0])
                                break
                            case codOp.CreditoTransfPorOnlineBanking:
                                detalle.numDocumento = onlyNumberInt2(detalle.concepto)
                                detalle.nombre=onlyText(detalle.concepto.split('Transf Por Online Banking  -')[1].split('Var')[0])
                                break
                            case codOp.CreditoCredin:
                                detalle.numDocumento = onlyNumberInt2(detalle.concepto)
                                break
                            case codOp.DebitoPorCredin:
                                //Debito Por Credin  - Id Credin 2010050000683632842727 Cuit 30715962906
                                const splitted = detalle.concepto.split(' ')
                                detalle.numDocumento = onlyNumberInt(splitted[ splitted.length -1 ])
                                break
                            default:
                                null
                        }

                        let upload = await UploadSantanderUltimosMovimientos.findOne({referencia:detalle.referencia})
                        if(!upload){
                            upload = new UploadSantanderUltimosMovimientos(detalle)
                            
                            //Guardamos el creador via JWT
                            upload.creador = req.usuario.id

                            //Marcamos transaccion como nueva
                            upload.estado = "new"
                            
                            upload.registro=Date.now()
                            upload.save()
                        }

                    } else {
                        flags.ultimosMovimientos.activo=false
                    }
                    
                }
            } catch (error) {
                console.log(error);
                res.status(500).send({msg:error})
            }
        })
        fs.unlinkSync(filePath);
        //res.json(resultado);
        res.json({
            'msg': 'File upload/import successfully!', 'file': req.file
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

//pdf-parse
exports.santanderResumenOnlineEmpresas = async (req, res) =>{
    try {
        const filePath = process.env.UPLOADS + req.file.filename;
        
        const pdfParser = new PDFParser();
        
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const Pages = pdfData.formImage.Pages
            const resultado = {
                informeSaldosConsolidados : {},
                detalleSaldoyMovimientos : [{
                    cuentaTipo:'',
                    cuentaNumero:0,
                    cuentaCBU:0,
                    cuentaSaldo:0,
                    cuentaDetalle:[{
                        fecha,
                        concepto,
                        comprobante,
                        debito,
                        credito,
                        saldo
                    }]
                }]
            };
            const flags = {
                lineaActual:0,
                cuitEmpresa:{
                    activo:true
                },
                fechaResumen:{
                    activo:true
                },
                informeSaldosConsolidados:{
                    activo:false,
                    lineaCCARS:2,
                    lineaCCUSD:3
                },
                detalleSaldoyMovimientos:{
                    tipoCuenta:{
                        activo:false,
                        lineaTC:7,
                        lineaNC:8,
                        lineaCBU:9,
                        lineaInicio:10
                    },
                    SALDORESUMENANTERIOR:{
                        activo:false,
                        lineaSaldo:1
                    }
                }
            }

            //return res.json(flags);
            //const jsonPdfData = JSON.stringify(pdfData)
            Pages.map(page => {
                page.Texts.map(R=>{
                    flags.lineaActual++
                    //console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    const linea = decodeURIComponent(R.R[0].T).trim();
                    
                    //Recupero cuit empresa del reumen
                    if(flags.cuitEmpresa.activo && linea.includes("CUIT")){
                        resultado.cuitEmpresa = onlyNumberInt(linea)
                        flags.cuitEmpresa.activo = false
                    }

                    //Recupero fecha del resumen
                    if(flags.fechaResumen.activo && multiSearchAnd(linea,[".",":","FECHA","/"])){
                        const date = linea.trim().slice(-8)
                        resultado.fechaResumen = parseDateDDMM20YY(date)
                        flags.fechaResumen.activo = false
                    }

                    //Recupero informe de saldos consolidados
                    if(linea==="INFORME DE SALDOS CONSOLIDADOS"){
                        flags.informeSaldosConsolidados.activo = true;
                        flags.informeSaldosConsolidados.lineaCCARS = flags.informeSaldosConsolidados.lineaCCARS + flags.lineaActual;
                        flags.informeSaldosConsolidados.lineaCCUSD = flags.informeSaldosConsolidados.lineaCCUSD + flags.lineaActual;
                        console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    }
                    if(flags.informeSaldosConsolidados.activo && flags.lineaActual===flags.informeSaldosConsolidados.lineaCCARS){
                        resultado.informeSaldosConsolidados.CCARS=toFloatPointSeparated(linea)
                        console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    }
                    if(flags.informeSaldosConsolidados.activo && flags.lineaActual===flags.informeSaldosConsolidados.lineaCCUSD){
                        flags.informeSaldosConsolidados.activo = false;
                        resultado.informeSaldosConsolidados.CCUSD=toFloatPointSeparated(linea);
                        console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    }

                    //Recupero información de cuenta

                    
                    //Recupero saldo inicial
                    if(linea.includes("SALDO RESUMEN ANTERIOR")){
                        flags.detalleSaldoyMovimientos.SALDORESUMENANTERIOR.lineaSaldo+=flags.lineaActual
                        flags.detalleSaldoyMovimientos.SALDORESUMENANTERIOR.activo = true
                        console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    }
                    if(flags.detalleSaldoyMovimientos.SALDORESUMENANTERIOR.activo && flags.lineaActual===flags.detalleSaldoyMovimientos.SALDORESUMENANTERIOR.lineaSaldo){
                        resultado.detalleSaldoyMovimientos.saldoResumenAnterior = toFloatPointSeparated(linea)
                        console.log(flags.lineaActual +': '+ decodeURIComponent(R.R[0].T));
                    }

                    //Recupero transacciones



                })
            })
            fs.unlinkSync(filePath);
            res.json({resultado})
        });
    
        pdfParser.loadPDF(filePath);

        // res.json({
        //     msg: 'File upload/import successfully!', 
        //     file: req.file
        // });

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

exports.mercadopagoReportesCobros = async (req,res) => {
    try {
        //Extraer datos del req
        const filePath = process.env.UPLOADS + req.file.filename;
        
        // -> Read Excel File to Json Data
        const excelData = excelToJson({
            sourceFile: filePath,
            sheets:[{
                // Excel Sheet Name
                name: 'export-activities',
    
                // Header Row -> be skipped and will not be present at our result object.
                header:{
                rows: 1
                },
        
                // Mapping columns to keys
                columnToKey: {
                    A:'date_created',
                    B:'date_approved',
                    C:'date_released',
                    D:'counterpart_name',
                    E:'counterpart_nickname',
                    F:'counterpart_email',
                    G:'counterpart_phone_number',
                    H:'buyer_document',
                    I:'item_id',
                    J:'reason',
                    K:'external_reference',
                    L:'seller_custom_field',
                    M:'operation_id',
                    //N:'operation_id',
                    O:'status',
                    P:'status_detail',
                    Q:'operation_type',
                    R:'transaction_amount',
                    S:'mercadopago_fee',
                    T:'marketplace_fee',
                    U:'shipping_cost',
                    V:'coupon_fee',
                    W:'net_received_amount',
                    X:'installments',
                    Y:'payment_type',
                    Z:'amount_refunded',
                    AA:'refund_operator',
                    AB:'claim_id',
                    AC:'chargeback_id',
                    AD:'marketplace',
                    AE:'order_id',
                    AF:'merchant_order_id',
                    AG:'campaign_id',
                    AH:'campaign_name',
                    AI:'activity_url',
                    AJ:'id',
                    AK:'shipment_status',
                    AL:'buyer_address',
                    AM:'tracking_number',
                    AN:'operator_name',
                    AO:'store_id',
                    AP:'pos_id',
                    AQ:'external_id',
                    AR:'financing_fee'
                }
            }]
        });
        
        excelData['export-activities'].map(async row => {
            try {
                
                //Estandarizar campos
                row.date_created=parseDateDDMMYYYY_HHMMSS(row.date_created);
                row.date_approved=parseDateDDMMYYYY_HHMMSS(row.date_approved);
                row.date_released=parseDateDDMMYYYY_HHMMSS(row.date_released);
                
                row.buyer_document=onlyNumberInt(row.buyer_document);
                row.operation_id=onlyNumberInt(row.operation_id);
                row.transaction_amount=textToFloat(row.transaction_amount);
                row.mercadopago_fee=textToFloat(row.mercadopago_fee);
                row.marketplace_fee=textToFloat(row.marketplace_fee);
                row.shipping_cost=textToFloat(row.shipping_cost);
                row.coupon_fee=textToFloat(row.coupon_fee);
                row.net_received_amount=textToFloat(row.net_received_amount);
                row.installments=onlyNumberInt(row.installments);
                row.amount_refunded=textToFloat(row.amount_refunded);
                row.claim_id=onlyNumberInt(row.claim_id);
                row.chargeback_id=onlyNumberInt(row.chargeback_id);
                row.order_id=onlyNumberInt(row.order_id);
                row.merchant_order_id=onlyNumberInt(row.merchant_order_id);
                row.campaign_id=onlyNumberInt(row.campaign_id);
                row.id=onlyNumberInt(row.id);
                row.tracking_number=onlyNumberInt(row.tracking_number);
                row.store_id=onlyNumberInt(row.store_id);
                row.pos_id=onlyNumberInt(row.pos_id);
                row.external_id=onlyNumberInt(row.external_id);
                row.financing_fee=textToFloat(row.financing_fee);
                
                let upload = await UploadMercadopagoReportesCobros.findOne({operation_id:row.operation_id})
                
                if(!upload){
                    upload = new UploadMercadopagoReportesCobros(row)
                    
                    //Guardamos el creador via JWT
                    upload.creador = req.usuario.id

                    //Marcamos transaccion como nueva
                    upload.estado = "new"
                    
                    upload.registro=Date.now()
                    
                    upload.save()
                }

            } catch (error) {
                console.log(error);
                res.status(500).send({msg:error,prueba:'prueba'})
            }
        });

        fs.unlinkSync(filePath);

        res.json({
            'msg': 'File uploaded/import successfully!', 'file': req.file
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send({msg:error})
    }
}

exports.insertarDNI = async (req, res) =>{

    const result = {reg:0,data:[],errores:[]}

    try {
        await Promise.all(
            req.files.map(async file => {
                //Extraer datos del req
                const filePath = process.env.UPLOADS + file.filename;

                let image = fs.readFileSync(filePath,{
                    encoding:null
                })
                
                const {data:{text}} = await Tesseract.recognize(image)

                console.log(onlyNumberInt(onlyDNIText(text)) + ' | ' + file.filename);

                fs.unlinkSync(filePath);
            })
        )

        res.json({
            msg: 'Files upload/import successfully!',result:result, files: req.files
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({msg:error})
    }
}

/**********************************************************
//Recuperar codigos operativos

if(flags.lineaActual === flags.ultimosMovimientos.lineaDetalle){
    resultado.codOperativo[0].cod = detalle.codOperativo
    resultado.codOperativo[0].concepto[0] = detalle.concepto
} else {
    
    const indiceCod = resultado.codOperativo.findIndex((element,index) => {
        if(element.cod === detalle.codOperativo) {
            return true
        }
    })

    const existeCod = -1 !== indiceCod

    if(existeCod){
        const indiceConcepto = resultado.codOperativo[indiceCod].concepto.findIndex((element,index) => {
            if(element === detalle.concepto) {
                return true
            }
        })

        const existeConcepto = -1 !== indiceConcepto
        
        if(!existeConcepto){
            resultado.codOperativo[indiceCod].concepto.push(detalle.concepto)
        }

    } else {
        const nuevoCodOperativo = {
            cod:detalle.codOperativo,
            concepto:[detalle.concepto]
        }
        resultado.codOperativo.push(nuevoCodOperativo)
    }
}
/**********************************************************/

/**********************************************************
//Recuperar detalle y guardarlo en JSON

if(flags.lineaActual === flags.ultimosMovimientos.lineaDetalle){
    resultado.detalle[0] = detalle
} else {
    resultado.detalle.push(detalle)
}
/**********************************************************/