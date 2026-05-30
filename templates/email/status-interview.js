const { emailLayout } = require('./layout');

function statusInterviewTemplate({ candidateName, jobTitle, companyName, applicationsUrl }) {
    const bodyHtml = `
      <p style="font-size:14px;color:#334155;line-height:1.6;">Bonjour <strong>${candidateName}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Votre profil a retenu l'attention du recruteur pour le poste
        <strong>${jobTitle}</strong>${companyName ? ` chez <strong>${companyName}</strong>` : ''}.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Un <strong style="color:#f97316;">entretien</strong> est prévu dans le cadre de votre candidature.
        Surveillez vos e-mails et votre téléphone : le recruteur vous contactera pour fixer les détails.
      </p>`;

    return emailLayout({
        title: 'Invitation à un entretien',
        bodyHtml,
        ctaUrl: applicationsUrl,
        ctaLabel: 'Voir ma candidature',
    });
}

module.exports = { statusInterviewTemplate };
