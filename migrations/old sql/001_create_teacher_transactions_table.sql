-- Migration: Create teacher_transactions table
-- Description: Tracks all payment transactions for teachers including platform access and student slot purchases
-- Date: 2024-12-19

-- Create teacher_transactions table
CREATE TABLE IF NOT EXISTS teacher_transactions (
    id SERIAL PRIMARY KEY,
    teacher_email VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe transaction ID
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('platform_access', 'student_slots')),
    amount_cents INTEGER NOT NULL, -- Amount in cents (e.g., 2900 for $29.00)
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Platform access specific fields
    access_plan VARCHAR(50), -- 'basic' or 'premium' for platform access
    student_slots_included INTEGER DEFAULT 0, -- How many slots included with this transaction
    
    -- Student slots specific fields
    slots_purchased INTEGER DEFAULT 0, -- How many additional slots purchased
    slots_added INTEGER DEFAULT 0, -- How many slots actually added to account
    
    -- Stripe specific fields
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255), -- For future use if needed
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraint
    CONSTRAINT fk_teacher_transactions_teacher_email 
        FOREIGN KEY (teacher_email) 
        REFERENCES teachers(email) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_transactions_teacher_email ON teacher_transactions(teacher_email);
CREATE INDEX IF NOT EXISTS idx_teacher_transactions_transaction_id ON teacher_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_teacher_transactions_status ON teacher_transactions(status);
CREATE INDEX IF NOT EXISTS idx_teacher_transactions_created_at ON teacher_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_teacher_transactions_type ON teacher_transactions(transaction_type);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teacher_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_teacher_transactions_updated_at
    BEFORE UPDATE ON teacher_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_transactions_updated_at();

-- Insert sample data for testing (optional - remove in production)
INSERT INTO teacher_transactions (
    teacher_email,
    transaction_id,
    transaction_type,
    amount_cents,
    currency,
    status,
    access_plan,
    student_slots_included,
    description,
    completed_at
) VALUES 
(
    'teacher@example.com',
    'txn_sample_001',
    'platform_access',
    2900,
    'USD',
    'completed',
    'basic',
    5,
    'Platform access - Basic plan with 5 student slots',
    CURRENT_TIMESTAMP
),
(
    'teacher@example.com',
    'txn_sample_002',
    'student_slots',
    1900,
    'USD',
    'completed',
    NULL,
    0,
    'Additional 5 student slots',
    CURRENT_TIMESTAMP
);

-- Grant permissions (adjust based on your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_transactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE teacher_transactions_id_seq TO authenticated;

-- Add RLS policies if using Supabase
ALTER TABLE teacher_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can only see their own transactions
CREATE POLICY "Teachers can view own transactions" ON teacher_transactions
    FOR SELECT USING (teacher_email = current_user);

-- Policy: Teachers can insert their own transactions
CREATE POLICY "Teachers can insert own transactions" ON teacher_transactions
    FOR INSERT WITH CHECK (teacher_email = current_user);

-- Policy: Only system/admin can update transaction status
CREATE POLICY "Only system can update transactions" ON teacher_transactions
    FOR UPDATE USING (false);

-- Policy: Only system/admin can delete transactions
CREATE POLICY "Only system can delete transactions" ON teacher_transactions
    FOR DELETE USING (false);
