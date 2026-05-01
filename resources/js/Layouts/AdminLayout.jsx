import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import useAdminAutoLogout from "../Hooks/useAdminAutoLogout";
import {
    Activity,
    BadgePercent,
    Bell,
    BookOpenText,
    BriefcaseBusiness,
    ChevronDown,
    Compass,
    Gauge,
    Image,
    Layers,
    LayoutGrid,
    LogOut,
    Mail,
    Megaphone,
    Menu,
    MessageCircle,
    MonitorCog,
    Package,
    Search,
    SearchCheck,
    Settings,
    Share2,
    ShieldCheck,
    User,
    Wallet,
    RefreshCw,
} from "lucide-react";

const menuGroups = [
    {
        key: "dashboard",
        label: "Dashboard",
        icon: Gauge,
        href: "/admin/dashboard",
    },
    {
        key: "settings",
        label: "Website Control",
        icon: Settings,
        children: [
            { href: "/admin/settings?tab=general", label: "General Settings" },
            { href: "/admin/settings?tab=contact", label: "Contact Details" },
            {
                href: "/admin/settings?tab=whatsapp",
                label: "WhatsApp Settings",
            },
            { href: "/admin/settings?tab=smtp", label: "SMTP / Email" },
            { href: "/admin/settings?tab=ga4", label: "GA4 Analytics" },
            { href: "/admin/settings?tab=seo", label: "SEO Defaults" },
            { href: "/admin/settings", label: "Roles & Permissions" },
            { href: "/admin/settings", label: "Backup & Security" },
        ],
    },
    {
        key: "package-control",
        label: "Package Control",
        icon: BriefcaseBusiness,
        children: [
            { href: "/admin/packages", label: "All Packages" },
            { href: "/admin/packages?tab=add", label: "Add New Package" },
            { href: "/admin/categories", label: "Categories" },
            { href: "/admin/destinations", label: "Destinations" },
            { href: "/admin/activities", label: "Activities" },
            { href: "/admin/packages?tab=pricing", label: "Pricing Manager" },
            { href: "/admin/seasonal-offers", label: "Seasonal Offers" },
            { href: "/admin/reviews", label: "Review Management" },
        ],
    },
    {
        key: "listing-page-control",
        label: "Listing Page Control",
        icon: Layers,
        children: [
            { href: "/admin/listing-pages", label: "All listing pages" },
            {
                href: "/admin/listing-pages/create",
                label: "Add New listing page",
            },
            {
                href: "/admin/listing-categories",
                label: "Category listing page",
            },
            {
                href: "/admin/listing-categories?action=new",
                label: "Add new listing page category",
            },
        ],
    },
    {
        key: "blog-control",
        label: "Blog Control",
        icon: BookOpenText,
        children: [
            { href: "/admin/blogs", label: "All Posts" },
            { href: "/admin/blogs/create", label: "Add New Blog" },
            { href: "/admin/blog-categories", label: "Categories" },
            { href: "/admin/blog-comments", label: "Comments" },
            { href: "/admin/blogs/drafts", label: "Draft Posts" },
            { href: "/admin/blogs?tab=seo", label: "SEO Meta Manager" },
            { href: "/admin/blogs?tab=featured", label: "Featured Articles" },
        ],
    },
    {
        key: "seo-management",
        label: "SEO Management",
        icon: SearchCheck,
        href: "/admin/seo-management",
    },
    {
        key: "activity-control",
        label: "Activity Control",
        icon: Activity,
        children: [
            {
                href: "/admin/leads",
                label: "Leads Management",
                badge: 12,
                badgeTone: "amber",
            },
            {
                href: "/admin/bookings",
                label: "Booking Requests",
                badge: 8,
                badgeTone: "emerald",
            },
            { href: "/admin/customers", label: "Customers" },
            { href: "/admin/leads", label: "Inquiry Messages" },
            { href: "/admin/leads", label: "Call Back Requests" },
            { href: "/admin/bookings", label: "Payment Logs" },
            { href: "/admin/bookings", label: "Refund Requests" },
            { href: "/admin/activity-logs", label: "Assigned Tasks" },
            { href: "/admin/activity-logs", label: "Staff Activity Logs" },
        ],
    },
    {
        key: "social-media-control",
        label: "Social Media Control",
        icon: Share2,
        children: [
            { href: "/admin/settings", label: "Social Links" },
            { href: "/admin/settings", label: "Instagram Feed" },
            { href: "/admin/settings", label: "Facebook Connect" },
            { href: "/admin/settings", label: "YouTube Videos" },
            { href: "/admin/settings", label: "Reviews Sync" },
            { href: "/admin/settings", label: "Testimonials" },
            { href: "/admin/settings", label: "Campaign Links" },
            { href: "/admin/settings", label: "Share Tracking" },
        ],
    },
    {
        key: "marketing-control",
        label: "Marketing Control",
        icon: Megaphone,
        children: [
            { href: "/admin/settings", label: "Email Campaigns" },
            { href: "/admin/settings", label: "Newsletter Subscribers" },
            { href: "/admin/leads", label: "Popup Leads" },
            { href: "/admin/settings", label: "Coupon Codes" },
            { href: "/admin/settings", label: "Referral Program" },
            { href: "/admin/analytics", label: "UTM Reports" },
        ],
    },
    {
        key: "media-library",
        label: "Media Library",
        icon: Image,
        children: [
            { href: "/admin/media-library", label: "Upload Media" },
            { href: "/admin/media-library", label: "Images" },
            { href: "/admin/media-library", label: "Videos" },
            { href: "/admin/media-library", label: "Documents" },
            { href: "/admin/media-library", label: "Compression Center" },
        ],
    },
];

