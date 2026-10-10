ALTER TABLE reassignment_requests
  ADD COLUMN pending_requester_id BIGINT UNSIGNED
    GENERATED ALWAYS AS (
      CASE WHEN status = 'pending' THEN requested_by ELSE NULL END
    ) STORED,
  ADD UNIQUE KEY uq_pending_reassignment (lead_id, pending_requester_id);
