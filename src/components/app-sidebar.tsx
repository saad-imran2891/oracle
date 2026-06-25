import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Satellite, Radio, Brain, ListOrdered, LineChart, Activity, Orbit,
} from "lucide-react";
import { useMission } from "@/hooks/use-mission";

const items = [
  { title: "Mission Overview", url: "/", icon: Orbit },
  { title: "Live Satellite Feed", url: "/feed", icon: Satellite },
  { title: "AI Decisions", url: "/decisions", icon: Brain },
  { title: "Transmission Queue", url: "/queue", icon: ListOrdered },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "System Performance", url: "/system", icon: Activity },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { running, orbitSec } = useMission();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary glow-primary">
            <Radio className="h-5 w-5" />
            <span className="absolute inset-0 rounded-md sweep border-t border-primary/50" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-wide">ORACLE</div>
            
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-mono">Mission Console</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={pathname === it.url}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-3 py-2 text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">STATUS</span>
            <span className={running ? "text-status-nominal" : "text-status-warn"}>
              {running ? "● NOMINAL" : "◌ PAUSED"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">T+</span>
            <span>{formatT(orbitSec)}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function formatT(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
