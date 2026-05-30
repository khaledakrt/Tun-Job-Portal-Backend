const { emailLayout } = require('./layout');

function statusRejectedTemplate({ candidateName, jobTitle, companyName, applicationsUrl }) {
    const bodyHtml = `
      <p style="font-size:14px;color:#334155;line-height:1.6;">Bonjour <strong>${candidateName}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Nous vous remercions pour l'intérêt porté au poste
        <strong>${jobTitle}</strong>${companyName ? ` chez <strong>${companyName}</strong>` : ''}.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Après étude de votre dossier, le recruteur a décidé de ne pas poursuivre votre candidature pour cette offre.
        Nous vous encourageons à consulter d'autres opportunités sur Tun-Job.
      </p>`;

    return emailLayout({
        title: 'Mise à jour de votre candidature',
        bodyHtml,
        ctaUrl: applicationsUrl,
        ctaLabel: 'Explorer d\'autres offres',
    });
}

module.exports = { statusRejectedTemplate };
