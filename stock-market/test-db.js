const tedious = require('tedious');
const config = {
  authentication: {
    options: {
      userName: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'yourStrong(!)Password',
    },
    type: 'default',
  },
  server: process.env.DB_HOST || 'localhost',
  options: {
    database: process.env.DB_NAME || 'StockMarketDB',
    encrypt: true,
    trustServerCertificate: true,
    port: Number(process.env.DB_PORT) || 1433,
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
