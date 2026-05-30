const emailService = require('../../services/email.service');
const { smtp } = require('../../config/env');

exports.postContact = async (req, res) => {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Veuillez fournir le nom, l\'email et le message.' });
    }

    try {
        const html = `
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Sujet :</strong> ${subject || '—'}</p>
            <hr />
            <p>${message.replace(/\n/g, '<br/>')}</p>
        `;

        const to = smtp.fromAddress || 'no-reply@tunjob.tn';
        const mailSubject = `Formulaire de contact — ${subject || 'Sans sujet'}`;

        await emailService.sendMail({ to, subject: mailSubject, html });

        return res.status(200).json({ message: 'Message envoyé avec succès.' });
    } catch (e) {
        console.error('Erreur envoi contact:', e);
        return res.status(500).json({ message: "Impossible d'envoyer le message pour le moment." });
    }
};
