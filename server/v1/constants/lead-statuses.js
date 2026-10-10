const LEAD_STATUSES = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  FOLLOW_UP: 'follow_up',
  CONVERTED: 'converted',
  LOST: 'lost',
});

module.exports = { LEAD_STATUSES, LEAD_STATUS_VALUES: Object.freeze(Object.values(LEAD_STATUSES)) };
