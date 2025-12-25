import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Roadmap() {
  const [unlockedAdvanced, setUnlockedAdvanced] = useState<boolean>(() => !!localStorage.getItem('purchased:roadmap:advanced'));

  const buyAdvanced = () => {
    // simulated purchase
    localStorage.setItem('purchased:roadmap:advanced', '1');
    setUnlockedAdvanced(true);
    alert('Advanced roadmap unlocked');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Roadmap</h2>
      <p className="text-sm text-muted-foreground">A guided path from basics to advanced topics. Basic steps are free; advanced content is purchasable.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-bold">1. Basics — Syntax & Variables</h3>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li>Variables and types</li>
            <li>Arithmetic and strings</li>
            <li>Control flow: if/else, loops</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold">2. Data Structures</h3>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li>Arrays, Lists</li>
            <li>Maps / Dictionaries</li>
            <li>Basic usage patterns</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold">3. Algorithms (Intermediate)</h3>
          <ul className="mt-2 text-sm list-disc list-inside">
            <li>Searching & sorting</li>
            <li>Recursion & iteration</li>
            <li>Complexity basics</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold">4. Advanced Topics (Paid)</h3>
          {unlockedAdvanced ? (
            <div>
              <ul className="mt-2 text-sm list-disc list-inside">
                <li>Graphs & Trees</li>
                <li>Dynamic Programming</li>
                <li>Memory & Optimization</li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Advanced roadmap locked. Purchase to unlock detailed lessons and examples.</p>
              <div className="flex gap-2">
                <Button onClick={buyAdvanced}>Buy Advanced Roadmap</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
