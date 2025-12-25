export type ExecutionAllowance = {
  allowed: boolean;
  remaining: number;
};

function getKey(userId?: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  const uid = userId || "anon";
  return `exec-runs-${today}-${uid}`;
}

export function checkAndConsumeExecution(userId: string | undefined | null, isPro: boolean, limit = 5): ExecutionAllowance {
  if (isPro) return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  try {
    // Bonus runs (granted by promos) are stored separately and consumed first
    const bonusKey = `exec-bonus-${userId || 'anon'}`;
    const bonus = Number(localStorage.getItem(bonusKey) || "0");
    if (!Number.isNaN(bonus) && bonus > 0) {
      localStorage.setItem(bonusKey, String(bonus - 1));
      return { allowed: true, remaining: Math.max(limit - 0, 0) };
    }

    const key = getKey(userId);
    const current = Number(localStorage.getItem(key) || "0");
    if (Number.isNaN(current)) {
      localStorage.removeItem(key);
    }
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return { allowed: true, remaining: Math.max(limit - next, 0) };
  } catch {
    // If storage fails, allow to avoid false negatives
    return { allowed: true, remaining: limit };
  }
}

export function grantExecutions(userId: string | undefined | null, amount = 5) {
  try {
    const bonusKey = `exec-bonus-${userId || 'anon'}`;
    const current = Number(localStorage.getItem(bonusKey) || "0");
    const next = (Number.isNaN(current) ? 0 : current) + amount;
    localStorage.setItem(bonusKey, String(next));
    return true;
  } catch {
    return false;
  }
}
