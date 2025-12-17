import Layout from "@/components/layout";
import { ExercisesView } from "@/components/exercises-simple";

export default function ExercisesPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <ExercisesView />
      </div>
    </Layout>
  );
}
