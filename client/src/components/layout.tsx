import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Terminal, Menu, ChevronDown, GraduationCap, Code, Dumbbell, Crown, Award, Activity, BookOpen, ShoppingBag, UserCircle, Trophy, Target, Flame, Code2, Sparkles, Blocks } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Auth from "@/components/auth";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/hooks/use-user";
import { Footer } from "@/components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
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
  const { user } = useUser();
  const showPricingBanner = location.includes("/pricing");

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
      {/* Default global background (not cosmetic-theme driven) */}
      <div className="fixed inset-0 pointer-events-none themed-bg -z-20" />
      {/* Navbar */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-3 lg:px-6 h-16 flex items-center justify-between min-w-0 flex-nowrap">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group" style={{ minWidth: 140, flexShrink: 0 }}>
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono font-bold text-lg tracking-tight">
                Code<span className="text-primary">Flow</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-2 min-w-0 flex-nowrap" style={{maxWidth: 'calc(100vw - 320px)'}}>
            <NavLink href="/" active={location === "/"}>
              <span style={{ minWidth: 63, marginLeft: 11, flexShrink: 0, fontSize: '0.7rem', display: 'inline-block' }}>{t('nav.home', 'Home')}</span>
            </NavLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "cosmetic-tab flex items-center gap-1 px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors hover:text-primary hover:bg-white/5 whitespace-nowrap",
                    isLessonActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                  data-active={isLessonActive ? "true" : "false"}
                >
                  <GraduationCap className="w-4 h-4" />
                  {t('nav.learn', 'Learn')}
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

            {/* Exercises dropdown (Sandbox lives inside Exercises) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "cosmetic-tab flex items-center gap-1 px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors hover:text-primary hover:bg-white/5 whitespace-nowrap",
                    location.includes("/exercises") || location.includes("/sandbox") ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                  data-active={location.includes("/exercises") || location.includes("/sandbox") ? "true" : "false"}
                >
                  <Dumbbell className="w-4 h-4" />
                  {t('nav.exercises', 'Exercises')}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-white/10">
                <DropdownMenuItem asChild>
                  <Link href="/exercises">
                    <div className={cn(
                      "flex items-center gap-3 w-full cursor-pointer py-2",
                      location.includes("/exercises") ? "text-primary" : ""
                    )}>
                      <Dumbbell className="w-4 h-4" />
                      {t('nav.exercises', 'Exercises')}
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sandbox">
                    <div
                      className={cn(
                        "cosmetic-tab flex items-center gap-3 w-full cursor-pointer py-2",
                        location.includes("/sandbox") ? "text-primary" : ""
                      )}
                      data-active={location.includes("/sandbox") ? "true" : "false"}
                    >
                      <Blocks className="w-4 h-4" />
                      {t('nav.sandbox', 'Sandbox')}
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink href="/tracks" active={location.includes("/tracks")}>
              <GraduationCap className="w-4 h-4" />
              {t('nav.learning', 'Learning')}
            </NavLink>

            <NavLink href="/pro" active={location.includes("/pro")}>
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">
                {t('nav.pro', 'Pro')}
              </span>
            </NavLink>

            <Link href="/pricing">
              <span className={cn(
                "flex items-center gap-2 px-2 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-bold cursor-pointer",
                location.includes("/pricing")
                  ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40"
                  : "text-amber-200 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent"
              )}>
                <span className="inline-flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">{t('nav.pricing', 'Pricing')}</span>
                </span>
              </span>
            </Link>

            <NavLink href="/library" active={location.includes("/library")}>
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="ml-1">{t('nav.library', 'Library')}</span>
            </NavLink>
            

            {/* Gamification dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "cosmetic-tab flex items-center gap-1 px-1 lg:px-2 py-1 rounded-lg text-[0.7rem] lg:text-xs font-medium transition-colors hover:text-primary hover:bg-white/5 whitespace-nowrap",
                    location.includes("/profile") || location.includes("/history") || location.includes("/journal") || location.includes("/achievements") || location.includes("/store") || location.includes("/leaderboard") || location.includes("/daily-challenges") || location.includes("/challenges") || location.includes("/monetization") ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                  data-active={location.includes("/profile") || location.includes("/history") || location.includes("/journal") || location.includes("/achievements") || location.includes("/store") || location.includes("/leaderboard") || location.includes("/daily-challenges") || location.includes("/challenges") || location.includes("/monetization") ? "true" : "false"}
                >
                  <Award className="w-4 h-4" />
                  {t('nav.gamification', 'Gamification')}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-white/10">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <div
                      className={cn("cosmetic-tab flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/profile") ? "text-primary" : "")}
                      data-active={location.includes("/profile") ? "true" : "false"}
                    > 
                      <UserCircle className="w-4 h-4" />
                      {t('nav.profile', 'Profile')}
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/battle-pass">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/battle-pass") ? "text-amber-400" : "")}> 
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold">{t('nav.battlePass', 'Battle Pass')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cosmetics">
                    <div
                      className={cn("cosmetic-tab flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/cosmetics") ? "text-fuchsia-400" : "")}
                      data-active={location.includes("/cosmetics") ? "true" : "false"}
                    > 
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      <span className="font-semibold">{t('nav.cosmetics', 'Cosmetics')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/challenges">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/challenges") ? "text-blue-400" : "")}> 
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">{t('nav.challenges', 'Challenges')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/leaderboard") ? "text-yellow-400" : "")}> 
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent font-bold">{t('nav.leaderboard', 'Leaderboard')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/daily-challenges">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/daily-challenges") ? "text-orange-400" : "")}> 
                      <Target className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold">{t('nav.dailyChallenges', 'Daily Challenges')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/history") ? "text-primary" : "")}> 
                      <Activity className="w-4 h-4" />
                      {t('nav.history', 'History')}
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/journal">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/journal") ? "text-primary" : "")}> 
                      <BookOpen className="w-4 h-4" />
                      {t('nav.journal', 'Journal')}
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/achievements">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/achievements") ? "text-primary" : "")}> 
                      <Award className="w-4 h-4" />
                      {t('nav.achievements', 'Achievements')}
                    </div>
                  </Link>
                </DropdownMenuItem>
                {/* Store moved to Pricing page; removed from Gamification menu */}
                <DropdownMenuItem asChild>
                  <Link href="/monetization">
                    <div className={cn("flex items-center gap-3 w-full cursor-pointer py-2", location.includes("/monetization") ? "text-primary" : "")}> 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('nav.upgrade', 'Upgrade')}
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0" style={{minWidth: 180, justifyContent: 'flex-end'}}>
            <LanguageSelector />
            <div data-auth-trigger>
              <Auth />
            </div>
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
              <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-[#0f172a] overflow-y-auto">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Browse available options</SheetDescription>
                <div className="flex flex-col gap-2 mt-8 pb-8">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      {t('nav.home', 'Home')}
                    </span>
                  </Link>

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('nav.learn', 'Learn')}
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

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                    {t('nav.exercises', 'Exercises')}
                  </div>
                  <Link href="/exercises" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.includes("/exercises") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <Dumbbell className="w-4 h-4" />
                      {t('nav.exercises', 'Exercises')}
                    </span>
                  </Link>
                  <Link href="/sandbox" onClick={() => setIsOpen(false)}>
                    <span
                      className={cn(
                        "cosmetic-tab flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        location.includes("/sandbox") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                      data-active={location.includes("/sandbox") ? "true" : "false"}
                    >
                      <Blocks className="w-4 h-4" />
                      {t('nav.sandbox', 'Sandbox')}
                    </span>
                  </Link>

                  <Link href="/tracks" onClick={() => setIsOpen(false)}>
                    <span
                      className={cn(
                        "cosmetic-tab flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                        location.includes("/tracks") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                      data-active={location.includes("/tracks") ? "true" : "false"}
                    >
                      <GraduationCap className="w-4 h-4" />
                      {t('nav.learning', 'Learning')}
                    </span>
                  </Link>

                  <Link href="/pro" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-colors bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40",
                      location.includes("/pro") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Pro
                      </span>
                    </span>
                  </Link>

                  <Link href="/pricing" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location.includes("/pricing") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">{t('nav.pricing', 'Pricing')}</span>
                    </span>
                  </Link>

                  <Link href="/library" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location.includes("/library") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold">{t('nav.library', 'Library')}</span>
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
                    <span style={{fontSize: '0.7em'}}>{t('nav.gamification', 'Gamification')}</span>
                  </div>
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <span
                      className={cn("cosmetic-tab flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/profile") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}
                      data-active={location.includes("/profile") ? "true" : "false"}
                    > 
                      <UserCircle className="w-4 h-4" />
                      {t('nav.profile', 'Profile')}
                    </span>
                  </Link>
                  <Link href="/battle-pass" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/battle-pass") ? "bg-amber-500/10 text-amber-300" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{t('nav.battlePass', 'Battle Pass')}</span>
                    </span>
                  </Link>
                  <Link href="/cosmetics" onClick={() => setIsOpen(false)}>
                    <span
                      className={cn("cosmetic-tab flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/cosmetics") ? "bg-fuchsia-500/10 text-fuchsia-300" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}
                      data-active={location.includes("/cosmetics") ? "true" : "false"}
                    > 
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{t('nav.cosmetics', 'Cosmetics')}</span>
                    </span>
                  </Link>
                  <Link href="/battle-pass" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/battle-pass") ? "bg-amber-500/10 text-amber-300" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{t('nav.battlePass', 'Battle Pass')}</span>
                    </span>
                  </Link>
                  <Link href="/challenges" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/challenges") ? "bg-blue-500/10 text-blue-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t('nav.challenges', 'Challenges')}</span>
                    </span>
                  </Link>
                  <Link href="/leaderboard" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors", location.includes("/leaderboard") ? "bg-yellow-500/10 text-yellow-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{t('nav.leaderboard', 'Leaderboard')}</span>
                    </span>
                  </Link>
                  <Link href="/daily-challenges" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/daily-challenges") ? "bg-orange-500/10 text-orange-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Target className="w-4 h-4 text-orange-400" />
                      {t('nav.dailyChallenges', 'Daily Challenges')}
                    </span>
                  </Link>
                  <Link href="/history" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/history") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Activity className="w-4 h-4" />
                      {t('nav.history', 'History')}
                    </span>
                  </Link>
                  <Link href="/journal" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/journal") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <BookOpen className="w-4 h-4" />
                      {t('nav.journal', 'Journal')}
                    </span>
                  </Link>
                  <Link href="/achievements" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/achievements") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <Award className="w-4 h-4" />
                      {t('nav.achievements', 'Achievements')}
                    </span>
                  </Link>
                  {/* Store moved to Pricing page; removed from mobile Gamification menu */}
                  <Link href="/monetization" onClick={() => setIsOpen(false)}>
                    <span className={cn("flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors", location.includes("/monetization") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}> 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('nav.upgrade', 'Upgrade')}
                    </span>
                  </Link>

                  <div className="mt-4 pt-4 border-t border-white/10" data-auth-trigger>
                    <Auth />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {showPricingBanner && (
          <div className="bg-amber-500/10 border-t border-b border-amber-500/30 text-amber-100 text-sm py-2 px-4 text-center">
            {t('banner.proCosts', 'Pro costs $2/month (USD); your bank will convert to local currency.')}
          </div>
        )}
      </header>

      <main className="flex-1 relative flex flex-col">
        {children}
      </main>

      <Footer />
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span
        className={cn(
          "cosmetic-tab flex items-center gap-2 px-1.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors hover:text-primary hover:bg-white/5 cursor-pointer whitespace-nowrap",
          active ? "text-primary bg-primary/10" : "text-muted-foreground"
        )}
        data-active={active ? "true" : "false"}
      >
        {children}
      </span>
    </Link>
  );
}
