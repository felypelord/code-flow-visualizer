import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Check, Clock, ChevronDown } from "lucide-react";
import { ProExercise } from "@/lib/pro-exercises";
import { ProExerciseEditor } from "@/components/pro-exercise-editor";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProExerciseCardProps {
  exercise: ProExercise;
  onSelect?: () => void;
  completed?: boolean;
}

export function ProExerciseCard({ exercise, onSelect, completed }: ProExerciseCardProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showEditor, setShowEditor] = useState(false);
  const isPro = !!user?.isPro;

  const difficultyColors = {
    Beginner: "bg-green-500/20 text-green-300 border-green-500/30",
    Intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Advanced: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const categoryIcons: Record<ProExercise["category"], string> = {
    algorithms: "🧮",
    "data-structures": "📊",
    async: "⚡",
    performance: "🚀",
    "design-patterns": "🎨",
  };

  const hasComplexity = Boolean(exercise.complexity?.time || exercise.complexity?.space);

  const handleClick = () => {
    if (!isPro) {
      setLocation("/pricing?vip=1");
      return;
    }
    setShowEditor(true);
    if (onSelect) {
      onSelect();
    }
  };

  if (showEditor && isPro) {
    return <ProExerciseEditor exercise={exercise} onClose={() => setShowEditor(false)} />;
  }

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isPro
          ? "cursor-pointer bg-gradient-to-br from-amber-900/20 to-slate-900/60 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]"
          : "opacity-75 cursor-pointer bg-slate-900/60 border-slate-800"
      }`}
      onClick={handleClick}
    >
      {/* Pro badge overlay */}
      {!isPro && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Crown className="w-3 h-3" />
          PRO
        </div>
      )}

      {completed && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg flex items-center gap-1">
          <Check className="w-3 h-3" />
          {t('pro.exercises.completed', 'Completed')}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcons[exercise.category]}</span>
              <h3 className={`font-bold ${isPro ? "text-white" : "text-slate-400"}`}>
                {exercise.title}
              </h3>
              {!isPro && <Lock className="w-4 h-4 text-amber-400" />}
            </div>
            <p className={`text-sm ${isPro ? "text-gray-300" : "text-slate-500"}`}>
              {exercise.description}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-full border font-semibold ${
              difficultyColors[exercise.difficulty]
            }`}
          >
            {exercise.difficulty}
          </span>
          <span
            className={`px-2 py-1 rounded-full ${
              isPro
                ? "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                : "bg-slate-700 text-slate-400 border border-slate-600"
            }`}
          >
            {t(`pro.exercises.categories.${exercise.category}`, {
              algorithms: 'Algorithms',
              "data-structures": 'Data Structures',
              async: 'Async',
              performance: 'Performance',
              "design-patterns": 'Design Patterns',
            }[exercise.category])}
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isPro
                ? "bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-200 border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                : "bg-slate-700 text-slate-400 border border-slate-600"
            }`}
          >
            <Clock className="w-3 h-3" />
            {exercise.estimatedTime}
          </span>

          {typeof exercise.points === 'number' && (
            <span
              className={`px-2 py-1 rounded-full ${
                isPro
                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
              title={t('pro.exercises.points', 'Points')}
            >
              {t('pro.exercises.pointsShort', 'Pts')}: {exercise.points}
            </span>
          )}

          {hasComplexity && (
            <span
              className={`px-2 py-1 rounded-full ${
                isPro
                  ? "bg-purple-500/15 text-purple-200 border border-purple-400/30"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
              title={t('pro.exercises.complexity', 'Complexity')}
            >
              {t('pro.exercises.complexityShort', 'Big-O')}: {exercise.complexity?.time || '-'} / {exercise.complexity?.space || '-'}
            </span>
          )}
        </div>

        {/* Languages */}
        <div className="flex flex-wrap gap-2">
          {exercise.languages.map((lang) => (
            <span
              key={lang}
              className={`text-xs px-2 py-1 rounded font-mono ${
                isPro
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-slate-900 text-slate-500 border border-slate-800"
              }`}
            >
              {lang}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`w-full ${
            isPro
              ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold shadow-[0_0_15px_rgba(251,191,36,0.4)]"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
          size="sm"
        >
          {isPro ? (
            <>{t('pro.exercises.solve', 'Solve Challenge')}</>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              {t('pro.exercises.unlock', 'Unlock with Pro')}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

interface ProExercisesGridProps {
  exercises: ProExercise[];
  completedIds?: string[];
  onSelectExercise?: (exercise: ProExercise) => void;
}

export function ProExercisesGrid({
  exercises,
  completedIds = [],
  onSelectExercise,
}: ProExercisesGridProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  // const t = {};

  if (exercises.length === 0) {
    return (
      <Card className="p-8 text-center bg-slate-900/60 border border-slate-700">
        <p className="text-slate-400">{t('pro.exercises.empty', 'No exercises found')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!user?.isPro && (
        <Card className="p-6 bg-gradient-to-br from-amber-900/20 to-slate-900/60 border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-white text-lg">{t('pro.exercises.locked.title', 'Pro Exercises Locked')}</h3>
              </div>
              <p className="text-slate-300 text-sm">{t('pro.exercises.locked.desc', 'Upgrade to Pro to unlock all exercises.')}</p>
            </div>
            <Button
              onClick={() => setLocation("/pricing?vip=1")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {t('pro.exercises.locked.cta', 'Activate Pro Now')}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <ProExerciseCard
            key={exercise.id}
            exercise={exercise}
            completed={completedIds.includes(exercise.id)}
            onSelect={() => onSelectExercise?.(exercise)}
          />
        ))}
      </div>
    </div>
  );
}
