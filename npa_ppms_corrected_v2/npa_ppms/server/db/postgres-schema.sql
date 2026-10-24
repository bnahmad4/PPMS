-- ============================================================================
-- NIGERIAN PORTS AUTHORITY (NPA)
-- DIGITAL PORT PASS MANAGEMENT SYSTEM (PPMS) — VERSION 3.0
-- Complete PostgreSQL Enterprise Schema & Migration DDL (All 46 Tables)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    cac_number VARCHAR(100) NOT NULL UNIQUE,
    tin_number VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    address TEXT NOT NULL,
    md_ceo_name VARCHAR(255) NOT NULL,
    md_ceo_phone VARCHAR(50),
    auth_rep_name VARCHAR(255) NOT NULL,
    auth_rep_email VARCHAR(255) NOT NULL,
    auth_rep_phone VARCHAR(50) NOT NULL,
    primary_port_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    letterhead_url TEXT,
    stamp_seal_url TEXT,
    cac_cert_url TEXT,
    tax_clearance_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. PORTS
CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT,
    capturing_location TEXT,
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    user_type VARCHAR(50) NOT NULL, -- 'INTERNAL', 'EXTERNAL'
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    assigned_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- 7. USER_ROLE_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- 8. COMPANY_USERS
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

-- 9. PORT_OFFICER_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS port_officer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(port_id, user_id, role_code)
);

-- 10. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_validity_months INT DEFAULT 12,
    base_fee_ngn NUMERIC(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. CATEGORY_REQUIREMENTS
CREATE TABLE IF NOT EXISTS category_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    max_size_mb INT DEFAULT 5,
    allowed_formats VARCHAR(100) DEFAULT 'PDF,JPG,PNG',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. PASS_TYPES
CREATE TABLE IF NOT EXISTS pass_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category_prefix VARCHAR(10),
    max_validity_days INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id),
    port_id UUID NOT NULL REFERENCES ports(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    pass_type_id UUID NOT NULL REFERENCES pass_types(id),
    status VARCHAR(60) NOT NULL DEFAULT 'DRAFT',
    validity_period_months INT DEFAULT 12,
    number_of_employees INT DEFAULT 1,
    justification TEXT,
    conditions_accepted BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. APPLICATION_EMPLOYEES
CREATE TABLE IF NOT EXISTS application_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    id_type VARCHAR(50) NOT NULL,
    id_reference VARCHAR(100) NOT NULL,
    passport_photo_url TEXT,
    id_document_url TEXT,
    capturing_status VARCHAR(50) DEFAULT 'PENDING',
    pass_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. APPLICATION_DOCUMENTS
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES category_requirements(id),
    document_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);

-- 16. EMPLOYEE_DOCUMENTS
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES application_employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. VEHICLE_STICKERS
CREATE TABLE IF NOT EXISTS vehicle_stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    chassis_number VARCHAR(100),
    vehicle_licence_url TEXT,
    insurance_url TEXT,
    roadworthiness_url TEXT,
    sticker_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. DOCUMENT_VERIFICATIONS
CREATE TABLE IF NOT EXISTS document_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES application_documents(id),
    verified_by_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL, -- 'VERIFIED', 'DEFECTIVE'
    notes TEXT,
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. WORKFLOW_STATES
CREATE TABLE IF NOT EXISTS workflow_states (
    code VARCHAR(60) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT NOT NULL
);

-- 20. WORKFLOW_TRANSITIONS
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_state VARCHAR(60) NOT NULL REFERENCES workflow_states(code),
    to_state VARCHAR(60) NOT NULL REFERENCES workflow_states(code),
    required_role VARCHAR(50) NOT NULL,
    action_label VARCHAR(100) NOT NULL
);

-- 21. WORKFLOW_LOGS
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(60),
    new_status VARCHAR(60) NOT NULL,
    responsible_user_id UUID REFERENCES users(id),
    responsible_role VARCHAR(50) NOT NULL,
    remarks TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 22. APPLICATION_CORRECTIONS
CREATE TABLE IF NOT EXISTS application_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    officer_user_id UUID NOT NULL REFERENCES users(id),
    defects TEXT NOT NULL,
    instructions TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 23. BILLS
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    oracle_bill_reference VARCHAR(100) NOT NULL,
    rrr_number VARCHAR(100),
    amount_ngn NUMERIC(15, 2) NOT NULL,
    billing_date DATE NOT NULL,
    payment_deadline DATE NOT NULL,
    billing_officer_id UUID NOT NULL REFERENCES users(id),
    supporting_doc_url TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 24. BILLING_REVISIONS
CREATE TABLE IF NOT EXISTS billing_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    revised_amount_ngn NUMERIC(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    revised_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 25. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id),
    receipt_reference VARCHAR(100) NOT NULL,
    amount_paid_ngn NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'REMITA / BANK TRANSFER',
    receipt_document_url TEXT NOT NULL,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 26. PAYMENT_VERIFICATIONS
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    accounts_officer_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL, -- 'CONFIRMED', 'REJECTED', 'CLARIFICATION_REQUIRED'
    verification_notes TEXT,
    oracle_confirmation_code VARCHAR(100),
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 27. CAPTURING_SLOTS
CREATE TABLE IF NOT EXISTS capturing_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    booked_count INT NOT NULL DEFAULT 0,
    location_venue VARCHAR(255) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 28. CAPTURING_APPOINTMENTS
