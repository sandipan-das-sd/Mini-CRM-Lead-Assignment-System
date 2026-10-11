function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function layout({ preview, heading, body, action }) {
  const button = action
    ? `<tr><td style="padding:8px 32px 32px"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${escapeHtml(action.label)}</a></td></tr>`
    : '';
  return `<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#182230">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 12px">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
<tr><td style="background:#111827;padding:24px 32px;color:#fff"><div style="font-size:20px;font-weight:800">LeadFlow CRM</div><div style="color:#a5b4fc;font-size:13px;margin-top:4px">Lead management, made accountable.</div></td></tr>
<tr><td style="padding:32px 32px 12px"><h1 style="font-size:24px;line-height:32px;margin:0">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:0 32px 24px;font-size:15px;line-height:24px;color:#475467">${body}</td></tr>
${button}
<tr><td style="border-top:1px solid #eaecf0;padding:20px 32px;font-size:12px;line-height:18px;color:#667085">This is an automated service email from LeadFlow CRM. Please do not reply.</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = { layout, escapeHtml };
