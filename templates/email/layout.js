function emailLayout({ title, bodyHtml, ctaUrl, ctaLabel }) {
    const ctaBlock = ctaUrl
        ? `<div style="text-align:center;margin:28px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${ctaLabel || 'Accéder à Tun-Job'}</a>
       </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background:#0f172a;padding:20px 24px;border-radius:12px 12px 0 0;">
      <span style="color:#fff;font-size:20px;font-weight:700;">Tun-Job Portal</span>
    </td></tr>
    <tr><td style="background:#fff;padding:32px 28px;border:1px solid #e2e8f0;border-top:none;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${title}</h1>
      ${bodyHtml}
      ${ctaBlock}
    </td></tr>
    <tr><td style="padding:16px 24px;text-align:center;font-size:12px;color:#64748b;">
      © Tun-Job Portal — Plateforme de recrutement en Tunisie
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { emailLayout };
