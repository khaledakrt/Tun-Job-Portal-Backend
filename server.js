const app = require('./app');
const { port } = require('./config/env');

app.listen(port, '127.0.0.1', () => {
    console.log(`🚀 Serveur Tun-Job-Portal actif sur http://127.0.0.1:${port}`);
});
