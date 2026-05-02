import { Link, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Activity,
    Bot,
    ChevronDown,
    Loader2,
    Send,
    Shield,
    Sparkles,
    X,
    Zap,
} from "lucide-react";

function getCsrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

function withBasePath(basePath, path) {
    const base = (basePath || "").replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
}

async function adminJson(path, { method = "GET", body } = {}) {
    const headers = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    if (method === "POST") {
        headers["Content-Type"] = "application/json";
        headers["X-CSRF-TOKEN"] = getCsrfToken();
    }
    const res = await fetch(path, {
        method,
        credentials: "same-origin",
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(text || res.statusText);
    }
    if (!res.ok) {
        const msg = data?.message || data?.error || text || res.statusText;
        throw new Error(typeof msg === "string" ? msg : "Request failed");
    }
    return data;
}

function renderReplyParts(text) {
    if (!text) return null;
    const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-amber-200/95">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return (
            <span key={i} className="whitespace-pre-wrap">
                {part}
            </span>
        );
    });
}

function statusDotClass(status) {
    if (status === "warning") return "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.65)]";
    if (status === "pending") return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]";
    return "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.55)]";
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-1 py-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-amber-500/90 animate-[pulse_1s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </div>
    );
}

export default function AdminAssistantWidget() {
    const { base_path: basePathProp = "" } = usePage().props || {};
    const basePath = typeof basePathProp === "string" ? basePathProp : "";
    const panelId = useId();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [snapshot, setSnapshot] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [auditLoading, setAuditLoading] = useState(false);
    const [error, setError] = useState("");
    const listEndRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToBottom = () => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open, chatLoading]);

    const loadStatus = useCallback(async () => {
        setStatusLoading(true);
        setError("");
        try {
            const data = await adminJson(withBasePath(basePath, "/api/admin-status"));
            setSnapshot(data);
        } catch (e) {
            setError(e.message || "Could not load admin status.");
        } finally {
            setStatusLoading(false);
        }
    }, [basePath]);

    useEffect(() => {
        if (open) loadStatus();
    }, [open, loadStatus]);

    useEffect(() => {
        adminJson(withBasePath(basePath, "/api/admin-status"))
            .then(setSnapshot)
            .catch(() => {});
    }, [basePath]);

    const pushMessage = (msg) => {
        setMessages((m) => [
            ...m,
            { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
        ]);
    };

    const sendChat = async (raw) => {
        const text = (raw ?? input).trim();
        if (!text || chatLoading) return;
        if (/^run\s+system\s+audit\b/i.test(text)) {
            setInput("");
            await runAudit();
            return;
        }
        setInput("");
        pushMessage({ role: "user", text });
        setChatLoading(true);
        setError("");
        try {
            const data = await adminJson(withBasePath(basePath, "/api/assistant-chat"), {
                method: "POST",
                body: { message: text },
            });
            pushMessage({
                role: "assistant",
                text: data.reply,
                cards: data.cards,
                suggestions: data.suggestions,
                readinessPercent: data.readiness_percent,
            });
            loadStatus();
        } catch (e) {
            pushMessage({
                role: "assistant",
                text: `**Error:** ${e.message || "Chat failed."}`,
            });
        } finally {
            setChatLoading(false);
        }
    };

    const runAudit = async () => {
        if (auditLoading) return;
        setAuditLoading(true);
        setError("");
        pushMessage({ role: "user", text: "Run system audit" });
        try {
            const audit = await adminJson(withBasePath(basePath, "/api/system-audit"));
            const r = audit.readiness;
            const rec = (audit.recommendations || []).slice(0, 12);
            const alerts = audit.alerts || [];
            const lines = [
                "**System audit complete**",
                `Readiness: **${r?.percent ?? "—"}%** — ${r?.label ?? ""}`,
                "",
                "**Alerts**",
                ...(alerts.length ? alerts.map((a) => `• ${a}`) : ["• None flagged"]),
                "",
                "**Recommendations**",
                ...rec.map((line) => `• ${line}`),
            ];
            pushMessage({ role: "assistant", text: lines.join("\n") });
            await loadStatus();
        } catch (e) {
            pushMessage({
                role: "assistant",
                text: `**Audit failed:** ${e.message || "Unknown error"}`,
            });
        } finally {
            setAuditLoading(false);
        }
    };

    const quickAsk = (q) => {
        if (q === "Run system audit") {
            void runAudit();
            return;
        }
        void sendChat(q);
    };

    const shell = (
        <>
            <style>{`
                @keyframes admin-assistant-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes admin-assistant-ring {
                    0% { transform: rotate(0deg) scale(1); opacity: 0.85; }
                    100% { transform: rotate(360deg) scale(1.06); opacity: 1; }
                }
                @keyframes admin-assistant-panel-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <div
                className="pointer-events-none fixed bottom-6 right-5 md:bottom-8 md:right-8"
                style={{ zIndex: 2147483000 }}
            >
                <div className="pointer-events-auto flex flex-col items-end gap-3">
                    {open ? (
                        <div
                            id={panelId}
                            role="dialog"
                            aria-label="Admin Smart Assistant"
                            className="flex min-h-0 max-h-[min(85vh,640px)] w-[min(100vw-1.25rem,26rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-amber-600/25 bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-[#0c0a09]/98 text-amber-50/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-300 ease-out motion-safe:animate-[admin-assistant-panel-in_0.35s_ease-out_both]"
                            style={{
                                boxShadow:
                                    "0 0 0 1px rgba(245,158,11,0.14), 0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(251,191,36,0.08)",
                            }}
                        >
                            <div className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
                            <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-amber-600/15 blur-3xl" />

                            <header className="relative z-10 flex items-start justify-between gap-3 border-b border-amber-900/40 px-4 pb-3 pt-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-600/25 to-orange-900/40 shadow-[0_0_22px_rgba(245,158,11,0.25)]">
                                        <Bot className="h-6 w-6 text-amber-200" />
                                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-950 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.75)]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-stone-950" />
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/90">
                                            Monitor
                                        </p>
                                        <h2 className="truncate text-base font-semibold tracking-tight text-amber-50">
                                            Admin Smart Assistant
                                        </h2>
                                        <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-400">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-45" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                                            </span>
                                            Live system
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-stone-600/50 bg-stone-900/80 text-amber-100/80 transition hover:border-amber-600/50 hover:bg-stone-800 hover:text-amber-50"
                                    aria-label="Close assistant"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>

                            {snapshot?.cards?.length ? (
                                <div className="relative z-10 max-h-[9.5rem] overflow-x-auto overflow-y-hidden px-3 pt-3 [scrollbar-width:thin]">
                                    <div className="flex gap-2 pb-1">
                                        {snapshot.cards.map((c) => (
                                            <div
                                                key={c.key}
                                                className="min-w-[8.5rem] flex-1 rounded-2xl border border-stone-700/60 bg-stone-900/50 p-2.5 shadow-inner backdrop-blur-sm transition hover:border-amber-600/35"
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                                        {c.title}
                                                    </span>
                                                    <span
                                                        className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(c.status)}`}
                                                    />
                                                </div>
                                                <p className="mt-1 text-lg font-semibold tabular-nums text-amber-50">
                                                    {c.completed != null && c.pending != null
                                                        ? `${c.completed}/${c.completed + c.pending}`
                                                        : c.pending != null
                                                          ? c.pending
                                                          : "—"}
                                                </p>
                                                <p className="line-clamp-2 text-[10px] leading-snug text-stone-500">
                                                    {c.hint}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {snapshot && (
                                <div className="relative z-10 mx-3 mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-amber-900/35 bg-gradient-to-br from-stone-900/90 to-stone-950/95 p-2.5">
                                    <div className="rounded-xl bg-stone-950/80 px-2.5 py-2 ring-1 ring-amber-900/30">
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                            Readiness
                                        </p>
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-orange-600">
                                            {statusLoading ? "…" : `${snapshot.readiness_percent}%`}
                                        </p>
                                        <p className="text-[11px] text-stone-400">
                                            {snapshot.readiness_label}
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-center gap-1.5 rounded-xl bg-stone-950/80 px-2.5 py-2 ring-1 ring-amber-900/30">
                                        <div className="flex items-center gap-1.5 text-[11px] text-stone-300">
                                            <Shield className="h-3.5 w-3.5 text-amber-500/95" />
                                            {snapshot.alerts?.length
                                                ? `${snapshot.alerts.length} alert(s)`
                                                : "No alerts"}
                                        </div>
                                        <Link
                                            href="/admin/dashboard"
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/95 hover:text-amber-300"
                                        >
                                            Open dashboard
                                            <ChevronDown className="h-3 w-3 -rotate-90" />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="relative z-10 flex flex-wrap gap-1.5 px-3 py-2.5">
                                {[
                                    "What is pending?",
                                    "Is everything ready for launch?",
                                    "Show dashboard status",
                                ].map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        disabled={chatLoading || auditLoading}
                                        onClick={() => quickAsk(q)}
                                        className="rounded-full border border-stone-600/50 bg-stone-900/60 px-2.5 py-1 text-[10px] font-medium text-stone-300 transition hover:border-amber-600/45 hover:text-amber-50 disabled:opacity-40"
                                    >
                                        {q}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={auditLoading || chatLoading}
                                    onClick={() => quickAsk("Run system audit")}
                                    className="inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-950/40 px-2.5 py-1 text-[10px] font-semibold text-amber-200 transition hover:bg-orange-900/50 disabled:opacity-40"
                                >
                                    {auditLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Zap className="h-3 w-3" />
                                    )}
                                    Run system audit
                                </button>
                            </div>

                            {error ? (
                                <p className="relative z-10 px-3 text-[11px] text-orange-300">{error}</p>
                            ) : null}

                            <div className="relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2 [scrollbar-color:rgba(245,158,11,0.35)_transparent] [scrollbar-width:thin]">
                                {messages.length === 0 && !chatLoading ? (
                                    <div className="rounded-2xl border border-dashed border-amber-800/40 bg-stone-900/40 px-3 py-6 text-center text-xs text-stone-500">
                                        <Sparkles className="mx-auto mb-2 h-5 w-5 text-amber-500/90" />
                                        Ask about pending work, launch readiness, or run a full
                                        audit. I monitor packages, blogs, SEO, destinations, leads,
                                        and settings — I do not generate marketing copy.
                                    </div>
                                ) : null}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                                msg.role === "user"
                                                    ? "rounded-br-md border border-orange-600/35 bg-gradient-to-br from-orange-700/50 via-amber-800/45 to-stone-950/90 text-amber-50"
                                                    : "rounded-bl-md border border-stone-600/50 bg-stone-900/75 text-stone-200 shadow-[inset_0_1px_0_rgba(251,191,36,0.06)]"
                                            }`}
                                        >
                                            <div className="text-[13px]">{renderReplyParts(msg.text)}</div>
                                            {msg.cards?.length ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.cards.map((card, idx) => (
                                                        <div
                                                            key={`${msg.id}-c-${idx}`}
                                                            className={`min-w-[4.5rem] rounded-xl border px-2.5 py-1.5 text-center ${
                                                                card.tone === "amber"
                                                                    ? "border-orange-500/35 bg-orange-950/50"
                                                                    : card.tone === "violet"
                                                                      ? "border-amber-600/35 bg-amber-950/40"
                                                                      : "border-amber-400/30 bg-stone-900/80"
                                                            }`}
                                                        >
                                                            <p className="text-[9px] font-medium uppercase tracking-wide text-stone-500">
                                                                {card.title}
                                                            </p>
                                                            <p className="text-sm font-semibold text-amber-50">
                                                                {card.value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {msg.suggestions?.length && msg.role === "assistant" ? (
                                                <div className="mt-2 flex flex-wrap gap-1 border-t border-stone-700/50 pt-2">
                                                    {msg.suggestions.slice(0, 4).map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            className="rounded-lg bg-stone-900/80 px-2 py-0.5 text-[10px] text-amber-300/95 hover:bg-stone-800"
                                                            onClick={() => quickAsk(s)}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading ? (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl rounded-bl-md border border-stone-600/50 bg-stone-900/75 px-4 py-3">
                                            <TypingDots />
                                        </div>
                                    </div>
                                ) : null}
                                <div ref={listEndRef} />
                            </div>

                            <form
                                className="relative z-10 border-t border-amber-900/35 p-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void sendChat();
                                }}
                            >
                                <div className="flex items-end gap-2 rounded-2xl border border-stone-700/60 bg-stone-950/90 p-1.5 pl-3 shadow-inner backdrop-blur-sm ring-1 ring-amber-950/40">
                                    <textarea
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                void sendChat();
                                            }
                                        }}
                                        placeholder="Ask: pending work, readiness, how-to…"
                                        className="max-h-24 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-[13px] text-amber-50/95 outline-none placeholder:text-stone-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !input.trim()}
                                        className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 shadow-[0_0_18px_rgba(234,88,12,0.35)] transition hover:brightness-110 disabled:opacity-35"
                                        aria-label="Send"
                                    >
                                        {chatLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-600">
                                    <Activity className="h-3 w-3" />
                                    Intelligence from your database — not an external content AI.
                                </p>
                            </form>
                        </div>
                    ) : null}

                    <div className="group relative">
                        <span
                            className="pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded-lg border border-amber-700/40 bg-stone-950/95 px-2.5 py-1 text-[10px] font-medium text-amber-100 opacity-0 shadow-lg backdrop-blur-md transition group-hover:opacity-100"
                            role="tooltip"
                        >
                            Admin Intelligence
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            aria-controls={open ? panelId : undefined}
                            className="relative grid h-14 w-14 place-items-center rounded-full border border-amber-500/45 bg-gradient-to-br from-stone-900 via-stone-950 to-[#0c0a09] text-amber-300 shadow-[0_8px_28px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,158,11,0.15)] transition hover:scale-[1.03] hover:border-amber-400/70 hover:shadow-[0_0_28px_rgba(234,88,12,0.28)]"
                            style={{ animation: "admin-assistant-float 5.5s ease-in-out infinite" }}
                            aria-label="Open Admin Smart Assistant"
                        >
                            <span
                                className="pointer-events-none absolute inset-[-4px] rounded-full border-2 border-transparent opacity-85"
                                style={{
                                    background:
                                        "linear-gradient(#0c0a09,#0c0a09) padding-box, conic-gradient(from 0deg, rgba(245,158,11,0.95), rgba(234,88,12,0.9), rgba(251,191,36,0.95), rgba(245,158,11,0.95)) border-box",
                                    animation: "admin-assistant-ring 8s linear infinite",
                                }}
                            />
                            <Sparkles className="relative z-[1] h-6 w-6 text-amber-400" />
                            {snapshot?.alerts?.length ? (
                                <span className="absolute -right-0.5 -top-0.5 z-[2] flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-stone-950 bg-gradient-to-br from-orange-500 to-amber-600 px-1 text-[10px] font-bold text-stone-950 shadow-[0_0_12px_rgba(249,115,22,0.65)]">
                                    {snapshot.alerts.length > 9 ? "9+" : snapshot.alerts.length}
                                </span>
                            ) : null}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    if (!mounted || typeof document === "undefined") {
        return null;
    }

    return createPortal(shell, document.body);
}
