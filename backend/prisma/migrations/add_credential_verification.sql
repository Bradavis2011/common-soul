-- Add credential verification tables

-- Document storage for healer credentials
CREATE TABLE IF NOT EXISTS healer_documents (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL,
    document_type TEXT NOT NULL, -- 'CERTIFICATION', 'LICENSE', 'EDUCATION', 'INSURANCE', 'RESUME', 'REFERENCE'
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    verification_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'
    verification_notes TEXT,
    verified_by TEXT, -- Admin ID who verified
    verified_at DATETIME,
    expires_at DATETIME, -- For licenses/certifications with expiry
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE
);

-- Structured certification data
CREATE TABLE IF NOT EXISTS healer_certifications (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL,
    certification_name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    certification_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    verification_url TEXT, -- Link to verify with issuing org
    document_id TEXT, -- Link to uploaded document
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'REVOKED'
    verification_status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES healer_documents(id) ON DELETE SET NULL
);

-- Education background
CREATE TABLE IF NOT EXISTS healer_education (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    degree_type TEXT, -- 'CERTIFICATE', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER'
    degree_title TEXT NOT NULL,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    graduation_status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'IN_PROGRESS', 'INCOMPLETE'
    gpa TEXT,
    honors TEXT,
    document_id TEXT, -- Link to diploma/transcript
    verification_status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES healer_documents(id) ON DELETE SET NULL
);

-- Professional experience
CREATE TABLE IF NOT EXISTS healer_experience (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    employment_type TEXT, -- 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'SELF_EMPLOYED'
    start_date DATE NOT NULL,
    end_date DATE, -- NULL if current position
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    key_achievements TEXT,
    location TEXT,
    verification_contact_name TEXT,
    verification_contact_email TEXT,
    verification_contact_phone TEXT,
    verification_status TEXT DEFAULT 'PENDING',
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE
);

-- Professional references
CREATE TABLE IF NOT EXISTS healer_references (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL,
    reference_type TEXT NOT NULL, -- 'PROFESSIONAL', 'ACADEMIC', 'CLIENT', 'MENTOR'
    contact_name TEXT NOT NULL,
    contact_title TEXT,
    organization TEXT,
    relationship TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    years_known INTEGER,
    reference_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'CONTACTED', 'VERIFIED', 'DECLINED', 'UNREACHABLE'
    reference_notes TEXT,
    contacted_at DATETIME,
    responded_at DATETIME,
    verification_score INTEGER, -- 1-10 rating from reference
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE
);

-- Background check results
CREATE TABLE IF NOT EXISTS healer_background_checks (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL UNIQUE,
    check_type TEXT NOT NULL, -- 'CRIMINAL', 'IDENTITY', 'EMPLOYMENT', 'EDUCATION', 'PROFESSIONAL_LICENSE'
    provider TEXT, -- Background check service provider
    provider_request_id TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'DECLINED'
    result TEXT, -- 'CLEAR', 'FLAGGED', 'DISQUALIFIED'
    result_details TEXT, -- JSON with detailed findings
    initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    expires_at DATETIME, -- When check needs renewal
    cost DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE
);

-- Verification checklist for admin review
CREATE TABLE IF NOT EXISTS healer_verification_checklist (
    id TEXT PRIMARY KEY,
    healer_profile_id TEXT NOT NULL UNIQUE,
    identity_verified BOOLEAN DEFAULT FALSE,
    certifications_verified BOOLEAN DEFAULT FALSE,
    education_verified BOOLEAN DEFAULT FALSE,
    experience_verified BOOLEAN DEFAULT FALSE,
    references_verified BOOLEAN DEFAULT FALSE,
    background_check_completed BOOLEAN DEFAULT FALSE,
    interview_completed BOOLEAN DEFAULT FALSE,
    insurance_verified BOOLEAN DEFAULT FALSE,
    portfolio_reviewed BOOLEAN DEFAULT FALSE,
    overall_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'
    admin_notes TEXT,
    rejected_reason TEXT,
    approved_by TEXT,
    approved_at DATETIME,
    next_review_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (healer_profile_id) REFERENCES healer_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_healer_documents_profile_id ON healer_documents(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_documents_type ON healer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_healer_documents_status ON healer_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_healer_certifications_profile_id ON healer_certifications(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_certifications_expiry ON healer_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_healer_education_profile_id ON healer_education(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_experience_profile_id ON healer_experience(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_references_profile_id ON healer_references(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_references_status ON healer_references(reference_status);
CREATE INDEX IF NOT EXISTS idx_healer_background_checks_profile_id ON healer_background_checks(healer_profile_id);
CREATE INDEX IF NOT EXISTS idx_healer_verification_checklist_profile_id ON healer_verification_checklist(healer_profile_id);