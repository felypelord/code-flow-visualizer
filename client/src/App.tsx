import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LessonPage from "@/pages/lesson";
import ExercisesPage from "@/pages/exercises";
import AdminPage from "@/pages/admin";
import ProPage from "@/pages/pro";
import PricingPage from "@/pages/pricing";
import ProfilePage from "@/pages/profile";
import PublicProfilePage from "@/pages/public-profile";
import HistoryPage from "@/pages/history";
import JournalPage from "@/pages/journal";
import AchievementsPage from "@/pages/achievements";
import StorePage from "@/pages/store";
import TracksPage from "@/pages/tracks";
import LeaderboardPage from "@/pages/leaderboard";
import DailyChallengesPage from "@/pages/daily-challenges";
import ChallengesPage from "@/pages/challenges";
import MonetizationPage from "@/pages/monetization";
import LibraryPage from "@/pages/library";
import BattlePassPage from "@/pages/battle-pass";
import CosmeticsPage from "@/pages/cosmetics";
import SandboxPage from "@/pages/sandbox";
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lesson/:id" component={LessonPage} />
      <Route path="/exercises" component={ExercisesPage} />
      <Route path="/sandbox" component={SandboxPage} />
      <Route path="/tracks" component={TracksPage} />
      <Route path="/pro" component={ProPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/library" component={LibraryPage} />
      {/* Gamification */}
      <Route path="/profile" component={ProfilePage} />
      <Route path="/u/:id" component={PublicProfilePage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/store" component={StorePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/daily-challenges" component={DailyChallengesPage} />
      <Route path="/challenges" component={ChallengesPage} />
      <Route path="/monetization" component={MonetizationPage} />
      <Route path="/cosmetics" component={CosmeticsPage} />
      <Route path="/battle-pass" component={BattlePassPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user } = useUser();

  useEffect(() => {
    const selectedTheme = String(user?.theme || '');
    const baseTheme = selectedTheme === 'light' ? 'light' : 'dark';
    const cosmeticTheme = selectedTheme && selectedTheme !== 'light' && selectedTheme !== 'dark' ? selectedTheme : '';
    try {
      // Reserve data-theme for base light/dark.
      document.documentElement.setAttribute('data-theme', baseTheme);

      // Cosmetic theme selector (patterns/backgrounds). Keep separate so we don't break the base theme system.
      document.documentElement.setAttribute('data-cosmetic-theme', cosmeticTheme);

      // Cosmetic-driven UI effects (used by CSS only)
      document.documentElement.setAttribute('data-name-effect', String((user as any)?.equippedNameEffect || ''));
      document.documentElement.setAttribute('data-tab-border', String((user as any)?.equippedTabBorder || ''));

      // Best-effort light/dark toggle for shadcn/tailwind variants.
      if (baseTheme === 'light') document.documentElement.classList.remove('dark');
      else document.documentElement.classList.add('dark');

      // Apply custom theme (MVP): customize the background grid line color.
      if (selectedTheme === 'theme_custom' && user?.customTheme?.gridColor) {
        const hex = user.customTheme.gridColor;
        const opacity = typeof user.customTheme.gridOpacity === 'number' ? Math.max(0, Math.min(1, user.customTheme.gridOpacity)) : 0.1;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        document.documentElement.style.setProperty('--bg-grid-line', `rgba(${r}, ${g}, ${b}, ${opacity})`);
      } else {
        document.documentElement.style.removeProperty('--bg-grid-line');
      }
    } catch {
      // ignore
    }
  }, [user?.theme, user?.customTheme?.gridColor, user?.customTheme?.gridOpacity, (user as any)?.equippedNameEffect, (user as any)?.equippedTabBorder]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          {/* Global theme-driven background (applies to all pages, including Profile) */}
          <div className="fixed inset-0 pointer-events-none themed-bg -z-20" />
          <Toaster />
          <Router />
          <Analytics />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
