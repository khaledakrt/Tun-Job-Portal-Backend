const db = require('../../config/db');
const applicationService = require('../../services/application.service');
const quizService = require('../../services/quiz.service');
const notificationCtrl = require('../shared/notification.controller');

exports.getApplications = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                a.id AS id, a.status AS status, a.applied_at AS applied_at, 
                j.title AS job_title, u.id AS candidate_id,
                u.name AS name, u.email AS email, u.phone AS phone, 
                u.address AS address, u.company_logo AS avatar_logo, 
                c.summary AS cv_summary,
                cp.birth_date, cp.linkedin, cp.github, 
                cp.job_status, cp.availability, cp.job_type, cp.location_pref
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.candidate_id = u.id
            LEFT JOIN cvs c ON u.id = c.candidate_id
            LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
            WHERE j.recruiter_id = ? 
            ORDER BY a.applied_at DESC`, [req.user.id]);

        return res.json({ applications: rows });
    } catch (e) {
        console.error('❌ GET APPLICATIONS:', e.message);
        return res.status(500).json({ error: e.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id, status } = req.body;
    try {
        const result = await applicationService.updateApplicationStatus({
            applicationId: id,
            status,
            recruiterId: req.user.id,
        });
        return res.json(result);
    } catch (e) {
        const code = e.statusCode || 500;
        return res.status(code).json({ message: e.message, error: e.message });
    }
};

exports.getCandidateProfileById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, address, company_logo AS avatar_logo FROM users WHERE id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
        return res.json(rows[0]);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getApplicationQuizAnswers = async (req, res) => {
    try {
        const applicationId = Number(req.params.applicationId);
        const data = await quizService.getApplicationQuizAnswers(applicationId, req.user.id);
        return res.json(data);
    } catch (e) {
        const code = e.statusCode || 500;
        return res.status(code).json({ message: e.message });
    }
};

exports.getCandidateCvById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT title, summary, skills, interests, experience, education FROM cvs WHERE candidate_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'CV introuvable pour ce candidat' });
        return res.json(rows[0]);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
