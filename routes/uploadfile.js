// Ruotas para cargar transacciones
const express = require ('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController')
const auth = require('../middleware/auth')
const { check } = require('express-validator')
const multer = require('multer');

// -> Multer Upload Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `${process.env.UPLOADS}`)
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname} - ${file.fieldname} - ${Date.now()}`)
    }
});

const upload = multer({storage: storage});

//Cargar transacciones
// /api/uploadfile
router.post('/binanceOrderHistoryMultiple', 

    upload.array("uploadfile"), 
    
    auth,
    
    //Reglas de validación
    
    uploadController.binanceOrderHistoryMultiple
);

router.post('/binancePartialDocumentNumbers',
    upload.single("uploadfile"), 
    auth,

    //Reglas de validación

    uploadController.binancePartialDocumentNumbers
)

router.post('/santanderDescargaUltimosMovimientos',
    auth,
    upload.single("uploadfile"),
    uploadController.santanderDescargaUltimosMovimientos
)

router.post('/santanderResumenOnlineEmpresas',
    auth,
    upload.single("uploadfile"),
    uploadController.santanderResumenOnlineEmpresas
)

router.post('/mercadopagoReportesCobros',
    auth,
    upload.single("uploadfile"),
    uploadController.mercadopagoReportesCobros
)

router.post('/insertarDNI',
    auth,
    upload.array("uploadfile"),     
    uploadController.insertarDNI
)

module.exports = router;
