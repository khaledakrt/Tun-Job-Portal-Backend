const db = require('../../config/db');
const { hasQuizSchema } = require('../../utils/dbSchema');

exports.getAllAvailableJobs = async (req, res) => {
    try {
        const quizReady = await hasQuizSchema();

        const sql = quizReady
            ? `
            SELECT j.*, u.company_name, u.company_logo,
                   COALESCE(j.has_quiz, 0) AS has_quiz
            FROM jobs j
            LEFT JOIN users u ON j.recruiter_id = u.id
            WHERE j.status = 'disponible'
            ORDER BY j.id DESC
            `
            : `
            SELECT j.*, u.company_name, u.company_logo
            FROM jobs j
            LEFT JOIN users u ON j.recruiter_id = u.id
            WHERE j.status = 'disponible'
            ORDER BY j.id DESC
            `;

        const [rows] = await db.execute(sql);

        const payload = quizReady
            ? rows
            : rows.map((job) => ({ ...job, has_quiz: 0 }));

        return res.status(200).json(payload);
    } catch (e) {
        console.error('❌ Erreur MySQL getAllAvailableJobs :', e.message);
        return res.status(500).json({
            message: 'Erreur interne du serveur lors de la récupération des offres.',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined,
        });
    }
};

exports.getRecruiterStats = async (req, res) => {
    const recruiter_id = req.user?.id;
    if (!recruiter_id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
        const [appRows] = await db.execute(`
            SELECT COUNT(a.id) AS total_applications 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = ?
        `, [recruiter_id]);

        const [interviewRows] = await db.execute(`
            SELECT COUNT(a.id) AS total_interviews 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = ? AND a.status = 'Entretien'
        `, [recruiter_id]);

        const totalApplications = appRows[0]?.total_applications || 0;
        const totalInterviews = interviewRows[0]?.total_interviews || 0;
        const conversionRate =
            totalApplications > 0
                ? Math.round((totalInterviews / totalApplications) * 100)
                : 0;

        return res.json({
            applicationsCount: totalApplications,
            interviewsCount: totalInterviews,
            conversionRate,
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
