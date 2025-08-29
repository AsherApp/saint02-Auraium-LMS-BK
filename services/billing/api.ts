import { http } from "../http"

export interface TrialStatus {
  started_at: string
  ends_at: string
  is_expired: boolean
  days_remaining: number
}

export interface SubscriptionStatus {
  subscription_status: string
  max_students_allowed: number
  has_subscription: boolean
  trial_status?: TrialStatus
  subscription?: {
    id: string
    status: string
    current_period_end: number
    cancel_at_period_end: boolean
  }
}

export interface CheckoutResponse {
  sessionId: string
  url: string
}

export interface PortalResponse {
  url: string
}

export interface TrialResponse {
  success: boolean
  trial_started_at: string
  trial_ends_at: string
  days_remaining: number
}

export class BillingService {
  // Get current subscription status
  static async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return http<SubscriptionStatus>('/api/billing/status')
  }

  // Create checkout session for subscription
  static async createCheckoutSession(priceId?: string, startTrial?: boolean): Promise<CheckoutResponse> {
    return http<CheckoutResponse>('/api/billing/checkout', {
      method: 'POST',
      body: { priceId, startTrial }
    })
  }

  // Start free trial
  static async startTrial(): Promise<TrialResponse> {
    return http<TrialResponse>('/api/billing/start-trial', {
      method: 'POST',
      body: {}
    })
  }

  // Create customer portal session
  static async createPortalSession(): Promise<PortalResponse> {
    return http<PortalResponse>('/api/billing/portal', {
      method: 'POST',
      body: {}
    })
  }

  // Get subscription plans (Pro only)
  static getPlans() {
    return [
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 50,
        priceFormatted: '£50',
        period: 'per month',
        students: 50,
        features: [
          'Up to 50 students',
          'Unlimited courses & modules',
          'Live video classes',
          'Interactive whiteboard',
          'Advanced assignments',
          'Real-time chat',
          'Progress tracking',
          'Priority support',
          'File uploads (100MB)',
          'Advanced analytics',
          'Student management',
          'Event scheduling'
        ],
        limitations: [],
        popular: true
      }
    ]
  }

  // Check if user can add more students
  static canAddStudents(currentCount: number, maxAllowed: number): boolean {
    return currentCount < maxAllowed
  }

  // Get upgrade message
  static getUpgradeMessage(currentCount: number, maxAllowed: number): string {
    if (currentCount >= maxAllowed) {
      return `You've reached your student limit (${maxAllowed}). Upgrade to Pro to add more students.`
    }
    return `You can add ${maxAllowed - currentCount} more students.`
  }

  // Check if user is on trial
  static isOnTrial(subscriptionStatus: SubscriptionStatus | null): boolean {
    if (!subscriptionStatus) return false
    return subscriptionStatus.subscription_status === 'trial' && 
           !!subscriptionStatus.trial_status && 
           !subscriptionStatus.trial_status.is_expired
  }

  // Get trial status message
  static getTrialMessage(trialStatus: TrialStatus | null): string {
    if (!trialStatus) return 'No trial information available.'
    if (trialStatus.is_expired) {
      return 'Your trial has expired. Upgrade to Pro to continue using advanced features.'
    }
    return `You have ${trialStatus.days_remaining} days remaining in your trial.`
  }

  // Check if trial is expiring soon (within 3 days)
  static isTrialExpiringSoon(trialStatus: TrialStatus | null): boolean {
    if (!trialStatus) return false
    return !trialStatus.is_expired && trialStatus.days_remaining <= 3
  }
}
