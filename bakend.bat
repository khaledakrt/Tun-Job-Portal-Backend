:: 1. CRÉATION DU DOSSIER DE LA BASE DE DONNÉES (À LA RACINE)
mkdir database
echo. > database\schema.sql
echo. > database\seeds.sql

:: 2. CRÉATION DE L'ARBORESCENCE ARCHITECTURALE DU BACKEND EXPRESS
mkdir backend\config
mkdir backend\middleware
mkdir backend\controllers\auth
mkdir backend\controllers\admin
mkdir backend\controllers\candidate
mkdir backend\controllers\recruiter
mkdir backend\controllers\shared
mkdir backend\routes
mkdir backend\uploads\logos
mkdir backend\uploads\avatars
mkdir backend\uploads\cv_files

:: 3. INITIALISATION DE TOUS LES FICHIERS DU LOGICIEL SUR LE DISQUE
echo. > backend\config\db.js
echo. > backend\config\multer.config.js
echo. > backend\middleware\auth.middleware.js
echo. > backend\middleware\role.middleware.js
echo. > backend\controllers\auth\auth.controller.js
echo. > backend\controllers\admin\admin.controller.js
echo. > backend\controllers\candidate\profile.controller.js
echo. > backend\controllers\candidate\cv.controller.js
echo. > backend\controllers\candidate\application.controller.js
echo. > backend\controllers\recruiter\profile.controller.js
echo. > backend\controllers\recruiter\job.controller.js
echo. > backend\controllers\recruiter\ats.controller.js
echo. > backend\controllers\shared\notification.controller.js
echo. > backend\routes\auth.routes.js
echo. > backend\routes\admin.routes.js
echo. > backend\routes\candidate.routes.js
echo. > backend\routes\recruiter.routes.js
echo. > backend\routes\notification.routes.js
echo. > backend\app.js
echo. > backend\server.js
