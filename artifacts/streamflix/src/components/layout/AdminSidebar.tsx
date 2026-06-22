import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, FolderTree, Users, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGetMe } from "@workspace/api-client-react";

export function AdminSidebar() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/admin/content", label: "Contenu", icon: Film },
    { href: "/admin/categories", label: "Catégories", icon: FolderTree },
    // User management is admin-only (moderators manage content only).
    ...(isAdmin
      ? [
          { href: "/admin/users", label: "Utilisateurs", icon: Users },
          { href: "/admin/invite", label: "Invitations", icon: Mail },
        ]
      : []),
  ];

  return (
    <div className="w-64 border-r border-white/10 bg-card/60 backdrop-blur-xl h-screen flex flex-col sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-medium">Quitter l'admin</span>
        </Link>
      </div>

      <div className="px-6 py-6">
        <span className="text-2xl font-black tracking-tight text-white">
          Piuky<span className="text-primary">Flix</span>
        </span>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-active-pill"
                    className="absolute inset-0 rounded-lg border border-primary/30 bg-primary/15"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn("relative h-4 w-4", isActive && "text-primary")} />
                <span className="relative">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          Connecté en <span className="font-medium text-primary">{isAdmin ? "admin" : "modérateur"}</span>
        </div>
      </div>
    </div>
  );
}
