import Stripe from 'stripe'
import { env } from '../config/env.js'

// Validate Stripe configuration
export function validateStripeConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required environment variables
  if (!env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is required')
  } else if (!env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_"')
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is required')
  } else if (!env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_"')
  }

  if (!env.STRIPE_PRICE_ID_PRO) {
    errors.push('STRIPE_PRICE_ID_PRO is required')
  } else if (!env.STRIPE_PRICE_ID_PRO.startsWith('price_')) {
    errors.push('STRIPE_PRICE_ID_PRO must start with "price_"')
  }

  if (!env.STRIPE_PRICE_ID_TRIAL) {
    errors.push('STRIPE_PRICE_ID_TRIAL is required')
  } else if (!env.STRIPE_PRICE_ID_TRIAL.startsWith('price_')) {
    errors.push('STRIPE_PRICE_ID_TRIAL must start with "price_"')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Test Stripe connection
export async function testStripeConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    // Test connection by retrieving account info
    await stripe.accounts.retrieve()
    
    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Stripe'
    }
  }
}

// Validate Stripe products and prices
export async function validateStripeProducts(): Promise<{ 
  isValid: boolean; 
  errors: string[]; 
  products: any[] 
}> {
  const errors: string[] = []
  const products: any[] = []

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    // Check if Pro price exists
    try {
      const proPrice = await stripe.prices.retrieve(env.STRIPE_PRICE_ID_PRO)
      products.push({ id: proPrice.id, type: 'pro', active: proPrice.active })
      
      if (!proPrice.active) {
        errors.push('Pro price is not active')
      }
    } catch (error) {
      errors.push(`Pro price ${env.STRIPE_PRICE_ID_PRO} not found`)
    }

    // Check if Trial price exists
    try {
      const trialPrice = await stripe.prices.retrieve(env.STRIPE_PRICE_ID_TRIAL)
      products.push({ id: trialPrice.id, type: 'trial', active: trialPrice.active })
      
      if (!trialPrice.active) {
        errors.push('Trial price is not active')
      }
    } catch (error) {
      errors.push(`Trial price ${env.STRIPE_PRICE_ID_TRIAL} not found`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      products
    }
  } catch (error: any) {
    return {
      isValid: false,
      errors: [error.message || 'Failed to validate Stripe products'],
      products: []
    }
  }
}

// Get Stripe configuration status
export async function getStripeStatus(): Promise<{
  config: { isValid: boolean; errors: string[] }
  connection: { success: boolean; error?: string }
  products: { isValid: boolean; errors: string[]; products: any[] }
}> {
  const config = validateStripeConfig()
  const connection = await testStripeConnection()
  const products = await validateStripeProducts()

  return {
    config,
    connection,
    products
  }
}

// Create Stripe customer
export async function createStripeCustomer(email: string, name?: string): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'lms_platform'
      }
    })

    return {
      success: true,
      customerId: customer.id
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create Stripe customer'
    }
  }
}

// Create checkout session with enhanced error handling
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata || {},
    }

    if (params.customerId) {
      sessionConfig.customer = params.customerId
    } else if (params.customerEmail) {
      sessionConfig.customer_email = params.customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create checkout session'
    }
  }
}
