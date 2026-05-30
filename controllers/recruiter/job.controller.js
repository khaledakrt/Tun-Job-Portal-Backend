const db = require('../../config/db');
const quizService = require('../../services/quiz.service');
const { hasQuizSchema } = require('../../utils/dbSchema');

async function fetchRecruiterJobs(recruiter_id) {
    const quizReady = await hasQuizSchema();
    if (quizReady) {
        const [rows] = await db.execute(
            `SELECT j.*, COUNT(a.id) AS application_count,
                    COALESCE(j.has_quiz, 0) AS has_quiz,
                    jq.is_active AS quiz_is_active,
                    jq.title AS quiz_title
             FROM jobs j
             LEFT JOIN applications a ON j.id = a.job_id
             LEFT JOIN job_quizzes jq ON j.id = jq.job_id
             WHERE j.recruiter_id = ?
             GROUP BY j.id, jq.id, jq.is_active, jq.title
             ORDER BY j.id DESC`,
            [recruiter_id]
        );
        return rows;
    }
    const [rows] = await db.execute(
        `SELECT j.*, COUNT(a.id) AS application_count
         FROM jobs j
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.recruiter_id = ?
         GROUP BY j.id
         ORDER BY j.id DESC`,
        [recruiter_id]
    );
    return rows.map((r) => ({ ...r, has_quiz: 0, quiz_is_active: null, quiz_title: null }));
}

exports.createJob = async (req, res) => {
    const {
        title, contract_type, location, workplace_type, salary, experience_level,
        missions_desc, profile_desc, skills_desc, languages_desc, expires_at,
        has_quiz, quiz,
    } = req.body;

    const recruiter_id = req.user?.id;
    if (!recruiter_id) {
        return res.status(401).json({ message: "Erreur d'authentification. Veuillez vous reconnecter." });
    }

    try {
        const formattedDate = expires_at && String(expires_at).trim() !== '' ? expires_at : null;
        const quizReady = await hasQuizSchema();

        if (has_quiz && quiz?.questions?.length && !quizReady) {
            return res.status(400).json({
                message: 'Le module quiz n\'est pas activé en base. Exécutez database/migrations/001_quiz_module.sql',
            });
        }

        let result;
        if (quizReady) {
            [result] = await db.execute(
                `INSERT INTO jobs 
                (recruiter_id, title, contract_type, location, workplace_type, salary, experience_level, 
                 missions_desc, profile_desc, skills_desc, languages_desc, status, expires_at, has_quiz) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    recruiter_id, title, contract_type, location, workplace_type,
                    salary || null, experience_level, missions_desc, profile_desc,
                    skills_desc || null, languages_desc || null, 'disponible', formattedDate,
                    has_quiz ? 1 : 0,
                ]
            );
        } else {
            [result] = await db.execute(
                `INSERT INTO jobs 
                (recruiter_id, title, contract_type, location, workplace_type, salary, experience_level, 
                 missions_desc, profile_desc, skills_desc, languages_desc, status, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    recruiter_id, title, contract_type, location, workplace_type,
                    salary || null, experience_level, missions_desc, profile_desc,
                    skills_desc || null, languages_desc || null, 'disponible', formattedDate,
                ]
            );
        }

        const jobId = result.insertId;

        if (quizReady && has_quiz && quiz?.questions?.length) {
            await quizService.upsertQuizForJob(jobId, recruiter_id, quiz);
        }

        return res.status(201).json({
            message: "Annonce d'emploi publiée avec succès !",
            jobId,
        });
    } catch (e) {
        return res.status(400).json({ message: "Impossible d'insérer l'offre.", error: e.message });
    }
};

exports.getRecruiterJobs = async (req, res) => {
    const recruiter_id = req.user?.id;
    if (!recruiter_id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
        const rows = await fetchRecruiterJobs(recruiter_id);
        return res.json(rows);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        await db.execute('DELETE FROM jobs WHERE id = ? AND recruiter_id = ?', [
            req.params.id,
            req.user.id,
        ]);
        return res.status(200).json({ success: true, message: 'Annonce supprimée avec succès !' });
    } catch (e) {
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
    }
};

exports.toggleJobStatus = async (req, res) => {
    const { jobId } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT status FROM jobs WHERE id = ? AND recruiter_id = ?',
            [jobId, req.user.id]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'Annonce introuvable.' });
        }
        const newStatus = rows[0].status === 'disponible' ? 'fermé' : 'disponible';
        await db.execute('UPDATE jobs SET status = ? WHERE id = ?', [newStatus, jobId]);
        return res.status(200).json({ message: 'Statut mis à jour !', newStatus });
    } catch (e) {
        return res.status(500).json({ message: 'Erreur interne.', error: e.message });
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
            WHERE j.recruiter_id = ?`, [recruiter_id]);

        const [interviewRows] = await db.execute(`
            SELECT COUNT(a.id) AS total_interviews 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = ? AND LOWER(a.status) LIKE '%entre%'`, [recruiter_id]);

        const totalApplications = appRows[0]?.total_applications || 0;
        const totalInterviews = interviewRows[0]?.total_interviews || 0;
        const conversionRate = totalApplications > 0
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
