-- Run this in the Supabase SQL Editor or with psql.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY,
 username VARCHAR(40) NOT NULL UNIQUE,
 student_id VARCHAR(40) UNIQUE,
 password_hash VARCHAR(100) NOT NULL,
 role VARCHAR(16) NOT NULL CHECK (role IN ('PATRON','CASHIER','ADMIN')),
 balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(254);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_student_id_lower_unique ON users (lower(student_id)) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS computers (
 pc_id BIGSERIAL PRIMARY KEY,
 pc_name VARCHAR(60) NOT NULL UNIQUE,
 ip_address VARCHAR(45),
 status VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','IN_USE','LOCKED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS computers_pc_name_lower_unique ON computers(lower(pc_name));

CREATE TABLE IF NOT EXISTS sessions (
 session_id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id),
 pc_id BIGINT NOT NULL REFERENCES computers(pc_id),
 remaining_sec INTEGER NOT NULL CHECK(remaining_sec >= 0),
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 ended_at TIMESTAMPTZ,
 status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','COMPLETED','CANCELLED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_pc ON sessions(pc_id) WHERE status='ACTIVE';
CREATE INDEX IF NOT EXISTS sessions_user_status_idx ON sessions(user_id,status);

CREATE TABLE IF NOT EXISTS transactions (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id),
 amount NUMERIC(12,2) NOT NULL CHECK(amount > 0),
 payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
 created_by BIGINT REFERENCES users(id),
 pc_id BIGINT REFERENCES computers(pc_id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pc_id BIGINT REFERENCES computers(pc_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_created_idx ON password_reset_tokens(user_id, created_at DESC);
