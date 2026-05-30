const db = require('../../config/db');
const applicationService = require('../../services/application.service');

exports.apply = async (req, res) => {
    const candidate_id = req.user?.id;
    if (!candidate_id) {
        return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
    }

    const job_id = Number(req.body.job_id);
    const quiz_answers = req.body.quiz_answers || [];

    try {
        const result = await applicationService.applyToJob({
            jobId: job_id,
            candidateId: candidate_id,
            quizAnswers: quiz_answers,
        });
        return res.status(201).json(result);
    } catch (e) {
        const code = e.statusCode || 500;
        if (code >= 500) console.error('❌ apply:', e.message);
        return res.status(code).json({ message: e.message || 'Erreur lors de la postulation.' });
    }
};

exports.getHistory = async (req, res) => {
    const candidate_id = req.user?.id;
    if (!candidate_id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
        const [rows] = await db.execute(`
            SELECT 
                a.status, a.applied_at, a.job_id, 
                j.title AS job_title, j.recruiter_id,
                j.contract_type, j.location, j.missions_desc, j.profile_desc,
                j.skills_desc, j.languages_desc, j.expires_at,
                u.company_name, u.company_logo
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON j.recruiter_id = u.id
            WHERE a.candidate_id = ? 
            ORDER BY a.applied_at DESC
        `, [candidate_id]);

        return res.json({ history: rows });
    } catch (e) {
        console.error('❌ getHistory:', e.message);
        return res.status(500).json({ error: e.message });
    }
};
