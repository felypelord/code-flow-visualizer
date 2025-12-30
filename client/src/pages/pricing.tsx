import { useUser } from "@/hooks/use-user";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Sparkles, Cpu, BarChart3, Lightbulb, Layers, GitBranch, Database, Zap, ShoppingBag, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import MonetizationSection from '@/components/monetization-section';
// Roadmap moved to Exercises page


export default function PricingPage() {
  const { user, token, refreshUser } = useUser();

  const [, setLocation] = useLocation();
  
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "per month",
      description: "Limited access to basic features.",
      features: [
        "Basic editor and exercise access",
        "Community challenges",
        "Limited AI suggestions (trial)",
        "Public examples and docs",
        "Basic debugging tools",
      ],
      notIncluded: [
        "Unlimited AI suggestions",
        "Snapshots & versioning",
        "Private playgrounds",
        "Priority support",
      ],
      cta: "Current Plan",
      ctaVariant: "secondary" as const,
      isFree: true,
    },
    {
      name: "Pro",
      price: "$2.00",
      period: "/month",
      description: "Full access to Pro features, tools and premium content.",
      badge: "Pro",
      features: [
        "Advanced visual debugger (breakpoints, step, inspect)",
        "Unlimited AI code suggestions & automated fixes",
        "Snapshots, restore points and version history",
        "Performance profiler with actionable insights",
        "Private VIP playground and experiment workspace",
        "Database inspector & mock data tooling",
        "Curated Pro learning tracks and challenges",
        "Priority email support",
      ],
      notIncluded: [],
      cta: "Activate Pro",
      ctaVariant: "default" as const,
      isPro: true,
    },
  ];
  const [billingPlan] = useState<"monthly">("monthly");
  const [secondsLeft, setSecondsLeft] = useState(3600); // 1h urgency banner
  const [vipOpen, setVipOpen] = useState(false);
  const [vipStep, setVipStep] = useState<"collect" | "verify">("collect");
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Password state
  const [code, setCode] = useState(""); // Code state
  // Store state
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [coins, setCoins] = useState<number>(user?.coins || 0);
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeRequiresAuth, setStoreRequiresAuth] = useState(false);
  const [storePublicView, setStorePublicView] = useState(false);

  const loadStore = async () => {
    setLoadingStore(true);
    try {
      // If user is anonymous, directly request the public listing to avoid 401 -> fallback flow
      if (!token) {
        try {
          const pub = await fetch('/api/store/public');
          if (pub.ok) {
            const d = await pub.json();
            const parsedPub = Array.isArray(d) ? d : (d?.items ?? d ?? []);
            setStoreItems(parsedPub);
            setStoreRequiresAuth(false);
            setStorePublicView(true);
            return;
          }
        } catch (e) {
          // fallthrough to original flow which will show demo items
        }
        // public listing unavailable
        setStoreItems([]);
        setStoreRequiresAuth(true);
        setLoadingStore(false);
        return;
      }

      const res = await fetch('/api/store', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        const parsed = Array.isArray(data) ? data : (data?.items ?? data ?? []);
        setStoreItems(parsed);
        setStoreRequiresAuth(false);
        // If there's no token, the server returned a public listing — show as public view
        setStorePublicView(!token);
      } else if (res.status === 401 || res.status === 403) {
        // Try to fetch a public listing so anonymous/free users can browse items
        try {
          const pub = await fetch('/api/store/public');
          if (pub.ok) {
            const d = await pub.json();
            const parsedPub = Array.isArray(d) ? d : (d?.items ?? d ?? []);
            setStoreItems(parsedPub);
            setStoreRequiresAuth(false);
            setStorePublicView(true);
          } else {
            // As a fallback, try fetching the store without auth header (some servers expose public items on same endpoint)
            const fallback = await fetch('/api/store');
            if (fallback.ok) {
              const f = await fallback.json();
              const parsedF = Array.isArray(f) ? f : (f?.items ?? f ?? []);
              setStoreItems(parsedF);
              setStoreRequiresAuth(false);
              setStorePublicView(true);
            } else {
              setStoreItems([]);
              setStoreRequiresAuth(true);
            }
          }
        } catch (e) {
          setStoreItems([]);
          setStoreRequiresAuth(true);
        }
      } else {
        console.error('Failed to load store');
      }
    } catch (err) {
      console.error('Error loading store', err);
    } finally {
      setLoadingStore(false);
    }
  };

  const loadCoins = async () => {
    try {
      const res = await fetch('/api/coins/balance', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins || 0);
      }
    } catch (err) {
      console.error('Error loading coins', err);
    }
  };

  // Canonical coin packages (match server PACKAGES: prices in USD cents)
  const coinPackages = useMemo(() => [
    { id: 'coins_100', coins: 100, priceCents: 100 },
    { id: 'coins_500', coins: 500, priceCents: 500 },
    { id: 'coins_1000', coins: 1000, priceCents: 1000 },
  ], []);

  function formatUSD(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Always attempt to load the store on mount (shows message if auth required),
  // and re-load when user/token changes so owned flags and balances refresh.
  useEffect(() => {
    loadStore();
    if (user) loadCoins();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Demo items to show to anonymous/free users so they can browse the store
  const demoStoreItems = useMemo(() => [
    { id: 'demo_hat', name: 'Golden Hat', description: 'Shiny cosmetic hat (demo view)', price: 150, type: 'cosmetic', icon: '🎩' },
    { id: 'demo_theme', name: 'Midnight Theme', description: 'Editor color theme (demo view)', price: 200, type: 'cosmetic', icon: '🌙' },
    { id: 'demo_boost', name: 'XP Boost (demo)', description: 'Temporary XP boost (demo view)', price: 300, type: 'utility', icon: '⚡' },
  ], []);

  const handleCoinPurchase = async (itemId: string) => {
    if (!token) { toast({ title: 'Sign in', description: 'Please sign in to purchase.' }); return; }
    setPurchaseLoading(itemId);
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Purchase failed');
      toast({ title: 'Purchase successful', description: data.message || 'Item purchased' });
      await loadStore();
      await loadCoins();
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast({ title: 'Purchase failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleEquip = async (itemId: string) => {
    if (!token) { toast({ title: 'Sign in', description: 'Please sign in to equip.' }); return; }
    try {
      const res = await fetch('/api/store/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Equip failed');
      toast({ title: data.message || 'Equipped', description: '' });
      if (refreshUser) await refreshUser();
      await loadStore();
      await loadCoins();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    }
  };

  const monthlyBenefits = useMemo(
    () => [
      "Priority support with faster SLAs",
      "Unlimited AI code suggestions and fixes",
      "Snapshots, restore points and versioning",
      "Performance analysis and profiling tools",
      "Private playground and experiment workspaces",
      "Curated learning tracks and Pro-only challenges",
    ],
    []
  );

  

  // Roadmap moved to dedicated Tracks page; no roadmap fetch here.

  // Roadmap item fetching removed — handled only on Tracks page.

  function renderMarkdownToHtml(md: string) {
    if (!md) return "";

    // Escape HTML to avoid injection
    const escapeHtml = (s: string) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    // Extract code fences and replace with placeholders so inner text isn't interpreted
    const codeBlocks: string[] = [];
    const placeholderPrefix = "__CODEBLOCK_";
    const withPlaceholders = md.replace(/```([\s\S]*?)```/g, (_m, code) => {
      const idx = codeBlocks.push(code) - 1;
      return `${placeholderPrefix}${idx}__`;
    });

    // Work on escaped text safely
    let safe = escapeHtml(withPlaceholders);

    // Headings
    safe = safe.replace(/^### (.*$)/gim, "<h4>$1</h4>");
    safe = safe.replace(/^## (.*$)/gim, "<h3>$1</h3>");
    safe = safe.replace(/^# (.*$)/gim, "<h2>$1</h2>");

    // Paragraphs
    safe = safe.replace(/\n\n+/g, "</p><p>");
    safe = "<p>" + safe + "</p>";

    // Inline code (escaped already)
    safe = safe.replace(/`([^`]+)`/g, (_m, c) => `<code class=\"bg-black/30 px-1 rounded\">${c}</code>`);

    // Restore code blocks (escape their content and wrap in <pre>)
    const final = safe.replace(new RegExp(placeholderPrefix + "(\\d+)__", "g"), (_m, idx) => {
      const code = codeBlocks[Number(idx)] || "";
      const esc = escapeHtml(code);
      return `<pre class=\"rounded bg-black/60 p-3 font-mono text-sm overflow-auto\">${esc}</pre>`;
    });

    return final;
  }

  const proFeatureCards = useMemo(
    () => [
      {
        icon: <Cpu className="w-6 h-6 text-white" />,
        title: "Debugger",
        desc: "Step through code and inspect values.",
        bullets: ["Breakpoints", "Step over/into"],
      },
      {
        icon: <BarChart3 className="w-6 h-6 text-white" />,
        title: "Analyzer",
        desc: "Analyze code performance with visual metrics.",
        bullets: ["Performance charts", "Detailed metrics"],
      },
      {
        icon: <Layers className="w-6 h-6 text-white" />,
        title: "Code Structures",
        desc: "Inspect code structure and data flows.",
        bullets: ["Structure viewer", "Dependency maps"],
      },
      {
        icon: <Lightbulb className="w-6 h-6 text-white" />,
        title: "AI Assistant",
        desc: "AI-powered suggestions and fixes.",
        bullets: ["AI suggestions", "Contextual fixes"],
      },
      {
        icon: <GitBranch className="w-6 h-6 text-white" />,
        title: "Snapshots",
        desc: "Save and restore code states.",
        bullets: ["State snapshots", "Restore points"],
      },
      {
        icon: <Database className="w-6 h-6 text-white" />,
        title: "Database Tools",
        desc: "Inspect and mock database content.",
        bullets: ["Query viewer", "Schema explorer"],
      },
    ],
    []
  );

  const proExerciseTracks = useMemo(
    () => [
      {
        title: "Foundations Track",
        accent: "from-emerald-500/15 to-emerald-700/10",
        items: [
          "Editor & Tooling Basics",
          "Reading Errors & Stack Traces",
          "Basic Debugging Techniques",
          "Console, Logs & Breakpoints",
          "Writing Simple Tests",
          "Safe Refactoring Patterns",
        ],
      },
      {
        title: "Beginner Track",
        accent: "from-emerald-500/15 to-emerald-700/10",
        items: [
          "Intro to loops",
          "Basic recursion",
          "Variables & types",
          "Functions & scope",
          "Conditionals",
          "Simple I/O",
        ],
      },
      {
        title: "Intermediate Track",
        accent: "from-amber-500/15 to-orange-600/10",
        items: [
          "Data structures",
          "OOP fundamentals",
          "Asymptotic analysis",
          "Recursion & dynamic programming",
          "APIs & networking",
          "Error handling",
        ],
      },
      {
        title: "Advanced Track",
        accent: "from-purple-500/15 to-indigo-700/10",
        items: [
          "Concurrency & parallelism",
          "Advanced algorithms",
          "Memory optimization",
          "Compiler basics",
          "Systems design",
          "Profiling & benchmarking",
        ],
      },
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // If opened with ?product=... optionally open modal/highlight and respect returnTo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get('product');
    const returnTo = params.get('returnTo') || undefined;
    if (product) {
      // scroll to store and show a simple modal — for now we set a selected product
      setTimeout(() => {
        const el = document.querySelector('.store');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
      // store selected in location hash for potential UI; also keep returnTo in URL
      if (returnTo) {
        // keep parameters for purchase handler to pick up
        // nothing else required here
      }
    }
  }, []);

  // If Stripe redirected back with session_id, confirm purchase and refresh user state
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id') || params.get('sessionId');
      const returnTo = params.get('returnTo') || undefined;
      if (!sessionId) return;
      try {
        const res = await fetch('/api/monetization/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });
        const j = await res.json();
        if (j?.ok && j.paid) {
          // refresh local user info to pick up Pro status
          try { await refreshUser(); } catch (e) { /* ignore */ }
          // redirect back to origin if provided
          if (returnTo) {
            window.location.href = returnTo;
            return;
          }
          // otherwise show a success toast and stay on pricing
          try { toast({ title: 'Purchase completed', description: 'Thank you — your purchase is active.' }); } catch {}
        } else {
          try { toast({ title: 'Purchase not completed', description: 'Payment not confirmed.' }); } catch {}
        }
      } catch (err) {
        try { toast({ title: 'Error', description: 'Unable to confirm purchase.' }); } catch {}
      } finally {
        // remove session params from URL to avoid re-checking
        const url = new URL(window.location.href);
        url.searchParams.delete('session_id');
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.toString());
      }
    })();
  }, [refreshUser]);

  // Central store purchase handler: create payment then redirect
  const handleStorePurchase = async (packageId: string, itemId?: string) => {
    if (!user) {
      // send to signup / login
      setLocation('/signup');
      return;
    }
    setPurchaseLoading(packageId);
    try {
      const res = await fetch('/api/monetization/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(itemId ? { packageId, itemId } : { packageId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMessage = (j && (j.error || j.message)) || 'Server failed to create payment.';
        // Common cause in dev: Stripe keys not configured
        toast({ title: 'Unable to start checkout', description: serverMessage + ' Check server Stripe configuration (STRIPE_SECRET_KEY).', variant: 'destructive' });
        return;
      }
      if (j?.checkoutUrl) {
        window.location.href = j.checkoutUrl;
      } else {
        toast({ title: 'Unable to start checkout', description: 'No checkout URL returned from server.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Unable to start purchase', variant: 'destructive' });
    } finally {
      setPurchaseLoading(null);
    }
  };

  useEffect(() => {
    // Auto-open VIP modal when coming from Pro with vip=1
    const params = new URLSearchParams(window.location.search);
    if (params.get("vip") === "1") {
      setVipOpen(true);
      setVipStep("collect");
      const url = new URL(window.location.href);
      url.searchParams.delete("vip");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const handleUpgrade = () => {
    // Open VIP modal to ensure email verification before payment
    setVipOpen(true);
    setVipStep("collect");
    if (user?.email) setEmail(user.email);
  };

  const submitCollect = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email." });
      return;
    }
    try {
      setLoading(true);
      const dobIso = dateOfBirth && dateOfBirth.length <= 10
        ? new Date(dateOfBirth + "T00:00:00.000Z").toISOString()
        : dateOfBirth;
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, dateOfBirth: dobIso, country, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error");
      // Persist pending signup so we can complete after payment
      const pending = { firstName, lastName, country, dateOfBirth, email, password };
      sessionStorage.setItem("pendingSignup", JSON.stringify(pending));
      setVipStep("verify");
      toast({ title: "VIP code sent", description: "Check your email for the VIP code." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  const submitVerifyThenCheckout = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !code) {
      toast({ title: "Error", description: "An error occurred." });
      return;
    }
    try {
      setLoading(true);
      const vres = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const vdata = await vres.json();
      if (!vres.ok || !vdata?.ok) throw new Error(vdata?.error || "Error");

      const cres = await fetch("/api/pro/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingPlan, currency: "BRL", email }),
      });
      const cdata = await cres.json();
      if (cres.ok && cdata?.url) {
        window.location.href = cdata.url;
        return;
      }
      toast({ title: "Error", description: "An error occurred." });
      setLocation("/pro");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!token) {
      setLocation("/");
      return;
    }
    try {
      const res = await fetch("/api/billing/portal", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      alert("Error");
    } catch (err) {
      alert("Error");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 py-12 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Pricing Plans</h1>
          <p className="text-xl text-gray-400">
            Choose a plan that fits you
          </p>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200">
            <span className="font-semibold text-white">Pro: $2.00/mo</span>
            <span className="text-gray-300">USD</span>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/80 to-orange-500/80 border border-red-500/50 text-sm text-white shadow-lg shadow-red-500/30">
            <span className="font-bold text-base">Flash Offer</span>
            <span className="text-white/90">Limited-time discount</span>
            <span className="px-2 py-1 rounded bg-black/40 font-mono text-sm tracking-wide">{minutes}:{seconds}</span>
          </div>
        </div>

        {/* Pro value highlights (moved from Pro page) */}
        <div className="max-w-5xl mx-auto mb-10 px-4 grid md:grid-cols-2 gap-4">
          <Card className="p-6 border-amber-400/30 bg-amber-500/5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold mb-2">
              <Crown className="w-4 h-4" />
              Premium Badge
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Premium Tools for Faster Debugging</h3>
            <p className="text-sm text-gray-300">Advanced debugging, AI-assisted fixes, snapshots, and curated learning tracks to accelerate development.</p>
          </Card>
          <Card className="p-6 border-amber-400/20 bg-slate-800/60">
            <div className="flex items-center gap-2 text-amber-200 font-semibold mb-2">
              <Sparkles className="w-4 h-4" />
              Pro Tracks Badge
            </div>
            <p className="text-sm text-gray-300">Curated tracks to level up</p>
          </Card>
        </div>

        {/* Detailed Pro features */}
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 mb-3">
              <Crown className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">Premium Badge</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Everything Pro: Faster debugging, smarter code</h2>
            <p className="text-sm text-gray-300 max-w-3xl mx-auto">Subscribe to Pro and get the full suite: advanced debugger, AI-powered fixes, snapshots, profiler, private playgrounds, and curated learning tracks to accelerate your development.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proFeatureCards.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                bullets={feature.bullets}
              />
            ))}
          </div>
        </div>

        {/* Pro tracks overview */}
        <div className="max-w-6xl mx-auto px-4 mb-14">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              Pro Tracks Badge
            </span>
            <p className="text-sm text-gray-400">Curated tracks to level up</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {proExerciseTracks.map((track) => (
              <div
                key={track.title}
                className={`relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br ${track.accent} p-5`}
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <Crown className="w-4 h-4 text-amber-300" />
                    <h3 className="text-lg font-semibold">{track.title}</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-200">
                    {track.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-amber-300 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Stripe / Billing developer hint */}
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <Card className="p-4 bg-slate-800/60 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Billing / Stripe</h4>
                  <p className="text-xs text-gray-300">If checkout fails in development, ensure the server has STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and price IDs set. Without them the server returns a 503 and checkout cannot start.</p>
                </div>
                <div className="text-right text-xs text-gray-400">Dev hint: set env vars and restart server</div>
              </div>
            </Card>
          </div>

          {/* Store: centralized purchases for small products and roadmap items */}
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Store</h3>
            <p className="text-sm text-gray-400">Centralized purchases for items and extras</p>
          </div>

          {/* Inline FlowCoins store UI copied from the dedicated Store page so all purchases live on Pricing */}
          <div className="space-y-6">
            {/* FlowCoins Balance */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-amber-400" />
                    XP Store
                  </h1>
                  <p className="text-gray-400 mt-2">Spend your hard-earned FlowCoins on power-ups and cosmetics.</p>
                </div>
              </div>
            </div>

            <Card className="p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-3xl">🪙</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-400" />
                      {coins} FlowCoins
                    </h2>
                    <p className="text-amber-200 text-sm">Your current balance • Earn 1 coin per 50 XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-300">Level {user?.level || 1}</p>
                  <p className="text-xs text-amber-200/70">{user?.xp || 0} XP</p>
                </div>
              </div>
            </Card>

            {/* Buy FlowCoins (USD) - visible to all, purchase button disabled for free users */}
            <div className="my-6">
              <h3 className="text-lg font-semibold text-white mb-3">Buy FlowCoins</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {coinPackages.map((pkg) => (
                  <Card key={pkg.id} className="p-4 bg-slate-900 border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm text-gray-300 font-semibold">{pkg.coins} FlowCoins</h4>
                        <p className="text-xs text-gray-500">{formatUSD(pkg.priceCents)}</p>
                      </div>
                      <div>
                        {(() => {
                          const coinBtnDisabled = Boolean(purchaseLoading) || (user ? !user.isPro : false);
                          const coinLabel = !user ? 'Sign in to buy' : (!user?.isPro ? 'Pro only' : purchaseLoading === pkg.id ? 'Processing...' : `Buy ${formatUSD(pkg.priceCents)}`);
                          return (
                            <Button
                              onClick={() => {
                                if (!user) { setLocation('/signup'); return; }
                                if (!user?.isPro) return;
                                handleStorePurchase(pkg.id);
                              }}
                              disabled={coinBtnDisabled}
                              className={`${coinBtnDisabled ? 'bg-slate-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
                            >
                              {coinLabel}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Store Grid (fetched from server) */}
            <div>
              {loadingStore ? (
                <div className="text-center text-gray-400 py-8">Loading store...</div>
              ) : storeItems.length === 0 ? (
                // If the server requires auth to view personalized store items, show a demo/browse-only list
                storeRequiresAuth ? (
                  <div>
                    <div className="text-center text-gray-400 py-4">Sign in to buy items — browse demo items below</div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {demoStoreItems.map((item) => (
                        <Card key={item.id} className={`p-6 transition-all bg-slate-900 border-slate-700 opacity-80`}>
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`text-5xl`}>{item.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-white">{item.name}</h3>
                              </div>
                              <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                              <span className={`text-xs px-2 py-1 rounded-full bg-purple-600/30 text-purple-400`}>Demo</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                            <div className="flex items-center gap-2 text-amber-400 font-bold"><Zap className="w-5 h-5" />{item.price} FlowCoins</div>
                            <div className="flex items-center gap-2">
                              <Button disabled className="bg-slate-700 cursor-not-allowed">Sign in to buy</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">No items available</div>
                )
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeItems.map((item) => {
                    const owned = !!item.owned;
                    const canAfford = (coins || 0) >= item.price;
                    const btnDisabled = user ? (!user.isPro || !canAfford) : false;
                    const btnLabel = !user ? 'Sign in to buy' : (!user?.isPro ? 'Pro only' : !canAfford ? 'Not enough coins' : 'Buy');
                    return (
                      <Card key={item.id} className={`p-6 transition-all ${owned ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-600/50' : canAfford ? 'bg-slate-900 border-slate-700 hover:border-amber-500 hover:scale-105' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`text-5xl ${owned ? '' : !canAfford ? 'grayscale opacity-50' : ''}`}>{item.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-white">{item.name}</h3>
                              {owned && <span className="text-xs px-2 py-1 bg-green-600/30 text-green-400 rounded-full">Owned</span>}
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'cosmetic' ? 'bg-purple-600/30 text-purple-400' : item.type === 'utility' ? 'bg-blue-600/30 text-blue-400' : 'bg-amber-600/30 text-amber-400'}`}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-2 text-amber-400 font-bold"><Zap className="w-5 h-5" />{item.price} FlowCoins</div>
                          <div className="flex items-center gap-2">
                            {owned && item.type === 'cosmetic' && (
                              <Button onClick={() => handleEquip(item.id)} className="bg-amber-600 hover:bg-amber-700">Equip</Button>
                            )}
                            {!owned && (
                              <Button
                                onClick={() => {
                                  if (!user) { setLocation('/signup'); return; }
                                  if (!user?.isPro) return;
                                  handleCoinPurchase(item.id);
                                }}
                                disabled={btnDisabled}
                                className={`${btnDisabled ? 'bg-slate-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
                              >
                                {btnLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <Card className="p-6 bg-slate-900/90 border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Gift className="w-6 h-6 text-purple-400" />How to Earn FlowCoins</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg"><div className="text-3xl mb-2">✅</div><h3 className="font-semibold text-white mb-1">Complete Exercises</h3><p className="text-sm text-gray-400">Earn 1 FlowCoin per 50 XP (10-50 XP per exercise)</p></div>
                <div className="p-4 bg-slate-800/50 rounded-lg"><div className="text-3xl mb-2">🔥</div><h3 className="font-semibold text-white mb-1">Daily Streak</h3><p className="text-sm text-gray-400">Bonus XP for streaks = more FlowCoins</p></div>
                <div className="p-4 bg-slate-800/50 rounded-lg"><div className="text-3xl mb-2">🏆</div><h3 className="font-semibold text-white mb-1">Unlock Achievements</h3><p className="text-sm text-gray-400">Each achievement gives 25-500 XP</p></div>
              </div>
            </Card>
          </div>
        </div>

        {/* Embedded Upgrade (Gamification -> Pricing) - exact upgrade UI copied into Pricing */}
        <div className="max-w-7xl mx-auto my-12 px-4">
          <MonetizationSection />
        </div>

        {/* Single price: $2 USD/month; card conversion handles FX */}

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 border-2 transition-all ${
                plan.isPro
                  ? "border-purple-500 bg-slate-800/80 shadow-lg shadow-purple-500/20"
                  : "border-gray-700 bg-slate-800/40"
              }`}
            >
              {plan.isPro && (
                <div className="pointer-events-none absolute -right-12 -top-6 w-48 rotate-45 drop-shadow-xl">
                  <div
                    className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-white text-xs font-bold text-center py-2 border border-white/30"
                    style={{
                      clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Flash offer · {minutes}:{seconds}
                  </div>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">{plan.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  {plan.isPro ? (
                    <>
                      <span className="text-4xl font-bold text-white">$2.00</span>
                      <span className="text-gray-400">/month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature.replace("✓ ", "")}</span>
                  </div>
                ))}

                {plan.notIncluded.length > 0 && (
                  <>
                    <div className="border-t border-gray-700 my-4" />
                    {plan.notIncluded.map((feature, i) => (
                      <div key={`not-${i}`} className="flex items-center gap-3 text-gray-500">
                        <span className="w-5 h-5 flex-shrink-0">✗</span>
                        <span className="line-through">{feature.replace("✗ ", "")}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* CTA Button */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    if (plan.isFree) return;
                    handleUpgrade();
                  }}
                  disabled={plan.isFree || (user?.isPro && plan.isPro)}
                  variant={plan.ctaVariant}
                  className="w-full py-2 font-semibold text-base"
                >
                  {user?.isPro && plan.isPro ? "✓ Active" : plan.cta}
                </Button>
                {user?.isPro && plan.isPro && (
                  <Button
                    onClick={handlePortal}
                    variant="secondary"
                    className="w-full py-2 font-semibold text-base"
                  >
                    Manage Subscription
                  </Button>
                )}
                {plan.isPro && !user?.isPro && (
                  <div className="text-xs text-center space-y-1 text-gray-300">
                    <p>USD</p>
                    <p className="text-red-300 font-semibold">Limited offer</p>
                    <p className="text-amber-200">Time remaining: {minutes}:{seconds}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Pro Benefits and Roadmap moved from Pro page */}
        <div className="max-w-6xl mx-auto mb-16 grid lg:grid-cols-3 gap-6 px-4">
          <div className="lg:col-span-2 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-200 font-semibold text-sm">
              <span className="w-4 h-4">✨</span>
              Monthly Benefits
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {monthlyBenefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-gray-200 bg-black/25 border border-amber-400/20 rounded-lg p-3">
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-200 font-semibold text-sm">
              <span className="w-4 h-4">👑</span>
              Roadmap (moved to Exercises tab)
            </div>
            <div className="space-y-3 text-sm text-gray-200">
              <p className="text-sm text-gray-400">The learning tracks were moved to the Exercises page for an improved interactive experience.</p>
            </div>
          </div>
        </div>

        {/* Billing & Receipts */}
        {user?.isPro && (
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 space-y-3 text-gray-200">
              <div className="flex items-center gap-2 text-amber-200 font-semibold text-sm">
                <span className="w-4 h-4">👑</span>
                Billing
              </div>
              <p className="text-sm text-slate-300">Manage your subscription, invoices, and payment methods.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePortal} className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold">
                  Open Billing Portal
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-400/60 text-amber-200"
                  onClick={async () => {
                    if (!token) {
                      alert("Sign in to continue");
                      return;
                    }
                    try {
                      const res = await fetch("/api/pro/receipt", {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();
                      if (res.ok && data?.receiptUrl) {
                        window.open(data.receiptUrl, "_blank");
                      } else {
                        alert("Download receipts");
                      }
                    } catch (err) {
                      alert("Download receipts");
                    }
                  }}
                >
                  Download Receipts
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">FAQ</h2>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">How does Pro billing work?</h3>
              <p className="text-gray-400">
                Pro is billed monthly (USD). You can cancel anytime.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">What features are included in Pro?</h3>
              <p className="text-gray-400">
                Access to AI tools, debugger, snapshots, and premium tracks.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Can I try Pro features for free?</h3>
              <p className="text-gray-400">
                Some features offer a one-time free trial use.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">How do I contact support?</h3>
              <p className="text-gray-400">
                Email support@codeflow.example or use the in-app help.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        {!user?.isPro ? (
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>
              <p className="text-purple-100 mb-6 text-lg">
                Join Pro to unlock features
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="font-bold text-lg px-8 py-6"
                onClick={handleUpgrade}
              >
                Activate Pro Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-slate-900/60 border border-gray-700 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-4">You Are Pro</h2>
              <p className="text-gray-300 mb-6 text-lg">
                You are a Pro subscriber.
              </p>
              <Button size="lg" className="font-bold text-lg px-8 py-6" onClick={handlePortal}>
                Manage Subscription
              </Button>
            </div>
          </div>
        )}
       
       {/* Roadmap modal removed — roadmap is now exclusively on the Tracks page */}

       {/* VIP Signup Modal */}
       <Dialog open={vipOpen} onOpenChange={setVipOpen}>
        <DialogContent className="bg-slate-900 border border-amber-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-300" /> VIP Signup
            </DialogTitle>
            <DialogDescription className="text-amber-100/80">
              Sign up for exclusive VIP access.
            </DialogDescription>
          </DialogHeader>

          {vipStep === "collect" ? (
            <form onSubmit={submitCollect} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-500 text-black font-semibold" disabled={loading || Boolean(purchaseLoading)}>
                {loading ? "Sending Code" : "Continue to Email Confirm"}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitVerifyThenCheckout} className="space-y-4">
              <div>
                <Label>Code Sent to {email}</Label>
                <div className="mt-2">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="border-amber-400/50 text-amber-200" onClick={() => setVipStep("collect")} disabled={loading || Boolean(purchaseLoading)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-amber-500 text-black font-semibold" disabled={loading || Boolean(purchaseLoading)}>
                  {loading ? "Verifying" : "Continue to Payment"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 hover:border-amber-400/40 transition-all hover:shadow-lg hover:shadow-amber-500/10">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl group-hover:from-amber-400/40 transition-all" />
      <div className="relative z-10 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-2.5">{icon}</div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-300">{desc}</p>
        <div className="space-y-2">
          {bullets.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-gray-400">
              <Check className="w-4 h-4 text-amber-400" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
