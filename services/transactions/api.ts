import { http } from '../http'

export interface TeacherTransaction {
  id: number
  transaction_id: string
  transaction_type: 'platform_access' | 'student_slots'
  amount_cents: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  access_plan?: 'basic' | 'premium'
  student_slots_included: number
  slots_purchased: number
  slots_added: number
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  description?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface TransactionSummary {
  totalTransactions: number
  completedTransactions: number
  pendingTransactions: number
  failedTransactions: number
  totalAmountCents: number
  totalAmountFormatted: string
  totalSlots: number
  lastTransactionDate?: string
}

export class TransactionService {
  // Get all transactions for a teacher
  static async getTransactions(teacherEmail: string): Promise<TeacherTransaction[]> {
    try {
      const response = await http<{ success: boolean; transactions: TeacherTransaction[] }>(
        `/api/transactions?email=${encodeURIComponent(teacherEmail)}`
      )
      
      if (response.success) {
        return response.transactions
      }
      
      throw new Error('Failed to fetch transactions')
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  // Get transaction summary for a teacher
  static async getTransactionSummary(teacherEmail: string): Promise<TransactionSummary> {
    try {
      const response = await http<{ success: boolean; summary: TransactionSummary }>(
        `/api/transactions/summary?email=${encodeURIComponent(teacherEmail)}`
      )
      
      if (response.success) {
        return response.summary
      }
      
      throw new Error('Failed to fetch transaction summary')
    } catch (error) {
      console.error('Error fetching transaction summary:', error)
      throw error
    }
  }

  // Create a new transaction (usually called by webhook)
  static async createTransaction(transactionData: {
    teacher_email: string
    transaction_id: string
    transaction_type: 'platform_access' | 'student_slots'
    amount_cents: number
    currency?: string
    status?: 'pending' | 'completed' | 'failed' | 'refunded'
    access_plan?: 'basic' | 'premium'
    student_slots_included?: number
    slots_purchased?: number
    slots_added?: number
    stripe_payment_intent_id?: string
    stripe_customer_id?: string
    description?: string
    metadata?: Record<string, any>
  }): Promise<TeacherTransaction> {
    try {
      const response = await http<{ success: boolean; transaction: TeacherTransaction }>(
        '/api/transactions',
        {
          method: 'POST',
          body: JSON.stringify(transactionData)
        }
      )
      
      if (response.success) {
        return response.transaction
      }
      
      throw new Error('Failed to create transaction')
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  // Format amount from cents to currency
  static formatAmount(amountCents: number, currency: string = 'USD'): string {
    const amount = amountCents / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Get transaction type display name
  static getTransactionTypeDisplay(type: 'platform_access' | 'student_slots'): string {
    switch (type) {
      case 'platform_access':
        return 'Platform Access'
      case 'student_slots':
        return 'Student Slots'
      default:
        return type
    }
  }

  // Get status display name and color
  static getStatusDisplay(status: 'pending' | 'completed' | 'failed' | 'refunded'): {
    label: string
    color: string
    bgColor: string
  } {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'failed':
        return {
          label: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      case 'refunded':
        return {
          label: 'Refunded',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      default:
        return {
          label: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  // Get access plan display name
  static getAccessPlanDisplay(plan?: 'basic' | 'premium'): string {
    switch (plan) {
      case 'basic':
        return 'Basic Plan'
      case 'premium':
        return 'Premium Plan'
      default:
        return 'N/A'
    }
  }

  // Calculate total spent
  static calculateTotalSpent(transactions: TeacherTransaction[]): number {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((total, t) => total + t.amount_cents, 0)
  }

  // Calculate total slots purchased
  static calculateTotalSlots(transactions: TeacherTransaction[]): number {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((total, t) => {
        if (t.transaction_type === 'platform_access') {
          return total + t.student_slots_included
        } else {
          return total + t.slots_purchased
        }
      }, 0)
  }
}
