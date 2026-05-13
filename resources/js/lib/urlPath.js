/**
 * Root-relative URL prefix from the server (Inertia `base_path`).
 * Empty when the app is served from the domain root.
 */
export function withPathPrefix(path, basePath) {
    const base = String(basePath || "").replace(/\/$/, "");
    const p = String(path || "");
    const normalized = p.startsWith("/") ? p : `/${p}`;

    return base ? `${base}${normalized}` : normalized;
}

/**
 * Strip `basePath` from Inertia's current `page.url` so it can be compared to
 * menu hrefs that use canonical `/admin/...` paths.
 */
export function stripPathPrefixFromPageUrl(pageUrl, basePath) {
    const base = String(basePath || "").replace(/\/$/, "");
    if (!base) {
        return pageUrl || "";
    }
    const u = pageUrl || "";
    const qIdx = u.indexOf("?");
    const pathPart = qIdx >= 0 ? u.slice(0, qIdx) : u;
    const queryPart = qIdx >= 0 ? u.slice(qIdx) : "";
    if (!pathPart.startsWith(base)) {
        return u;
    }
    let rest = pathPart.slice(base.length);
    if (rest === "") {
        rest = "/";
    } else if (!rest.startsWith("/")) {
        rest = `/${rest}`;
    }

    return rest + queryPart;
}
