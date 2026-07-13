"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  };

  return { installed, canPrompt: !!deferred, promptInstall };
}

function InstallInstructions({ onClose }: { onClose: () => void }) {
  const ios = isIOS();
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base">Download as App</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
        </div>
        {ios ? (
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2"><Share size={16} className="text-sky-500 shrink-0 mt-0.5" /><span>Tap the <b>Share</b> icon in Safari's toolbar.</span></li>
            <li className="flex items-start gap-2"><PlusSquare size={16} className="text-sky-500 shrink-0 mt-0.5" /><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
            <li className="flex items-start gap-2"><Download size={16} className="text-sky-500 shrink-0 mt-0.5" /><span>Tap <b>Add</b> — the app icon appears on your home screen.</span></li>
          </ol>
        ) : (
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="font-black text-sky-500 shrink-0">1.</span><span>Open your browser menu (⋮ or ⋯).</span></li>
            <li className="flex items-start gap-2"><span className="font-black text-sky-500 shrink-0">2.</span><span>Tap <b>Install app</b> / <b>Add to Home screen</b>.</span></li>
            <li className="flex items-start gap-2"><span className="font-black text-sky-500 shrink-0">3.</span><span>Confirm — it now opens like a native app.</span></li>
          </ol>
        )}
        <p className="text-[11px] text-gray-400 text-center">No app store needed — it installs straight from this site.</p>
      </div>
    </div>
  );
}

/** Compact pill for placement right next to a product name. */
export function InstallAppBadge({ label = "App" }: { label?: string }) {
  const { installed, canPrompt, promptInstall } = useInstallPrompt();
  const [showInstructions, setShowInstructions] = useState(false);

  if (installed) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canPrompt) {
      const accepted = await promptInstall();
      if (!accepted) setShowInstructions(true);
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title={`Download ${label} as an app`}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-2 py-0.5 rounded-full transition-colors shrink-0"
      >
        <Download size={10} /> App
      </button>
      {showInstructions && <InstallInstructions onClose={() => setShowInstructions(false)} />}
    </>
  );
}

/** Sitewide dismissible top bar, shown once per browser until installed or dismissed. */
export function InstallAppBar() {
  const { installed, canPrompt, promptInstall } = useInstallPrompt();
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until we check localStorage client-side

  useEffect(() => {
    setDismissed(localStorage.getItem("install_bar_dismissed") === "1");
  }, []);

  if (installed || dismissed) return null;

  const handleInstallClick = async () => {
    if (canPrompt) {
      const accepted = await promptInstall();
      if (!accepted) setShowInstructions(true);
    } else {
      setShowInstructions(true);
    }
  };

  const dismiss = () => {
    localStorage.setItem("install_bar_dismissed", "1");
    setDismissed(true);
  };

  return (
    <>
      <div className="sticky top-0 z-[100] bg-sky-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5"><Download size={13} /> Get the DemandGeniusAI app on your phone — faster, works offline.</span>
        <button onClick={handleInstallClick} className="bg-white text-sky-700 font-bold px-3 py-1 rounded-full hover:bg-sky-50 transition-colors">Download as App</button>
        <button onClick={dismiss} className="text-sky-100 hover:text-white ml-1"><X size={14} /></button>
      </div>
      {showInstructions && <InstallInstructions onClose={() => setShowInstructions(false)} />}
    </>
  );
}
