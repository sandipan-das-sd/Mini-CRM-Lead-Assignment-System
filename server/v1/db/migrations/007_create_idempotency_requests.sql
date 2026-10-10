CREATE TABLE IF NOT EXISTS idempotency_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  operation VARCHAR(80) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status ENUM('processing','completed') NOT NULL DEFAULT 'processing',
  response_status SMALLINT UNSIGNED NULL,
  response_body JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at TIMESTAMP(3) NULL,
  expires_at TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3) + INTERVAL 24 HOUR),
  PRIMARY KEY (id),
  UNIQUE KEY uq_idempotency_scope (user_id, operation, idempotency_key),
  KEY idx_idempotency_expiry (expires_at),
  CONSTRAINT fk_idempotency_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
