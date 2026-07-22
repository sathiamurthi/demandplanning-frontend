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

/** The manifest actually linked in the current document right now. Each
 *  vertical (college360, ride360, ...) links its own manifest via
 *  metadata.manifest in its layout.tsx — this reads whichever one is live. */
function currentManifestHref(): string | null {
  if (typeof document === "undefined") return null;
  const href = document.querySelector('link[rel="manifest"]')?.getAttribute("href") || null;
  if (!href) return null;
  try { return new URL(href, window.location.origin).pathname; } catch { return href; }
}

/** beforeinstallprompt is bound to whatever manifest was linked in the
 *  document AT THE MOMENT it fired. On an SPA with several per-vertical
 *  manifests, a client-side route change does not necessarily cause the
 *  browser to re-evaluate installability — so a captured prompt from the
 *  homepage (main app's manifest) must never be used to "install" a
 *  different vertical's manifest. We track which manifest the captured
 *  event corresponds to and only offer the native one-tap prompt when it
 *  matches the manifest the caller actually wants installed. */
function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [deferredManifest, setDeferredManifest] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setDeferredManifest(currentManifestHref());
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); setDeferredManifest(null); };
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

  /** Only usable when the captured prompt's manifest matches `wantManifest`
   *  (or `wantManifest` is omitted, meaning "whatever's current is fine"). */
  const canPromptFor = (wantManifest?: string | null) =>
    !!deferred && (!wantManifest || deferredManifest === wantManifest);

  const promptInstall = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setDeferredManifest(null);
    return outcome === "accepted";
  };

  return { installed, canPromptFor, promptInstall };
}

function InstallInstructions({ onClose, appName }: { onClose: () => void; appName?: string }) {
  const ios = isIOS();
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base">Download {appName || "App"} as App</h3>
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
        <p className="text-[11px] text-gray-400 text-center">No app store needed — it installs straight from this page.</p>
      </div>
    </div>
  );
}

const INSTALL_QUERY_FLAG = "install";

/** Runs the actual install attempt for the CURRENT page (assumes the right
 *  manifest is already linked in the document — i.e. we're on the target
 *  vertical's own route). Falls back to manual instructions when the
 *  native one-tap prompt isn't available or doesn't match. */
function useInstallHere(manifestHref?: string) {
  const { installed, canPromptFor, promptInstall } = useInstallPrompt();
  const [showInstructions, setShowInstructions] = useState(false);

  const run = async () => {
    const want = manifestHref ?? currentManifestHref();
    if (canPromptFor(want)) {
      const accepted = await promptInstall();
      if (!accepted) setShowInstructions(true);
    } else {
      setShowInstructions(true);
    }
  };

  return { installed, run, showInstructions, setShowInstructions };
}

interface InstallTarget {
  /** Route this app lives at, e.g. "/ride360". If we're not currently on
   *  this route, clicking install does a full navigation there first (a
   *  hard reload guarantees the browser re-links THIS app's manifest)
   *  and auto-resumes the install once it lands. */
  installPath?: string;
  /** The manifest file this app should install from, e.g. "/ride360-manifest.json".
   *  Only meaningful once we're actually on installPath. */
  manifestHref?: string;
}

function useAppInstall({ installPath, manifestHref }: InstallTarget) {
  const { installed, run, showInstructions, setShowInstructions } = useInstallHere(manifestHref);
  const [pending, setPending] = useState(false);

  // If we just got hard-navigated here to finish an install, resume it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(INSTALL_QUERY_FLAG) !== "1") return;
    params.delete(INSTALL_QUERY_FLAG);
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "") + window.location.hash;
    window.history.replaceState(null, "", cleanUrl);
    // Give the manifest link / SW a moment to register before we try.
    const t = setTimeout(() => run(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (typeof window === "undefined") return;
    const onTarget = !installPath || window.location.pathname.startsWith(installPath);
    if (!onTarget) {
      setPending(true);
      const url = new URL(installPath!, window.location.origin);
      url.searchParams.set(INSTALL_QUERY_FLAG, "1");
      window.location.href = url.pathname + url.search;
      return;
    }
    await run();
  };

  return { installed, pending, start, showInstructions, setShowInstructions };
}

/** Compact pill for placement right next to a product name. Pass
 *  `installPath`/`manifestHref` when this badge represents a DIFFERENT
 *  app than the page it's rendered on (e.g. a product card on the
 *  homepage) — otherwise it installs whatever's on this current page. */
export function InstallAppBadge({ label = "App", installPath, manifestHref }: { label?: string; installPath?: string; manifestHref?: string }) {
  const { installed, pending, start, showInstructions, setShowInstructions } = useAppInstall({ installPath, manifestHref });

  if (installed) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await start();
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={pending}
        title={`Download ${label} as an app`}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-2 py-0.5 rounded-full transition-colors shrink-0 disabled:opacity-60"
      >
        <Download size={10} /> {pending ? "Opening…" : "App"}
      </button>
      {showInstructions && <InstallInstructions appName={label} onClose={() => setShowInstructions(false)} />}
    </>
  );
}

/** Sitewide dismissible top bar, shown once per browser until installed or
 *  dismissed. Always installs whatever app is on the CURRENT page — never
 *  navigates away, since it's already contextual to wherever it's shown. */
export function InstallAppBar() {
  const { installed, run, showInstructions, setShowInstructions } = useInstallHere();
  const [dismissed, setDismissed] = useState(true); // default hidden until we check localStorage client-side

  useEffect(() => {
    setDismissed(localStorage.getItem("install_bar_dismissed") === "1");
  }, []);

  if (installed || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem("install_bar_dismissed", "1");
    setDismissed(true);
  };

  return (
    <>
      <div className="sticky top-0 z-[100] bg-sky-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5"><Download size={13} /> Get the DemandGeniusAI app on your phone — faster, works offline.</span>
        <button onClick={run} className="bg-white text-sky-700 font-bold px-3 py-1 rounded-full hover:bg-sky-50 transition-colors">Download as App</button>
        <button onClick={dismiss} className="text-sky-100 hover:text-white ml-1"><X size={14} /></button>
      </div>
      {showInstructions && <InstallInstructions onClose={() => setShowInstructions(false)} />}
    </>
  );
}
