const db = require('../config/db');

async function getQuizByJobId(jobId, { includeCorrect = false, activeOnly = true } = {}) {
    const activeClause = activeOnly ? ' AND is_active = 1' : '';
    const [quizzes] = await db.execute(
        `SELECT id, job_id, title, is_active FROM job_quizzes WHERE job_id = ?${activeClause}`,
        [jobId]
    );
    if (!quizzes.length) return null;

    const quiz = quizzes[0];
    const [questions] = await db.execute(
        `SELECT id, question_text, question_type, sort_order
         FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC, id ASC`,
        [quiz.id]
    );

    const enriched = [];
    for (const q of questions) {
        const [choices] = await db.execute(
            `SELECT id, choice_text, sort_order${includeCorrect ? ', is_correct' : ''}
             FROM quiz_choices WHERE question_id = ? ORDER BY sort_order ASC, id ASC`,
            [q.id]
        );
        enriched.push({ ...q, choices });
    }

    return { ...quiz, questions: enriched };
}

async function upsertQuizForJob(jobId, recruiterId, payload) {
    const [jobs] = await db.execute('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (!jobs.length) {
        const err = new Error('Offre introuvable.');
        err.statusCode = 404;
        throw err;
    }

    const { title = 'Quiz de présélection', questions = [] } = payload;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [existing] = await conn.execute('SELECT id FROM job_quizzes WHERE job_id = ?', [jobId]);
        let quizId;

        if (existing.length) {
            quizId = existing[0].id;
            await conn.execute('UPDATE job_quizzes SET title = ?, is_active = 1 WHERE id = ?', [title, quizId]);
            const [oldQuestions] = await conn.execute('SELECT id FROM quiz_questions WHERE quiz_id = ?', [quizId]);
            for (const oq of oldQuestions) {
                await conn.execute('DELETE FROM quiz_choices WHERE question_id = ?', [oq.id]);
            }
            await conn.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId]);
        } else {
            const [ins] = await conn.execute(
                'INSERT INTO job_quizzes (job_id, title, is_active) VALUES (?, ?, 1)',
                [jobId, title]
            );
            quizId = ins.insertId;
        }

        await conn.execute('UPDATE jobs SET has_quiz = 1 WHERE id = ?', [jobId]);

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const [qIns] = await conn.execute(
                `INSERT INTO quiz_questions (quiz_id, question_text, question_type, sort_order)
                 VALUES (?, ?, ?, ?)`,
                [quizId, q.question_text, q.question_type || 'single', i]
            );
            const questionId = qIns.insertId;
            const choices = q.choices || [];
            for (let j = 0; j < choices.length; j++) {
                const c = choices[j];
                await conn.execute(
                    `INSERT INTO quiz_choices (question_id, choice_text, is_correct, sort_order)
                     VALUES (?, ?, ?, ?)`,
                    [questionId, c.choice_text, c.is_correct ? 1 : 0, j]
                );
            }
        }

        await conn.commit();
        return { quizId, message: 'Quiz enregistré avec succès.' };
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

async function setQuizActive(jobId, recruiterId, isActive) {
    const [jobs] = await db.execute('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (!jobs.length) {
        const err = new Error('Offre introuvable.');
        err.statusCode = 404;
        throw err;
    }

    const [quizzes] = await db.execute('SELECT id FROM job_quizzes WHERE job_id = ?', [jobId]);
    if (!quizzes.length) {
        const err = new Error('Aucun quiz à modifier pour cette offre.');
        err.statusCode = 404;
        throw err;
    }

    const active = isActive ? 1 : 0;
    await db.execute('UPDATE job_quizzes SET is_active = ? WHERE job_id = ?', [active, jobId]);
    await db.execute('UPDATE jobs SET has_quiz = ? WHERE id = ?', [active, jobId]);

    return {
        message: active ? 'Quiz rendu disponible pour les candidats.' : 'Quiz masqué aux candidats.',
        is_active: !!active,
    };
}

