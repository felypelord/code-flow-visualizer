import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Lock, CheckCircle2, Circle, Lightbulb, BookOpen, Trophy, Flame, Code2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CHALLENGES, ChallengeDifficulty, Challenge, getXPWithHint, getXPWithSolution, getDailyBonusXP } from '../lib/challenges';

interface ChallengeProgress {
  id: string;
  completed: boolean;
  attempts: number;
  hintsUsed: number;
  solutionViewed: boolean;
}

export default function ChallengesPage() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<typeof CHALLENGES[0] | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solutionViewed, setSolutionViewed] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [dailyBonus, setDailyBonus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProgress();
      checkDailyChallenge();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/challenges/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress || []);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const checkDailyChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/challenges/daily', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.challengeId) {
          setDailyBonus(data.challengeId);
        }
      }
    } catch (error) {
      console.error('Failed to check daily challenge:', error);
    }
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-900/30 text-green-300 border-green-600/40';
      case 'intermediate':
        return 'bg-blue-900/30 text-blue-300 border-blue-600/40';
      case 'advanced':
        return 'bg-purple-900/30 text-purple-300 border-purple-600/40';
      case 'expert':
        return 'bg-red-900/30 text-red-300 border-red-600/40';
      default:
        return '';
    }
  };

  const getDifficultyLabel = (difficulty: ChallengeDifficulty) => {
    const labels: Record<ChallengeDifficulty, string> = {
      beginner: '🟢 Beginner',
      intermediate: '🔵 Intermediate',
      advanced: '🟣 Advanced',
      expert: '🔴 Expert',
    };
    return labels[difficulty];
  };

  const getDifficultyRequiredLevel = (difficulty: ChallengeDifficulty): number => {
    const levels: Record<ChallengeDifficulty, number> = {
      beginner: 0,
      intermediate: 100,
      advanced: 500,
      expert: 1500,
    };
    return levels[difficulty];
  };

  const executeCode = async () => {
    if (!selectedChallenge || !code.trim()) {
      toast({ title: 'Error', description: 'Write some code first' });
      return;
    }

    setExecuting(true);
    setOutput('');

    try {
      const result = await fetch('/api/challenges/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          code,
          hintsUsed,
          solutionViewed,
        }),
      });

      const data = await result.json();

      if (data.success) {
        const earnedXP = solutionViewed ? getXPWithSolution(selectedChallenge.baseXP) : hintsUsed > 0 ? getXPWithHint(selectedChallenge.baseXP, hintsUsed) : selectedChallenge.baseXP;
        const bonus = dailyBonus === selectedChallenge.id ? getDailyBonusXP(selectedChallenge.baseXP) : 0;
        const totalXP = earnedXP + bonus;

        setOutput(`✅ All tests passed!\n+${totalXP} XP ${bonus > 0 ? `(+${bonus} Daily Bonus 🔥)` : ''}`);
        toast({
          title: 'Success!',
          description: `Challenge completed! +${totalXP} XP`,
        });

        await refreshUser();
        await loadProgress();
        setSelectedChallenge(null);
        setCode('');
        setHintsUsed(0);
        setSolutionViewed(false);
      } else {
        setOutput(`❌ ${data.message}\n\n${data.details || ''}`);
      }
    } catch (error: any) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const showHint = () => {
    if (!selectedChallenge) return;
    if (hintsUsed >= selectedChallenge.hints.length) {
      toast({ title: 'No hints', description: 'You used all hints!' });
      return;
    }
    const hint = selectedChallenge.hints[hintsUsed];
    setOutput(`💡 Hint ${hintsUsed + 1}: ${hint}`);
    setHintsUsed(hintsUsed + 1);
  };

  const showSolution = () => {
    if (!selectedChallenge) return;
    setSolutionViewed(true);
    setCode(selectedChallenge.solution);
    setOutput(`📖 Solution shown! (You will earn only 20% of XP)`);
    toast({
      title: 'Notice',
      description: 'Showing the solution reduces XP earned to 20%',
      variant: 'destructive',
    });
  };

  const filteredChallenges = CHALLENGES.filter((ch: Challenge) => {
    if (selectedDifficulty !== 'all' && ch.difficulty !== selectedDifficulty) return false;
    if (selectedCategory !== 'all' && ch.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(CHALLENGES.map((ch: Challenge) => ch.category))) as string[];
  const difficulties: ChallengeDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  const completedCount = progress.filter((p: any) => p.completed).length;
  const totalXPGained = progress.reduce((sum: number, p: any) => {
    const challenge = CHALLENGES.find((c: Challenge) => c.id === p.id);
    if (!challenge) return sum;
    return sum + (p.solutionViewed ? getXPWithSolution(challenge.baseXP) : p.hintsUsed > 0 ? getXPWithHint(challenge.baseXP, p.hintsUsed) : challenge.baseXP);
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to access the challenges</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Code2 className="w-12 h-12 text-blue-400" />
            Coding Challenges
          </h1>
          <p className="text-blue-300 text-lg">Improve your coding skills with {CHALLENGES.length} challenges</p>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-600/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Challenges Completed</p>
                <p className="text-3xl font-bold text-blue-200">{completedCount} / {CHALLENGES.length}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-600/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total XP Earned</p>
                <p className="text-3xl font-bold text-yellow-200">{totalXPGained}</p>
              </div>
              <Zap className="w-12 h-12 text-yellow-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-600/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-200">{Math.round((completedCount / CHALLENGES.length) * 100)}%</p>
              </div>
              <Trophy className="w-12 h-12 text-purple-400" />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: List of Challenges */}
          <div className="md:col-span-1 space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {['all', ...difficulties].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff as any)}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700'
                      } border`}
                    >
                      {diff === 'all' ? 'All' : getDifficultyLabel(diff as ChallengeDifficulty).split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">Category</p>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {['all', ...categories].map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-3 py-1 text-xs rounded transition-all ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredChallenges.map((challenge: Challenge) => {
                const progressItem = progress.find((p) => p.id === challenge.id);
                const isCompleted = progressItem?.completed;
                const isLocked = (user.xp || 0) < getDifficultyRequiredLevel(challenge.difficulty);
                const isDailyBonus = dailyBonus === challenge.id;

                return (
                  <Card
                    key={challenge.id}
                    onClick={() => !isLocked && setSelectedChallenge(challenge)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedChallenge?.id === challenge.id
                        ? 'border-blue-500 bg-blue-900/30'
                        : isCompleted
                          ? 'border-green-600/40 bg-green-900/10'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-200">{challenge.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                            {getDifficultyLabel(challenge.difficulty).split(' ')[0]}
                          </span>
                          {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                          {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                          {isDailyBonus && <Flame className="w-3 h-3 text-orange-400" />}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-yellow-300 text-right">
                        {isDailyBonus ? Math.floor(challenge.baseXP * 1.5) : challenge.baseXP}
                        {isDailyBonus && ' 🔥'}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right: Challenge Details and Editor */}
          <div className="md:col-span-2">
            {selectedChallenge ? (
              <div className="space-y-4">
                {/* Challenge Info */}
                <Card className="p-6 bg-slate-900/90 border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedChallenge.title}</h2>
                      <p className="text-gray-400">{selectedChallenge.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                        {getDifficultyLabel(selectedChallenge.difficulty)}
                      </p>
                      {dailyBonus === selectedChallenge.id && (
                        <div className="mt-2 text-orange-400 text-sm font-bold flex items-center gap-1 justify-end">
                          <Flame className="w-4 h-4" /> Daily Bonus +50%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-2">Problem:</p>
                      <p className="text-gray-100 text-sm bg-black/30 p-3 rounded">{selectedChallenge.problem}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-2">Test Cases:</p>
                      <div className="space-y-2">
                        {selectedChallenge.testCases.map((tc: any, idx: number) => (
                          <div key={idx} className="text-xs bg-black/30 p-2 rounded text-gray-300">
                            <p>Input: {JSON.stringify(tc.input)}</p>
                            <p>Expected output: {JSON.stringify(tc.output)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Code Editor */}
                <Card className="p-4 bg-slate-900/90 border-slate-700">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Your Code:</p>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-48 bg-black/60 border border-slate-700 text-white text-sm p-3 rounded font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Type your solution here..."
                  />

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button
                      onClick={executeCode}
                      disabled={executing || !code.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {executing ? 'Running...' : '▶️ Run'}
                    </Button>
                    <Button
                      onClick={showHint}
                      variant="outline"
                      className="border-yellow-600/40 text-yellow-300"
                      disabled={hintsUsed >= selectedChallenge.hints.length}
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Hint ({hintsUsed}/{selectedChallenge.hints.length})
                    </Button>
                    <Button
                      onClick={showSolution}
                      variant="outline"
                      className="border-amber-600/40 text-amber-300"
                      disabled={solutionViewed}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      View Solution
                    </Button>
                  </div>
                </Card>

                {/* Output */}
                {output && (
                  <Card className="p-4 bg-black/60 border-slate-700">
                    <p className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{output}</p>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 bg-slate-900/90 border-slate-700 text-center">
                <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a challenge to start</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
