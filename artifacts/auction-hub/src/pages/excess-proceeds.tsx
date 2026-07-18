import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useListExcessProceeds, useGetExcessProceedsSummary } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { DollarSign, AlertCircle, Calendar } from "lucide-react"

export default function ExcessProceedsPage() {
  const [page, setPage] = React.useState(0);
  const limit = 50;
  
  const { data: summary } = useGetExcessProceedsSummary({ query: { queryKey: ["/api/excess-proceeds/summary"] } })
  const { data, isLoading } = useListExcessProceeds(
    { limit, offset: page * limit }, 
    { query: { queryKey: ["/api/excess-proceeds", { limit, offset: page * limit }] } }
  )

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-success text-glow-green">Excess Proceeds Tracker</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">POST-AUCTION SURPLUS FUNDS RECOVERY</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-success">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground uppercase">Total Unclaimed Amount</p>
                  <p className="text-3xl font-bold lcd-text text-success text-glow-green">
                    {formatCurrency(summary?.unclaimedAmount)}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground uppercase">Unclaimed Records</p>
                  <p className="text-3xl font-bold lcd-text text-primary text-glow-amber">
                    {formatNumber(summary?.unclaimedCount)}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sidebar border-sidebar-border">
            <CardContent className="p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase mb-4">By State Breakdown</p>
              <div className="space-y-2">
                {summary?.byState.map(st => (
                  <div key={st.state} className="flex justify-between text-sm font-mono">
                    <span>{st.state}</span>
                    <span className="font-bold">{formatNumber(st.count)} records</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="bg-background border-border shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-sidebar text-muted-foreground border-b border-sidebar-border font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">APN / Location</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium text-right">Sale Price</th>
                  <th className="px-4 py-3 font-medium text-right">Tax Bill</th>
                  <th className="px-4 py-3 font-medium text-right text-success">Excess Amount</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border font-mono">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">LOADING RECORDS...</td></tr>
                ) : data?.records.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">NO RECORDS FOUND</td></tr>
                ) : (
                  data?.records.map(record => (
                    <tr key={record.id} className="hover:bg-sidebar/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-primary">{record.parcelNumber}</div>
                        <div className="text-xs text-muted-foreground">{record.state} • {record.county}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={record.ownerName || ''}>
                        {record.ownerName || 'UNKNOWN'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(record.salePrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(record.taxBillAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-success lcd-text text-base">
                        {formatCurrency(record.excessAmount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.claimDeadline ? new Date(record.claimDeadline).toLocaleDateString() : 'UNKNOWN'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.claimed ? (
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground">CLAIMED</Badge>
                        ) : (
                          <Badge variant="success" className="bg-success/20 text-success border-success/50">AVAILABLE</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border bg-sidebar/50">
            <div className="text-xs font-mono text-muted-foreground">
              SHOWING {page * limit + 1}-{Math.min((page + 1) * limit, data?.total || 0)} OF {data?.total || 0}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-background border border-border rounded font-mono text-xs disabled:opacity-50"
              >
                PREV
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!data || (page + 1) * limit >= data.total}
                className="px-3 py-1 bg-background border border-border rounded font-mono text-xs disabled:opacity-50"
              >
                NEXT
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
