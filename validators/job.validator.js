const Joi = require('joi');

const createJob = Joi.object({
    title: Joi.string().trim().min(3).max(150).required(),
    contract_type: Joi.string().valid('CDI', 'CDD', 'Stage', 'Alternance', 'Freelance').required(),
    location: Joi.string().trim().min(2).max(150).required(),
    workplace_type: Joi.string().valid('Présentiel', 'Hybride', 'Télétravail').default('Présentiel'),
    salary: Joi.string().trim().max(50).allow('', null),
    experience_level: Joi.string()
        .valid('Junior (0-2 ans)', 'Intermédiaire (2-5 ans)', 'Senior (5 ans+)')
        .required(),
    missions_desc: Joi.string().trim().min(10).required(),
    profile_desc: Joi.string().trim().min(10).required(),
    skills_desc: Joi.string().trim().allow('', null),
    languages_desc: Joi.string().trim().allow('', null),
    expires_at: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)),
    has_quiz: Joi.boolean().default(false),
    quiz: Joi.object({
        title: Joi.string().trim().max(150).default('Quiz de présélection'),
        questions: Joi.array()
            .items(
                Joi.object({
                    question_text: Joi.string().trim().min(3).required(),
                    question_type: Joi.string().valid('single', 'multiple').default('single'),
                    choices: Joi.array()
                        .items(
                            Joi.object({
                                choice_text: Joi.string().trim().min(1).required(),
                                is_correct: Joi.boolean().default(false),
                            })
                        )
                        .length(3)
                        .required(),
                })
            )
            .min(1)
            .max(5),
    }).when('has_quiz', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
});

const toggleStatus = Joi.object({
    jobId: Joi.number().integer().positive().required(),
});

module.exports = { createJob, toggleStatus };
