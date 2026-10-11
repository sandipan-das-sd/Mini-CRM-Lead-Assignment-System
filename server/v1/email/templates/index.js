const env = require('../../config/env');
const { layout, escapeHtml } = require('./layout');

const paragraph = (text) => `<p style="margin:0 0 16px">${text}</p>`;
const detail = (label, value) =>
  `<div style="margin:8px 0"><strong style="color:#182230">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;

function welcome(data) {
  return {
    subject: 'Your LeadFlow CRM account is ready',
    text: `Welcome, ${data.name}. Your LeadFlow CRM account is ready. Sign in with ${data.email} at ${env.APP_URL}/login.`,
    html: layout({
      preview: 'Your sales account has been created.',
      heading: `Welcome, ${data.name}`,
      body:
        paragraph('Your sales account has been created and is ready to use.') +
        detail('Sign-in email', data.email) +
        paragraph(
          'For security, your password is not included in this email. Contact your administrator if you need sign-in assistance.',
        ),
      action: { label: 'Sign in to LeadFlow', url: `${env.APP_URL}/login` },
    }),
  };
}

function leadAssigned(data) {
  return {
    subject: `Lead assigned: ${data.leadName}`,
    text: `Hello ${data.recipientName}. ${data.leadName} has been assigned to you. Reason: ${data.reason || 'No reason provided'}. View it at ${env.APP_URL}/leads/${data.leadId}.`,
    html: layout({
      preview: `A lead has been assigned to you: ${data.leadName}`,
      heading: 'A lead has been assigned to you',
      body:
        paragraph(`Hello ${escapeHtml(data.recipientName)},`) +
        detail('Lead', data.leadName) +
        detail('Reason', data.reason || 'No reason provided') +
        paragraph('Please review the lead details and plan the next action.'),
      action: { label: 'View lead', url: `${env.APP_URL}/leads/${data.leadId}` },
    }),
  };
}

function reassignmentRequested(data) {
  return {
    subject: `Reassignment requested: ${data.leadName}`,
    text: `${data.requesterName} requested reassignment of ${data.leadName}. Reason: ${data.reason}. Review it at ${env.APP_URL}/reassignment-requests.`,
    html: layout({
      preview: `${data.requesterName} requested a lead reassignment.`,
      heading: 'Reassignment review required',
      body:
        paragraph(`${escapeHtml(data.requesterName)} submitted a reassignment request.`) +
        detail('Lead', data.leadName) +
        detail('Reason', data.reason),
      action: { label: 'Review request', url: `${env.APP_URL}/reassignment-requests` },
    }),
  };
}

function reassignmentReviewed(data) {
  const approved = data.decision === 'approved';
  return {
    subject: `Reassignment request ${approved ? 'approved' : 'rejected'}`,
    text: `Hello ${data.requesterName}. Your reassignment request for ${data.leadName} was ${data.decision}.`,
    html: layout({
      preview: `Your reassignment request was ${data.decision}.`,
      heading: `Request ${approved ? 'approved' : 'rejected'}`,
      body:
        paragraph(`Hello ${escapeHtml(data.requesterName)},`) +
        detail('Lead', data.leadName) +
        detail('Decision', data.decision) +
        paragraph(
          approved ? 'The lead ownership has been updated.' : 'The lead remains assigned to you.',
        ),
      action: { label: 'Open LeadFlow', url: env.APP_URL },
    }),
  };
}

const templates = {
  welcome,
  leadAssigned,
  reassignmentRequested,
  reassignmentReviewed,
};

function renderTemplate(name, data) {
  const template = templates[name];
  if (!template) throw new Error(`Unknown email template: ${name}`);
  return template(data);
}

module.exports = { renderTemplate };
