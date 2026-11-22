import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { 
  Users, DollarSign, Clock, ShieldCheck, Search, 
  Phone, Mail, Home, Edit3, Save, X, ExternalLink, AlertTriangle 
} from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"

const PIPELINE_STAGES = [
  { key: "all", label: "All Stages" },
  { key: "new_lead", label: "1. New Lead" },
  { key: "skip_traced", label: "2. Skip-Traced" },
  { key: "outreach_sent", label: "3. Outreach Sent" },
  { key: "under_contract", label: "4. Under Contract" },
  { key: "claim_filed", label: "5. Claim Filed" },
  { key: "paid", label: "6. Funds Recovered" },
]

export default function CrmLeadsPage() {
  const [selectedStage, setSelectedStage] = React.useState("all")
  const [selectedState, setSelectedState] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [activeLead, setActiveLead] = React.useState<any | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editForm, setEditForm] = React.useState<any>({})

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crm/leads", { status: selectedStage, state: selectedState, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedStage !== "all") params.append("status", selectedStage)
      if (selectedState !== "all") params.append("state", selectedState)
      if (search) params.append("search", search)
      
      const res = await fetch(`/api/crm/leads?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load CRM leads")
      return res.json()
    }
  })

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update lead")
      return res.json()
    },
    onSuccess: (updated) => {
      toast.success("Lead Updated", { description: `Parcel ${updated.parcelNumber} changes saved.` })
      setActiveLead(updated)
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] })
    },
    onError: (err: any) => {
      toast.error("Update Failed", { description: err.message })
    }
  })

  const handleOpenLead = (lead: any) => {
    setActiveLead(lead)
    setEditForm({
      priorOwnerName: lead.priorOwnerName || "",
      contactPhone: lead.contactPhone || "",
      contactEmail: lead.contactEmail || "",
      mailingAddress: lead.mailingAddress || "",
      skipTraceStatus: lead.skipTraceStatus || "unsearched",
      leadStatus: lead.leadStatus || "new_lead",
      heirInformation: lead.heirInformation || "",
      skipTraceNotes: lead.skipTraceNotes || "",
      claimReferenceNumber: lead.claimReferenceNumber || "",
      notes: lead.notes || "",
    })
    setIsEditing(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLead) return
    updateLeadMutation.mutate({ id: activeLead.id, updates: editForm })
  }

  const handleQuickStatusChange = (leadId: number, newStatus: string) => {
    updateLeadMutation.mutate({ id: leadId, updates: { leadStatus: newStatus } })
  }

  const summary = data?.summary

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary text-glow-amber">
              Prior Owner Recovery CRM
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              ISOLATED FORECLOSURE OVERAGE LEADS & SKIP-TRACING PIPELINE
            </p>
          </div>
          <Link href="/excess-proceeds">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-sidebar border border-sidebar-border text-muted-foreground font-mono text-xs rounded hover:text-foreground transition-all">
              &larr; Back to Staging Tracker
            </button>
          </Link>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-primary">
            <CardContent className="p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase">Active Pipeline Leads</p>
              <p className="text-2xl font-bold lcd-text text-primary mt-1">
                {formatNumber(summary?.totalLeads || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-success">
            <CardContent className="p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase">Total Pipeline Overage</p>
              <p className="text-2xl font-bold lcd-text text-success text-glow-green mt-1">
                {formatCurrency(summary?.totalPipelineValue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-warning">
            <CardContent className="p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase">Est. Contingency Fees (~25%)</p>
              <p className="text-2xl font-bold lcd-text text-warning mt-1">
                {formatCurrency(summary?.totalPotentialFees || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-destructive">
            <CardContent className="p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase">Urgent Escheatment (&lt;180d)</p>
              <p className="text-2xl font-bold lcd-text text-destructive mt-1">
                {formatNumber(summary?.urgentCount || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="bg-sidebar border-sidebar-border p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {PIPELINE_STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedStage(s.key)}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                    selectedStage === s.key
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search APN, Owner, Address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Leads Table */}
        <Card className="bg-background border-border shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-sidebar text-muted-foreground border-b border-sidebar-border font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Parcel / Location</th>
                  <th className="px-4 py-3 font-medium">Prior Owner of Record</th>
                  <th className="px-4 py-3 font-medium text-right text-success">Net Surplus</th>
                  <th className="px-4 py-3 font-medium text-right text-warning">Est. Fee (25%)</th>
                  <th className="px-4 py-3 font-medium">County Escheatment Clock</th>
                  <th className="px-4 py-3 font-medium">Pipeline Stage</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border font-mono">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">LOADING CRM PIPELINE...</td></tr>
                ) : data?.leads?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No leads in this stage yet. Go to <Link href="/excess-proceeds" className="text-primary underline">Excess Proceeds Staging</Link> and click "Promote to CRM"!
                    </td>
                  </tr>
                ) : (
                  data?.leads?.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-sidebar/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-primary">{lead.parcelNumber}</div>
                        <div className="text-xs text-muted-foreground">{lead.state} • {lead.county}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{lead.priorOwnerName || "Unknown Owner"}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.contactPhone ? (
                            <span className="text-success flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.contactPhone}</span>
                          ) : (
                            <span className="text-muted-foreground">No phone listed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-success lcd-text text-base">
                        {formatCurrency(lead.excessAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-warning lcd-text">
                        {formatCurrency(lead.estimatedRecoveryFee)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {lead.daysRemaining <= 90 ? (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/50 text-[10px] px-1.5 py-0 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              CRITICAL: {lead.daysRemaining}d
                            </Badge>
                          ) : lead.daysRemaining <= 180 ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px] px-1.5 py-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              URGENT: {lead.daysRemaining}d
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">
                              {lead.daysRemaining} days left
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Deadline: {lead.claimDeadline || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.leadStatus}
                          onChange={(e) => handleQuickStatusChange(lead.id, e.target.value)}
                          className="bg-background border border-border text-xs font-mono rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="new_lead">1. New Lead</option>
                          <option value="skip_traced">2. Skip-Traced</option>
                          <option value="outreach_sent">3. Outreach Sent</option>
                          <option value="under_contract">4. Under Contract</option>
                          <option value="claim_filed">5. Claim Filed</option>
                          <option value="paid">6. Paid</option>
                          <option value="dead_lead">Dead / Disqualified</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenLead(lead)}
                          className="px-2.5 py-1 bg-sidebar-accent hover:bg-primary hover:text-primary-foreground border border-border rounded text-xs font-mono transition-all flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          Skip-Trace / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Lead Detail & Skip-Trace Drawer / Modal */}
        {activeLead && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-sidebar border border-sidebar-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-sidebar-border pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Skip-Trace File: {activeLead.parcelNumber}
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground">
                    {activeLead.county} County, {activeLead.state} • Surplus: ${Number(activeLead.excessAmount).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setActiveLead(null)}
                  className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground uppercase">Prior Owner of Record</label>
                    <input
                      type="text"
                      value={editForm.priorOwnerName}
                      onChange={(e) => setEditForm({ ...editForm, priorOwnerName: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground font-sans text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground uppercase">Skip-Trace Finding Status</label>
                    <select
                      value={editForm.skipTraceStatus}
                      onChange={(e) => setEditForm({ ...editForm, skipTraceStatus: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                    >
                      <option value="unsearched">Unsearched</option>
                      <option value="in_progress">In Progress</option>
                      <option value="located">Owner Located</option>
                      <option value="deceased">Deceased (Estate)</option>
                      <option value="heirs_found">Heirs Identified</option>
                      <option value="not_found">Not Found</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground uppercase">Phone Number(s)</label>
                    <input
                      type="text"
                      placeholder="e.g. (555) 123-4567"
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground uppercase">Email Address(es)</label>
                    <input
                      type="text"
                      placeholder="e.g. owner@gmail.com"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground uppercase">Last Known Mailing / Current Address</label>
                  <input
                    type="text"
                    placeholder="Street, City, State, Zip"
                    value={editForm.mailingAddress}
                    onChange={(e) => setEditForm({ ...editForm, mailingAddress: e.target.value })}
                    className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground uppercase">Heirs / Estate Relatives Information</label>
                  <textarea
                    rows={2}
                    placeholder="Names of surviving spouse, children, executor, probate case number..."
                    value={editForm.heirInformation}
                    onChange={(e) => setEditForm({ ...editForm, heirInformation: e.target.value })}
                    className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground font-sans"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground uppercase">Skip-Trace Research Notes</label>
                  <textarea
                    rows={3}
                    placeholder="TruePeopleSearch / LexisNexis / County assessor record findings..."
                    value={editForm.skipTraceNotes}
                    onChange={(e) => setEditForm({ ...editForm, skipTraceNotes: e.target.value })}
                    className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground uppercase">Pipeline Stage</label>
                    <select
                      value={editForm.leadStatus}
                      onChange={(e) => setEditForm({ ...editForm, leadStatus: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                    >
                      <option value="new_lead">1. New Lead</option>
                      <option value="skip_traced">2. Skip-Traced</option>
                      <option value="outreach_sent">3. Outreach Sent</option>
                      <option value="under_contract">4. Under Contract</option>
                      <option value="claim_filed">5. Claim Filed</option>
                      <option value="paid">6. Paid</option>
                      <option value="dead_lead">Dead Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground uppercase">County Claim Reference / Tracking #</label>
                    <input
                      type="text"
                      placeholder="e.g. CLM-2026-9812"
                      value={editForm.claimReferenceNumber}
                      onChange={(e) => setEditForm({ ...editForm, claimReferenceNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-background border border-border rounded text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-sidebar-border">
                  <button
                    type="button"
                    onClick={() => setActiveLead(null)}
                    className="px-4 py-2 bg-background border border-border rounded font-mono text-xs hover:bg-sidebar-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLeadMutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground font-mono font-bold text-xs rounded hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updateLeadMutation.isPending ? "Saving..." : "Save Skip-Trace File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
