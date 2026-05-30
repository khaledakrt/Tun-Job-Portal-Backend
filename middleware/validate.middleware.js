/**
 * Middleware de validation Joi
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((d) => d.message);
            return res.status(400).json({
                message: details.join(' '),
                errors: details,
            });
        }

        req[source] = value;
        next();
    };
}

module.exports = { validate };
