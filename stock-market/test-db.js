require('dotenv').config();
const tedious = require('tedious');
const config = {
  authentication: {
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    type: 'default',
  },
  server: process.env.DB_HOST,
  options: {
    database: process.env.DB_NAME,
    encrypt: true,
    trustServerCertificate: true,
    port: Number(process.env.DB_PORT),
  },
};

const connection = new tedious.Connection(config);
connection.on('connect', (err) => {
  if (err) {
    console.error('Connection Failed', err);
    process.exit(1);
  } else {
    console.log('Connected');
    process.exit(0);
  }
});
connection.connect();
