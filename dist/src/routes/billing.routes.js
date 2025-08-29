import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireTeacher } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validation.js';
import { z } from 'zod';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';
const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia'
});
// Create checkout session for subscription (with trial support)
router.post('/checkout', requireAuth, requireTeacher, validateBody(z.object({
    priceId: z.string().optional(),
    startTrial: z.boolean().optional()
})), asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const { priceId, startTrial = false } = req.body;
    if (!userEmail) {
        return res.status(401).json({ error: 'user_not_found' });
    }
    try {
        // Get teacher info
        const { data: teacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .select('*')
            .eq('email', userEmail)
            .single();
        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'teacher_not_found' });
        }
        // Check if teacher is already on trial
        if (startTrial && teacher.trial_started_at) {
            return res.status(400).json({ error: 'trial_already_started' });
        }
        // Determine which price ID to use
        const finalPriceId = startTrial ? env.STRIPE_PRICE_ID_TRIAL : (priceId || env.STRIPE_PRICE_ID_PRO);
        // Create Stripe checkout session
        const sessionConfig = {
            customer_email: userEmail,
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${env.APP_BASE_URL}/teacher/settings?success=true`,
            cancel_url: `${env.APP_BASE_URL}/teacher/settings?canceled=true`,
            metadata: {
                teacher_email: userEmail,
                teacher_id: teacher.id,
                is_trial: startTrial.toString()
            },
            subscription_data: {
                metadata: {
                    teacher_email: userEmail,
                    teacher_id: teacher.id,
                    is_trial: startTrial.toString()
                }
            }
        };
        // Add trial period if starting trial
        if (startTrial) {
            sessionConfig.subscription_data = {
                ...sessionConfig.subscription_data,
                trial_period_days: env.TRIAL_PERIOD_DAYS
            };
        }
        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.json({
            sessionId: session.id,
            url: session.url
        });
    }
    catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'checkout_failed' });
    }
}));
// Start free trial (without payment)
router.post('/start-trial', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    if (!userEmail) {
        return res.status(401).json({ error: 'user_not_found' });
    }
    try {
        // Get teacher info
        const { data: teacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .select('*')
            .eq('email', userEmail)
            .single();
        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'teacher_not_found' });
        }
        // Check if teacher already has a trial or subscription
        if (teacher.trial_started_at || teacher.subscription_status === 'pro') {
            return res.status(400).json({ error: 'trial_not_available' });
        }
        // Calculate trial end date
        const trialStart = new Date();
        const trialEnd = new Date(trialStart.getTime() + (env.TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000));
        // Update teacher with trial information
        const { error: updateError } = await supabaseAdmin
            .from('teachers')
            .update({
            subscription_status: 'trial',
            max_students_allowed: 50, // Pro features during trial
            trial_started_at: trialStart.toISOString(),
            trial_ends_at: trialEnd.toISOString(),
            updated_at: new Date().toISOString()
        })
            .eq('email', userEmail);
        if (updateError) {
            throw updateError;
        }
        res.json({
            success: true,
            trial_started_at: trialStart.toISOString(),
            trial_ends_at: trialEnd.toISOString(),
            days_remaining: env.TRIAL_PERIOD_DAYS
        });
    }
    catch (error) {
        console.error('Start trial error:', error);
        res.status(500).json({ error: 'trial_start_failed' });
    }
}));
// Create customer portal session
router.post('/portal', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    if (!userEmail) {
        return res.status(401).json({ error: 'user_not_found' });
    }
    try {
        // Get teacher's Stripe customer ID
        const { data: teacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .select('stripe_customer_id')
            .eq('email', userEmail)
            .single();
        if (teacherError || !teacher?.stripe_customer_id) {
            return res.status(404).json({ error: 'no_subscription_found' });
        }
        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: teacher.stripe_customer_id,
            return_url: `${env.APP_BASE_URL}/teacher/settings`,
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Portal session error:', error);
        res.status(500).json({ error: 'portal_failed' });
    }
}));
// Stripe webhook handler
router.post('/webhook', asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'invalid_signature' });
    }
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionChange(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionCancellation(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'webhook_processing_failed' });
    }
}));
// Get subscription status (enhanced with trial info)
router.get('/status', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    if (!userEmail) {
        return res.status(401).json({ error: 'user_not_found' });
    }
    try {
        const { data: teacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .select('subscription_status, max_students_allowed, stripe_customer_id, stripe_subscription_id, trial_started_at, trial_ends_at')
            .eq('email', userEmail)
            .single();
        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'teacher_not_found' });
        }
        // Get subscription details from Stripe if exists
        let subscription = null;
        if (teacher.stripe_subscription_id) {
            try {
                subscription = await stripe.subscriptions.retrieve(teacher.stripe_subscription_id);
            }
            catch (error) {
                console.error('Failed to retrieve subscription:', error);
            }
        }
        // Calculate trial status
        let trialStatus = null;
        if (teacher.trial_started_at && teacher.trial_ends_at) {
            const now = new Date();
            const trialEnd = new Date(teacher.trial_ends_at);
            const isExpired = now > trialEnd;
            const daysRemaining = isExpired ? 0 : Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            trialStatus = {
                started_at: teacher.trial_started_at,
                ends_at: teacher.trial_ends_at,
                is_expired: isExpired,
                days_remaining: daysRemaining
            };
        }
        res.json({
            subscription_status: teacher.subscription_status,
            max_students_allowed: teacher.max_students_allowed,
            has_subscription: !!teacher.stripe_subscription_id,
            trial_status: trialStatus,
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end
            } : null
        });
    }
    catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ error: 'status_check_failed' });
    }
}));
// Helper functions for webhook handlers
async function handleSubscriptionChange(subscription) {
    const teacherEmail = subscription.metadata.teacher_email;
    if (!teacherEmail) {
        console.error('No teacher email in subscription metadata');
        return;
    }
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const maxStudents = isActive ? 50 : env.FREE_STUDENTS_LIMIT;
    await supabaseAdmin
        .from('teachers')
        .update({
        subscription_status: isActive ? 'pro' : 'free',
        max_students_allowed: maxStudents,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        updated_at: new Date().toISOString()
    })
        .eq('email', teacherEmail);
    console.log(`Updated subscription for ${teacherEmail}: ${subscription.status}`);
}
async function handleSubscriptionCancellation(subscription) {
    const teacherEmail = subscription.metadata.teacher_email;
    if (!teacherEmail) {
        console.error('No teacher email in subscription metadata');
        return;
    }
    await supabaseAdmin
        .from('teachers')
        .update({
        subscription_status: 'free',
        max_students_allowed: env.FREE_STUDENTS_LIMIT,
        updated_at: new Date().toISOString()
    })
        .eq('email', teacherEmail);
    console.log(`Cancelled subscription for ${teacherEmail}`);
}
async function handlePaymentSucceeded(invoice) {
    // Handle successful payment
    console.log(`Payment succeeded for invoice ${invoice.id}`);
}
async function handlePaymentFailed(invoice) {
    const teacherEmail = invoice.metadata.teacher_email;
    if (teacherEmail) {
        await supabaseAdmin
            .from('teachers')
            .update({
            subscription_status: 'payment_failed',
            updated_at: new Date().toISOString()
        })
            .eq('email', teacherEmail);
        console.log(`Payment failed for ${teacherEmail}`);
    }
}
export { router };
