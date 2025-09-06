"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { TransactionService, TeacherTransaction, TransactionSummary } from "@/services/transactions/api"
import { dateUtils } from "@/utils/date-utils"
import { 
  CreditCard, 
  Download, 
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function TransactionsSection() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<TeacherTransaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch transactions and summary
  useEffect(() => {
    if (user?.email) {
      fetchData()
    }
  }, [user?.email])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transactionsData, summaryData] = await Promise.all([
        TransactionService.getTransactions(user!.email),
        TransactionService.getTransactionSummary(user!.email)
      ])
      
      setTransactions(transactionsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({ 
        title: "Error", 
        description: "Failed to load transaction data", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchData()
      toast({ 
        title: "Success", 
        description: "Transaction data refreshed" 
      })
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to refresh data", 
        variant: "destructive" 
      })
    } finally {
      setRefreshing(false)
    }
  }

  const exportTransactions = () => {
    if (transactions.length === 0) {
      toast({ 
        title: "No Data", 
        description: "No transactions to export", 
        variant: "destructive" 
      })
      return
    }

    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Status', 'Transaction ID'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        TransactionService.getTransactionTypeDisplay(t.transaction_type),
        t.description || 'N/A',
        TransactionService.formatAmount(t.amount_cents, t.currency),
        t.status,
        t.transaction_id
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({ 
      title: "Exported", 
      description: "Transaction data exported to CSV" 
    })
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <p className="text-slate-400 text-sm">View your payment history and platform access</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={exportTransactions}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Spent</p>
                <p className="text-white font-semibold">{summary.totalAmountFormatted}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-white font-semibold">{summary.completedTransactions}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-white font-semibold">{summary.pendingTransactions}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Slots</p>
                <p className="text-white font-semibold">{summary.totalSlots}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Transactions Table */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Recent Transactions</h4>
            <Badge variant="secondary" className="bg-white/10 text-slate-300">
              {transactions.length} transactions
            </Badge>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h5 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h5>
              <p className="text-slate-400">
                Your transaction history will appear here once you make payments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {dateUtils.short(transaction.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                          >
                            {TransactionService.getTransactionTypeDisplay(transaction.transaction_type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-white max-w-xs">
                          <div className="truncate">
                            {transaction.description || 'N/A'}
                          </div>
                          {transaction.access_plan && (
                            <div className="text-xs text-slate-400 mt-1">
                              Plan: {TransactionService.getAccessPlanDisplay(transaction.access_plan)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-white font-semibold">
                              {TransactionService.formatAmount(transaction.amount_cents, transaction.currency)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const statusDisplay = TransactionService.getStatusDisplay(transaction.status)
                            return (
                              <Badge 
                                className={`${statusDisplay.bgColor} ${statusDisplay.color} border-0`}
                              >
                                {statusDisplay.label}
                              </Badge>
                            )
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10"
                              onClick={() => {
                                // Show transaction details modal
                                toast({
                                  title: "Transaction Details",
                                  description: `Transaction ID: ${transaction.transaction_id}`,
                                })
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Transaction Insights */}
      {transactions.length > 0 && (
        <GlassCard className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Transaction Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-white">Payment Breakdown</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Platform Access</span>
                  <span className="text-white">
                    {TransactionService.formatAmount(
                      transactions
                        .filter(t => t.transaction_type === 'platform_access' && t.status === 'completed')
                        .reduce((sum, t) => sum + t.amount_cents, 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Student Slots</span>
                  <span className="text-white">
                    {TransactionService.formatAmount(
                      transactions
                        .filter(t => t.transaction_type === 'student_slots' && t.status === 'completed')
                        .reduce((sum, t) => sum + t.amount_cents, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium text-white">Slot Summary</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Initial Slots</span>
                  <span className="text-white">
                    {transactions
                      .filter(t => t.transaction_type === 'platform_access' && t.status === 'completed')
                      .reduce((sum, t) => sum + t.student_slots_included, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Additional Slots</span>
                  <span className="text-white">
                    {transactions
                      .filter(t => t.transaction_type === 'student_slots' && t.status === 'completed')
                      .reduce((sum, t) => sum + t.slots_purchased, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
