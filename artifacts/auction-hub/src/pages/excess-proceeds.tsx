import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useListExcessProceeds, useGetExcessProceedsSummary } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { DollarSign, AlertCircle, Calendar, ShieldCheck, Clock, ArrowRight, Filter } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"

const OVERAGE_PRESETS = [
  { label: "All Amounts", value: 0 },
  { label: "> $5,000", value: 5000 },
  { label: "> $10,000", value: 10000 },
  { label: "> $25,000", value: 25000 },
  { label: "> $50,000", value: 50000 },
  { label: "> $100,000", value: 100000 },
]

export default function ExcessProceedsPage() {
  const [page, setPage] = React.useState(0);
  const [minOverage, setMinOverage] = React.useState<number>(10000); // Default $10k+
  const [selectedState, setSelectedState] = React.useState<string>("ALL");
  const [promotingId, setPromotingId] = React.useState<number | null>(null);
  const [promotedIds, setPromotedIds] = React.useState<Set<number>>(new Set());

  const limit = 50;
  const queryClient = useQueryClient();
  
  const { data: summary } = useGetExcessProceedsSummary({ query: { queryKey: ["/api/excess-proceeds/summary"] } })

  const queryParams: Record<string, any> = {
    limit,
    offset: page * limit,
  };
  if (minOverage > 0) queryParams.min_amount = minOverage;
  if (selectedState !== "ALL") queryParams.state = selectedState;

  const { data, isLoading } = useListExcessProceeds(
    queryParams as any,
    { query: { queryKey: ["/api/excess-proceeds", queryParams] } }
  )

  const handlePromoteToCheckpoint = async (record: any) => {
    try {
      setPromotingId(record.id);
      const res = await fetch(`/api/excess-proceeds/${record.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to promote record");
      }
      
      const result = await res.json();
      setPromotedIds(prev => new Set(prev).add(record.id));
      toast.success("Checkpoint Passed!", {
        description: `Parcel ${record.parcelNumber} ($${Number(record.excessAmount).toLocaleString()}) isolated into Recovery CRM.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/excess-proceeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    } catch (err: any) {
      toast.error("Promotion Failed", { description: err.message });
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-success text-glow-green">Excess Proceeds Tracker</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              POST-AUCTION FORECLOSURE OVERAGES & ESCHEATMENT MONITOR
            </p>
          </div>
          <Link href="/crm-leads">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs rounded shadow-md hover:bg-primary/90 transition-all">
              <ShieldCheck className="w-4 h-4" />
              VIEW RECOVERY CRM LEADS
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
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
              <p className="text-xs font-mono text-muted-foreground uppercase mb-3">By State Breakdown</p>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {summary?.byState.map(st => (
                  <div key={st.state} className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{st.state}</span>
                    <span className="font-bold">{formatNumber(st.count)} records</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar: Selectable Overage & State Filter */}
        <Card className="bg-sidebar border-sidebar-border p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase font-bold text-muted-foreground">Min. Overage Threshold:</span>
              <div className="flex flex-wrap gap-1.5">
                {OVERAGE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setMinOverage(p.value); setPage(0); }}
                    className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                      minOverage === p.value
                        ? "bg-success text-black font-bold border-success shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        : "bg-background border-border text-muted-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-muted-foreground">State:</span>
              <div className="flex gap-1">
                {["ALL", "CA", "WA", "NV", "FL", "TX", "AZ"].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setSelectedState(st); setPage(0); }}
                    className={`px-2 py-0.5 text-xs font-mono rounded border transition-all ${
                      selectedState === st
                        ? "bg-primary text-primary-foreground font-bold border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Data Table with Checkpoint Gate */}
        <Card className="bg-background border-border shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-sidebar text-muted-foreground border-b border-sidebar-border font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">APN / Location</th>
                  <th className="px-4 py-3 font-medium">Prior Owner</th>
                  <th className="px-4 py-3 font-medium text-right">Sale Price</th>
                  <th className="px-4 py-3 font-medium text-right">Tax Bill</th>
                  <th className="px-4 py-3 font-medium text-right text-success">Net Overage</th>
                  <th className="px-4 py-3 font-medium">County Escheatment Window</th>
                  <th className="px-4 py-3 font-medium text-center">Checkpoint Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border font-mono">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">LOADING RECORDS...</td></tr>
                ) : data?.records.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">NO RECORDS MATCHING OVERAGE THRESHOLD</td></tr>
                ) : (
                  data?.records.map((record: any) => {
                    const isPromoted = record.promotedToCrm || promotedIds.has(record.id);
                    const daysLeft = record.daysUntilEscheatment;
                    
                    return (
                      <tr key={record.id} className="hover:bg-sidebar/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-primary">{record.parcelNumber}</div>
                          <div className="text-xs text-muted-foreground">{record.state} • {record.county}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate" title={record.ownerName || ''}>
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{record.claimDeadline ? new Date(record.claimDeadline).toLocaleDateString() : 'Est. by Statute'}</span>
                            </div>
                            {daysLeft !== null && daysLeft !== undefined && (
                              <div>
                                {daysLeft <= 90 ? (
                                  <Badge className="bg-destructive/20 text-destructive border-destructive/50 text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit">
                                    <Clock className="w-2.5 h-2.5" />
                                    CRITICAL: {daysLeft} DAYS
                                  </Badge>
                                ) : daysLeft <= 180 ? (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit">
                                    <Clock className="w-2.5 h-2.5" />
                                    URGENT: {daysLeft} DAYS
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {daysLeft} days remaining
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPromoted ? (
                            <Link href="/crm-leads">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40 font-mono text-xs cursor-pointer hover:bg-primary/20">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                IN CRM PIPELINE
                              </Badge>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handlePromoteToCheckpoint(record)}
                              disabled={promotingId === record.id}
                              className="px-3 py-1.5 bg-success/20 hover:bg-success/30 border border-success/60 text-success text-xs font-mono font-bold rounded transition-all flex items-center gap-1 mx-auto disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {promotingId === record.id ? "QUALIFYING..." : "PROMOTE TO CRM"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
