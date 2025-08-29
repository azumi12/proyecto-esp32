// src/config/db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',      // Servidor MySQL
  user: 'root',           // Usuario de MySQL (cámbialo si no es root)
  password: '',           // Contraseña de MySQL
  database: 'registros' // Tu base de datos en XAMPP
});

// Conectar y mostrar estado
connection.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos MySQL');
  }
});

module.exports = connection;
