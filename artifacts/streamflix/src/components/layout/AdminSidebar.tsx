import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, FolderTree, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/admin/content", label: "Contenu", icon: Film },
    { href: "/admin/categories", label: "Catégories", icon: FolderTree },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
  ];

  return (
    <div className="w-64 border-r border-border bg-card h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-bold">Quitter l'admin</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Gestion
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
