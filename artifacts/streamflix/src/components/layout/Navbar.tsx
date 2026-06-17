import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Search, Bell, User, Menu, LogOut, ChevronDown, MonitorPlay } from "lucide-react";
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

export function Navbar() {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="StreamFlix" className="h-8 w-auto" />
          </Link>
          <Show when="signed-in">
            <nav className="hidden md:flex gap-6">
              <Link href="/browse" className="text-sm font-medium transition-colors hover:text-primary">
                Browse
              </Link>
              <Link href="/search" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Search
              </Link>
              <Link href="/favorites" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                My List
              </Link>
              <Link href="/history" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                History
              </Link>
            </nav>
          </Show>
        </div>

        <div className="flex items-center gap-4">
          <Show when="signed-in">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/search")} className="text-muted-foreground hover:text-white">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
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
                <DropdownMenuItem onClick={() => setLocation("/admin")}>
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: basePath || "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
          
          <Show when="signed-out">
            <Button variant="ghost" onClick={() => setLocation("/sign-in")} className="text-white hover:text-primary hover:bg-transparent">
              Sign In
            </Button>
            <Button onClick={() => setLocation("/sign-up")} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              Get Started
            </Button>
          </Show>
        </div>
      </div>
    </header>
  );
}