import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-svh bg-background">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}
