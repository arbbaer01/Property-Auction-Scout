import { useGetAuthStatus, useLogout } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"

export function useAuthStatus() {
  const { data, isLoading, error } = useGetAuthStatus({ 
    query: { refetchInterval: 60000, queryKey: ["/api/auth/status"] } 
  });

  return {
    authStatus: data,
    isLoading,
    error
  }
}

export function useLogoutHandler() {
  const { toast } = useToast()
  return useLogout({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "Successfully disconnected from Bid4Assets.",
        })
      },
      onError: (err) => {
        toast({
          title: "Logout failed",
          description: (err as any)?.error || "An error occurred",
          variant: "destructive"
        })
      }
    }
  })
}
