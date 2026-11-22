import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useLogin, useGetAuthStatus } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ShieldCheck, ShieldAlert, KeyRound, Terminal } from "lucide-react"

export default function SettingsPage() {
  const { data: authStatus, refetch } = useGetAuthStatus({ query: { queryKey: ["/api/auth/status"] } })
  const loginMutation = useLogin()
  const { toast } = useToast()
  
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return;
    
    loginMutation.mutate({
      data: { username, password }
    }, {
      onSuccess: () => {
        toast({ title: "Authentication Successful", description: "System linked to Bid4Assets." })
        setPassword("")
        refetch()
      },
      onError: (err) => {
        toast({ title: "Authentication Failed", description: (err as any)?.error || "Authentication failed", variant: "destructive" })
      }
    })
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">CONFIGURATION & INTEGRATIONS</p>
        </div>

        <Card className="border-2 border-sidebar-border bg-sidebar shadow-lg">
          <CardHeader className="border-b border-sidebar-border bg-sidebar-accent/30 flex flex-row items-center gap-4">
            <div className={`p-3 rounded-full ${authStatus?.loggedIn ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
              {authStatus?.loggedIn ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>
            <div>
              <CardTitle className="font-mono text-lg">BID4ASSETS CREDENTIALS</CardTitle>
              <CardDescription className="font-mono text-xs mt-1">
                {authStatus?.loggedIn ? 'CONNECTION ACTIVE' : 'AUTHENTICATION REQUIRED'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {authStatus?.loggedIn ? (
              <div className="space-y-4">
                <div className="bg-background border border-border p-4 rounded-lg font-mono">
                  <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                    <span>AUTHENTICATED USER</span>
                    <span className="text-success glow-green">VERIFIED</span>
                  </div>
                  <div className="text-xl text-primary">{authStatus.username}</div>
                  {authStatus.lastLoginAt && (
                    <div className="text-xs text-muted-foreground mt-4">
                      SESSION START: {new Date(authStatus.lastLoginAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Logout via the sidebar to switch accounts.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6 max-w-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-mono text-xs text-muted-foreground uppercase">Username</Label>
                    <div className="relative">
                      <Terminal className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="username" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="pl-10 font-mono bg-background border-border focus-visible:ring-primary" 
                        placeholder="admin_user"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-mono text-xs text-muted-foreground uppercase">Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 font-mono bg-background border-border focus-visible:ring-primary" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  variant="terminal" 
                  className="w-full"
                  disabled={loginMutation.isPending || !username || !password}
                >
                  {loginMutation.isPending ? 'AUTHENTICATING...' : 'ESTABLISH LINK'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
