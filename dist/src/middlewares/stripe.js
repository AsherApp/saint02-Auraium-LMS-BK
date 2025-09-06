import Stripe from 'stripe';
import { env } from '../config/env.js';
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});
// Stripe error handling middleware
export function stripeErrorHandler(error, req, res, next) {
    if (error.type?.startsWith('Stripe')) {
        console.error('Stripe error:', error);
        switch (error.type) {
            case 'StripeCardError':
                return res.status(400).json({
                    error: 'card_error',
                    message: error.message || 'Your card was declined'
                });
            case 'StripeRateLimitError':
                return res.status(429).json({
                    error: 'rate_limit_error',
                    message: 'Too many requests. Please try again later'
                });
            case 'StripeInvalidRequestError':
                return res.status(400).json({
                    error: 'invalid_request',
                    message: error.message || 'Invalid request'
                });
            case 'StripeAPIError':
                return res.status(500).json({
                    error: 'api_error',
                    message: 'Payment service temporarily unavailable'
                });
            case 'StripeConnectionError':
                return res.status(500).json({
                    error: 'connection_error',
                    message: 'Unable to connect to payment service'
                });
            case 'StripeAuthenticationError':
                return res.status(500).json({
                    error: 'authentication_error',
                    message: 'Payment service authentication failed'
                });
            default:
                return res.status(500).json({
                    error: 'payment_error',
                    message: 'An unexpected payment error occurred'
                });
        }
    }
    next(error);
}
// Validate Stripe webhook signature
export function validateStripeWebhook(req, res, next) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = env.STRIPE_WEBHOOK_SECRET;
    if (!sig) {
        return res.status(400).json({ error: 'missing_signature' });
    }
    if (!endpointSecret) {
        return res.status(500).json({ error: 'webhook_secret_not_configured' });
    }
    try {
        stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        next();
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'invalid_signature' });
    }
}
// Rate limiting for Stripe operations
export function stripeRateLimit(req, res, next) {
    // Simple in-memory rate limiting (in production, use Redis)
    const userEmail = req.user?.email;
    if (!userEmail) {
        return next();
    }
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 requests per minute
    // This is a simplified rate limiter - in production, use a proper rate limiting library
    if (!global.stripeRateLimit) {
        global.stripeRateLimit = new Map();
    }
    const userLimits = global.stripeRateLimit.get(userEmail) || { count: 0, resetTime: now + windowMs };
    if (now > userLimits.resetTime) {
        userLimits.count = 0;
        userLimits.resetTime = now + windowMs;
    }
    if (userLimits.count >= maxRequests) {
        return res.status(429).json({
            error: 'rate_limit_exceeded',
            message: 'Too many payment requests. Please try again later'
        });
    }
    userLimits.count++;
    global.stripeRateLimit.set(userEmail, userLimits);
    next();
}
// Validate Stripe customer ID
export function validateStripeCustomer(req, res, next) {
    const { customerId } = req.params;
    if (!customerId || !customerId.startsWith('cus_')) {
        return res.status(400).json({
            error: 'invalid_customer_id',
            message: 'Invalid Stripe customer ID'
        });
    }
    next();
}
// Validate Stripe price ID
export function validateStripePrice(req, res, next) {
    const { priceId } = req.body;
    if (!priceId || !priceId.startsWith('price_')) {
        return res.status(400).json({
            error: 'invalid_price_id',
            message: 'Invalid Stripe price ID'
        });
    }
    next();
}
// Log Stripe operations
export function logStripeOperation(req, res, next) {
    const userEmail = req.user?.email;
    const operation = req.path.split('/').pop();
    console.log(`Stripe operation: ${operation} for user: ${userEmail}`);
    next();
}
