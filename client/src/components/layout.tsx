import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Terminal, Menu, ChevronDown, GraduationCap, Code, Dumbbell, Crown, Award, Activity, BookOpen, ShoppingBag, UserCircle, Trophy, Target, Flame, Code2 } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Auth from "@/components/auth";
import { LanguageSelector } from "@/components/language-selector";
// import removed: useLanguage
import { useUser } from "@/hooks/use-user";
import { Footer } from "@/components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const t: any = {};
  const labels: Record<string, string> = {
    lessonFunctions: "Functions",
    lessonConditionals: "Conditionals",
    lessonLoopsArrays: "Loops & Arrays",
    lessonObjects: "Objects",
    lessonClasses: "Classes",
    lessonRecursion: "Recursion",
    lessonClosures: "Closures",
    lessonAsyncAwait: "Async / Await",
    lessonDebugging: "Debugging",
  };
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, token } = useUser();
  const showPricingBanner = location.includes("/pricing");

  const openPortal = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/billing/portal", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      alert("Unable to open billing portal");
    } catch {
      alert("Error opening portal");
    }
  };

  const lessons = [
    { href: "/lesson/functions", labelKey: "lessonFunctions", icon: Code },
    { href: "/lesson/conditionals", labelKey: "lessonConditionals", icon: Code },
    { href: "/lesson/loops-arrays", labelKey: "lessonLoopsArrays", icon: Code },
    { href: "/lesson/objects", labelKey: "lessonObjects", icon: Code },
    { href: "/lesson/classes", labelKey: "lessonClasses", icon: Code },
    { href: "/lesson/recursion", labelKey: "lessonRecursion", icon: Code },
    { href: "/lesson/closures", labelKey: "lessonClosures", icon: Code },
    { href: "/lesson/async-await", labelKey: "lessonAsyncAwait", icon: Code },
    { href: "/lesson/debugging", labelKey: "lessonDebugging", icon: Code },
  ];

  const isLessonActive = lessons.some(lesson => location.includes(lesson.href));

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono font-bold text-lg tracking-tight">
                Code<span className="text-primary">Flow</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" active={location === "/"}>
              Home
            </NavLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary hover:bg-white/5",
                  isLessonActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}>
                  <GraduationCap className="w-4 h-4" />
                  Learn
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-white/10">
                {lessons.map((lesson) => (
                  <DropdownMenuItem key={lesson.href} asChild>
                    <Link href={lesson.href}>
                      <div className={cn(
                        "flex items-center gap-3 w-full cursor-pointer py-2",
                        location.includes(lesson.href) ? "text-primary" : ""
                      )}>
                        <lesson.icon className="w-4 h-4" />
                        {labels[lesson.labelKey as keyof typeof labels] || lesson.labelKey}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink href="/exercises" active={location.includes("/exercises")}>
              <Dumbbell className="w-4 h-4" />
              Exercises
            </NavLink>

            <Link href="/pricing">
              <span className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer",
                location.includes("/pricing")
                  ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40"
                  : "text-amber-200 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent"
              )}>
                <span className="inline-flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">Pricing</span>
                </span>
              </span>
            </Link>
            <NavLink href="/pro" active={location.includes("/pro")}>
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">
                Pro
              </span>
            </NavLink>

            {/* Gamification dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary hover:bg-white/5",
                  location.includes("/profile") || location.includes("/history") || location.includes("/journal") || location.includes("/achievements") || location.includes("/store") || location.includes("/leaderboard") || location.includes("/daily-challenges") || location.includes("/challenges") || location.includes("/monetization") ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}>
                  <Award className="w-4 h-4" />
                  Gamification
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-white/10">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/profile") ? "text-primary" : "")}> 
                      <UserCircle className="w-4 h-4" />
                      Profile
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/challenges">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/challenges") ? "text-blue-400" : "")}> 
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">Challenges</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/leaderboard") ? "text-yellow-400" : "")}> 
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent font-bold">Leaderboard</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/daily-challenges">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/daily-challenges") ? "text-orange-400" : "")}> 
                      <Target className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold">Daily Challenges</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/history") ? "text-primary" : "")}> 
                      <Activity className="w-4 h-4" />
                      History
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/journal">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/journal") ? "text-primary" : "")}> 
                      <BookOpen className="w-4 h-4" />
                      Journal
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/achievements">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/achievements") ? "text-primary" : "")}> 
                      <Award className="w-4 h-4" />
                      Achievements
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/store">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/store") ? "text-primary" : "")}> 
                      <ShoppingBag className="w-4 h-4" />
                      Store
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/monetization">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/monetization") ? "text-primary" : "")}> 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Upgrade
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            {user?.isPro && (
              <Button size="sm" variant="secondary" onClick={openPortal}>
                Manage Subscription
              </Button>
            )}
            <Auth />
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-[#0f172a]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Browse available options</SheetDescription>
                <div className="flex flex-col gap-2 mt-8">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      Home
                    </span>
                  </Link>

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Learn
                  </div>
                  {lessons.map((lesson) => (
                    <Link key={lesson.href} href={lesson.href} onClick={() => setIsOpen(false)}>
                      <span className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        location.includes(lesson.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}>
                        <lesson.icon className="w-4 h-4" />
                        {labels[lesson.labelKey as keyof typeof labels] || lesson.labelKey}
                      </span>
                    </Link>
                  ))}

                  <Link href="/exercises" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors mt-2",
                      location.includes("/exercises") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <Dumbbell className="w-4 h-4" />
                      Exercises
                    </span>
                  </Link>

                  <Link href="/pricing" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location.includes("/pricing") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">Pricing</span>
                    </span>
                  </Link>

                  <Link href="/pro" onClick={() => setIsOpen(false)}>
                    <span className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-colors bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Pro
                      </span>
                    </span>
                  </Link>

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                    Gamification
                  </div>
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/profile") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <UserCircle className="w-4 h-4" />
                      Profile
                    </span>
                  </Link>
                  <Link href="/challenges" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/challenges") ? "bg-blue-500/10 text-blue-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Challenges</span>
                    </span>
                  </Link>
                  <Link href="/leaderboard" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/leaderboard") ? "bg-yellow-500/10 text-yellow-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Leaderboard</span>
                    </span>
                  </Link>
                  <Link href="/daily-challenges" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/daily-challenges") ? "bg-orange-500/10 text-orange-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Target className="w-4 h-4 text-orange-400" />
                      Daily Challenges
                    </span>
                  </Link>
                  <Link href="/history" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/history") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Activity className="w-4 h-4" />
                      History
                    </span>
                  </Link>
                  <Link href="/journal" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/journal") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <BookOpen className="w-4 h-4" />
                      Journal
                    </span>
                  </Link>
                  <Link href="/achievements" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/achievements") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Award className="w-4 h-4" />
                      Achievements
                    </span>
                  </Link>
                  <Link href="/store" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/store") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <ShoppingBag className="w-4 h-4" />
                      Store
                    </span>
                  </Link>
                  <Link href="/monetization" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/monetization") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Upgrade
                    </span>
                  </Link>

                  {user?.isPro && (
                    <div className="mt-4">
                      <Button className="w-full" variant="secondary" onClick={() => { setIsOpen(false); openPortal(); }}>
                        Manage subscription
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Auth />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {showPricingBanner && (
          <div className="bg-amber-500/10 border-t border-b border-amber-500/30 text-amber-100 text-sm py-2 px-4 text-center">
            Pro costs $2/month (USD); your bank will convert to local currency.
          </div>
        )}
      </header>

      <main className="flex-1 relative flex flex-col">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none blueprint-grid -z-10 opacity-30" />
        
        {children}
      </main>

      <Footer />
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary hover:bg-white/5 cursor-pointer",
        active ? "text-primary bg-primary/10" : "text-muted-foreground"
      )}>
        {children}
      </span>
    </Link>
  );
}
