import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Terminal, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Início" },
    { href: "/lesson/functions", label: "Funções" },
    { href: "/lesson/conditionals", label: "Condicionais" },
    { href: "/lesson/loops-arrays", label: "Loops" },
    { href: "/lesson/objects", label: "Objetos" },
    { href: "/lesson/classes", label: "Classes" },
    { href: "/lesson/recursion", label: "Recursão" },
  ];

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
                Code<span className="text-primary">Visual</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} active={location === item.href || (item.href !== "/" && location.includes(item.href))}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-[#0f172a]">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SheetDescription className="sr-only">Navegue pelas lições disponíveis</SheetDescription>
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <span className={cn(
                        "block px-4 py-3 rounded-lg text-lg font-medium transition-colors",
                        location.includes(item.href) && item.href !== "/" || location === item.href
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
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
        "cursor-pointer text-sm font-medium transition-colors hover:text-primary",
        active ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"
      )}>
        {children}
      </span>
    </Link>
  );
}
