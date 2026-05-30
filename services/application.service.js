const db = require('../config/db');
const notificationCtrl = require('../controllers/shared/notification.controller');
const emailService = require('./email.service');
const quizService = require('./quiz.service');
const { hasQuizSchema } = require('../utils/dbSchema');

async function applyToJob({ jobId, candidateId, quizAnswers }) {
    const [existing] = await db.execute(
        'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
        [jobId, candidateId]
    );
    if (existing.length > 0) {
        const err = new Error('Vous avez déjà transmis votre profil pour cette opportunité !');
        err.statusCode = 400;
        throw err;
    }

    const quizReady = await hasQuizSchema();
    const [jobs] = await db.execute(
        quizReady
            ? `SELECT j.id, j.title, COALESCE(j.has_quiz, 0) AS has_quiz, j.recruiter_id,
                      u.email AS recruiter_email, u.name AS recruiter_name, u.company_name
               FROM jobs j
               JOIN users u ON j.recruiter_id = u.id
               WHERE j.id = ? AND j.status = 'disponible'`
            : `SELECT j.id, j.title, 0 AS has_quiz, j.recruiter_id,
                      u.email AS recruiter_email, u.name AS recruiter_name, u.company_name
               FROM jobs j
               JOIN users u ON j.recruiter_id = u.id
               WHERE j.id = ? AND j.status = 'disponible'`,
        [jobId]
    );
    if (!jobs.length) {
        const err = new Error('Offre introuvable ou fermée.');
        err.statusCode = 404;
        throw err;
    }
    const job = jobs[0];

    if (quizReady && job.has_quiz) {
        await quizService.validateQuizAnswers(jobId, quizAnswers);
    }

    const [insertResult] = await db.execute(
        'INSERT INTO applications (job_id, candidate_id) VALUES (?, ?)',
        [jobId, candidateId]
    );
    const applicationId = insertResult.insertId;

    if (quizReady && job.has_quiz && quizAnswers?.length) {
        await quizService.saveApplicationAnswers(applicationId, quizAnswers);
    }

    const [candidates] = await db.execute('SELECT name, email FROM users WHERE id = ?', [candidateId]);
    const candidate = candidates[0] || { name: 'Un candidat', email: null };

    const alertMessage = `👤 ${candidate.name} a postulé pour votre offre : "${job.title}"`;
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        job.recruiter_id,
        alertMessage,
    ]);

    if (job.recruiter_email) {
        emailService.notifyRecruiterNewApplication({
            recruiterEmail: job.recruiter_email,
            recruiterName: job.recruiter_name,
            candidateName: candidate.name,
            jobTitle: job.title,
        }).catch((e) => console.error('❌ Email recruteur (candidature):', e.message));
    }

    return { applicationId, message: 'Votre candidature a été transmise avec succès au recruteur !' };
}



async function updateApplicationStatus({ applicationId, status, recruiterId }) {
    const [rows] = await db.execute(
        `SELECT a.id, a.candidate_id, a.job_id, a.status AS old_status,
                j.title AS job_title, j.recruiter_id,
                c.email AS candidate_email, c.name AS candidate_name,
                r.company_name, r.name AS r_name, r.address AS r_address, r.company_logo AS r_logo
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         JOIN users c ON a.candidate_id = c.id
         JOIN users r ON j.recruiter_id = r.id
         WHERE a.id = ? AND j.recruiter_id = ?`,
        [applicationId, recruiterId]
    );
    if (!rows.length) {
        const err = new Error('Candidature introuvable.');
        err.statusCode = 404;
        throw err;
    }
    const app = rows[0];

    await db.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);

    // Message mis à jour avec le nom de l'entreprise
    const notificationMessage = `📧 L'entreprise "${app.company_name}" a changé le statut de votre candidature pour "${app.job_title}" en ${status}`;
    
    await notificationCtrl.triggerNotification(
        app.candidate_id,
        notificationMessage
    );

    if (app.candidate_email) {
        emailService.notifyCandidateStatusChange({
            candidateEmail: app.candidate_email,
            candidateName: app.candidate_name,
            jobTitle: app.job_title,
            companyName: app.company_name,
            status,
        }).catch((e) => console.error('❌ Email candidat (statut):', e.message));
    }

    return { message: 'Statut ATS mis à jour avec succès !' };
}


module.exports = { applyToJob, updateApplicationStatus };
