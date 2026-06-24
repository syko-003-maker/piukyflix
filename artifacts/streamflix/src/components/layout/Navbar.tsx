import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Show, useClerk, useUser } from "@clerk/react";
import { Search, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe } from "@workspace/api-client-react";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: me } = useGetMe();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const isAdmin = me?.role === "admin" || me?.role === "moderator";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const navCls = (href: string) =>
    `text-sm font-medium transition-colors ${location === href ? "text-white" : "text-muted-foreground hover:text-white"}`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileLinkCls = (href: string) =>
    `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location === href ? "bg-primary/15 text-white" : "text-muted-foreground hover:bg-secondary hover:text-white"}`;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-background/90 shadow-lg shadow-black/30 backdrop-blur-md" : "border-b border-transparent bg-background/30 backdrop-blur-sm"}`}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tight text-white" style={{ filter: "drop-shadow(0 0 14px hsl(265 89% 66% / 0.55))" }}>
              Piuky<span className="text-primary">Flix</span>
            </span>
          </Link>
          <Show when="signed-in">
            <nav className="hidden md:flex gap-6 items-center">
              <Link href="/browse" className={navCls("/browse")}>Catalogue</Link>
              <Link href="/search" className={navCls("/search")}>Recherche</Link>
              <Link href="/favorites" className={navCls("/favorites")}>Ma liste</Link>
              <Link href="/history" className={navCls("/history")}>Historique</Link>
              <Link href="/requests" className={navCls("/requests")}>Demandes</Link>
              {isAdmin && (
                <Link href="/admin">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-md transition-colors">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Admin
                  </span>
                </Link>
              )}
            </nav>
          </Show>
        </div>

        <div className="flex items-center gap-4">
          <Show when="signed-in">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/search")} className="text-muted-foreground hover:text-white">
              <Search className="h-5 w-5" />
              <span className="sr-only">Rechercher</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Tableau de bord admin</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: basePath || "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-white md:hidden" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Menu</span>
            </Button>
          </Show>

          <Show when="signed-out">
            <Button variant="ghost" onClick={() => setLocation("/sign-in")} className="text-white hover:text-primary hover:bg-transparent">
              Se connecter
            </Button>
            <Button onClick={() => setLocation("/sign-up")} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              Commencer
            </Button>
          </Show>
        </div>
      </div>

      <Show when="signed-in">
        {mobileOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/10 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/browse" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/browse")}>Catalogue</Link>
            <Link href="/search" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/search")}>Recherche</Link>
            <Link href="/favorites" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/favorites")}>Ma liste</Link>
            <Link href="/history" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/history")}>Historique</Link>
            <Link href="/requests" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/requests")}>Demandes</Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className={mobileLinkCls("/admin")}>Admin</Link>
            )}
          </nav>
        )}
      </Show>
    </header>
  );
}
