const Joi = require('joi');

const choiceSchema = Joi.object({
    choice_text: Joi.string().trim().min(1).required(),
    is_correct: Joi.boolean().default(false),
});

const questionSchema = Joi.object({
    question_text: Joi.string().trim().min(3).required(),
    question_type: Joi.string().valid('single', 'multiple').default('single'),
    choices: Joi.array().items(choiceSchema).length(3).required(),
});

const upsertQuiz = Joi.object({
    title: Joi.string().trim().max(150).default('Quiz de présélection'),
    questions: Joi.array().items(questionSchema).min(1).max(5).required(),
});

const toggleVisibility = Joi.object({
    is_active: Joi.boolean().required(),
});

module.exports = { upsertQuiz, toggleVisibility };
