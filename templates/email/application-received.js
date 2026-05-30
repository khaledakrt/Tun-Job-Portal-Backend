const { emailLayout } = require('./layout');

function applicationReceivedTemplate({ recruiterName, candidateName, jobTitle, dashboardUrl }) {
    const bodyHtml = `
      <p style="font-size:14px;color:#334155;line-height:1.6;">Bonjour <strong>${recruiterName}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        <strong>${candidateName}</strong> vient de postuler à votre offre
        <strong style="color:#0ea5e9;">${jobTitle}</strong>.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Consultez sa candidature dans votre pipeline ATS pour avancer dans le processus de recrutement.
      </p>`;

    return emailLayout({
        title: 'Nouvelle candidature reçue',
        bodyHtml,
        ctaUrl: dashboardUrl,
        ctaLabel: 'Voir le pipeline ATS',
    });
}

module.exports = { applicationReceivedTemplate };
