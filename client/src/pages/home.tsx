import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, Code, Box, Layers, Play, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import generatedImage from "@assets/generated_images/blueprint_style_programming_visualization_concept.png";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  {t.languageSupport}
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                  {t.heroTitle1} <br/>
                  <span className="text-primary">{t.heroTitle2}</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                  {t.heroSubtitle}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/lesson/functions">
                    <button aria-label="Get started" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                      {t.getStarted} <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href="/lesson/objects">
                    <button aria-label="Explore objects" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                      {t.exploreObjects}
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hero Image / Graphic */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full hidden lg:block pointer-events-none opacity-40 mix-blend-screen mask-image-gradient">
            <picture>
              <source srcSet={generatedImage.replace('.png', '.webp')} type="image/webp" />
              <img src={generatedImage} alt="Blueprint visualization" loading="lazy" className="w-full h-full object-cover" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent" />
          </div>
        </section>

        {/* Lessons Grid */}
        <section className="container mx-auto px-4 py-20 border-t border-white/5">
          <h2 className="text-3xl font-bold mb-12">{t.learningModules}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LessonCard 
              icon={<Code className="w-8 h-8 text-blue-400" />}
              title={t.lessonFunctions}
              description={t.lessonFunctionsDesc}
              href="/lesson/functions"
              color="blue"
            />
            <LessonCard 
              icon={<Box className="w-8 h-8 text-orange-400" />}
              title={t.lessonConditionals}
              description={t.lessonConditionalsDesc}
              href="/lesson/conditionals"
              color="orange"
            />
            <LessonCard 
              icon={<Repeat className="w-8 h-8 text-pink-400" />}
              title={t.lessonLoopsArrays}
              description={t.lessonLoopsArraysDesc}
              href="/lesson/loops-arrays"
              color="pink"
            />
            <LessonCard 
              icon={<Box className="w-8 h-8 text-emerald-400" />}
              title={t.lessonObjects}
              description={t.lessonObjectsDesc}
              href="/lesson/objects"
              color="emerald"
            />
            <LessonCard 
              icon={<Layers className="w-8 h-8 text-amber-400" />}
              title={t.lessonClasses}
              description={t.lessonClassesDesc}
              href="/lesson/classes"
              color="amber"
            />
            <LessonCard 
              icon={<Repeat className="w-8 h-8 text-purple-400" />}
              title={t.lessonRecursion}
              description={t.lessonRecursionDesc}
              href="/lesson/recursion"
              color="purple"
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}

function LessonCard({ icon, title, description, href, color }: any) {
  const colorClasses = {
    blue: "hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    emerald: "hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    amber: "hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    purple: "hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    pink: "hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]",
    orange: "hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
  };

  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ y: -5 }}
        className={`bg-card/40 border border-white/10 p-6 rounded-xl cursor-pointer transition-all duration-300 group h-full flex flex-col ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        <div className="mb-6 p-4 bg-white/5 w-fit rounded-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
        <div className="mt-6 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
          Start <ArrowRight className="w-3 h-3 ml-2" />
        </div>
      </motion.div>
    </Link>
  );
}
