const quizService = require('../../services/quiz.service');
const db = require('../../config/db');
const { hasQuizSchema } = require('../../utils/dbSchema');

exports.getJobQuizForCandidate = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const quizReady = await hasQuizSchema();

        const [jobs] = await db.execute(
            'SELECT id, status FROM jobs WHERE id = ?',
            [jobId]
        );

        if (!jobs.length || jobs[0].status !== 'disponible') {
            return res.status(404).json({ message: 'Offre introuvable.' });
        }

        if (!quizReady) {
            return res.json({ has_quiz: false, quiz: null });
        }

        const [quizFlags] = await db.execute(
            'SELECT COALESCE(has_quiz, 0) AS has_quiz FROM jobs WHERE id = ?',
            [jobId]
        );

        if (!quizFlags[0]?.has_quiz) {
            return res.json({ has_quiz: false, quiz: null });
        }

        const quiz = await quizService.getQuizByJobId(jobId, { includeCorrect: false });
        if (!quiz) {
            return res.json({ has_quiz: false, quiz: null });
        }

        return res.json({ has_quiz: true, quiz });
    } catch (e) {
        console.error('❌ getJobQuizForCandidate:', e.message);
        return res.status(500).json({ error: e.message });
    }
};
