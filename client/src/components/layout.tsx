import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Terminal, Menu, ChevronDown, GraduationCap, Code, Dumbbell, Crown } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Auth from "@/components/auth";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/hooks/use-user";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
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
      alert("Não foi possível abrir o portal de cobrança");
    } catch {
      alert("Erro ao abrir o portal");
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
              {t.home}
            </NavLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary hover:bg-white/5",
                  isLessonActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}>
                  <GraduationCap className="w-4 h-4" />
                  {t.learn}
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
                        {t[lesson.labelKey as keyof typeof t]}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink href="/exercises" active={location.includes("/exercises")}>
              <Dumbbell className="w-4 h-4" />
              {t.exercises}
            </NavLink>

            <NavLink href="/pricing" active={location.includes("/pricing")}>
              <span className="text-sm font-medium">Preços</span>
            </NavLink>
            {user?.isPro && (
              <NavLink href="/pro" active={location.includes("/pro")}>
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-bold">
                  Pro
                </span>
              </NavLink>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            {user?.isPro && (
              <Button size="sm" variant="secondary" onClick={openPortal}>
                Gerenciar assinatura
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
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SheetDescription className="sr-only">Navegue pelas opções disponíveis</SheetDescription>
                <div className="flex flex-col gap-2 mt-8">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      {t.home}
                    </span>
                  </Link>

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t.learn}
                  </div>
                  {lessons.map((lesson) => (
                    <Link key={lesson.href} href={lesson.href} onClick={() => setIsOpen(false)}>
                      <span className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        location.includes(lesson.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}>
                        <lesson.icon className="w-4 h-4" />
                        {t[lesson.labelKey as keyof typeof t]}
                      </span>
                    </Link>
                  ))}

                  <Link href="/exercises" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors mt-2",
                      location.includes("/exercises") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <Dumbbell className="w-4 h-4" />
                      {t.exercises}
                    </span>
                  </Link>

                  <Link href="/pricing" onClick={() => setIsOpen(false)}>
                    <span className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      location.includes("/pricing") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      <span className="text-sm font-medium">Preços</span>
                    </span>
                  </Link>

                  {user?.isPro && (
                    <Link href="/pro" onClick={() => setIsOpen(false)}>
                      <span className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-colors bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                          Pro
                        </span>
                      </span>
                    </Link>
                  )}

                  {user?.isPro && (
                    <div className="mt-4">
                      <Button className="w-full" variant="secondary" onClick={() => { setIsOpen(false); openPortal(); }}>
                        Gerenciar assinatura
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
            Pro custa $2/mês (USD); seu banco faz a conversão para BRL/outras moedas.
          </div>
        )}
      </header>

      <main className="flex-1 relative flex flex-col">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none blueprint-grid -z-10 opacity-30" />
        
        {children}
      </main>

      <footer className="border-t border-white/5 py-8 mt-auto bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Feito para ajudar você a entender o "código-fonte" do código.</p>
        </div>
      </footer>
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
