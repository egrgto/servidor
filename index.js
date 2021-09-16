const express = require ('express');
const conectarDB = require('./config/db');
const cors = require('cors');

//Crear el servidor
const app = express();

//Conectar a la base de datos
conectarDB()

//Habilitar CORS
app.use(cors())

//Habilitar express.json (leer datos que coloque el usuario desde json)
app.use(express.json({extended:true}));

//Puerto de la app
const PORT = process.env.PORT || 3000;

//Importar rutas
app.use('/api/usuarios',require('./routes/usuarios'))
app.use('/api/auth',require('./routes/auth'))
app.use('/api/proyectos',require('./routes/proyectos'))
app.use('/api/tareas',require('./routes/tareas'))
app.use('/api/transacciones',require('./routes/transacciones'))
app.use('/api/personas',require('./routes/personas'))
app.use('/api/uploadfile',require('./routes/uploadfile'))
app.use('/api/importBinanceOrderHistory',require('./routes/importBinanceOrderHistory'))
//app.use('/api/conciliar',require('./routes/conciliar'))

//Definir la página principal
app.get('/',(req,res)=>{
    res.send('Hola Mundo')
})

//Arrancar la app
app.listen(PORT,() =>{
    console.log(`El servidor esta funcionando en el puerto ${PORT}`);
})