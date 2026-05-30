const nodemailer = require('nodemailer');
const { smtp, frontendUrl } = require('../config/env');
const { applicationReceivedTemplate } = require('../templates/email/application-received');
const { statusAcceptedTemplate } = require('../templates/email/status-accepted');
const { statusRejectedTemplate } = require('../templates/email/status-rejected');
const { statusInterviewTemplate } = require('../templates/email/status-interview');

let transporter;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
        });
    }
    return transporter;
}

async function sendMail({ to, subject, html }) {
    if (!smtp.user || !smtp.pass) {
        console.warn('⚠️  SMTP non configuré — e-mail non envoyé:', subject, '→', to);
        return { skipped: true };
    }

    const from = `"${smtp.fromName}" <${smtp.fromAddress}>`;
    const info = await getTransporter().sendMail({ from, to, subject, html });
    return info;
}

async function notifyRecruiterNewApplication({ recruiterEmail, recruiterName, candidateName, jobTitle }) {
    const html = applicationReceivedTemplate({
        recruiterName: recruiterName || 'Recruteur',
        candidateName,
        jobTitle,
        dashboardUrl: `${frontendUrl}/recruiter/ats-pipeline`,
    });
    return sendMail({
        to: recruiterEmail,
        subject: `Tun-Job — Nouvelle candidature : ${jobTitle}`,
        html,
    });
}

function normalizeStatus(status) {
    return (status || '').toLowerCase().trim();
}

async function notifyCandidateStatusChange({ candidateEmail, candidateName, jobTitle, companyName, status }) {
    const s = normalizeStatus(status);
    const applicationsUrl = `${frontendUrl}/candidate/applications-list`;

    let html;
    let subject;

    if (s.includes('prop') || s.includes('accept') || s === 'proposition') {
        html = statusAcceptedTemplate({ candidateName, jobTitle, companyName, applicationsUrl });
        subject = `Tun-Job — Candidature acceptée : ${jobTitle}`;
    } else if (s.includes('rejet') || s.includes('refus')) {
        html = statusRejectedTemplate({ candidateName, jobTitle, companyName, applicationsUrl });
        subject = `Tun-Job — Mise à jour : ${jobTitle}`;
    } else if (s.includes('entre')) {
        html = statusInterviewTemplate({ candidateName, jobTitle, companyName, applicationsUrl });
        subject = `Tun-Job — Entretien planifié : ${jobTitle}`;
    } else {
        return { skipped: true, reason: 'status_not_emailable' };
    }

    return sendMail({ to: candidateEmail, subject, html });
}

module.exports = {
    sendMail,
    notifyRecruiterNewApplication,
    notifyCandidateStatusChange,
};
