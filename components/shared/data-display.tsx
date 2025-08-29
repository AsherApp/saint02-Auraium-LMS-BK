"use client"

import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  className = ""
}: StatCardProps) {
  return (
    <Card className={`bg-white/5 border-white/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">
          {title}
        </CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Badge>
            <span className="text-xs text-slate-400 ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DataTableProps {
  headers: string[]
  children: ReactNode
  className?: string
}

export function DataTable({ headers, children, className = "" }: DataTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((header, index) => (
              <th 
                key={index}
                className="text-left py-3 px-4 text-sm font-medium text-slate-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface DataRowProps {
  children: ReactNode
  className?: string
}

export function DataRow({ children, className = "" }: DataRowProps) {
  return (
    <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${className}`}>
      {children}
    </tr>
  )
}

interface DataCellProps {
  children: ReactNode
  className?: string
}

export function DataCell({ children, className = "" }: DataCellProps) {
  return (
    <td className={`py-3 px-4 text-sm text-white ${className}`}>
      {children}
    </td>
  )
}
