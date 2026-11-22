import { AppLayout } from "@/components/layout/app-layout"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-4xl font-bold font-mono tracking-tight mb-2">404: DIRECTORY NOT FOUND</h1>
        <p className="text-muted-foreground font-mono">The requested node does not exist in the mainframe.</p>
      </div>
    </AppLayout>
  )
}
