import Layout from '@/components/layout';
import { lessons } from '@/lib/lessons';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

function groupByDifficulty() {
  const groups: Record<string, any[]> = { Beginner: [], Intermediate: [], Advanced: [] };
  Object.values(lessons).forEach((l: any) => {
    const diff = l.difficulty || 'Beginner';
    if (!groups[diff]) groups[diff] = [];
    groups[diff].push(l);
  });
  return groups;
}

export default function LearningIndex() {
  const groups = groupByDifficulty();

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Learning Path</h1>
        <p className="text-sm text-muted-foreground mb-6">Each lesson contains a short teaching text before the practice area — follow it, then Practice and Check your solution.</p>

        {['Beginner','Intermediate','Advanced'].map((level) => (
          <section key={level} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{level}</h2>
              <div className="text-sm text-muted-foreground">{groups[level]?.length || 0} lessons</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(groups[level] || []).map((lesson:any) => {
                const variant = lesson?.variants?.javascript || Object.values(lesson?.variants || {})[0] || {};
                const teach = variant?.steps && Array.isArray(variant.steps) && variant.steps[0] ? variant.steps[0].explanation : lesson.description;
                return (
                  <article key={lesson.id} className="p-4 bg-card/50 border border-white/10 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{lesson.description}</p>
                        <div className="mt-3 text-sm leading-relaxed text-gray-200 bg-white/3 p-3 rounded">
                          <strong className="text-xs uppercase text-muted-foreground">Teaching</strong>
                          <p className="mt-2 text-sm">{teach}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end md:ml-4">
                        <Link href={`/lesson/${lesson.id}`}>
                          <Button className="bg-primary text-primary-foreground">Start</Button>
                        </Link>
                        <Link href={`/lesson/${lesson.id}?view=playground`}>
                          <Button variant="ghost">Practice <ChevronRight className="w-4 h-4 inline-block ml-2"/></Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
