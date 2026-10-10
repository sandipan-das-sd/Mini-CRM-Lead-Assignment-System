CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(500) NULL,
  assigned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  unassigned_at TIMESTAMP(3) NULL,
  PRIMARY KEY (id),
  KEY idx_assignments_lead_time (lead_id, assigned_at, id),
  KEY idx_assignments_to_user_time (to_user_id, assigned_at, id),
  CONSTRAINT fk_assignments_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignments_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignments_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignments_actor FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
