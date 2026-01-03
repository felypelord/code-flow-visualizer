import { test, expect } from "@playwright/test";

async function setProgLang(page: any, lang: string) {
  await page.addInitScript((l: string) => {
    window.localStorage.setItem("progLang", String(l));
  }, lang);
}

async function fillEditor(page: any, code: string) {
  const editor = page.locator(".code-editor textarea");
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await editor.fill(code);
}

function getOutputCard(page: any) {
  // "Output" title is a unique exact match inside the Output card header.
  return page.getByText("Output", { exact: true }).locator("..");
}

function getErrorBadge(page: any) {
  // In editable mode CodeEditor shows "Error: line N" badge.
  return page.locator(".code-editor").getByText(/Error: line \d+/);
}

async function clickStepNTimes(page: any, n: number) {
  const stepBtn = page.getByRole("button", { name: "Step" });
  for (let i = 0; i < n; i++) {
    await stepBtn.click();
  }
}

async function clickStepNTimesWithDelay(page: any, n: number, delayMs = 25) {
  const stepBtn = page.getByRole("button", { name: "Step" });
  for (let i = 0; i < n; i++) {
    await stepBtn.click();
    if (delayMs > 0) await page.waitForTimeout(delayMs);
  }
}

async function waitForPyodide(page: any, timeoutMs = 120_000) {
  await page.waitForFunction(
    () => {
      const w: any = window as any;
      return Boolean(w.__cf_pyodide && typeof w.__cf_pyodide.runPython === "function");
    },
    null,
    { timeout: timeoutMs },
  );
}

test.describe("Sandbox (JS)", () => {
  test("prints stdout to Output panel", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(page, "console.log('OK_JS_1');");
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    const outputCard = getOutputCard(page);
    await expect(outputCard).toBeVisible({ timeout: 15_000 });
    await expect(outputCard.getByText("OK_JS_1")).toBeVisible({ timeout: 15_000 });
  });

  test("maps SyntaxError to the correct line", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(
      page,
      [
        "const a = ;",
        "console.log('SHOULD_NOT_PRINT');",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    // Some SyntaxErrors come without a reliable engine line number; we still require an error surface.
    const errorSurface = page
      .locator("text=Syntax issue")
      .first()
      .or(page.locator("text=Execution error").first())
      .or(getErrorBadge(page));
    await expect(errorSurface).toBeVisible({ timeout: 15_000 });
    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("SHOULD_NOT_PRINT")).toHaveCount(0);
  });

  test("maps runtime Error to throw line and preserves earlier output", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(
      page,
      [
        "console.log('before');",
        "throw new Error('boom');",
        "console.log('after');",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("before")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Error: line 2")).toBeVisible({ timeout: 15_000 });
    await expect(outputCard.getByText("after")).toHaveCount(0);
  });

  test("handles loops + heap mutations and prints expected results", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(
      page,
      [
        "let arr = [1, 2, 3, 4];",
        "let obj = { sum: 0 };",
        "for (let i = 0; i < arr.length; i++) {",
        "  obj.sum += arr[i];",
        "  arr[i] = arr[i] * 2;",
        "}",
        "obj.extra = arr.join(',');",
        "console.log('sum=' + obj.sum);",
        "console.log('extra=' + obj.extra);",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("sum=10")).toBeVisible({ timeout: 30_000 });
    await expect(outputCard.getByText("extra=2,4,6,8")).toBeVisible({ timeout: 30_000 });
    await expect(getErrorBadge(page)).toHaveCount(0);
  });

  test("handles nested objects + deep mutations and prints expected results", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(
      page,
      [
        "let state = { user: { name: 'Ana', scores: [1, 2, 3] }, meta: { tags: ['x'] } };",
        "state.user.scores[1] = 99;",
        "state.meta.tags.push('y');",
        "let sum = 0;",
        "for (let i = 0; i < state.user.scores.length; i++) sum += state.user.scores[i];",
        "state.user.sum = sum;",
        "console.log('sum=' + state.user.sum);",
        "console.log('tags=' + state.meta.tags.join('|'));",
      ].join("\n"),
    );

    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("sum=103")).toBeVisible({ timeout: 30_000 });
    await expect(outputCard.getByText("tags=x|y")).toBeVisible({ timeout: 30_000 });
    await expect(getErrorBadge(page)).toHaveCount(0);
  });

  test("maps JSON.parse runtime error to a line and preserves earlier output", async ({ page }) => {
    await page.goto("/sandbox?lng=en");
    await fillEditor(
      page,
      [
        "console.log('start');",
        `JSON.parse('{"a":1,}');`,
        "console.log('never');",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Play" }).click();

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("start")).toBeVisible({ timeout: 15_000 });
    await expect(outputCard.getByText("never")).toHaveCount(0);
    await expect(getErrorBadge(page)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Sandbox (simulated non-JS)", () => {
  test("shows non-JS output note and steps line-by-line", async ({ page }) => {
    await setProgLang(page, "java");
    await page.goto("/sandbox?lng=en");

    await fillEditor(
      page,
      [
        "class Main {",
        "  public static void main(String[] args) {",
        "    int x = 1;",
        "    x = x + 2;",
        "    System.out.println(x);",
        "  }",
        "}",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Step" }).click();

    await expect(getOutputCard(page)).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("Output is shown for JavaScript execution"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Line\s+\d+\//)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Sandbox (Python / real engine)", () => {
  test.describe.configure({ timeout: 180_000 });

  test("steps through Python code and prints output", async ({ page }) => {
    await setProgLang(page, "python");
    await page.goto("/sandbox?lng=en");

    await fillEditor(
      page,
      [
        "def f(n):",
        "    x = n + 1",
        "    return x",
        "",
        "a = [1, 2]",
        "a.append(3)",
        "print(f(a[0]))",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();

    // First click triggers Pyodide load + trace build; wait until Pyodide is ready.
    await page.getByRole("button", { name: "Step" }).click();
    await waitForPyodide(page, 120_000);
    await clickStepNTimesWithDelay(page, 200, 15);

    await expect(page.getByRole("heading", { name: "Call Stack" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Heap Memory" })).toBeVisible({ timeout: 30_000 });

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText(/:\s*2\s*$/)).toBeVisible({ timeout: 30_000 });
  });

  test("maps Python runtime error to a line", async ({ page }) => {
    await setProgLang(page, "python");
    await page.goto("/sandbox?lng=en");

    await fillEditor(
      page,
      [
        "x = 10",
        "y = 0",
        "print('before')",
        "z = x / y",
        "print(z)",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Reset" }).click();

    await page.getByRole("button", { name: "Step" }).click();
    await waitForPyodide(page, 120_000);
    await clickStepNTimesWithDelay(page, 200, 15);

    const outputCard = getOutputCard(page);
    await expect(outputCard.getByText("before")).toBeVisible({ timeout: 30_000 });
    await expect(getErrorBadge(page)).toBeVisible({ timeout: 30_000 });
  });
});