async function deleteQuizForJob(jobId, recruiterId) {
    const [jobs] = await db.execute('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (!jobs.length) {
        const err = new Error('Offre introuvable.');
        err.statusCode = 404;
        throw err;
    }
    await db.execute('DELETE FROM job_quizzes WHERE job_id = ?', [jobId]);
    await db.execute('UPDATE jobs SET has_quiz = 0 WHERE id = ?', [jobId]);
    return { message: 'Quiz supprimé.' };
}

async function validateQuizAnswers(jobId, quizAnswers) {
    const quiz = await getQuizByJobId(jobId, { includeCorrect: true });
    if (!quiz) return;

    if (!Array.isArray(quizAnswers) || quizAnswers.length === 0) {
        const err = new Error('Ce poste requiert de répondre au quiz avant de postuler.');
        err.statusCode = 400;
        throw err;
    }

    const requiredIds = new Set(quiz.questions.map((q) => q.id));
    const answeredIds = new Set(quizAnswers.map((a) => Number(a.question_id)));

    for (const qId of requiredIds) {
        if (!answeredIds.has(qId)) {
            const err = new Error('Veuillez répondre à toutes les questions du quiz.');
            err.statusCode = 400;
            throw err;
        }
    }

    for (const answer of quizAnswers) {
        const question = quiz.questions.find((q) => q.id === Number(answer.question_id));
        if (!question) {
            const err = new Error('Réponse invalide pour ce quiz.');
            err.statusCode = 400;
            throw err;
        }
        const choiceId = Number(answer.choice_id);
        const validChoice = question.choices.some((c) => c.id === choiceId);
        if (!validChoice) {
            const err = new Error('Choix de réponse invalide.');
            err.statusCode = 400;
            throw err;
        }
    }
}

async function saveApplicationAnswers(applicationId, quizAnswers) {
    for (const a of quizAnswers) {
        await db.execute(
            `INSERT INTO application_quiz_answers (application_id, question_id, choice_id)
             VALUES (?, ?, ?)`,
            [applicationId, a.question_id, a.choice_id]
        );
    }
}

async function getApplicationQuizAnswers(applicationId, recruiterId) {
    const [apps] = await db.execute(
        `SELECT a.id, a.job_id, j.has_quiz
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ? AND j.recruiter_id = ?`,
        [applicationId, recruiterId]
    );
    if (!apps.length) {
        const err = new Error('Candidature introuvable.');
        err.statusCode = 404;
        throw err;
    }

    const app = apps[0];
    if (!app.has_quiz) {
        return { has_quiz: false, quiz_title: null, answers: [] };
    }

    const [quizRows] = await db.execute(
        `SELECT jq.title AS quiz_title
         FROM job_quizzes jq
         WHERE jq.job_id = ? AND jq.is_active = 1`,
        [app.job_id]
    );
    const quizTitle = quizRows[0]?.quiz_title || 'Quiz de présélection';

    const [rows] = await db.execute(
        `SELECT
            qq.id AS question_id,
            qq.question_text,
            qq.question_type,
            qq.sort_order,
            qc.id AS choice_id,
            qc.choice_text AS selected_choice_text,
            qc.is_correct AS is_correct_choice
         FROM application_quiz_answers aqa
         JOIN quiz_questions qq ON aqa.question_id = qq.id
         LEFT JOIN quiz_choices qc ON aqa.choice_id = qc.id
         WHERE aqa.application_id = ?
         ORDER BY qq.sort_order ASC, qq.id ASC`,
        [applicationId]
    );

    return {
        has_quiz: true,
        quiz_title: quizTitle,
        answers: rows.map((r) => ({
            question_id: r.question_id,
            question_text: r.question_text,
            question_type: r.question_type,
            sort_order: r.sort_order,
            choice_id: r.choice_id,
            selected_choice_text: r.selected_choice_text || '—',
            is_correct: !!r.is_correct_choice,
        })),
    };
}

module.exports = {
    getQuizByJobId,
    upsertQuizForJob,
    setQuizActive,
    deleteQuizForJob,
    validateQuizAnswers,
    saveApplicationAnswers,
    getApplicationQuizAnswers,
};