CREATE TABLE IF NOT EXISTS capturing_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES capturing_slots(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    scheduled_for_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(50) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    number_of_persons INT NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'ATTENDED', 'RESCHEDULED', 'CANCELLED'
    booked_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 29. CAPTURING_RECORDS
CREATE TABLE IF NOT EXISTS capturing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES capturing_appointments(id),
    employee_id UUID NOT NULL REFERENCES application_employees(id),
    officer_user_id UUID NOT NULL REFERENCES users(id),
    capturing_status VARCHAR(50) NOT NULL, -- 'CAPTURED', 'ABSENT', 'RESCHEDULED', 'CAPTURING_UNSUCCESSFUL', 'AWAITING_PASS_PRODUCTION'
    machine_workstation_ref VARCHAR(100),
    notes TEXT,
    captured_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 30. PASSES
CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    application_id UUID NOT NULL REFERENCES applications(id),
    employee_id UUID NOT NULL REFERENCES application_employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    port_id UUID NOT NULL REFERENCES ports(id),
    pass_type_id UUID NOT NULL REFERENCES pass_types(id),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'AWAITING_COLLECTION', -- 'AWAITING_COLLECTION', 'ACTIVE', 'EXPIRED', 'REVOKED', 'LOST'
    rfid_chip_uid VARCHAR(100),
    qr_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 31. PASS_COLLECTIONS
CREATE TABLE IF NOT EXISTS pass_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
    collected_by_name VARCHAR(255) NOT NULL,
    collector_id_type VARCHAR(50) NOT NULL,
    collector_id_reference VARCHAR(100) NOT NULL,
    collector_phone VARCHAR(50) NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    issuing_officer_id UUID NOT NULL REFERENCES users(id),
    signature_acknowledgement_url TEXT,
    notes TEXT
);

-- 32. PASS_RENEWALS
CREATE TABLE IF NOT EXISTS pass_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_pass_id UUID NOT NULL REFERENCES passes(id),
    request_type VARCHAR(50) NOT NULL, -- 'RENEWAL', 'LOST_REPLACEMENT', 'DAMAGED_REPLACEMENT'
    reason TEXT NOT NULL,
    police_extract_url TEXT,
    new_application_id UUID REFERENCES applications(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 33. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 34. NOTIFICATION_DELIVERIES
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- 'IN_APP', 'EMAIL', 'SMS'
    status VARCHAR(50) NOT NULL,
    dispatched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 35. SMTP_SETTINGS
CREATE TABLE IF NOT EXISTS smtp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL DEFAULT 587,
    username VARCHAR(255),
    password_encrypted TEXT,
    encryption_type VARCHAR(20) DEFAULT 'STARTTLS', -- 'NONE', 'STARTTLS', 'TLS'
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL DEFAULT 'NPA Port Pass Management System',
    reply_to_email VARCHAR(255),
    timeout_ms INT DEFAULT 10000,
    max_retries INT DEFAULT 3,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 36. EMAIL_TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    plain_text_body TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 37. EMAIL_NOTIFICATION_LOGS
CREATE TABLE IF NOT EXISTS email_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    application_reference VARCHAR(100),
    event_code VARCHAR(100) NOT NULL,
    attempt_count INT DEFAULT 1,
    status VARCHAR(50) NOT NULL, -- 'QUEUED', 'SENT', 'FAILED', 'RETRIED'
    smtp_message_id VARCHAR(255),
    error_message TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 38. CONDITIONS_VERSIONS
CREATE TABLE IF NOT EXISTS conditions_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_code VARCHAR(50) NOT NULL UNIQUE, -- 'REVISED_MARCH_2018'
    title VARCHAR(255) NOT NULL,
    full_text TEXT NOT NULL,
    prosecution_warning TEXT NOT NULL,
    effective_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 39. CONDITIONS_ACCEPTANCE_LOGS
CREATE TABLE IF NOT EXISTS conditions_acceptance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    version_id UUID NOT NULL REFERENCES conditions_versions(id),
    signature_name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    scrolled_to_bottom BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 40. VALIDATION_LOGS
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    validation_status VARCHAR(50) NOT NULL,
    messages JSONB,
    validated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 41. AUDIT_TRAIL
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 42. FEE_REFERENCES
CREATE TABLE IF NOT EXISTS fee_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    pass_type_id UUID NOT NULL REFERENCES pass_types(id),
    standard_fee_ngn NUMERIC(15, 2) NOT NULL,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 43. APPLICATION_ATTACHMENTS
CREATE TABLE IF NOT EXISTS application_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    attachment_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 44. SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 45. SCHEDULED_JOBS
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL UNIQUE,
    cron_expression VARCHAR(100) NOT NULL,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'IDLE',
    error_details TEXT
);

-- 46. SECURITY_EVENTS
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(50),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance indexing
CREATE INDEX IF NOT EXISTS idx_apps_company ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_apps_port ON applications(port_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_workflow_app ON workflow_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_email_logs_ref ON email_notification_logs(application_reference);
