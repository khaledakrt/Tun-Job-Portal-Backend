const express = require('express');
const app = express();

// Render fournit automatiquement la variable d'environnement PORT (par défaut 10000)
const port = process.env.PORT || 3000; 

app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
