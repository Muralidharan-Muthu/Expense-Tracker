import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import type { QueryClient } from "@tanstack/react-query";
import { LiWiseLogo } from "@/components/LiWiseLogo";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useProfile } from "@/lib/expense-data";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAVIGATION } from "@/config/app-navigation";

export function AppSidebar({ queryClient }: { queryClient: QueryClient }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const profile = useProfile();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { theme, toggle } = useTheme();
  const collapsed = state === "collapsed";
  const displayName = profile.data?.name || profile.data?.email?.split("@")[0] || "Your account";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={collapsed && !isMobile ? "h-14 items-center justify-center border-b border-sidebar-border p-0" : "border-b border-sidebar-border p-3"}>
        <Link to="/" onClick={() => isMobile && setOpenMobile(false)} className={collapsed && !isMobile ? "flex size-12 items-center justify-center overflow-hidden" : "flex min-w-0 items-center"}>
          <LiWiseLogo compact={collapsed && !isMobile} className={collapsed && !isMobile ? "w-9 justify-center" : ""} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {APP_NAVIGATION.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.title} size="lg" className={collapsed && !isMobile ? "justify-center" : undefined}>
                      <Link to={item.to} onClick={() => isMobile && setOpenMobile(false)}><item.icon />{!collapsed || isMobile ? <span>{item.title}</span> : null}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed || isMobile ? <div className="min-w-0 px-2 py-1"><p className="truncate text-sm font-semibold">{displayName}</p><p className="truncate text-xs text-sidebar-foreground/60">{profile.data?.email}</p></div> : null}
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton tooltip={theme === "dark" ? "Light mode" : "Dark mode"} className={collapsed && !isMobile ? "justify-center" : undefined} onClick={toggle}>{theme === "dark" ? <Sun /> : <Moon />}{!collapsed || isMobile ? <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span> : null}</SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton tooltip="Sign out" className={collapsed && !isMobile ? "justify-center" : undefined} onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}><LogOut />{!collapsed || isMobile ? <span>Sign out</span> : null}</SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
