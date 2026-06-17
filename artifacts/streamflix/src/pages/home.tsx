import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Tv, Film, MonitorPlay } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-background/90 bg-gradient-to-t from-background via-background/80 to-background/20" />
          </div>
          
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white drop-shadow-sm">
                Unlimited movies, TV shows, and more
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-medium">
                Watch anywhere. Cancel anytime.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white font-bold rounded-md">
                    Start Watching
                    <Play className="ml-2 h-5 w-5 fill-current" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background border-t border-white/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-secondary rounded-full">
                  <MonitorPlay className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white">Enjoy on your TV</h3>
                <p className="text-muted-foreground text-lg">
                  Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-secondary rounded-full">
                  <Film className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white">Download your shows</h3>
                <p className="text-muted-foreground text-lg">
                  Save your favorites easily and always have something to watch.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-secondary rounded-full">
                  <Tv className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white">Watch everywhere</h3>
                <p className="text-muted-foreground text-lg">
                  Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/10 bg-background mt-auto">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StreamFlix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}