const { emailLayout } = require('./layout');

function statusAcceptedTemplate({ candidateName, jobTitle, companyName, applicationsUrl }) {
    const bodyHtml = `
      <p style="font-size:14px;color:#334155;line-height:1.6;">Bonjour <strong>${candidateName}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Bonne nouvelle ! Votre candidature pour le poste
        <strong>${jobTitle}</strong>${companyName ? ` chez <strong>${companyName}</strong>` : ''}
        a été <span style="color:#10b981;font-weight:700;">acceptée</span>.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Le recruteur vous contactera prochainement pour les prochaines étapes.
      </p>`;

    return emailLayout({
        title: 'Candidature acceptée',
        bodyHtml,
        ctaUrl: applicationsUrl,
        ctaLabel: 'Suivre mes candidatures',
    });
}

module.exports = { statusAcceptedTemplate };
