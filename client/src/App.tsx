import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LessonPage from "@/pages/lesson";
import ExercisesPage from "@/pages/exercises";
import AdminPage from "@/pages/admin";
import ProPage from "@/pages/pro";
import PricingPage from "@/pages/pricing";
import ProfilePage from "@/pages/profile";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lesson/:id" component={LessonPage} />
      <Route path="/exercises" component={ExercisesPage} />
      <Route path="/tracks" component={TracksPage} />
      <Route path="/pro" component={ProPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/library" component={LibraryPage} />
      {/* Gamification */}
      <Route path="/profile" component={ProfilePage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/store" component={StorePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/daily-challenges" component={DailyChallengesPage} />
      <Route path="/challenges" component={ChallengesPage} />
      <Route path="/monetization" component={MonetizationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
