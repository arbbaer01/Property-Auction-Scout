import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useListProperties } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { Search, Database } from "lucide-react"

export default function PropertiesPage() {
  const [params, setParams] = React.useState({
    limit: 50,
    offset: 0,
    state: '',
    county: '',
    parcel_number: ''
  })
  
  // Debounce search
  const [searchVal, setSearchVal] = React.useState('')
  React.useEffect(() => {
    const t = setTimeout(() => setParams(p => ({...p, parcel_number: searchVal, offset: 0})), 500)
    return () => clearTimeout(t)
  }, [searchVal])

  const { data, isLoading } = useListProperties(params, { 
    query: { queryKey: ["/api/properties", params] } 
  })

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties Database</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">RAW PARCEL DATA REPOSITORY</p>
          </div>
        </div>

        <Card className="bg-sidebar border-sidebar-border p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search APN..." 
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="pl-10 font-mono bg-background border-border" 
              />
            </div>
            <select 
              value={params.state}
              onChange={e => setParams({...params, state: e.target.value, offset: 0})}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">ALL STATES</option>
              <option value="NV">NEVADA</option>
              <option value="CA">CALIFORNIA</option>
              <option value="AZ">ARIZONA</option>
            </select>
            <div className="ml-auto flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Database className="w-4 h-4" />
              {data?.total || 0} RECORDS
            </div>
          </div>
        </Card>

        <Card className="bg-background border-border shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-sidebar text-muted-foreground border-b border-sidebar-border font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">APN</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Min Bid / Tax</th>
                  <th className="px-4 py-3 font-medium">Sale Price</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border font-mono">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">LOADING DATABASE...</td></tr>
                ) : data?.properties.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">NO RECORDS FOUND</td></tr>
                ) : (
                  data?.properties.map(record => (
                    <tr key={record.id} className="hover:bg-sidebar/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-primary">{record.parcelNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.state} • {record.county}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{record.spreadsheetType.replace('_', ' ').toUpperCase()}</td>
                      <td className="px-4 py-3 lcd-text">{formatCurrency(record.minimumBid || record.taxBillAmount)}</td>
                      <td className="px-4 py-3 lcd-text text-info">{record.salePrice ? formatCurrency(record.salePrice) : '-'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-xs">{record.ownerName || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border bg-sidebar/50">
            <div className="text-xs font-mono text-muted-foreground">
              SHOWING {params.offset + 1}-{Math.min(params.offset + params.limit, data?.total || 0)} OF {data?.total || 0}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setParams(p => ({...p, offset: Math.max(0, p.offset - p.limit)}))}
                disabled={params.offset === 0}
                className="px-3 py-1 bg-background border border-border rounded font-mono text-xs disabled:opacity-50"
              >
                PREV
              </button>
              <button 
                onClick={() => setParams(p => ({...p, offset: p.offset + p.limit}))}
                disabled={!data || params.offset + params.limit >= data.total}
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