const badgeStyles = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
};

function parseRelativeUrl(input) {
    try {
        const parsed = new URL(input, "http://localhost");
        return {
            pathname: parsed.pathname,
            searchParams: parsed.searchParams,
        };
    } catch {
        return {
            pathname: input.split("?")[0] || input,
            searchParams: new URLSearchParams(input.split("?")[1] || ""),
        };
    }
}

function isItemActive(url, href) {
    if (!href) return false;

    const current = parseRelativeUrl(url || "");
    const target = parseRelativeUrl(href);

    const pathMatches =
        current.pathname === target.pathname ||
        current.pathname.startsWith(target.pathname + "/");

    if (!pathMatches) return false;

    // If menu item declares query params, ensure they are present in current URL.
    const targetEntries = [...target.searchParams.entries()];
    if (!targetEntries.length) return true;

    return targetEntries.every(
        ([key, value]) => current.searchParams.get(key) === value,
    );
}

function getItemActiveScore(url, href) {
    if (!isItemActive(url, href)) return -1;
    if (url === href) return 10000 + href.length; // prefer exact match first
    return href.length; // then prefer most specific prefix
}

export default function AdminLayout({ title, children }) {
    const { url, props } = usePage();
    const [refreshing, setRefreshing] = useState(false);
    const [dismissedAlert, setDismissedAlert] = useState("");
    const [darkMode, setDarkMode] = useState(
        () => localStorage.getItem("admin_theme") === "dark",
    );
    const collapsed = false;
    const [search, setSearch] = useState("");
    const [openGroup, setOpenGroup] = useState(
        () => localStorage.getItem("admin_sidebar_open") || "dashboard",
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { showWarning, countdownSeconds, stayLoggedIn, logoutNow } =
        useAdminAutoLogout();

    const refreshCurrentPage = () => {
        router.reload({
            preserveScroll: true,
            preserveState: true,
            onStart: () => setRefreshing(true),
            onFinish: () => setRefreshing(false),
        });
    };

    useEffect(() => {
        localStorage.setItem("admin_theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("admin_sidebar_open", openGroup);
    }, [openGroup]);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [url]);

    useEffect(() => {
        const direct = menuGroups.find(
            (g) => g.href && isItemActive(url, g.href),
        );
        if (direct) {
            setOpenGroup(direct.key);
            return;
        }
        const withChild = menuGroups.find((g) =>
            g.children?.some((item) => isItemActive(url, item.href)),
        );
        if (withChild) {
            setOpenGroup(withChild.key);
        }
    }, [url]);

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return menuGroups;
        const term = search.toLowerCase();
        return menuGroups
            .map((group) => ({
                ...group,
                children: (group.children || []).filter((item) =>
                    item.label.toLowerCase().includes(term),
                ),
            }))
            .filter(
                (group) =>
                    group.label.toLowerCase().includes(term) ||
                    (group.children && group.children.length > 0),
            );
    }, [search]);

    const firstValidationError = useMemo(() => {
        const pageErrors = props?.errors || {};
        const firstValue = Object.values(pageErrors)[0];
        if (!firstValue) return "";
        return Array.isArray(firstValue) ? firstValue[0] : firstValue;
    }, [props?.errors]);

    const alertConfig = useMemo(() => {
        if (props?.flash?.error)
            return { type: "error", message: props.flash.error };
        if (firstValidationError)
            return { type: "error", message: firstValidationError };
        if (props?.flash?.success)
            return { type: "success", message: props.flash.success };
        return null;
    }, [firstValidationError, props?.flash?.error, props?.flash?.success]);

    useEffect(() => {
        setDismissedAlert("");
    }, [alertConfig?.message]);

    return (
        <div
            className={
                darkMode
                    ? "dark h-screen overflow-hidden bg-stone-900 text-amber-50"
                    : "h-screen overflow-hidden bg-amber-50 text-stone-700"
            }
        >
            <div className="flex h-full">
                <button
                    type="button"
                    aria-label="Close menu"
                    className={`fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm transition-opacity md:hidden ${
                        mobileNavOpen
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                />
                <aside
                    className={`relative z-50 flex h-screen w-[280px] shrink-0 overflow-hidden border-r border-amber-200/70 bg-amber-100/60 p-4 shadow-[0_10px_40px_rgba(120,53,15,0.10)] backdrop-blur-xl transition-transform duration-200 dark:border-stone-700/80 dark:bg-stone-900 md:static md:translate-x-0 ${
                        mobileNavOpen
                            ? "fixed left-0 top-0 translate-x-0"
                            : "fixed left-0 top-0 -translate-x-full md:translate-x-0"
                    }`}
                >
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-10 top-20 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20" />
                        <div className="absolute -right-10 bottom-24 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
                    </div>
                    <div className="relative z-10 flex h-full flex-col">
                        <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="relative overflow-hidden rounded-xl border border-stone-800/80 bg-[#0f0f0f] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/10 to-transparent" />
                                        <img
                                            src="https://unotrips.com/img/logos.png?v=4&t=1776967446011"
                                            alt="UNO Trips"
                                            className="mx-auto h-6 w-auto object-contain"
                                        />
                                    </div>
                                    {!collapsed && (
                                        <div className="mt-2.5 min-w-0">
                                            <p className="truncate text-sm font-semibold leading-5 tracking-[0.01em] text-stone-900 dark:text-amber-50">
                                                UNO Trips
                                            </p>
                                            <p className="truncate text-xs font-medium uppercase tracking-[0.08em] text-stone-500 dark:text-amber-100/70">
                                                Admin Panel
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!collapsed && (
                                <div className="mt-3">
                                    <label className="relative block">
                                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                                        <input
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Search menu"
                                            className="w-full rounded-xl border border-amber-200 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 dark:border-stone-700 dark:bg-transparent"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex-1 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                            <nav className="space-y-2">
                                {filteredGroups.map((group) => {
                                    const Icon = group.icon;
                                    const activeChildIndex = group.href
                                        ? -1
                                        : group.children.reduce(
                                              (bestIndex, item, idx) => {
                                                  const score =
                                                      getItemActiveScore(
                                                          url,
                                                          item.href,
                                                      );
                                                  const bestScore =
                                                      bestIndex === -1
                                                          ? -1
                                                          : getItemActiveScore(
                                                                url,
                                                                group.children[
                                                                    bestIndex
                                                                ].href,
                                                            );
                                                  return score > bestScore
                                                      ? idx
                                                      : bestIndex;
                                              },
                                              -1,
                                          );
                                    const groupActive = group.href
                                        ? isItemActive(url, group.href)
                                        : activeChildIndex !== -1;
                                    const isOpen = openGroup === group.key;
                                    if (group.href) {
                                        return (
                                            <div
                                                key={group.key}
                                                className="rounded-2xl border border-amber-200/80 bg-white/80 p-1 dark:border-stone-700 dark:bg-stone-900/80"
                                            >
                                                <Link
                                                    href={group.href}
                                                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                                                        groupActive
                                                            ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-orange-700 dark:text-amber-300"
                                                            : "text-stone-700 hover:bg-amber-100 dark:text-amber-100/80 dark:hover:bg-stone-800"
                                                    }`}
                                                    title={
                                                        collapsed
                                                            ? group.label
                                                            : undefined
                                                    }
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <Icon className="h-4 w-4" />
                                                        {!collapsed && (
                                                            <span className="font-medium">
                                                                {group.label}
                                                            </span>
                                                        )}
                                                    </span>
                                                </Link>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div
                                            key={group.key}
                                            className="rounded-2xl border border-amber-200/80 bg-white/80 p-1 dark:border-stone-700 dark:bg-stone-900/80"
                                        >
                                            <button
                                                onClick={() =>
                                                    setOpenGroup((prev) =>
                                                        prev === group.key
                                                            ? ""
                                                            : group.key,
                                                    )
                                                }
                                                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                                                    groupActive
                                                        ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-orange-700 dark:text-amber-300"
                                                        : "text-stone-700 hover:bg-amber-100 dark:text-amber-100/80 dark:hover:bg-stone-800"
                                                }`}
                                                title={
                                                    collapsed
                                                        ? group.label
                                                        : undefined
                                                }
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Icon className="h-4 w-4" />
                                                    {!collapsed && (
                                                        <span className="font-medium">
                                                            {group.label}
                                                        </span>
                                                    )}
                                                </span>
                                                {!collapsed && (
                                                    <ChevronDown
                                                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                    />
                                                )}
                                            </button>
                                            {!collapsed && (
                                                <div
                                                    className={`grid overflow-hidden transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                                                >
                                                    <div className="min-h-0 space-y-1 pl-3 pr-2 pb-2">
                                                        {group.children.map(
                                                            (item, idx) => {
                                                                const active =
                                                                    idx ===
                                                                    activeChildIndex;
                                                                return (
                                                                    <Link
                                                                        key={`${group.key}-${item.label}`}
                                                                        href={
                                                                            item.href
                                                                        }
                                                                        className={`group/item relative flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition ${
                                                                            active
                                                                                ? "mt-3 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-900 shadow-md"
                                                                                : "text-stone-600 hover:bg-amber-100 dark:text-amber-100/80 dark:hover:bg-stone-800"
                                                                        }`}
                                                                    >
                                                                        <span className="truncate">
                                                                            {
                                                                                item.label
                                                                            }
                                                                        </span>
                                                                        {item.badge ? (
                                                                            <span
                                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStyles[item.badgeTone] || "bg-slate-100 text-slate-600"}`}
                                                                            >
                                                                                {
                                                                                    item.badge
                                                                                }
                                                                            </span>
                                                                        ) : null}
                                                                        {active ? (
                                                                            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                                                                        ) : null}
                                                                    </Link>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-amber-200 bg-white/95 px-5 backdrop-blur dark:border-stone-700 dark:bg-stone-950/90">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(true)}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-white text-stone-600 hover:bg-amber-100 md:hidden dark:border-stone-700 dark:bg-stone-900 dark:text-amber-100 dark:hover:bg-stone-800"
                                aria-label="Open menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <h1 className="truncate text-lg font-semibold text-stone-800 dark:text-amber-50">
                                {title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="grid h-9 w-9 place-items-center rounded-xl border border-amber-200 bg-white text-stone-500 hover:bg-amber-100 dark:border-stone-700 dark:bg-stone-900">
                                🔔
                            </button>
                            <button
                                onClick={refreshCurrentPage}
                                disabled={refreshing}
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-1.5 text-xs text-stone-700 hover:bg-amber-100 disabled:opacity-60 dark:border-stone-700 dark:text-amber-100 dark:hover:bg-stone-800"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </button>
                            <button
                                onClick={() => setDarkMode((v) => !v)}
                                className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs dark:border-stone-700"
                            >
                                {darkMode ? "Light" : "Dark"}
                            </button>
                            <button
                                onClick={logoutNow}
                                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-sm font-medium text-stone-900 hover:from-amber-400 hover:to-orange-500"
                            >
                                Logout
                            </button>
                        </div>
                    </header>
                    {alertConfig && dismissedAlert !== alertConfig.message ? (
                        <div
                            className={`mx-4 mt-3 flex items-start justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm md:mx-6 ${
                                alertConfig.type === "error"
                                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                            }`}
                        >
                            <p className="font-medium">{alertConfig.message}</p>
                            <button
                                onClick={() =>
                                    setDismissedAlert(alertConfig.message)
                                }
                                className="shrink-0 rounded-md px-1.5 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                                aria-label="Dismiss alert"
                            >
                                ✕
                            </button>
                        </div>
                    ) : null}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        {children}
                    </main>
                    <footer className="sticky bottom-0 z-10 shrink-0 border-t border-amber-200 bg-white/95 px-6 py-4 text-sm text-stone-500 backdrop-blur dark:border-stone-700 dark:bg-stone-950/95 dark:text-amber-100/70">
                        © 2026, Made with ❤️ by UNO Trips Admin
                    </footer>
                </div>
            </div>
            {showWarning ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
                        <h3 className="text-lg font-semibold text-stone-900 dark:text-amber-50">
                            Session Expiring
                        </h3>
                        <p className="mt-2 text-sm text-stone-600 dark:text-amber-100/80">
                            You will be logged out in 2 minutes due to
                            inactivity.
                        </p>
                        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                            Auto logout in {countdownSeconds}s
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={stayLoggedIn}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                            >
                                Stay Logged In
                            </button>
                            <button
                                type="button"
                                onClick={logoutNow}
                                className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-950/50 dark:text-rose-200"
                            >
                                Logout Now
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
