import { router } from "@inertiajs/react";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { withPathPrefix } from "../lib/urlPath";

function getCsrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

function resolveNotificationHref(url, basePath) {
    if (!url) return "#";
    const u = String(url);
    if (u.startsWith("http://") || u.startsWith("https://")) {
        return u;
    }

    return withPathPrefix(u, basePath);
}

export default function AdminNotificationBell({
    initialUnread = 0,
    basePath = "",
}) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [unread, setUnread] = useState(initialUnread);
    const rootRef = useRef(null);

    useEffect(() => {
        setUnread(initialUnread);
    }, [initialUnread]);

    useEffect(() => {
        function onDocMouseDown(e) {
            if (!open) return;
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocMouseDown);

        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [open]);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(withPathPrefix("/admin/notifications", basePath), {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "same-origin",
            });
            if (!res.ok) {
                throw new Error("Could not load notifications");
            }
            const data = await res.json();
            setItems(data.notifications ?? []);
            setUnread(data.unread_count ?? 0);
        } catch (e) {
            setError(e.message || "Error");
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    useEffect(() => {
        if (open) {
            loadList();
        }
    }, [open, loadList]);

    const onMarkAllRead = async () => {
        try {
            const res = await fetch(
                withPathPrefix("/admin/notifications/read-all", basePath),
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRF-TOKEN": getCsrfToken(),
                    },
                    credentials: "same-origin",
                    body: "{}",
                },
            );
            if (!res.ok) {
                throw new Error("Failed");
            }
            setUnread(0);
            setItems((prev) =>
                prev.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                })),
            );
        } catch {
            /* ignore */
        }
    };

    const onClickItem = async (n) => {
        if (!n.read_at) {
            try {
                await fetch(
                    withPathPrefix(`/admin/notifications/${n.id}/read`, basePath),
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-CSRF-TOKEN": getCsrfToken(),
                        },
                        credentials: "same-origin",
                        body: "{}",
                    },
                );
                setUnread((c) => Math.max(0, c - 1));
                setItems((prev) =>
                    prev.map((x) =>
                        x.id === n.id
                            ? { ...x, read_at: new Date().toISOString() }
                            : x,
                    ),
                );
            } catch {
                /* still navigate */
            }
        }
        const href = resolveNotificationHref(n.data?.url, basePath);
        if (href && href !== "#") {
            setOpen(false);
            router.visit(href);
        }
    };

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                aria-label="Notifications"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-amber-200 bg-white text-stone-500 hover:bg-amber-100 dark:border-stone-700 dark:bg-stone-900 dark:text-amber-100 dark:hover:bg-stone-800"
            >
                <Bell className="h-4 w-4" aria-hidden />
                {unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                    </span>
                ) : null}
            </button>
            {open ? (
                <div className="absolute right-0 top-full z-[100] mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900">
                    <div className="flex items-center justify-between border-b border-amber-100 px-3 py-2 dark:border-stone-700">
                        <span className="text-sm font-semibold text-stone-800 dark:text-amber-50">
                            Notifications
                        </span>
                        {unread > 0 ? (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                            >
                                Mark all read
                            </button>
                        ) : null}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <p className="px-3 py-6 text-center text-sm text-stone-500">
                                Loading…
                            </p>
                        ) : error ? (
                            <p className="px-3 py-6 text-center text-sm text-rose-600">
                                {error}
                            </p>
                        ) : items.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-stone-500">
                                No notifications yet
                            </p>
                        ) : (
                            <ul className="divide-y divide-amber-100 dark:divide-stone-700">
                                {items.map((n) => (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            onClick={() => onClickItem(n)}
                                            className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-amber-50 dark:hover:bg-stone-800 ${
                                                n.read_at
                                                    ? "opacity-75"
                                                    : "bg-amber-50/50 dark:bg-stone-800/40"
                                            }`}
                                        >
                                            <span className="font-medium text-stone-900 dark:text-amber-50">
                                                {n.data?.title ?? "Notice"}
                                            </span>
                                            {n.data?.body ? (
                                                <span className="line-clamp-2 text-xs text-stone-600 dark:text-amber-100/70">
                                                    {n.data.body}
                                                </span>
                                            ) : null}
                                            {n.created_at ? (
                                                <span className="text-[10px] text-stone-400 dark:text-stone-500">
                                                    {n.created_at}
                                                </span>
                                            ) : null}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
