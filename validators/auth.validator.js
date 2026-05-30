const Joi = require('joi');

const emailRule = Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(100);

const register = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Le nom est obligatoire.',
        'string.min': 'Le nom doit contenir au moins 2 caractères.',
    }),
    email: emailRule.required().messages({
        'string.empty': "L'adresse e-mail est obligatoire.",
        'string.email': 'Adresse e-mail invalide.',
    }),
    password: Joi.string().min(8).max(128).required().messages({
        'string.empty': 'Le mot de passe est obligatoire.',
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
    }),
    role: Joi.string().valid('candidate', 'recruiter').default('candidate'),
});

const login = Joi.object({
    email: emailRule.required().messages({
        'string.empty': "L'adresse e-mail est obligatoire.",
        'string.email': 'Adresse e-mail invalide.',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Le mot de passe est obligatoire.',
    }),
});

module.exports = { register, login };
