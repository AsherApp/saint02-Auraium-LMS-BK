import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth';
const router = Router();
// Get all transactions for a teacher
router.get('/teacher/:email', requireAuth, async (req, res) => {
    try {
        const { email } = req.params;
        // Verify the authenticated user is requesting their own transactions
        if (req.user?.email !== email) {
            return res.status(403).json({ error: 'Unauthorized access to transactions' });
        }
        const { data: transactions, error } = await supabaseAdmin
            .from('teacher_transactions')
            .select(`
        id,
        transaction_id,
        transaction_type,
        amount_cents,
        currency,
        status,
        access_plan,
        student_slots_included,
        slots_purchased,
        slots_added,
        stripe_payment_intent_id,
        description,
        metadata,
        created_at,
        updated_at,
        completed_at
      `)
            .eq('teacher_email', email)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch transactions'
            });
        }
        res.json({
            success: true,
            transactions: transactions || []
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});
// Get transaction summary for a teacher
router.get('/teacher/:email/summary', requireAuth, async (req, res) => {
    try {
        const { email } = req.params;
        // Verify the authenticated user is requesting their own summary
        if (req.user?.email !== email) {
            return res.status(403).json({ error: 'Unauthorized access to transaction summary' });
        }
        // Get all transactions for summary calculation
        const { data: transactions, error } = await supabaseAdmin
            .from('teacher_transactions')
            .select('status, amount_cents, transaction_type, student_slots_included, slots_purchased, created_at')
            .eq('teacher_email', email);
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch transaction summary'
            });
        }
        // Calculate summary from transactions data
        const summary = {
            total_transactions: transactions?.length || 0,
            completed_transactions: transactions?.filter(t => t.status === 'completed').length || 0,
            pending_transactions: transactions?.filter(t => t.status === 'pending').length || 0,
            failed_transactions: transactions?.filter(t => t.status === 'failed').length || 0,
            total_amount_cents: transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount_cents || 0), 0) || 0,
            total_slots_included: transactions?.filter(t => t.transaction_type === 'platform_access' && t.status === 'completed').reduce((sum, t) => sum + (t.student_slots_included || 0), 0) || 0,
            total_slots_purchased: transactions?.filter(t => t.transaction_type === 'student_slots' && t.status === 'completed').reduce((sum, t) => sum + (t.slots_purchased || 0), 0) || 0,
            last_transaction_date: transactions?.length > 0 ? Math.max(...transactions.map(t => new Date(t.created_at).getTime())) : null
        };
        // Calculate totals
        const totalAmount = summary.total_amount_cents || 0;
        const totalSlots = (summary.total_slots_included || 0) + (summary.total_slots_purchased || 0);
        res.json({
            success: true,
            summary: {
                totalTransactions: summary.total_transactions,
                completedTransactions: summary.completed_transactions,
                pendingTransactions: summary.pending_transactions,
                failedTransactions: summary.failed_transactions,
                totalAmountCents: totalAmount,
                totalAmountFormatted: `$${(totalAmount / 100).toFixed(2)}`,
                totalSlots: totalSlots,
                lastTransactionDate: summary.last_transaction_date ? new Date(summary.last_transaction_date).toISOString() : undefined
            }
        });
    }
    catch (error) {
        console.error('Error fetching transaction summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transaction summary'
        });
    }
});
// Create a new transaction (called by webhook or system)
router.post('/', async (req, res) => {
    try {
        const { teacher_email, transaction_id, transaction_type, amount_cents, currency = 'USD', status = 'pending', access_plan, student_slots_included = 0, slots_purchased = 0, slots_added = 0, stripe_payment_intent_id, stripe_customer_id, description, metadata = {} } = req.body;
        // Validate required fields
        if (!teacher_email || !transaction_id || !transaction_type || !amount_cents) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        // Validate transaction type
        if (!['platform_access', 'student_slots'].includes(transaction_type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction type'
            });
        }
        // Validate status
        if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        const { data: transaction, error } = await supabaseAdmin
            .from('teacher_transactions')
            .insert({
            teacher_email,
            transaction_id,
            transaction_type,
            amount_cents,
            currency,
            status,
            access_plan,
            student_slots_included,
            slots_purchased,
            slots_added,
            stripe_payment_intent_id,
            stripe_customer_id,
            description,
            metadata,
            completed_at: status === 'completed' ? new Date().toISOString() : null
        })
            .select()
            .single();
        if (error) {
            console.error('Supabase error:', error);
            // Handle duplicate transaction ID
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'Transaction ID already exists'
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Failed to create transaction'
            });
        }
        res.status(201).json({
            success: true,
            transaction
        });
    }
    catch (error) {
        console.error('Error creating transaction:', error);
        // Handle duplicate transaction ID
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Transaction ID already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create transaction'
        });
    }
});
// Update transaction status (called by webhook)
router.patch('/:transaction_id/status', async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { status, stripe_payment_intent_id, metadata } = req.body;
        if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };
        if (stripe_payment_intent_id) {
            updateData.stripe_payment_intent_id = stripe_payment_intent_id;
        }
        if (metadata) {
            updateData.metadata = metadata;
        }
        // Set completed_at if status is completed
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }
        const { data: transaction, error } = await supabaseAdmin
            .from('teacher_transactions')
            .update(updateData)
            .eq('transaction_id', transaction_id)
            .select()
            .single();
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update transaction status'
            });
        }
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.json({
            success: true,
            transaction
        });
    }
    catch (error) {
        console.error('Error updating transaction status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update transaction status'
        });
    }
});
// Get transaction by ID
router.get('/:transaction_id', requireAuth, async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Teacher email is required'
            });
        }
        // Verify the authenticated user is requesting their own transaction
        if (req.user?.email !== email) {
            return res.status(403).json({ error: 'Unauthorized access to transaction' });
        }
        const { data: transaction, error } = await supabaseAdmin
            .from('teacher_transactions')
            .select('*')
            .eq('transaction_id', transaction_id)
            .eq('teacher_email', email)
            .single();
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch transaction'
            });
        }
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.json({
            success: true,
            transaction
        });
    }
    catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transaction'
        });
    }
});
export default router;
