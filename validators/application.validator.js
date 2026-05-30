const Joi = require('joi');

const apply = Joi.object({
    job_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/)).required(),
    quiz_answers: Joi.array()
        .items(
            Joi.object({
                question_id: Joi.number().integer().positive().required(),
                choice_id: Joi.number().integer().positive().required(),
            })
        )
        .default([]),
});

const updateStatus = Joi.object({
    id: Joi.number().integer().positive().required(),
    status: Joi.string().trim().min(2).max(50).required(),
});

module.exports = { apply, updateStatus };
