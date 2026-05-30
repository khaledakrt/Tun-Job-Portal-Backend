const quizService = require('../../services/quiz.service');

exports.getJobQuiz = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const quiz = await quizService.getQuizByJobId(jobId, {
            includeCorrect: true,
            activeOnly: false,
        });
        if (!quiz) return res.status(404).json({ message: 'Aucun quiz associé à cette offre.' });
        return res.json(quiz);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.saveJobQuiz = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const result = await quizService.upsertQuizForJob(jobId, req.user.id, req.body);
        return res.status(200).json(result);
    } catch (e) {
        const code = e.statusCode || 500;
        return res.status(code).json({ message: e.message });
    }
};

exports.toggleQuizVisibility = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const isActive = !!req.body.is_active;
        const result = await quizService.setQuizActive(jobId, req.user.id, isActive);
        return res.json(result);
    } catch (e) {
        const code = e.statusCode || 500;
        return res.status(code).json({ message: e.message });
    }
};

exports.deleteJobQuiz = async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const result = await quizService.deleteQuizForJob(jobId, req.user.id);
        return res.json(result);
    } catch (e) {
        const code = e.statusCode || 500;
        return res.status(code).json({ message: e.message });
    }
};
