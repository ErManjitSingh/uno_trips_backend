import { usePage } from "@inertiajs/react";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { withPathPrefix } from "../lib/urlPath";

export default function AdminToastStack() {
    const page = usePage();
    const { flash, errors, auth } = page.props || {};
    const basePath = String(page.props?.base_path ?? "");
    const [toasts, setToasts] = useState([]);
    const shownKeysRef = useRef(new Set());
    const prevUnreadRef = useRef(null);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const pushToast = useCallback((payload) => {
        const message = String(payload.message ?? "").trim();
        if (!message) return;
        const rawType = payload.type;
        const type =
            rawType === "error"
                ? "error"
                : rawType === "info"
                  ? "info"
                  : "success";
        const title = String(
            payload.title ??
                (type === "error" ? "Error" : type === "info" ? "Update" : "Done"),
        );
        const key = `${type}:${title}:${message}`;
        if (shownKeysRef.current.has(key)) return;
        shownKeysRef.current.add(key);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        window.setTimeout(() => dismiss(id), 6500);
        window.setTimeout(() => shownKeysRef.current.delete(key), 12000);
    }, [dismiss]);

    useEffect(() => {
        const s = flash?.success;
        if (s) pushToast({ type: "success", title: "Success", message: s });
    }, [flash?.success, pushToast]);

    useEffect(() => {
        const e = flash?.error;
        if (e) pushToast({ type: "error", title: "Error", message: e });
    }, [flash?.error, pushToast]);

    const firstValidationMessage = useMemo(() => {
        const pageErrors = errors || {};
        const firstValue = Object.values(pageErrors)[0];
        if (!firstValue) return "";
        return Array.isArray(firstValue)
            ? String(firstValue[0] ?? "")
            : String(firstValue);
    }, [errors]);

    useEffect(() => {
        if (!firstValidationMessage.trim()) return;
        pushToast({
            type: "error",
            title: "Please fix the form",
            message: firstValidationMessage,
        });
    }, [firstValidationMessage, pushToast]);

    useEffect(() => {
        if (!auth?.user) return undefined;

        const poll = async () => {
            try {
                const res = await fetch(
                    withPathPrefix("/admin/notifications", basePath),
                    {
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                        credentials: "same-origin",
                    },
                );
                if (!res.ok) return;
                const data = await res.json();
                const count = Number(data.unread_count ?? 0);
                if (
                    prevUnreadRef.current !== null &&
                    count > prevUnreadRef.current
                ) {
                    const diff = count - prevUnreadRef.current;
                    pushToast({
                        type: "info",
                        title: "New notification",
                        message:
                            diff === 1
                                ? "You have 1 new unread notification. Open the bell to view."
                                : `You have ${diff} new unread notifications. Open the bell to view.`,
                    });
                }
                prevUnreadRef.current = count;
            } catch {
                /* ignore */
            }
        };

        poll();
        const interval = window.setInterval(poll, 60000);

        return () => window.clearInterval(interval);
    }, [auth?.user, basePath, pushToast]);

    useEffect(() => {
        const onEvent = (e) => {
            const detail = e.detail || {};
            const message = String(detail.message ?? "").trim();
            if (!message) return;
            pushToast({
                type:
                    detail.type === "error"
                        ? "error"
                        : detail.type === "info"
                          ? "info"
                          : "success",
                title: detail.title || "Notice",
                message,
            });
        };
        window.addEventListener("admin-toast", onEvent);

        return () => window.removeEventListener("admin-toast", onEvent);
    }, [pushToast]);

    return (
        <div
            className="pointer-events-none fixed right-4 top-20 z-[200] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md motion-safe:transition motion-safe:duration-300 ${
                        t.type === "error"
                            ? "border-rose-200/90 bg-rose-50/95 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/90 dark:text-rose-100"
                            : t.type === "info"
                              ? "border-sky-200/90 bg-sky-50/95 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/90 dark:text-sky-50"
                              : "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-50"
                    }`}
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                            {t.title}
                        </p>
                        <p className="mt-0.5 text-sm font-medium leading-snug">
                            {t.message}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="shrink-0 rounded-lg p-1 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                        aria-label="Dismiss"
                        onClick={() => dismiss(t.id)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
