-- Migration 023: Add customer access logs table for daily check-in and visit access control
CREATE TABLE IF NOT EXISTS customer_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) NOT NULL,
    unit_code VARCHAR(50) NOT NULL,
    facility_code VARCHAR(20) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    access_type VARCHAR(20) NOT NULL DEFAULT 'ENTRY',
    access_method VARCHAR(30) NOT NULL DEFAULT 'PIN_CODE',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    access_pin VARCHAR(10),
    purpose VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    expected_at TIMESTAMP,
    deny_reason VARCHAR(100),
    checkin_at TIMESTAMP,
    checkout_at TIMESTAMP,
    duration_minutes INTEGER,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_access_contract ON customer_access_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_customer_access_facility ON customer_access_logs(facility_code);
CREATE INDEX IF NOT EXISTS idx_customer_access_status ON customer_access_logs(status);

