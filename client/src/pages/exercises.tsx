import Layout from "@/components/layout";
import { ExercisesViewNew } from "@/components/exercises-new";

export default function ExercisesPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <ExercisesViewNew />
      </div>
    </Layout>
  );
}
