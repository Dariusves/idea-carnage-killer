import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const WORKER_URL = "https://idea-carnage-worker.ideacarnage.workers.dev/roast";

const Index = () => {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const destroyIdea = useCallback(async () => {
    if (!idea.trim()) {
      toast.error("Feed me an idea first, coward.");
      return;
    }

    setResult("");
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResult(accumulated);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setResult(
          "## 💀 Connection Failed\n\nLooks like the destruction server is down. Even our servers couldn't handle your terrible idea.\n\n*Configure `WORKER_URL` in the source to connect your Cloudflare Worker.*"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [idea]);

  const shareCarnage = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Carnage copied. Spread the destruction. ☠️");
  }, [result]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-4xl md:text-6xl font-bold text-primary animate-flicker font-mono-display tracking-tight">
          💀 Idea Destroyer
        </h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base font-mono-display">
          Your startup dreams end here.
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl space-y-5">
        <label
          htmlFor="idea-input"
          className="block text-foreground font-mono-display text-lg md:text-xl text-center"
        >
          What's your genius business idea?
        </label>
        <textarea
          id="idea-input"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Uber for dogs, but with blockchain..."
          rows={4}
          disabled={loading}
          className="w-full rounded-lg bg-card border border-border p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all font-sans text-base md:text-lg"
        />

        <button
          onClick={destroyIdea}
          disabled={loading}
          className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-mono-display font-bold text-lg md:text-xl tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Destroying..." : "💀 Destroy My Idea"}
        </button>
      </div>

      {/* Loading skull */}
      {loading && (
        <div className="mt-12 text-center">
          <div className="text-7xl md:text-8xl animate-skull-pulse select-none">
            💀
          </div>
          <p className="mt-3 text-muted-foreground font-mono-display text-sm animate-glitch">
            Annihilating your dreams...
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="w-full max-w-2xl mt-10 space-y-4 animate-fade-in">
          <div className="rounded-lg bg-card border border-border p-6 md:p-8 prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-mono-display prose-headings:text-primary prose-strong:text-foreground prose-p:text-foreground/85">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>

          <button
            onClick={shareCarnage}
            className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-mono-display font-bold text-base hover:bg-muted transition-colors"
          >
            ☠️ Share the Carnage
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="mt-auto pt-16 text-muted-foreground/50 text-xs font-mono-display">
        No ideas were actually harmed. Probably.
      </p>
    </div>
  );
};

export default Index;
