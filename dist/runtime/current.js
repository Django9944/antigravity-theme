// Antigravity Theme — Compiled Runtime Engine
// Copyright (c) 2026 Django9944, licensed under the MIT License.
// 自动注入顶栏主题胶囊切换器 + 下拉菜单选择（深浅自适应交由 Antigravity 宿主原生控制）
(() => {
    'use strict';
    if (window.__antigravityThemeEngineLoaded) return;
    window.__antigravityThemeEngineLoaded = true;

    const THEME_PACK_VERSION = "v0.2.2";
    const THEME_PACK_REPO = "Django9944/antigravity-theme";
    const UPDATE_CACHE_KEY = 'ag_custom_theme_update_cache_v1';
    const UPDATE_DISABLE_KEY = 'ag_custom_theme_disable_update_check';
    const UPDATE_CHECK_TTL_MS = 24 * 60 * 60 * 1000;
    const UPDATE_FAIL_TTL_MS = 60 * 60 * 1000;
    let latestUpdateInfo = null;

    function parseThemeSemver(tag) {
        const clean = String(tag || '').trim().replace(/^[vV]/, '').split('-')[0];
        const parts = clean.split('.').map((n) => parseInt(n, 10));
        if (!parts.length || parts.some((n) => Number.isNaN(n))) return null;
        while (parts.length < 3) parts.push(0);
        return parts.slice(0, 3);
    }

    function isRemoteNewer(remoteTag, localTag) {
        const r = parseThemeSemver(remoteTag);
        const l = parseThemeSemver(localTag);
        if (!r || !l) return false;
        for (let i = 0; i < 3; i++) {
            if (r[i] > l[i]) return true;
            if (r[i] < l[i]) return false;
        }
        return false;
    }

    function renderUpdateBadgeUI() {
        const dot = document.getElementById('antigravity-theme-update-dot');
        const banner = document.getElementById('antigravity-theme-update-banner');
        const btn = document.getElementById('antigravity-theme-btn');
        const hasUpdate = Boolean(latestUpdateInfo && latestUpdateInfo.hasUpdate && latestUpdateInfo.tag);
        if (dot) {
            dot.style.display = hasUpdate ? 'block' : 'none';
        }
        if (banner) {
            if (hasUpdate) {
                banner.style.display = 'flex';
                banner.textContent = `发现新版本 ${latestUpdateInfo.tag} · 点击查看`;
                banner.title = `当前 ${THEME_PACK_VERSION} -> 最新 ${latestUpdateInfo.tag}（可运行检查更新脚本一键升级）`;
                banner.dataset.releaseUrl = latestUpdateInfo.url || `https://github.com/${THEME_PACK_REPO}/releases/latest`;
            } else {
                banner.style.display = 'none';
            }
        }
        if (btn && hasUpdate && !btn.title.includes(latestUpdateInfo.tag)) {
            btn.title = `${btn.title} · 有新版本 ${latestUpdateInfo.tag}`;
        }
    }

    function persistFailedUpdateCheck() {
        const info = {
            checkedAt: Date.now(),
            localVersion: THEME_PACK_VERSION,
            failed: true,
            hasUpdate: false
        };
        latestUpdateInfo = info;
        try { localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify(info)); } catch (e) {}
    }

    function checkThemeUpdateOnce() {
        if (window.__antigravityThemeUpdateChecked) return;
        window.__antigravityThemeUpdateChecked = true;
        try {
            if (localStorage.getItem(UPDATE_DISABLE_KEY) === '1') return;
            const raw = localStorage.getItem(UPDATE_CACHE_KEY);
            if (raw) {
                const cached = JSON.parse(raw);
                const ttl = (cached && cached.failed) ? UPDATE_FAIL_TTL_MS : UPDATE_CHECK_TTL_MS;
                if (cached && cached.checkedAt && (Date.now() - cached.checkedAt) < ttl && cached.localVersion === THEME_PACK_VERSION) {
                    latestUpdateInfo = cached;
                    renderUpdateBadgeUI();
                    return;
                }
            }
        } catch (e) {}

        if (typeof fetch !== 'function') return;
        fetch(`https://api.github.com/repos/${THEME_PACK_REPO}/releases/latest`, {
            headers: { Accept: 'application/vnd.github+json' },
            cache: 'no-store'
        })
            .then((res) => (res && res.ok ? res.json() : null))
            .then((data) => {
                if (!data || !data.tag_name) {
                    persistFailedUpdateCheck();
                    return;
                }
                const tag = String(data.tag_name);
                const url = (data.html_url && /^https:\/\/github\.com\//.test(String(data.html_url)))
                    ? String(data.html_url)
                    : `https://github.com/${THEME_PACK_REPO}/releases/latest`;
                const info = {
                    checkedAt: Date.now(),
                    localVersion: THEME_PACK_VERSION,
                    tag,
                    url,
                    hasUpdate: isRemoteNewer(tag, THEME_PACK_VERSION)
                };
                latestUpdateInfo = info;
                try { localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify(info)); } catch (e) {}
                renderUpdateBadgeUI();
            })
            .catch(() => {
                persistFailedUpdateCheck();
            });
    }

    const BASE_CSS = "/* Antigravity Theme — Host Surfaces & Component Rules (Light + Shared Base)\n   Semantic OKLCH-compiled host surface stylesheet by @django9944/antigravity-theme (Copyright (c) 2026 Django9944). */\n\n/* ---------- 1. Root Stage, Aurora Mesh & Shell Transparency ---------- */\nhtml {\n  height: 100% !important;\n  min-height: 0 !important;\n  max-height: 100% !important;\n  overflow: hidden !important;\n  background-color: var(--ag-base-bg) !important;\n  background-image: var(--ag-mesh) !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  background-size: 100% 100% !important;\n  scrollbar-width: none !important;\n}\n\nhtml::-webkit-scrollbar,\nbody::-webkit-scrollbar {\n  display: none !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\nbody {\n  height: 100% !important;\n  min-height: 0 !important;\n  overflow: hidden !important;\n  background: transparent !important;\n  color: var(--ag-fg) !important;\n}\n\n#root,\n#root > div,\nbody > div:not([class*=\"fixed\"]):not([role=\"dialog\"]):not([role=\"alertdialog\"]):not([aria-modal=\"true\"]):not(dialog):not([data-base-ui-portal]):not([data-floating-ui-portal]):not([class*=\"animate-backdropFadeIn\"]):not([class*=\"animate-modalFadeIn\"]):not([data-testid=\"media-modal\"]):not(.settings-modal-backdrop),\nmain,\n[class*=\"bg-background\"]:not([role=\"dialog\"]):not([role=\"alertdialog\"]):not([aria-modal=\"true\"]):not(dialog):not([data-dialog-popup]):not([data-alert-dialog-popup]):not([data-radix-dialog-content]):not([data-radix-alert-dialog-content]):not([class*=\"animate-modalFadeIn\"]):not([class*=\"fixed\"][class*=\"inset-0\"] *),\n[class*=\"bg-content\"]:not([role=\"dialog\"]):not([role=\"alertdialog\"]):not([aria-modal=\"true\"]):not(dialog):not([data-dialog-popup]):not([data-alert-dialog-popup]):not([data-radix-dialog-content]):not([data-radix-alert-dialog-content]):not([class*=\"animate-modalFadeIn\"]):not([class*=\"fixed\"][class*=\"inset-0\"] *),\ndiv[class*=\"h-screen\"],\ndiv[class*=\"w-screen\"],\ndiv[class*=\"z-0\"][class*=\"flex-1\"],\ndiv[class*=\"min-h-0\"][class*=\"h-full\"],\n.agy-shell,\n.agy-sheet,\n.agy-sheet[data-sheet-inset],\n.agy-inset-shell {\n  background-color: transparent !important;\n  background-image: none !important;\n}\n\n/* ---------- 2. Left Frosted Sidebar & Sticky Header ---------- */\n.bg-sidebar {\n  background-color: var(--ag-base-bg) !important;\n  background-image: var(--sidebar-unified-bg) !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\n.bg-sidebar div[class*=\"overflow-y-auto\"],\n.bg-sidebar div[class*=\"overscroll-none\"],\ndiv[class*=\"bg-sidebar\"] div[class*=\"overflow-y-auto\"] {\n  overflow-x: hidden !important;\n}\n\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] {\n  border-right: 1px solid rgba(255, 255, 255, 0.32) !important;\n}\n\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] .bg-sidebar:not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]),\n.bg-sidebar div[data-sidebar-section-drop-id]:not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]),\n.bg-sidebar div:has(> [data-testid=\"section-header\"]):not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]) {\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n.bg-sidebar .bg-card,\n.bg-sidebar .bg-sidebar-secondary,\n.bg-sidebar .bg-secondary,\n.bg-sidebar .bg-muted,\n.bg-sidebar [class*=\"bg-card\"],\n.bg-sidebar [class*=\"bg-secondary\"]:not([class*=\"bg-sidebar-secondary\"]),\n.bg-sidebar [class*=\"bg-muted\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n  border-color: transparent !important;\n}\n\n.bg-sidebar button,\n.bg-sidebar a,\n.bg-sidebar [role=\"button\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n  border-color: transparent !important;\n}\n\n[class*=\"group/section-header\"],\n[class*=\"group/section-header\"] button,\n[class*=\"group/section-header\"] span {\n  background: transparent !important;\n  box-shadow: none !important;\n  border: none !important;\n}\n\n.bg-sidebar div[style*=\"position: sticky\"],\n.bg-sidebar div[style*=\"position:sticky\"],\n.bg-sidebar div[data-index=\"0\"] {\n  width: 100% !important;\n  margin: 0 !important;\n  box-sizing: border-box !important;\n  background-color: var(--ag-base-bg) !important;\n  background-image: var(--sidebar-unified-bg) !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n  z-index: 30 !important;\n}\n\n.bg-sidebar div[style*=\"position: sticky\"]::before,\n.bg-sidebar div[style*=\"position:sticky\"]::before,\n.bg-sidebar div[data-index=\"0\"]::before,\n.bg-sidebar div[data-sidebar-section-drop-id=\"main-section-header\"]::before,\n.bg-sidebar div:has(> [data-testid=\"section-header\"][data-title=\"Projects\"])::before {\n  display: none !important;\n  content: none !important;\n}\n\n.bg-sidebar [class*=\"bg-border\"],\n.bg-sidebar hr,\ndiv[class*=\"bg-border\"] {\n  background-color: rgba(255, 255, 255, 0.22) !important;\n}\n\n.bg-sidebar a[href=\"/\"] {\n  background: rgba(255, 255, 255, 0.42) !important;\n  border: 1px solid rgba(255, 255, 255, 0.72) !important;\n  border-radius: 8px !important;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06) !important;\n  color: var(--ag-fg) !important;\n  font-weight: 600 !important;\n}\n\n.bg-sidebar button:not([data-testid=\"title-menu-bar-option\"]):hover,\n.bg-sidebar a:not([href=\"/\"]):hover,\n.bg-sidebar [role=\"button\"]:not([data-testid=\"title-menu-bar-option\"]):hover {\n  background-color: rgba(255, 255, 255, 0.30) !important;\n  border-radius: 8px !important;\n}\n\n.bg-sidebar,\n.bg-sidebar * {\n  color: var(--ag-fg) !important;\n}\n\n.bg-sidebar svg {\n  color: var(--ag-fg-secondary) !important;\n}\n\n.bg-sidebar [class*=\"text-muted\"],\n.bg-sidebar [class*=\"text-sidebar-muted\"] {\n  color: var(--ag-fg-muted) !important;\n}\n\n@layer theme {\n  [data-testid^=\"conversation-row-\"]:hover,\n  [data-testid^=\"conversation-row-\"]:focus-within,\n  .agy-sidebar-row:hover,\n  .agy-sidebar-row:focus-within {\n    --row-bg: rgba(255, 255, 255, 0.55) !important;\n  }\n\n  [data-testid^=\"conversation-row-\"][data-selected=\"true\"],\n  .agy-sidebar-row[data-selected=\"true\"] {\n    --row-bg: rgba(255, 255, 255, 0.66) !important;\n  }\n}\n\n[data-testid^=\"conversation-row-\"]:hover,\n[data-testid^=\"conversation-row-\"]:focus-within,\n.agy-sidebar-row:hover,\n.agy-sidebar-row:focus-within {\n  background-color: rgba(255, 255, 255, 0.55) !important;\n  border-radius: 8px !important;\n}\n\n[data-testid^=\"conversation-row-\"][data-selected=\"true\"],\n.agy-sidebar-row[data-selected=\"true\"] {\n  background-color: rgba(255, 255, 255, 0.66) !important;\n  border-radius: 8px !important;\n  box-shadow: none !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"])::before {\n  background: none !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\n\n[data-testid^=\"conversation-row-\"]:hover div[class*=\"flex-col\"][class*=\"min-w-0\"]:not(:has(input)),\n[data-testid^=\"conversation-row-\"]:focus-within div[class*=\"flex-col\"][class*=\"min-w-0\"]:not(:has(input)) {\n  -webkit-mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 52px), transparent calc(100% - 34px)) !important;\n  mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 52px), transparent calc(100% - 34px)) !important;\n}\n\n[data-testid^=\"conversation-row-\"]:hover span {\n  color: var(--ag-fg) !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button {\n  background-color: transparent !important;\n  border-radius: 9999px !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button:hover {\n  background-color: rgba(10, 10, 12, 0.06) !important;\n  box-shadow: none !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) svg {\n  color: var(--secondary-foreground) !important;\n  opacity: 0.85 !important;\n  transition: opacity 0.15s ease, color 0.15s ease !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button:hover svg {\n  color: var(--foreground) !important;\n  opacity: 1 !important;\n}\n\n/* ---------- 3. Title Menu Bar & Pane Titlebar Toolbar ---------- */\n[data-testid=\"title-menu-bar\"] {\n  position: relative !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.30) !important;\n  box-shadow: none !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] {\n  padding: 0 !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button {\n  background-color: transparent !important;\n  border: none !important;\n  border-radius: 6px !important;\n  box-shadow: none !important;\n  color: var(--ag-fg-secondary) !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button:hover,\ndiv[class*=\"absolute\"][class*=\"right-0\"][class*=\"top-0\"] button:hover {\n  background-color: rgba(255, 255, 255, 0.55) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"] {\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--ag-fg-secondary) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"]:hover {\n  background: rgba(255, 255, 255, 0.55) !important;\n}\n\n[data-testid=\"pane-titlebar-toolbar\"] button:is([data-testid^=\"open-editor-\"], [data-testid=\"install-editor\"], [data-testid=\"editor-loading\"]) {\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  height: 24px !important;\n  width: auto !important;\n  min-width: unset !important;\n  max-width: none !important;\n  padding: 0 8px !important;\n  white-space: nowrap !important;\n  font-size: 12px !important;\n  font-weight: 500 !important;\n  font-family: inherit !important;\n  color: var(--foreground) !important;\n  background: rgba(255, 255, 255, 0.72) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border: 1px solid rgba(255, 255, 255, 0.92) !important;\n  border-radius: 6px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;\n  flex: 0 0 auto !important;\n  gap: 5px !important;\n  line-height: 1 !important;\n  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease !important;\n}\n\n[data-testid=\"pane-titlebar-toolbar\"] button:is([data-testid^=\"open-editor-\"], [data-testid=\"install-editor\"], [data-testid=\"editor-loading\"]) span {\n  white-space: nowrap !important;\n  line-height: 1 !important;\n}\n\n[data-testid=\"pane-titlebar-toolbar\"] button:is([data-testid^=\"open-editor-\"], [data-testid=\"install-editor\"], [data-testid=\"editor-loading\"]):hover {\n  background: rgba(255, 255, 255, 0.92) !important;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;\n}\n\n/* ---------- 4. Composer Input, Mention Menus & Sticky Conversation Title ---------- */\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea),\n.surface-composer:has([contenteditable=\"true\"]),\n.surface-composer:has(textarea) {\n  background: rgba(255, 255, 255, 0.78) !important;\n  backdrop-filter: blur(16px) saturate(112%) !important;\n  -webkit-backdrop-filter: blur(16px) saturate(112%) !important;\n  border: 1px solid rgba(255, 255, 255, 0.85) !important;\n  border-radius: 16px !important;\n  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;\n}\n\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]) > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea) > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]),\n.surface-composer > .surface-composer-card:not([data-mention-menu]):not([role=\"listbox\"]) {\n  background: transparent !important;\n  box-shadow: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\ndiv[data-mention-menu],\ndiv[class*=\"bg-card-border\"] div[data-mention-menu],\ndiv[role=\"listbox\"][data-mention-menu],\ndiv[aria-label=\"Mentions\"],\ndiv[aria-label=\"Typeahead menu\"],\ndiv:has(> [id*=\"typeahead-item\"]) {\n  background-color: var(--ag-surface-popover) !important;\n  background: var(--ag-surface-popover) !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 16px !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n  z-index: 99999 !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] {\n  color: var(--ag-fg) !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"][aria-selected=\"true\"],\ndiv[data-mention-menu] [role=\"option\"]:hover,\ndiv[data-mention-menu] [role=\"option\"] > div:hover,\ndiv[data-mention-menu] [role=\"option\"] > div[class*=\"bg-secondary\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.15) !important;\n  border-radius: 8px !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] svg {\n  color: var(--ag-fg-secondary) !important;\n}\n\ndiv[data-mention-menu] [class*=\"opacity-50\"],\ndiv[data-mention-menu] [class*=\"text-muted\"] {\n  color: var(--ag-fg-muted) !important;\n}\n\n[contenteditable=\"true\"] ~ p,\ndiv[class*=\"bg-card-border\"] p[class*=\"absolute\"] {\n  color: var(--ag-fg-placeholder) !important;\n  opacity: 1 !important;\n}\n\ntextarea,\n[contenteditable=\"true\"] {\n  color: var(--ag-fg) !important;\n}\n\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> div[class*=\"md-sticky-message-bleed\"]) {\n  background-color: transparent !important;\n  background-image: var(--ag-mesh) !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-radius: 0 !important;\n}\n\ndiv[class*=\"md-sticky-message-bleed\"]::after {\n  background: none !important;\n  background-color: transparent !important;\n}\n\n/* ---------- 5. User Input Bubble ---------- */\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-radius: 14px !important;\n  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(var(--ag-accent-rgb), 0.16) !important;\n}\n\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] > div[class*=\"bg-card\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"user-input-step\"],\n[data-testid=\"user-input-step\"] * {\n  color: var(--ag-fg) !important;\n}\n\n[data-testid=\"user-input-step\"] {\n  filter: none !important;\n}\n\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  background-color: var(--ag-surface-user-bubble) !important;\n  background-image: none !important;\n  border: none !important;\n  box-shadow: 0 0 20px 10px var(--ag-surface-user-bubble) !important;\n  padding: 4px !important;\n  border-radius: 9999px !important;\n  z-index: 2 !important;\n}\n\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] button {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n/* ---------- 6. Floating Portals, Tooltips, Context Menus & Selection Popups ---------- */\n[data-base-ui-portal] [data-base-ui-focusable]:not(.settings-modal-container):not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [class*=\"bg-card\"]:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] div[role=\"presentation\"]:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]) > div:not(.settings-modal-container):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] > div:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]) > div:not(.settings-modal-container):not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"animate-slideIn\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"w-72\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"tooltip\"]:not([data-closed]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n.compact-tooltip:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-tooltip-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-side]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-floating-ui-portal] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-sonner-toast]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-toast-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"bubble-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv.selection-quote-popup > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-popup\"] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"selection-quote-button\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"quote\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"explain\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"conversation-preview\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *) {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--ag-shadow-tooltip) !important;\n  z-index: 99999 !important;\n}\n\ndiv.selection-popup,\ndiv.selection-quote-popup,\ndiv[class*=\"selection-popup\"],\ndiv[class*=\"selection-quote-popup\"] {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  overflow: visible !important;\n  z-index: 99999 !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"],\ndiv[class*=\"selection-popup\"] button {\n  background-color: transparent !important;\n  color: var(--ag-fg) !important;\n  border-radius: 6px !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"] span,\ndiv[class*=\"selection-popup\"] button span {\n  color: var(--ag-fg) !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"] span.opacity-50,\nbutton[data-testid=\"selection-quote-button\"] span:last-child:not(:first-child),\ndiv[class*=\"selection-popup\"] button span.opacity-50 {\n  color: var(--ag-fg-muted) !important;\n  opacity: 0.85 !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"]:hover,\ndiv[class*=\"selection-popup\"] button:hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.16) !important;\n}\n\n[role=\"tooltip\"] *,\n.compact-tooltip * {\n  color: var(--ag-fg) !important;\n  background-color: transparent !important;\n}\n\ndiv[class*=\"bubble-menu\"] [class*=\"bg-border\"],\ndiv[class*=\"floating-\"] [class*=\"bg-border\"],\ndiv[class*=\"selection-popup\"] [class*=\"bg-border\"],\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) [class*=\"bg-border\"],\n[data-base-ui-portal] [class*=\"bg-border\"],\n[data-radix-hover-card-content] [class*=\"bg-border\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.22) !important;\n}\n\n[data-base-ui-portal] [data-base-ui-focusable] svg,\n[data-base-ui-portal] [class*=\"bg-card\"] svg,\n[data-radix-hover-card-content] svg,\n[data-radix-popover-content] svg,\ndiv[class*=\"bubble-menu\"] svg,\ndiv[class*=\"floating-\"] svg,\ndiv[class*=\"selection-popup\"] svg,\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) svg {\n  color: var(--ag-fg-secondary) !important;\n}\n\ndiv[class*=\"bubble-menu\"] button:hover,\ndiv[class*=\"floating-\"] button:hover,\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) button:hover,\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"quote\"]) button:hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.15) !important;\n  border-radius: 6px !important;\n}\n\n[data-base-ui-portal] [data-base-ui-focusable] [class*=\"text-muted\"],\n[data-base-ui-portal] [class*=\"bg-card\"] [class*=\"text-muted\"],\n[data-base-ui-portal] div[role=\"presentation\"] [class*=\"text-muted\"],\n[data-radix-hover-card-content] [class*=\"text-muted\"],\n[data-radix-popper-content-wrapper] [data-side] [class*=\"text-muted\"],\n[data-radix-hover-card-content] span:has(+ span) {\n  color: var(--ag-fg-muted) !important;\n}\n\n[data-testid=\"context-usage-panel\"] {\n  --context-track: rgba(0, 0, 0, 0.08);\n  --muted: rgba(0, 0, 0, 0.08) !important;\n  --color-muted: rgba(0, 0, 0, 0.08) !important;\n}\n\n[data-testid=\"context-usage-panel\"] [class~=\"bg-muted\"],\n[data-testid=\"context-usage-panel\"] .bg-muted {\n  background-color: var(--context-track) !important;\n  border-radius: 999px !important;\n}\n\n[data-testid=\"context-usage-panel\"] [class~=\"bg-muted\"] > div,\n[data-testid=\"context-usage-panel\"] .bg-muted > div {\n  border-radius: 999px !important;\n}\n\n[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"listbox\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-popover-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-menu-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-select-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-combobox-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[popover]:popover-open:not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[class*=\"bg-popover\"]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-list]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-dropdown-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-context-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-select-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *) {\n  background-color: var(--ag-surface-popover) !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n/* Modal & Confirmation Dialogs (e.g. Delete Conversation) */\n[role=\"dialog\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid^=\"overview-panel-host-\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"alertdialog\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[aria-modal=\"true\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid^=\"overview-panel-host-\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndialog[open]:not([class*=\"inset-0\"]):not(.settings-modal-container):not([data-testid=\"media-modal\"]),\n[data-dialog-popup]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-alert-dialog-popup]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-dialog-content]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-alert-dialog-content]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"animate-modalFadeIn\"]:not([class*=\"inset-0\"]):not(:has([data-testid=\"mermaid-lightbox-viewport\"])):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n:is([class*=\"fixed\"][class*=\"inset-0\"]):is([class*=\"z-50\"], [class*=\"z-40\"], [class*=\"z-[\"], [class*=\"items-center\"], [class*=\"bg-black\"], [class*=\"animate-backdropFadeIn\"], [class*=\"animate-modalFadeIn\"], [role=\"dialog\"], [role=\"alertdialog\"], [aria-modal=\"true\"]):not(#root):not(#root > div):not(.agy-shell):not(.agy-sheet):not(.agy-inset-shell):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *):not(.settings-modal-backdrop):not(:has(.settings-modal-container)):not(:has([aria-label=\"Settings\"])):not(:has([data-testid=\"mermaid-lightbox-viewport\"])) > div:is([class*=\"rounded-\"], [class*=\"bg-card\"], [class*=\"bg-background\"], [class*=\"bg-popover\"], [class*=\"shadow-\"], [class*=\"border\"]):not([class*=\"inset-0\"]):not([class*=\"pointer-events-none\"]):not([data-testid=\"media-modal\"]):not(.settings-modal-container) {\n  background-color: var(--ag-surface-modal) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n[role=\"menuitem\"],\n[role=\"option\"] {\n  color: var(--ag-fg) !important;\n}\n\n[role=\"menuitem\"]:hover,\n[role=\"option\"]:hover,\n[role=\"option\"][aria-selected=\"true\"],\n[cmdk-item][data-selected=\"true\"],\n[cmdk-item]:hover,\n[data-highlighted] {\n  background-color: rgba(var(--ag-accent-rgb), 0.15) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid=\"title-menu-bar\"] [class*=\"border-menu-border\"],\n[data-testid=\"title-menu-bar\"] div[class*=\"bg-sidebar\"],\n[data-testid=\"title-menu-bar\"] [role=\"menu\"] {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 10px !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n[data-testid=\"title-menu-bar-option\"] {\n  color: var(--ag-fg) !important;\n}\n\n[data-testid=\"title-menu-bar\"] button[data-testid=\"title-menu-bar-option\"]:hover,\n[data-testid=\"title-menu-bar\"] button[data-testid=\"title-menu-bar-option\"]:focus-visible,\ndiv[class*=\"bg-sidebar\"] button[data-testid=\"title-menu-bar-option\"]:hover,\ndiv[class*=\"bg-sidebar\"] button[data-testid=\"title-menu-bar-option\"]:focus-visible,\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-option\"]:hover,\n[data-testid=\"title-menu-bar-option\"]:hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.16) !important;\n  border-radius: 6px !important;\n}\n\n/* ---------- 7. Overview Panel, New Tab & Search ---------- */\n[data-testid^=\"overview-panel-host-\"] {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n  contain: layout style paint;\n  will-change: transform, opacity;\n}\n\n[data-testid^=\"overview-panel-host-\"]:is([data-starting-style], [data-ending-style]) {\n  background-color: var(--ag-surface-popover-opaque) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  pointer-events: none !important;\n}\n\n[data-testid^=\"overview-panel-host-\"],\n[data-testid=\"overview-panel\"],\n[data-testid=\"aux-pane-new-tab-view\"],\n[data-testid=\"side-panel-new-tab-view\"],\n[data-testid^=\"aux-pane-new-tab-\"],\n[data-testid^=\"side-panel-new-tab-\"] {\n  --overview-item-hover: rgba(var(--ag-accent-rgb), 0.15);\n  --muted: var(--overview-item-hover) !important;\n  --secondary: var(--overview-item-hover) !important;\n  --color-muted: var(--overview-item-hover) !important;\n  --color-secondary: var(--overview-item-hover) !important;\n}\n\n[data-testid^=\"overview-panel-row-\"]:hover,\n[data-testid^=\"overview-panel-row-\"]:focus-visible,\n[data-testid^=\"overview-panel-row-\"][data-state=\"active\"],\n[data-testid^=\"overview-panel-row-\"][data-state=\"open\"],\n[data-testid^=\"overview-panel-row-\"][aria-selected=\"true\"],\n[data-testid^=\"overview-panel-row-\"][data-selected=\"true\"],\n[data-testid=\"overview-panel\"] button:not([data-testid=\"overview-panel-customize-trigger\"]):hover,\n[data-testid^=\"overview-panel-host-\"] button:not([data-testid=\"overview-panel-customize-trigger\"]):hover,\n[data-testid=\"overview-panel\"] [role=\"button\"]:hover,\n[data-testid^=\"overview-panel-host-\"] [role=\"button\"]:hover,\n[data-testid=\"overview-panel\"] [class*=\"cursor-pointer\"]:hover,\n[data-testid^=\"overview-panel-host-\"] [class*=\"cursor-pointer\"]:hover,\n[data-testid=\"overview-panel\"] [role=\"menuitem\"]:hover,\n[data-testid^=\"overview-panel-host-\"] [role=\"menuitem\"]:hover,\n[data-testid=\"overview-panel\"] [role=\"option\"]:hover,\n[data-testid^=\"overview-panel-host-\"] [role=\"option\"]:hover,\n[data-testid=\"overview-panel\"] [role=\"option\"][aria-selected=\"true\"],\n[data-testid^=\"overview-panel-host-\"] [role=\"option\"][aria-selected=\"true\"] {\n  background-color: var(--overview-item-hover) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid^=\"new-tab-card-\"]:hover,\n[data-testid^=\"new-tab-card-\"]:focus-visible,\n[data-testid^=\"new-tab-card-\"][data-state=\"active\"],\n[data-testid^=\"new-tab-card-\"][data-state=\"open\"],\n[data-testid^=\"new-tab-card-\"][aria-selected=\"true\"],\n[data-testid^=\"new-tab-card-\"][data-selected=\"true\"],\n[data-testid=\"aux-pane-new-tab-view\"] button:not([class*=\"rounded-full\"]):hover,\n[data-testid=\"side-panel-new-tab-view\"] button:not([class*=\"rounded-full\"]):hover,\n[data-testid=\"aux-pane-new-tab-view\"] [class*=\"cursor-pointer\"]:hover,\n[data-testid=\"side-panel-new-tab-view\"] [class*=\"cursor-pointer\"]:hover {\n  background-color: var(--overview-item-hover) !important;\n  border-radius: 8px !important;\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"new-tab-search-input\"] {\n  background-color: rgba(255, 255, 255, 0.55) !important;\n  border: 1px solid rgba(var(--ag-accent-rgb), 0.24) !important;\n  border-radius: 8px !important;\n  color: var(--foreground) !important;\n  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05) !important;\n  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;\n}\n\n[data-testid=\"new-tab-search-input\"]:hover {\n  border-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n}\n\n[data-testid=\"new-tab-search-input\"]:focus,\n[data-testid=\"new-tab-search-input\"]:focus-visible,\n[data-testid=\"new-tab-search-input\"]:focus-within {\n  background-color: rgba(255, 255, 255, 0.85) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.58) !important;\n  box-shadow: 0 0 0 3px rgba(var(--ag-accent-rgb), 0.16) !important;\n}\n\n[data-testid=\"new-tab-search-input\"]::placeholder {\n  color: var(--placeholder) !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"],\nbutton[aria-label*=\"Scroll to bottom\" i],\nbutton[aria-label*=\"bottom\" i]:has(svg) {\n  background-color: var(--ag-surface-popover) !important;\n  color: var(--ag-fg) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--ag-shadow-floating) !important;\n  backdrop-filter: blur(12px) !important;\n  z-index: 30 !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"]:hover,\nbutton[aria-label*=\"Scroll to bottom\" i]:hover {\n  background-color: #FFFFFF !important;\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16) !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"] svg,\nbutton[aria-label*=\"Scroll to bottom\" i] svg {\n  color: var(--ag-fg) !important;\n}\n\n[data-base-ui-portal] [data-closed],\n[data-base-ui-portal] [data-closed] *,\n[data-base-ui-portal] [data-ending-style],\n[data-base-ui-portal] [data-ending-style] *,\n[data-base-ui-portal] [data-state=\"closed\"],\n[data-base-ui-portal] [data-state=\"closed\"] *,\n[data-radix-popper-content-wrapper]:has([data-state=\"closed\"]) {\n  opacity: 0 !important;\n  visibility: hidden !important;\n  pointer-events: none !important;\n  transition: opacity 0.08s ease-out !important;\n}\n\n/* ---------- 8. Built-in Browser Pane ---------- */\n[data-testid=\"builtin-browser-pane\"],\n[data-testid=\"browser-pane\"] {\n  background-color: var(--terminal-bg) !important;\n  background-image: none !important;\n  color: var(--foreground) !important;\n  border-top: 1px solid var(--border) !important;\n}\n\n[data-testid=\"browser-omnibox-pill\"],\n[data-testid=\"browser-url-input\"]:not([data-testid=\"browser-omnibox-pill\"] *) {\n  background-color: rgba(255, 255, 255, 0.72) !important;\n  border: 1px solid rgba(var(--ag-accent-rgb), 0.24) !important;\n  border-radius: 9999px !important;\n  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05) !important;\n  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease !important;\n}\n\n[data-testid=\"browser-omnibox-pill\"]:hover,\n[data-testid=\"browser-url-input\"]:not([data-testid=\"browser-omnibox-pill\"] *):hover {\n  border-color: rgba(var(--ag-accent-rgb), 0.38) !important;\n}\n\n[data-testid=\"browser-omnibox-pill\"]:focus-within,\n[data-testid=\"browser-url-input\"]:focus:not([data-testid=\"browser-omnibox-pill\"] *),\n[data-testid=\"browser-url-input\"]:focus-visible:not([data-testid=\"browser-omnibox-pill\"] *),\n[data-testid=\"browser-url-input\"]:focus-within:not([data-testid=\"browser-omnibox-pill\"] *) {\n  background-color: #FFFFFF !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.62) !important;\n  box-shadow: 0 0 0 3px rgba(var(--ag-accent-rgb), 0.18) !important;\n}\n\n[data-testid=\"browser-omnibox-pill\"] [data-testid=\"browser-url-input\"] {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  border-radius: 0 !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"browser-url-input\"]:not(.text-transparent),\n[data-testid=\"browser-url-display\"],\n[data-testid=\"browser-url-display\"] > span:not(.text-error):not(.text-muted-foreground) {\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"browser-url-input\"].text-transparent {\n  color: transparent !important;\n  -webkit-text-fill-color: transparent !important;\n}\n\n[data-testid=\"browser-url-input\"]::placeholder {\n  color: var(--placeholder) !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] button:not([data-testid=\"url-security-indicator\"]),\n[data-testid=\"browser-pane\"] button:not([data-testid=\"url-security-indicator\"]) {\n  border-radius: 6px !important;\n  color: var(--foreground) !important;\n  transition: background-color 0.15s ease, color 0.15s ease !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-indicator\"],\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-pending\"] {\n  border-radius: 9999px !important;\n  background-color: rgba(var(--ag-accent-rgb), 0.12) !important;\n  color: var(--foreground) !important;\n  transition: background-color 0.15s ease, color 0.15s ease !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-indicator\"]:hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.22) !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] button:not([data-testid=\"url-security-indicator\"]):hover,\n[data-testid=\"browser-pane\"] button:not([data-testid=\"url-security-indicator\"]):hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.12) !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] svg,\n[data-testid=\"browser-pane\"] svg {\n  color: var(--foreground) !important;\n  opacity: 0.85 !important;\n}\n\n/* ---------- 9. Settings Modal ---------- */\n.settings-modal-container,\n[role=\"dialog\"][aria-label=\"Settings\"] {\n  --settings-dialog-bg: var(--ag-settings-bg);\n  --settings-text: var(--ag-fg);\n  --settings-text-muted: var(--ag-fg-muted);\n  --settings-accent-rgb: var(--ag-accent-rgb);\n  --settings-accent: var(--ag-accent);\n  --settings-accent-deep: var(--ag-accent-deep);\n  --settings-card-bg: #FFFFFF;\n  --settings-card-border: rgba(0, 0, 0, 0.11);\n  --settings-card-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);\n  --settings-row-hover: rgba(var(--ag-accent-rgb), 0.07);\n  --settings-control-bg: rgba(0, 0, 0, 0.055);\n  --settings-control-bg-hover: rgba(var(--ag-accent-rgb), 0.10);\n  --settings-control-border: rgba(0, 0, 0, 0.13);\n  --settings-control-top: rgba(255, 255, 255, 0.55);\n  --settings-control-bottom: rgba(255, 255, 255, 0);\n  --settings-control-inset: inset 0 1px 0 rgba(255, 255, 255, 0.85);\n  --settings-control-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);\n  --settings-focus-ring: rgba(var(--ag-accent-rgb), 0.22);\n  --settings-nav-active-bg: rgba(var(--ag-accent-rgb), 0.14);\n  --settings-nav-hover-bg: rgba(0, 0, 0, 0.05);\n  --settings-nav-active-border: rgba(var(--ag-accent-rgb), 0.24);\n  --settings-track-bg: rgba(0, 0, 0, 0.05);\n  --settings-track-border: rgba(0, 0, 0, 0.10);\n  --settings-track-inset: inset 0 1px 2px rgba(0, 0, 0, 0.06);\n  --settings-pressed-bg: #FFFFFF;\n  --settings-pressed-fg: var(--ag-accent-deep);\n  --settings-pressed-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);\n  --settings-badge-bg: rgba(var(--ag-accent-rgb), 0.12);\n  --settings-badge-fg: var(--ag-accent-deep);\n  --settings-badge-border: rgba(var(--ag-accent-rgb), 0.22);\n  --settings-switch-off: rgba(0, 0, 0, 0.18);\n  --settings-switch-thumb: #FFFFFF;\n  --settings-switch-thumb-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);\n  --settings-code-bg: rgba(0, 0, 0, 0.045);\n  --settings-code-border: rgba(0, 0, 0, 0.12);\n  --settings-code-fg: var(--ag-fg);\n  --settings-picker-border: rgba(0, 0, 0, 0.16);\n  --settings-dialog-shadow: 0 24px 64px rgba(0, 0, 0, 0.20);\n  --secondary: var(--settings-control-bg) !important;\n  --secondary-foreground: var(--settings-text) !important;\n  --border: var(--settings-control-border) !important;\n  --sidebar-secondary: var(--settings-nav-active-bg) !important;\n  --sidebar-muted: var(--settings-nav-hover-bg) !important;\n  --color-secondary: var(--settings-control-bg) !important;\n  --color-secondary-foreground: var(--settings-text) !important;\n  --color-border: var(--settings-control-border) !important;\n  --color-sidebar-secondary: var(--settings-nav-active-bg) !important;\n  --color-sidebar-muted: var(--settings-nav-hover-bg) !important;\n  --sidebar-border: var(--settings-card-border) !important;\n  --muted: var(--settings-row-hover) !important;\n  --color-muted: var(--settings-row-hover) !important;\n}\n\n.settings-modal-container[role=\"dialog\"]:not([data-testid=\"media-modal\"]) {\n  background-color: var(--settings-dialog-bg) !important;\n  background-image: none !important;\n  border-color: var(--settings-card-border) !important;\n  color: var(--settings-text) !important;\n  box-shadow: var(--settings-dialog-shadow) !important;\n}\n\n.settings-modal-container div.rounded-xl.border.border-border,\n.settings-modal-container [data-slot=\"card\"] {\n  background-color: var(--settings-card-bg) !important;\n  border-color: var(--settings-card-border) !important;\n  box-shadow: var(--settings-card-shadow) !important;\n}\n\n.settings-modal-container .divide-border > * + *,\n.settings-modal-container [class*=\"divide-\"] > * + * {\n  border-color: var(--settings-card-border) !important;\n}\n\n.settings-modal-container hr {\n  border-color: var(--settings-card-border) !important;\n  background-color: var(--settings-card-border) !important;\n}\n\n.settings-modal-container button[role=\"combobox\"] {\n  background: linear-gradient(180deg, var(--settings-control-top) 0%, var(--settings-control-bottom) 100%) !important;\n  color: var(--settings-text) !important;\n  border-color: var(--settings-control-border) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--settings-control-inset), var(--settings-control-shadow) !important;\n  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease !important;\n}\n\n.settings-modal-container button[role=\"combobox\"]:hover {\n  background-color: var(--settings-control-bg-hover) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  color: var(--settings-text) !important;\n}\n\n.settings-modal-container button[role=\"combobox\"]:focus-visible,\n.settings-modal-container button[role=\"combobox\"][aria-expanded=\"true\"],\n.settings-modal-container button[role=\"combobox\"][data-popup-open] {\n  outline: none !important;\n  border-color: var(--settings-accent) !important;\n  box-shadow: 0 0 0 2px var(--settings-focus-ring) !important;\n}\n\n.settings-modal-container button[role=\"combobox\"] svg {\n  color: var(--settings-accent) !important;\n  opacity: 0.9 !important;\n}\n\n.settings-modal-container button.bg-secondary:not([role=\"combobox\"]):not([data-slot=\"toggle-group\"] button):not([data-testid^=\"settings-nav-item-\"]) {\n  background: linear-gradient(180deg, var(--settings-control-top), var(--settings-control-bottom)) !important;\n  color: var(--settings-text) !important;\n  border-color: var(--settings-control-border) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--settings-control-inset), var(--settings-control-shadow) !important;\n  font-weight: 600 !important;\n  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease !important;\n}\n\n.settings-modal-container button.bg-secondary:not([role=\"combobox\"]):not([data-slot=\"toggle-group\"] button):not([data-testid^=\"settings-nav-item-\"]):hover {\n  background-color: var(--settings-control-bg-hover) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  color: var(--settings-accent-deep) !important;\n}\n\n.settings-modal-container button.bg-secondary:not([role=\"combobox\"]):not([data-slot=\"toggle-group\"] button):not([data-testid^=\"settings-nav-item-\"]):focus-visible {\n  outline: none !important;\n  border-color: var(--settings-accent) !important;\n  box-shadow: 0 0 0 2px var(--settings-focus-ring) !important;\n}\n\n.settings-modal-container span.bg-secondary.rounded-full,\n.settings-modal-container [data-slot=\"badge\"] {\n  background-color: var(--settings-badge-bg) !important;\n  color: var(--settings-badge-fg) !important;\n  border-color: var(--settings-badge-border) !important;\n  font-weight: 700 !important;\n  box-shadow: none !important;\n}\n\n.settings-modal-container [class*=\"group/nav-item\"] > button[data-testid^=\"settings-nav-item-\"] {\n  background-color: transparent !important;\n  border-color: transparent !important;\n  border-radius: 8px !important;\n  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease !important;\n}\n\n.settings-modal-container [class*=\"group/nav-item\"] > button[data-testid^=\"settings-nav-item-\"]:hover {\n  background-color: var(--settings-nav-hover-bg) !important;\n  border-color: var(--settings-card-border) !important;\n}\n\n.settings-modal-container [class*=\"group/nav-item\"] > button[data-testid^=\"settings-nav-item-\"][class*=\"bg-sidebar-secondary\"] {\n  background-color: var(--settings-nav-active-bg) !important;\n  border-color: var(--settings-nav-active-border) !important;\n  box-shadow: inset 0 0 0 1px var(--settings-nav-active-border) !important;\n}\n\n.settings-modal-container [class*=\"group/nav-item\"] > button[data-testid^=\"settings-nav-item-\"] span {\n  color: var(--settings-text) !important;\n}\n\n.settings-modal-container [class*=\"group/nav-item\"] > button[data-testid^=\"settings-nav-item-\"][class*=\"bg-sidebar-secondary\"] span {\n  color: var(--settings-accent-deep) !important;\n  font-weight: 650 !important;\n}\n\n.settings-modal-container [data-testid=\"settings-nav-item-Account\"] {\n  border-color: transparent !important;\n  border-radius: 8px !important;\n}\n\n.settings-modal-container [data-testid=\"settings-nav-item-Account\"]:hover {\n  background-color: var(--settings-nav-hover-bg) !important;\n  border-color: var(--settings-card-border) !important;\n}\n\n.settings-modal-container [data-slot=\"toggle-group\"] {\n  background-color: var(--settings-track-bg) !important;\n  border-color: var(--settings-track-border) !important;\n  border-radius: 10px !important;\n  box-shadow: var(--settings-track-inset) !important;\n}\n\n.settings-modal-container [data-slot=\"toggle-group\"] button {\n  background-color: transparent !important;\n  color: var(--settings-text-muted) !important;\n  border-radius: 7px !important;\n  font-weight: 500 !important;\n  box-shadow: none !important;\n}\n\n.settings-modal-container [data-slot=\"toggle-group\"] button[aria-pressed=\"false\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  color: var(--settings-text-muted) !important;\n  border-color: transparent !important;\n  box-shadow: none !important;\n}\n\n.settings-modal-container [data-slot=\"toggle-group\"] button:hover {\n  background-color: var(--settings-nav-hover-bg) !important;\n  color: var(--settings-text) !important;\n}\n\n.settings-modal-container [data-slot=\"toggle-group\"] button[data-pressed],\n.settings-modal-container [data-slot=\"toggle-group\"] button[aria-pressed=\"true\"] {\n  background-color: var(--settings-pressed-bg) !important;\n  background-image: none !important;\n  color: var(--settings-pressed-fg) !important;\n  font-weight: 650 !important;\n  box-shadow: var(--settings-pressed-shadow) !important;\n}\n\n.settings-modal-container input:not([type=\"hidden\"]):not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]):not([aria-hidden=\"true\"]),\n.settings-modal-container textarea,\n.settings-modal-container select {\n  background-color: var(--settings-control-bg) !important;\n  border-color: var(--settings-control-border) !important;\n  color: var(--settings-text) !important;\n  border-radius: 7px !important;\n}\n\n.settings-modal-container input:not([type=\"hidden\"]):not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]):not([aria-hidden=\"true\"]):focus-visible,\n.settings-modal-container textarea:focus-visible,\n.settings-modal-container select:focus-visible {\n  outline: none !important;\n  border-color: var(--settings-accent) !important;\n  box-shadow: 0 0 0 2px var(--settings-focus-ring) !important;\n}\n\n.settings-modal-container input[type=\"color\"] {\n  background-color: var(--settings-control-bg) !important;\n  border-color: var(--settings-picker-border) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--settings-control-inset) !important;\n}\n\n.settings-modal-container input[type=\"color\"]:hover {\n  border-color: rgba(var(--ag-accent-rgb), 0.48) !important;\n}\n\n.settings-modal-container button[aria-label*=\"color\" i],\n.settings-modal-container [data-testid*=\"color-swatch\"] {\n  border-color: var(--settings-picker-border) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--settings-control-inset) !important;\n}\n\n.settings-modal-container button[aria-label*=\"color\" i][aria-pressed=\"true\"],\n.settings-modal-container button[aria-label*=\"color\" i][aria-checked=\"true\"],\n.settings-modal-container [data-testid*=\"color-swatch\"][aria-pressed=\"true\"],\n.settings-modal-container [data-testid*=\"color-swatch\"][aria-checked=\"true\"] {\n  border-color: var(--settings-accent) !important;\n  box-shadow: 0 0 0 2px var(--settings-focus-ring) !important;\n}\n\n.settings-modal-container pre,\n.settings-modal-container code.bg-secondary,\n.settings-modal-container [data-testid*=\"code-preview\"],\n.settings-modal-container [class*=\"code-preview\"] {\n  background-color: var(--settings-code-bg) !important;\n  border-color: var(--settings-code-border) !important;\n  border-radius: 8px !important;\n  color: var(--settings-code-fg) !important;\n  box-shadow: none !important;\n}\n\n.settings-modal-container [role=\"switch\"] {\n  background-color: var(--settings-switch-off) !important;\n  border-color: var(--settings-control-border) !important;\n  box-shadow: none !important;\n}\n\n.settings-modal-container [role=\"switch\"][data-state=\"checked\"],\n.settings-modal-container [role=\"switch\"][aria-checked=\"true\"],\n.settings-modal-container [role=\"switch\"][data-checked] {\n  background-color: var(--settings-accent) !important;\n  border-color: var(--settings-accent) !important;\n}\n\n.settings-modal-container [role=\"switch\"] > span,\n.settings-modal-container [role=\"switch\"] > div {\n  background-color: var(--settings-switch-thumb) !important;\n  box-shadow: var(--settings-switch-thumb-shadow) !important;\n}\n\n.settings-modal-container input[type=\"checkbox\"],\n.settings-modal-container input[type=\"radio\"] {\n  accent-color: var(--settings-accent) !important;\n}\n\n.settings-modal-container [class*=\"hover:bg-muted\"]:hover,\n.settings-modal-container [class*=\"hover:bg-secondary\"]:hover,\n.settings-modal-container [class*=\"hover:bg-sidebar-muted\"]:hover {\n  background-color: var(--settings-row-hover) !important;\n}\n\n/* ---------- 10. Composer Triggers, Send & Record Buttons ---------- */\n[data-testid=\"model-selector-trigger\"],\n[data-testid=\"permissions-selector-trigger\"] {\n  background: transparent !important;\n  color: var(--ag-fg-secondary) !important;\n}\n\n[data-testid=\"send-button\"],\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]) {\n  border-radius: 9999px !important;\n  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease !important;\n}\n\n[data-testid=\"send-button\"]:disabled,\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):disabled {\n  background: rgba(255, 255, 255, 0.45) !important;\n  color: var(--ag-fg-muted) !important;\n  opacity: 0.55 !important;\n  border: 1px solid rgba(255, 255, 255, 0.60) !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled),\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):not(:disabled) {\n  background: var(--ag-accent-solid) !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.90) !important;\n  box-shadow: 0 4px 12px rgba(var(--ag-accent-rgb), 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled) svg,\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):not(:disabled) svg {\n  color: #FFFFFF !important;\n  fill: #FFFFFF !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled):hover,\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):not(:disabled):hover {\n  background: var(--ag-accent-deep) !important;\n  box-shadow: 0 6px 16px rgba(var(--ag-accent-rgb), 0.38) !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"] {\n  background-color: rgba(255, 255, 255, 0.42) !important;\n  background-image: none !important;\n  color: var(--muted-foreground) !important;\n  border: 1px solid rgba(255, 255, 255, 0.55) !important;\n  border-radius: 9999px !important;\n  box-shadow: none !important;\n  opacity: 1 !important;\n  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"] svg {\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"]:hover {\n  background-color: rgba(255, 255, 255, 0.72) !important;\n  color: var(--ag-accent) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.32) !important;\n  box-shadow: 0 2px 8px rgba(var(--ag-accent-rgb), 0.18) !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"]:disabled {\n  background-color: rgba(255, 255, 255, 0.32) !important;\n  color: var(--muted-foreground) !important;\n  opacity: 0.55 !important;\n  box-shadow: none !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-recording=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"recording\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"active\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-active=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][aria-pressed=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"].bg-red-500 {\n  background-color: var(--ag-danger) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border-color: rgba(255, 255, 255, 0.55) !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.35) !important;\n  opacity: 1 !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-recording=\"true\"] svg,\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"recording\"] svg,\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"active\"] svg,\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-active=\"true\"] svg,\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][aria-pressed=\"true\"] svg {\n  color: #FFFFFF !important;\n  fill: currentColor !important;\n}\n\n/* ---------- 11. Voice Call Controls & Voice Dock ---------- */\n[data-testid=\"voice-call-controls\"],\n[data-testid=\"voice-dock\"],\n[data-testid=\"voice-speed-panel\"],\n[data-popover-popup]:has([data-testid=\"voice-speed-panel\"]),\n[data-testid=\"voice-picker\"],\n[data-testid=\"voice-mic-warning\"],\n[data-testid=\"voice-mic-switched\"],\n[data-testid=\"voice-error-tip\"],\n[data-testid=\"voice-live-pill\"],\n[data-testid=\"voice-start-button\"],\n[data-testid=\"voice-mute-button\"],\n[data-testid=\"voice-call-agent-mute\"],\n[data-testid=\"voice-call-speed\"],\n[data-testid=\"voice-call-collapse\"],\n[data-testid=\"voice-call-end\"],\n[data-testid=\"voice-dock-end\"],\n[data-testid=\"voice-dock-send\"],\n[data-testid=\"voice-dock-compose\"],\n[data-testid=\"voice-dock-composer\"] {\n  --voice-accent-rgb: var(--ag-accent-rgb);\n  --voice-icon: var(--ag-accent);\n  --voice-solid: var(--ag-accent-solid);\n  --voice-text: var(--foreground);\n  --voice-pill-bg: rgba(255, 255, 255, 0.68);\n  --voice-pill-hover: rgba(255, 255, 255, 0.95);\n  --voice-pill-border: rgba(var(--ag-accent-rgb), 0.28);\n  --voice-pill-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85);\n  --voice-chip-bg: rgba(255, 255, 255, 0.55);\n  --voice-chip-hover: rgba(255, 255, 255, 0.85);\n  --voice-chip-border: rgba(var(--ag-accent-rgb), 0.22);\n  --voice-chip-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);\n  --voice-panel-bg: rgba(255, 255, 255, 0.82);\n  --voice-panel-border: rgba(var(--ag-accent-rgb), 0.28);\n  --voice-panel-gradient: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.76) 100%);\n  --voice-panel-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.90);\n  --voice-line: rgba(var(--ag-accent-rgb), 0.42);\n  --voice-track-bg: rgba(var(--ag-accent-rgb), 0.12);\n  --voice-track-border: rgba(var(--ag-accent-rgb), 0.26);\n  --voice-thumb-bg: #FFFFFF;\n  --voice-card-bg: var(--ag-surface-popover);\n  --voice-card-border: var(--ag-popover-border);\n  --voice-card-shadow: var(--ag-shadow-popover);\n  --voice-pressed-bg: var(--foreground);\n  --voice-pressed-fg: #FFFFFF;\n  --voice-pressed-border: rgba(255, 255, 255, 0.55);\n  --voice-danger: var(--ag-danger);\n  --voice-danger-hover: var(--ag-danger-hover);\n  --secondary: var(--voice-chip-bg) !important;\n  --secondary-foreground: var(--voice-text) !important;\n  --border: var(--voice-line) !important;\n  --color-secondary: var(--voice-chip-bg) !important;\n  --color-secondary-foreground: var(--voice-text) !important;\n  --color-border: var(--voice-line) !important;\n  --card: var(--voice-card-bg) !important;\n  --color-card: var(--voice-card-bg) !important;\n  --card-border: var(--voice-card-border) !important;\n  --color-card-border: var(--voice-card-border) !important;\n}\n\n[data-testid=\"live-docked\"] {\n  --voice-accent-rgb: var(--ag-accent-rgb);\n  --voice-line: rgba(var(--ag-accent-rgb), 0.42);\n  --voice-text: var(--foreground);\n  --voice-panel-bg: rgba(255, 255, 255, 0.82);\n  --voice-panel-border: rgba(var(--ag-accent-rgb), 0.28);\n  --voice-panel-gradient: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.76) 100%);\n  --voice-panel-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.90);\n  background-color: var(--voice-panel-bg) !important;\n  background-image: var(--voice-panel-gradient) !important;\n  color: var(--voice-text) !important;\n  border: 1px solid var(--voice-panel-border) !important;\n  border-bottom: 0 !important;\n  border-radius: 16px 16px 0 0 !important;\n  box-shadow: var(--voice-panel-shadow) !important;\n  -webkit-backdrop-filter: blur(18px) saturate(150%) !important;\n  backdrop-filter: blur(18px) saturate(150%) !important;\n}\n\n[data-testid=\"live-docked\"] div:has(> [data-testid=\"live-docked-scroll\"]) {\n  border-top-color: var(--voice-line) !important;\n}\n\n[data-testid=\"voice-start-button\"],\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))) {\n  background-color: var(--voice-pill-bg) !important;\n  background-image: none !important;\n  color: var(--voice-icon) !important;\n  border: 1px solid var(--voice-pill-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--voice-pill-shadow) !important;\n  opacity: 1 !important;\n  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease !important;\n}\n\n[data-testid=\"voice-start-button\"] svg,\n[data-testid=\"voice-start-button\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))) svg,\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))) [class*=\"text-background\"] {\n  color: var(--voice-icon) !important;\n}\n\n[data-testid=\"voice-start-button\"] svg[class*=\"fill-background\"],\n[data-testid=\"voice-start-button\"] svg [class*=\"fill-background\"],\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))) svg[class*=\"fill-background\"],\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))) svg [class*=\"fill-background\"] {\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-start-button\"]:hover,\n[data-testid=\"voice-live-pill\"]:where(:not(.bg-red-600)):where(:not(:has([data-testid=\"voice-end-button\"]))):hover {\n  background-color: var(--voice-pill-hover) !important;\n  border-color: rgba(var(--voice-accent-rgb), 0.42) !important;\n  box-shadow: 0 2px 8px rgba(var(--voice-accent-rgb), 0.25) !important;\n}\n\n[data-testid=\"voice-live-pill\"][data-state=\"active\"],\n[data-testid=\"voice-live-pill\"][data-state=\"live\"],\n[data-testid=\"voice-live-pill\"][data-active=\"true\"],\n[data-testid=\"voice-live-pill\"][data-live=\"true\"],\n[data-testid=\"voice-live-pill\"][aria-pressed=\"true\"],\n[data-testid=\"voice-live-pill\"].bg-red-500,\n[data-testid=\"voice-live-pill\"].bg-red-600,\n[data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]) {\n  background-color: var(--ag-danger) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border-color: rgba(255, 255, 255, 0.55) !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.35) !important;\n  animation: ag-voice-breathe 2.4s ease-in-out infinite !important;\n}\n\n[data-testid=\"voice-live-pill\"][data-state=\"active\"] svg,\n[data-testid=\"voice-live-pill\"][data-state=\"live\"] svg,\n[data-testid=\"voice-live-pill\"][data-active=\"true\"] svg,\n[data-testid=\"voice-live-pill\"][data-live=\"true\"] svg,\n[data-testid=\"voice-live-pill\"][aria-pressed=\"true\"] svg,\n[data-testid=\"voice-live-pill\"].bg-red-500 svg,\n[data-testid=\"voice-live-pill\"].bg-red-600 svg,\n[data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]) svg,\n[data-testid=\"voice-live-pill\"][data-state=\"active\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"][data-state=\"live\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"][data-active=\"true\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"][data-live=\"true\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"][aria-pressed=\"true\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"].bg-red-500 [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"].bg-red-600 [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]) [class*=\"text-background\"] {\n  color: #FFFFFF !important;\n}\n\n[data-testid=\"voice-live-pill\"].bg-red-600 [data-testid=\"voice-speed-button\"]:hover,\n[data-testid=\"voice-live-pill\"].bg-red-600 [data-testid=\"voice-speed-button\"][aria-expanded=\"true\"],\n[data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]) [data-testid=\"voice-speed-button\"]:hover,\n[data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]) [data-testid=\"voice-speed-button\"][aria-expanded=\"true\"] {\n  background-color: rgba(255, 255, 255, 0.20) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n}\n\n[data-testid=\"voice-end-button\"] {\n  background-color: var(--ag-danger) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.55) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.35) !important;\n  opacity: 1 !important;\n  animation: ag-voice-breathe 2.4s ease-in-out infinite !important;\n}\n\n[data-testid=\"voice-end-button\"] svg,\n[data-testid=\"voice-end-button\"] [class*=\"text-background\"] {\n  color: #FFFFFF !important;\n  fill: currentColor !important;\n}\n\n@keyframes ag-voice-breathe {\n  0%, 100% {\n    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.32);\n  }\n  50% {\n    box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.08), 0 4px 18px rgba(239, 68, 68, 0.55);\n  }\n}\n\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-start-button\"],\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-end-button\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  border-color: transparent !important;\n  box-shadow: none !important;\n  color: inherit !important;\n  animation: none !important;\n}\n\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-end-button\"]:hover {\n  background-color: rgba(255, 255, 255, 0.20) !important;\n  color: #FFFFFF !important;\n}\n\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-start-button\"] svg,\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-start-button\"] [class*=\"text-background\"],\n[data-testid=\"voice-live-pill\"] [data-testid=\"voice-end-button\"] svg {\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-call-controls\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  color: var(--voice-text) !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"voice-mute-button\"]:not([aria-pressed=\"true\"]),\n[data-testid=\"voice-call-agent-mute\"]:not([aria-pressed=\"true\"]),\n[data-testid=\"voice-call-speed\"]:not([aria-expanded=\"true\"]) {\n  background-color: var(--voice-chip-bg) !important;\n  background-image: none !important;\n  color: var(--voice-text) !important;\n  border: 1px solid var(--voice-chip-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--voice-chip-shadow) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-mute-button\"]:not([aria-pressed=\"true\"]) svg,\n[data-testid=\"voice-call-agent-mute\"]:not([aria-pressed=\"true\"]) svg,\n[data-testid=\"voice-call-speed\"]:not([aria-expanded=\"true\"]) svg {\n  color: var(--voice-text) !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-call-speed\"][aria-expanded=\"true\"] {\n  background-color: rgba(var(--voice-accent-rgb), 0.14) !important;\n  background-image: none !important;\n  color: var(--voice-icon) !important;\n  border: 1px solid rgba(var(--voice-accent-rgb), 0.32) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--voice-chip-shadow) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-call-speed\"][aria-expanded=\"true\"] svg {\n  color: var(--voice-icon) !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-mute-button\"]:not([aria-pressed=\"true\"]):hover,\n[data-testid=\"voice-call-agent-mute\"]:not([aria-pressed=\"true\"]):hover,\n[data-testid=\"voice-call-speed\"]:hover {\n  background-color: var(--voice-chip-hover) !important;\n  color: var(--voice-icon) !important;\n  border-color: rgba(var(--voice-accent-rgb), 0.38) !important;\n  box-shadow: 0 2px 8px rgba(var(--voice-accent-rgb), 0.20) !important;\n}\n\n[data-testid=\"voice-mute-button\"]:not([aria-pressed=\"true\"]):hover svg,\n[data-testid=\"voice-call-agent-mute\"]:not([aria-pressed=\"true\"]):hover svg,\n[data-testid=\"voice-call-speed\"]:hover svg {\n  color: var(--voice-icon) !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-call-agent-mute\"][aria-pressed=\"true\"] {\n  background-color: var(--voice-pressed-bg) !important;\n  background-image: none !important;\n  color: var(--voice-pressed-fg) !important;\n  border: 1px solid var(--voice-pressed-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 2px 8px rgba(var(--voice-accent-rgb), 0.22) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-call-agent-mute\"][aria-pressed=\"true\"] svg {\n  color: var(--voice-pressed-fg) !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-mute-button\"][aria-pressed=\"true\"],\n[data-testid=\"voice-mute-button\"].bg-red-600 {\n  background-color: var(--ag-danger) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.55) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-mute-button\"][aria-pressed=\"true\"] svg,\n[data-testid=\"voice-mute-button\"].bg-red-600 svg {\n  color: #FFFFFF !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-call-collapse\"] {\n  border-radius: 9999px !important;\n  transition: background-color 0.16s ease, color 0.16s ease !important;\n}\n\n[data-testid=\"voice-call-collapse\"]:hover {\n  background-color: var(--voice-chip-hover) !important;\n  color: var(--voice-icon) !important;\n}\n\n[data-testid=\"voice-call-collapse\"]:hover svg {\n  color: var(--voice-icon) !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"voice-call-end\"],\n[data-testid=\"voice-dock-end\"] {\n  background-color: var(--voice-danger) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.55) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16), 0 2px 10px rgba(239, 68, 68, 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-call-end\"]:hover,\n[data-testid=\"voice-dock-end\"]:hover {\n  background-color: var(--voice-danger-hover) !important;\n  color: #FFFFFF !important;\n}\n\n[data-testid=\"voice-call-end\"] svg,\n[data-testid=\"voice-dock-end\"] svg {\n  color: #FFFFFF !important;\n  fill: currentColor !important;\n}\n\n[data-popover-popup]:has([data-testid=\"voice-speed-panel\"]) {\n  background-color: var(--voice-card-bg) !important;\n  background-image: none !important;\n  color: var(--voice-text) !important;\n  border: 1px solid var(--voice-card-border) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--voice-card-shadow) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-speed-panel\"] {\n  color: var(--voice-text) !important;\n}\n\n[data-testid=\"voice-speed-panel\"] [data-testid=\"voice-speed-track\"] {\n  background-color: var(--voice-track-bg) !important;\n  background-image: none !important;\n  border-radius: 9999px !important;\n  box-shadow: inset 0 1px 2px rgba(var(--voice-accent-rgb), 0.16), 0 0 0 1px var(--voice-track-border) !important;\n}\n\n[data-testid=\"voice-speed-panel\"] [data-testid=\"voice-speed-fill\"] {\n  background: linear-gradient(90deg, rgba(var(--voice-accent-rgb), 0.86) 0%, var(--voice-icon) 100%) !important;\n  border-radius: 9999px !important;\n}\n\n[data-testid=\"voice-speed-panel\"] [data-testid=\"voice-speed-thumb\"] {\n  background-color: var(--voice-thumb-bg) !important;\n  box-shadow: 0 1px 3px rgba(var(--voice-accent-rgb), 0.28), 0 0 0 1px rgba(var(--voice-accent-rgb), 0.22) !important;\n}\n\n[data-testid=\"voice-speed-panel\"] [data-testid=\"voice-speed-dot\"] {\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-dock\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  border: 0 !important;\n  box-shadow: none !important;\n  -webkit-backdrop-filter: none !important;\n  backdrop-filter: none !important;\n}\n\n[data-testid=\"voice-dock\"] div:has(> [data-testid=\"voice-dock-open\"]),\n[data-testid=\"voice-dock-compose\"],\n[data-testid=\"voice-dock-composer\"] > div {\n  background-color: var(--voice-card-bg) !important;\n  background-image: none !important;\n  border: 1px solid var(--voice-panel-border) !important;\n  box-shadow: var(--voice-card-shadow) !important;\n  -webkit-backdrop-filter: blur(18px) saturate(150%) !important;\n  backdrop-filter: blur(18px) saturate(150%) !important;\n}\n\n[data-testid=\"voice-dock-compose\"],\n[data-testid=\"voice-dock\"] div:has(> [data-testid=\"voice-dock-open\"]) {\n  border-radius: 9999px !important;\n}\n\n[data-testid=\"voice-dock-composer\"] > div {\n  border-radius: 20px !important;\n}\n\n[data-testid=\"voice-dock-send\"]:not(:disabled) {\n  background-color: var(--voice-solid) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.85) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 4px 12px rgba(var(--voice-accent-rgb), 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-dock-send\"]:not(:disabled) svg {\n  color: #FFFFFF !important;\n  fill: #FFFFFF !important;\n}\n\n[data-testid=\"voice-dock-send\"]:not(:disabled):hover {\n  filter: brightness(0.94);\n  box-shadow: 0 6px 16px rgba(var(--voice-accent-rgb), 0.38) !important;\n}\n\n[data-testid=\"voice-dock-send\"]:disabled {\n  background-color: transparent !important;\n  background-image: none !important;\n  color: var(--muted-foreground) !important;\n  border-color: transparent !important;\n  box-shadow: none !important;\n  opacity: 0.6 !important;\n}\n\n[data-testid=\"voice-picker\"] {\n  background-color: var(--voice-card-bg) !important;\n  background-image: none !important;\n  color: var(--voice-text) !important;\n  border: 1px solid var(--voice-card-border) !important;\n  border-radius: 20px !important;\n  box-shadow: var(--voice-card-shadow) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-picker\"] [data-testid=\"voice-picker-use\"] {\n  background-color: var(--voice-solid) !important;\n  background-image: none !important;\n  color: #FFFFFF !important;\n  border: 0 !important;\n  border-radius: 12px !important;\n  box-shadow: 0 4px 14px rgba(var(--voice-accent-rgb), 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-picker\"] [data-testid=\"voice-picker-use\"]:hover {\n  background-color: var(--voice-solid) !important;\n  filter: brightness(1.08);\n}\n\n[data-testid=\"voice-mic-warning\"],\n[data-testid=\"voice-mic-switched\"],\n[data-testid=\"voice-error-tip\"] {\n  background-color: var(--voice-card-bg) !important;\n  background-image: none !important;\n  color: var(--voice-text) !important;\n  border: 1px solid var(--voice-card-border) !important;\n  border-radius: 20px !important;\n  box-shadow: var(--voice-card-shadow) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"voice-mic-warning\"] [class*=\"text-muted\"],\n[data-testid=\"voice-error-tip\"] [class*=\"text-muted\"] {\n  color: var(--muted-foreground) !important;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  [data-testid=\"voice-live-pill\"][data-state=\"active\"],\n  [data-testid=\"voice-live-pill\"][data-state=\"live\"],\n  [data-testid=\"voice-live-pill\"][data-active=\"true\"],\n  [data-testid=\"voice-live-pill\"][data-live=\"true\"],\n  [data-testid=\"voice-live-pill\"][aria-pressed=\"true\"],\n  [data-testid=\"voice-live-pill\"].bg-red-500,\n  [data-testid=\"voice-live-pill\"].bg-red-600,\n  [data-testid=\"voice-live-pill\"]:has([data-testid=\"voice-end-button\"]),\n  [data-testid=\"voice-end-button\"] {\n    animation: none !important;\n  }\n}\n\n/* ---------- 12. Scrollbars, Conversation Navigator & Loading Spinner ---------- */\n.bg-sidebar *::-webkit-scrollbar:horizontal {\n  display: none !important;\n  height: 0 !important;\n  width: 0 !important;\n}\n\n[data-testid=\"conversation-view\"] {\n  overflow-y: hidden !important;\n  overflow-x: hidden !important;\n  scrollbar-width: none !important;\n}\n\n[data-testid=\"conversation-view\"]::-webkit-scrollbar {\n  display: none !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\n[data-testid=\"overlay-scrollbar\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"] {\n  width: 5px !important;\n  background-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  background-image: none !important;\n  border-radius: 9999px !important;\n  transition: width 0.15s ease-out, background-color 0.15s ease-out, box-shadow 0.15s ease-out !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"] {\n  width: auto !important;\n  height: 5px !important;\n  background-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  background-image: none !important;\n  border-radius: 9999px !important;\n  transition: height 0.15s ease-out, background-color 0.15s ease-out, box-shadow 0.15s ease-out !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover {\n  width: 6px !important;\n  background: var(--ag-scrollbar-v) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 0 6px rgba(var(--ag-accent-rgb), 0.30) !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover {\n  height: 6px !important;\n  background: var(--ag-scrollbar-h) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 0 6px rgba(var(--ag-accent-rgb), 0.30) !important;\n}\n\n.md-table-scroll {\n  scrollbar-width: auto !important;\n  scrollbar-color: auto !important;\n}\n\n.md-table-scroll::-webkit-scrollbar {\n  height: 5px !important;\n  width: 5px !important;\n}\n\n.md-table-scroll::-webkit-scrollbar-track {\n  background: transparent !important;\n}\n\n.md-table-scroll::-webkit-scrollbar-thumb {\n  background: rgba(var(--ag-accent-rgb), 0.40) !important;\n  border: none !important;\n  border-radius: 9999px !important;\n}\n\n.md-table-scroll::-webkit-scrollbar-thumb:hover,\n.md-table-scroll::-webkit-scrollbar-thumb:active {\n  background: var(--ag-scrollbar-h) !important;\n}\n\n[data-testid=\"conversation-navigator\"] ol {\n  opacity: 1 !important;\n}\n\n[data-testid=\"conversation-navigator-turn\"] > span,\n[data-testid=\"conversation-navigator-group\"] > span {\n  background-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"conversation-navigator-turn\"][data-active=\"true\"] > span,\n[data-testid=\"conversation-navigator-turn\"]:hover > span,\n[data-testid=\"conversation-navigator-turn\"]:focus-visible > span,\n[data-testid=\"conversation-navigator-turn\"][data-popup-open] > span,\n[data-testid=\"conversation-navigator-group\"]:hover > span,\n[data-testid=\"conversation-navigator-group\"]:focus-visible > span,\n[data-testid=\"conversation-navigator-group\"][data-popup-open] > span {\n  background: var(--ag-scrollbar-v) !important;\n  box-shadow: 0 0 6px rgba(var(--ag-accent-rgb), 0.30) !important;\n}\n\n[data-testid=\"status-loading-spinner\"] {\n  opacity: 1 !important;\n}\n\n[data-testid=\"status-loading-spinner\"] > [data-agent-state-dot] {\n  background-image: none !important;\n}\n\n[data-testid=\"status-loading-spinner\"] > [data-agent-state-dot]:nth-child(1) {\n  background-color: var(--ag-spinner-1) !important;\n  box-shadow: 0 0 4px color-mix(in srgb, var(--ag-spinner-1) 55%, transparent) !important;\n}\n\n[data-testid=\"status-loading-spinner\"] > [data-agent-state-dot]:nth-child(2) {\n  background-color: var(--ag-spinner-2) !important;\n  box-shadow: 0 0 4px color-mix(in srgb, var(--ag-spinner-2) 55%, transparent) !important;\n}\n\n[data-testid=\"status-loading-spinner\"] > [data-agent-state-dot]:nth-child(3) {\n  background-color: var(--ag-spinner-3) !important;\n  box-shadow: 0 0 4px color-mix(in srgb, var(--ag-spinner-3) 55%, transparent) !important;\n}\n\n[data-testid=\"status-loading-spinner\"] > [data-agent-state-dot]:nth-child(4) {\n  background-color: var(--ag-spinner-4) !important;\n  box-shadow: 0 0 4px color-mix(in srgb, var(--ag-spinner-4) 55%, transparent) !important;\n}\n\n/* ---------- 13. Auxiliary Pane Tabs & Maximized Chrome ---------- */\ndiv:not(.agy-aux-tab):has(> button[data-tab-id]),\ndiv:not(.agy-aux-tab):has(> .agy-aux-tab),\ndiv.border-b:has(button[data-tab-id]),\ndiv.border-b:has(.agy-aux-tab) {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]) {\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--ag-fg) !important;\n  transition: background-color 0.15s ease !important;\n}\n\n.agy-aux-tab > button[data-tab-id] {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]) {\n  background-color: transparent !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):hover {\n  background-color: rgba(255, 255, 255, 0.35) !important;\n  border-radius: 6px !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id])[class*=\"bg-secondary\"] {\n  background-color: rgba(255, 255, 255, 0.55) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border-radius: 6px !important;\n  color: var(--ag-fg) !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id])[class*=\"bg-secondary\"] :is(div[class*=\"truncate\"], .agy-aux-tab-title),\n:is(.agy-aux-tab, button[data-tab-id]):hover :is(div[class*=\"truncate\"], .agy-aux-tab-title),\n:is(.agy-aux-tab, button[data-tab-id]):focus-within :is(div[class*=\"truncate\"], .agy-aux-tab-title) {\n  padding-right: 24px !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id])[class*=\"bg-secondary\"] :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]) {\n  opacity: 1 !important;\n  pointer-events: auto !important;\n  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.86) 32%, rgba(255, 255, 255, 0.95) 100%) !important;\n  border-top-right-radius: 6px !important;\n  border-bottom-right-radius: 6px !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]) :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]) {\n  opacity: 0 !important;\n  pointer-events: none !important;\n  background: transparent !important;\n  transition: opacity 0.15s ease !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):hover :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]),\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):focus-within :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]) {\n  opacity: 1 !important;\n  pointer-events: auto !important;\n  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.86) 32%, rgba(255, 255, 255, 0.95) 100%) !important;\n  border-top-right-radius: 6px !important;\n  border-bottom-right-radius: 6px !important;\n}\n\n:is(.agy-aux-tab .agy-hover-actions button, button[data-tab-id] [role=\"button\"]) {\n  background: transparent !important;\n  border-radius: 4px !important;\n  pointer-events: auto !important;\n  width: 20px !important;\n  height: 20px !important;\n  color: var(--ag-fg) !important;\n  opacity: 0.85 !important;\n  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease !important;\n}\n\n:is(.agy-aux-tab .agy-hover-actions button, button[data-tab-id] [role=\"button\"]):hover {\n  background: rgba(255, 255, 255, 0.65) !important;\n  color: var(--ag-fg) !important;\n  opacity: 1 !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;\n}\n\nbutton[data-testid=\"aux-pane-new-tab-button\"],\n[data-testid=\"new-tab-button\"] {\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--ag-fg) !important;\n}\n\nbutton[data-testid=\"aux-pane-new-tab-button\"]:hover,\n[data-testid=\"new-tab-button\"]:hover,\n[data-testid=\"new-tab-button\"]:focus-visible {\n  background-color: rgba(255, 255, 255, 0.35) !important;\n  border-radius: 6px !important;\n}\n\nhtml[data-ag-custom-theme][data-aux-pane-maximized=\"true\"] .agy-sheet {\n  z-index: 50 !important;\n  position: relative !important;\n}\n\nhtml[data-ag-custom-theme][data-aux-pane-maximized=\"true\"] .agy-sheet > div.relative.flex.w-full.h-full.outline-none > div:last-child div:has(> button[data-tab-id]),\nhtml[data-ag-custom-theme][data-aux-pane-maximized=\"true\"] .agy-sheet > div.relative.flex.w-full.h-full.outline-none > div:last-child div:has(> .agy-aux-tab) {\n  background-color: var(--terminal-bg, var(--ag-base-bg)) !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;\n}\n\n[data-testid=\"new-tab-button\"] {\n  background-color: transparent !important;\n  border: none !important;\n  border-radius: 8px !important;\n  color: var(--foreground) !important;\n  transition: background-color 0.15s ease, color 0.15s ease !important;\n}\n\n[data-testid=\"new-tab-button\"]:hover,\n[data-testid=\"new-tab-button\"]:focus-visible {\n  background-color: rgba(var(--ag-accent-rgb), 0.15) !important;\n  color: var(--foreground) !important;\n}\n\n/* ---------- 14. Media Modal, Mermaid Lightbox, Sticky Views, Plugins & Ask Question ---------- */\n[data-testid=\"media-modal\"],\ndiv[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\ndiv[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  inset: 0 !important;\n  background-color: var(--media-modal-bg) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  opacity: 1 !important;\n  z-index: 5000 !important;\n}\n\ndiv[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  inset: 0 !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  z-index: 5001 !important;\n}\n\n[data-testid=\"mermaid-lightbox-viewport\"] {\n  background-color: var(--ag-mermaid-viewport-bg) !important;\n  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16) !important;\n}\n\n[data-testid=\"media-modal-header\"] {\n  position: absolute !important;\n  top: 18px !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: auto !important;\n  width: auto !important;\n  height: auto !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  transform: none !important;\n  z-index: 100 !important;\n  pointer-events: none !important;\n}\n\n[data-testid=\"media-modal-header\"] > div {\n  pointer-events: auto !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  height: 40px !important;\n  box-sizing: border-box !important;\n  gap: 4px !important;\n  padding: 0 8px !important;\n  background: var(--media-capsule-bg) !important;\n  backdrop-filter: blur(20px) saturate(120%) !important;\n  -webkit-backdrop-filter: blur(20px) saturate(120%) !important;\n  border: 1px solid var(--media-capsule-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;\n}\n\n[data-testid=\"media-modal-header\"] button {\n  background: transparent !important;\n  background-color: transparent !important;\n  color: var(--media-capsule-fg) !important;\n  width: 30px !important;\n  height: 30px !important;\n  padding: 0 !important;\n  border: none !important;\n  border-radius: 9999px !important;\n  box-shadow: none !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  cursor: pointer !important;\n  transition: background-color 0.15s ease !important;\n}\n\n[data-testid=\"media-modal-header\"] button:hover {\n  background: var(--media-capsule-hover) !important;\n}\n\n[data-testid=\"media-modal-header\"] button:active {\n  background: var(--media-capsule-hover) !important;\n}\n\n[data-testid=\"media-modal-header\"] button svg {\n  width: 18px !important;\n  height: 18px !important;\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"media-modal-zoom-controls\"] {\n  height: 40px !important;\n  box-sizing: border-box !important;\n  gap: 2px !important;\n  padding: 0 8px !important;\n  background: var(--media-capsule-bg) !important;\n  backdrop-filter: blur(20px) saturate(120%) !important;\n  -webkit-backdrop-filter: blur(20px) saturate(120%) !important;\n  border: 1px solid var(--media-capsule-border) !important;\n  border-radius: 9999px !important;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;\n}\n\n[data-testid=\"media-modal-zoom-controls\"] button {\n  background: transparent !important;\n  color: var(--media-capsule-fg) !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 9999px !important;\n}\n\n[data-testid=\"media-modal-zoom-controls\"] button:hover {\n  background: var(--media-capsule-hover) !important;\n}\n\n[data-testid=\"media-modal-zoom-controls\"] button svg {\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\n[data-testid=\"media-modal-zoom-reset\"] {\n  color: var(--media-capsule-fg) !important;\n  font-weight: 600 !important;\n  font-size: 12px !important;\n  opacity: 1 !important;\n}\n\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> div > h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"history-search-input\"]),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"customizations-search\"]),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has([data-testid=\"file-diff-accordion-toggle\"]),\ndiv[style*=\"position: sticky\"]:has([data-testid=\"file-diff-accordion-toggle\"]) {\n  background-color: var(--ag-base-bg) !important;\n  background-image: var(--ag-mesh) !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\ndiv:has(> button[data-testid=\"file-diff-accordion-toggle\"]) {\n  border-bottom: 1px solid var(--border) !important;\n}\n\ndiv:has(> input[data-testid=\"history-search-input\"]),\ndiv:has(> input[data-testid=\"customizations-search\"]),\n[data-testid=\"sidecars-view\"] div.relative:has(> input) {\n  background: rgba(255, 255, 255, 0.82) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border: 1px solid rgba(255, 255, 255, 0.92) !important;\n  border-radius: 8px !important;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06) !important;\n}\n\ndiv:has(> input[data-testid=\"history-search-input\"]):focus-within,\ndiv:has(> input[data-testid=\"customizations-search\"]):focus-within,\n[data-testid=\"sidecars-view\"] div.relative:has(> input):focus-within {\n  background: rgba(255, 255, 255, 0.95) !important;\n  border-color: var(--ag-accent) !important;\n  box-shadow: 0 0 0 2px rgba(var(--ag-accent-rgb), 0.22) !important;\n}\n\n[data-testid=\"sidecars-view\"] button:is([data-testid=\"sidecar-create-with-prompt\"], [data-testid=\"sidecar-new-button\"]) {\n  background: rgba(255, 255, 255, 0.72) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border: 1px solid rgba(255, 255, 255, 0.92) !important;\n  border-radius: 8px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;\n}\n\n[data-testid=\"sidecars-view\"] button:is([data-testid=\"sidecar-create-with-prompt\"], [data-testid=\"sidecar-new-button\"]):hover {\n  background: rgba(255, 255, 255, 0.92) !important;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;\n}\n\nnav[data-testid=\"plugins-tabs\"],\ndiv.inline-flex.rounded-full:has(> a[href*=\"/plugins\"]) {\n  background: rgba(255, 255, 255, 0.72) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border: 1px solid rgba(255, 255, 255, 0.92) !important;\n  border-radius: 8px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;\n}\n\nnav[data-testid=\"plugins-tabs\"] [data-testid^=\"plugins-tab-\"][aria-current=\"page\"],\ndiv.inline-flex.rounded-full:has(> a[href*=\"/plugins\"]) a[href*=\"/plugins\"].bg-background {\n  background: rgba(255, 255, 255, 0.95) !important;\n  border: 1px solid rgba(255, 255, 255, 0.92) !important;\n  border-radius: 6px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;\n  color: var(--foreground) !important;\n  font-weight: 600 !important;\n}\n\nnav[data-testid=\"plugins-tabs\"] [data-testid^=\"plugins-tab-\"]:not([aria-current=\"page\"]):hover {\n  background: rgba(255, 255, 255, 0.45) !important;\n  color: var(--foreground) !important;\n}\n\ndiv[class*=\"sticky\"][class*=\"top-0\"] div[class*=\"bg-card\"]:has(svg):not([class*=\"user-input-buttons-container\"]) {\n  background-color: rgba(255, 255, 255, 0.88) !important;\n  backdrop-filter: blur(16px) !important;\n  -webkit-backdrop-filter: blur(16px) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 10px !important;\n  box-shadow: var(--ag-shadow-floating) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked),\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"],\nlabel:has(> textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel:has(> textarea[data-testid=\"ask-question-writein\"])[class~=\"bg-secondary\"],\nlabel:has(> div > textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel:has(> div > textarea[data-testid=\"ask-question-writein\"])[class~=\"bg-secondary\"],\nlabel[for*=\"__write_in__\"]:has(input:checked),\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.12) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.32) !important;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"],\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"],\nlabel[for*=\"__write_in__\"]:has(input:checked) div[class*=\"bg-border\"],\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.20) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"] span,\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] span,\nlabel[for*=\"__write_in__\"]:has(input:checked) div[class*=\"bg-border\"] span,\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] span {\n  color: var(--ag-accent) !important;\n  font-weight: 700 !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) [data-testid=\"ask-question-option-text\"],\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] [data-testid=\"ask-question-option-text\"] {\n  color: var(--ag-fg) !important;\n  font-weight: 600 !important;\n}\n\n[data-testid=\"ask-question-collapse-button\"],\n[data-testid=\"ask-question-dismiss-button\"] {\n  background-color: rgba(255, 255, 255, 0.42) !important;\n  border: 1px solid rgba(var(--ag-accent-rgb), 0.22) !important;\n  border-radius: 6px !important;\n  color: var(--foreground) !important;\n  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease !important;\n}\n\n[data-testid=\"ask-question-collapse-button\"]:hover,\n[data-testid=\"ask-question-dismiss-button\"]:hover,\n[data-testid=\"ask-question-collapse-button\"]:focus-visible,\n[data-testid=\"ask-question-dismiss-button\"]:focus-visible {\n  background-color: rgba(var(--ag-accent-rgb), 0.16) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.42) !important;\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"ask-question-option-hover-card\"] {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  border-radius: 8px !important;\n  color: var(--foreground) !important;\n  box-shadow: var(--ag-shadow-tooltip) !important;\n}\n\n/* ---------- 15. Integrated Terminal (xterm.js) & Focus Outlines ---------- */\n[data-testid=\"terminal-surface\"],\n[data-testid=\"terminal-tab-surface\"],\n[data-testid=\"terminal-split-container\"],\n[data-testid^=\"terminal-pane-\"],\n[data-testid=\"terminal-active\"] {\n  background: transparent !important;\n  background-color: transparent !important;\n}\n\n:is([data-testid=\"terminal-surface\"], [data-testid^=\"terminal-pane-\"], [data-testid=\"terminal-active\"]):has(.xterm) :is([class*=\"animate-spin\"], svg[class*=\"spin\" i], [data-testid*=\"loading\" i], [data-testid*=\"spinner\" i]):not(.xterm):not(.xterm *) {\n  display: none !important;\n}\n\n[data-testid=\"terminal-active\"] > div:has(> .xterm) {\n  background: var(--ag-terminal-panel-bg) !important;\n  -webkit-backdrop-filter: none !important;\n  backdrop-filter: none !important;\n  border: 1px solid rgba(255, 255, 255, 0.74) !important;\n  border-radius: 12px !important;\n  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;\n  overflow: hidden !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm {\n  padding: 10px 14px !important;\n  box-sizing: border-box !important;\n  background: transparent !important;\n  background-color: transparent !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm-viewport,\n[data-testid=\"terminal-active\"] .xterm-scrollable-element,\n[data-testid=\"terminal-active\"] .xterm-screen {\n  background: transparent !important;\n  background-color: transparent !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-rows,\n[data-testid=\"terminal-active\"] .xterm .xterm-rows span {\n  font-family: \"JetBrains Mono\", \"SF Mono\", Menlo, Monaco, \"Cascadia Mono\", Consolas, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", monospace !important;\n  letter-spacing: normal !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-scrollable-element > .shadow.top,\n[data-testid=\"terminal-active\"] .xterm .xterm-scrollable-element > .shadow.left {\n  box-shadow: rgba(0, 0, 0, 0.18) 0 6px 6px -6px inset !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-cursor.xterm-cursor-block {\n  background-color: var(--ag-terminal-cursor) !important;\n  color: #FFFFFF !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-cursor.xterm-cursor-outline {\n  outline-color: var(--ag-terminal-cursor) !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-cursor.xterm-cursor-bar {\n  box-shadow: 2px 0 0 var(--ag-terminal-cursor) inset !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-cursor.xterm-cursor-underline {\n  border-bottom-color: var(--ag-terminal-cursor) !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-selection div {\n  background-color: var(--ag-terminal-selection) !important;\n}\n\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-0 { color: var(--ag-terminal-ansi-0) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-1 { color: var(--ag-terminal-ansi-1) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-2 { color: var(--ag-terminal-ansi-2) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-3 { color: var(--ag-terminal-ansi-3) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-4 { color: var(--ag-terminal-ansi-4) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-5 { color: var(--ag-terminal-ansi-5) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-6 { color: var(--ag-terminal-ansi-6) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-7 { color: var(--ag-terminal-ansi-7) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-8 { color: var(--ag-terminal-ansi-8) !important; }\n[data-testid=\"terminal-active\"] .xterm .xterm-fg-9 { color: var(--ag-terminal-ansi-9) !important; }\n\n#antigravity-theme-btn:focus-visible,\nbutton:focus-visible,\ninput:focus-visible,\nselect:focus-visible,\ntextarea:focus-visible,\n[tabindex]:focus-visible {\n  outline: 2px solid var(--ring, var(--ag-accent)) !important;\n  outline-offset: 2px !important;\n}\n\n/* ---------- 16. Reduced Transparency Accessibility Fallback ---------- */\n@media (prefers-reduced-transparency: reduce) {\n  :root {\n    --ag-surface-popover: var(--ag-surface-popover-opaque);\n    --ag-surface-modal: var(--ag-surface-popover-opaque);\n    --ag-popover-backdrop: none;\n  }\n\n  html,\n  .bg-sidebar,\n  .bg-sidebar div[style*=\"position: sticky\"],\n  .bg-sidebar div[style*=\"position:sticky\"],\n  .bg-sidebar div[data-index=\"0\"],\n  div[class*=\"sticky\"][class*=\"top-0\"]:has(> div[class*=\"md-sticky-message-bleed\"]),\n  div[class*=\"sticky\"][class*=\"top-0\"]:has(> h1),\n  div[class*=\"sticky\"][class*=\"top-0\"]:has(> div > h1) {\n    background-image: none !important;\n    background-color: var(--ag-base-bg) !important;\n  }\n\n  div[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]),\n  div[class*=\"bg-card-border\"]:has(textarea),\n  .surface-composer:has([contenteditable=\"true\"]),\n  .surface-composer:has(textarea),\n  [data-testid=\"pane-titlebar-toolbar\"] button,\n  [data-testid=\"live-docked\"],\n  [data-testid=\"voice-dock\"] div:has(> [data-testid=\"voice-dock-open\"]),\n  [data-testid=\"voice-dock-compose\"],\n  [data-testid=\"voice-dock-composer\"] > div,\n  button[aria-label=\"Scroll to Bottom\"],\n  [data-testid=\"media-modal-header\"] > div,\n  [data-testid=\"media-modal-zoom-controls\"] {\n    backdrop-filter: none !important;\n    -webkit-backdrop-filter: none !important;\n  }\n}\n";
    const DARK_DELTA_CSS = "/* Antigravity Theme — Dark Appearance Overrides\n   Compiled by @django9944/antigravity-theme (Copyright (c) 2026 Django9944).\n   Appended only when host Appearance resolves to Dark mode. */\n\nhtml {\n  background-color: var(--ag-base-bg) !important;\n}\n\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] {\n  border-right: 1px solid var(--border) !important;\n}\n\n.bg-sidebar {\n  background-color: var(--sidebar) !important;\n}\n\n.bg-sidebar div[style*=\"position: sticky\"],\n.bg-sidebar div[style*=\"position:sticky\"],\n.bg-sidebar div[data-index=\"0\"] {\n  width: 100% !important;\n  margin: 0 !important;\n  box-sizing: border-box !important;\n  background-color: var(--ag-surface-popover-opaque) !important;\n  background-image: var(--sidebar-unified-bg) !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n  z-index: 30 !important;\n}\n\n.bg-sidebar [class*=\"bg-border\"],\n.bg-sidebar hr,\ndiv[class*=\"bg-border\"] {\n  background-color: rgba(255, 255, 255, 0.08) !important;\n}\n\n.bg-sidebar a[href=\"/\"] {\n  background: rgba(var(--ag-accent-rgb), 0.14) !important;\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  color: var(--foreground) !important;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;\n}\n\n.bg-sidebar button:not([data-testid=\"title-menu-bar-option\"]):hover,\n.bg-sidebar a:not([href=\"/\"]):hover,\n.bg-sidebar [role=\"button\"]:not([data-testid=\"title-menu-bar-option\"]):hover {\n  background-color: rgba(255, 255, 255, 0.08) !important;\n}\n\n.bg-sidebar,\n.bg-sidebar * {\n  color: var(--foreground) !important;\n}\n\n.bg-sidebar svg {\n  color: var(--primary) !important;\n  opacity: 0.88;\n}\n\n.bg-sidebar [class*=\"text-muted\"],\n.bg-sidebar [class*=\"text-sidebar-muted\"] {\n  color: var(--muted-foreground) !important;\n}\n\n@layer theme {\n  [data-testid^=\"conversation-row-\"]:hover,\n  [data-testid^=\"conversation-row-\"]:focus-within,\n  .agy-sidebar-row:hover,\n  .agy-sidebar-row:focus-within {\n    --row-bg: rgba(255, 255, 255, 0.08) !important;\n  }\n\n  [data-testid^=\"conversation-row-\"][data-selected=\"true\"],\n  .agy-sidebar-row[data-selected=\"true\"] {\n    --row-bg: color-mix(in srgb, var(--primary) 20%, transparent) !important;\n  }\n}\n\n[data-testid^=\"conversation-row-\"]:hover,\n[data-testid^=\"conversation-row-\"]:focus-within,\n.agy-sidebar-row:hover,\n.agy-sidebar-row:focus-within {\n  background-color: rgba(255, 255, 255, 0.08) !important;\n}\n\n[data-testid^=\"conversation-row-\"][data-selected=\"true\"],\n.agy-sidebar-row[data-selected=\"true\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.20) !important;\n  box-shadow: none !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"])::before {\n  background: none !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button {\n  background-color: transparent !important;\n  border-radius: 9999px !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button:hover {\n  background-color: rgba(255, 255, 255, 0.12) !important;\n  box-shadow: none !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) svg {\n  color: var(--secondary-foreground) !important;\n  opacity: 0.85 !important;\n  transition: opacity 0.15s ease, color 0.15s ease !important;\n}\n\n:is([data-testid^=\"conversation-row-\"], [data-testid=\"conversation-row-history\"]) :is(.agy-row-actions, [class*=\"top-0 bottom-0\"]) button:hover svg {\n  color: var(--foreground) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"title-menu-bar\"] {\n  border-bottom: 1px solid var(--border) !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button,\ndiv[class*=\"absolute\"][class*=\"right-0\"][class*=\"top-0\"] button {\n  color: var(--secondary-foreground) !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button:hover,\ndiv[class*=\"absolute\"][class*=\"right-0\"][class*=\"top-0\"] button:hover {\n  background-color: rgba(255, 255, 255, 0.10) !important;\n}\n\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"] {\n  color: var(--secondary-foreground) !important;\n}\n\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"]:hover {\n  background: rgba(255, 255, 255, 0.10) !important;\n}\n\n[data-testid=\"pane-titlebar-toolbar\"] button:is([data-testid^=\"open-editor-\"], [data-testid=\"install-editor\"], [data-testid=\"editor-loading\"]) {\n  background: rgba(255, 255, 255, 0.08) !important;\n  border: 1px solid var(--border) !important;\n  border-radius: 6px !important;\n  box-shadow: none !important;\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"pane-titlebar-toolbar\"] button:is([data-testid^=\"open-editor-\"], [data-testid=\"install-editor\"], [data-testid=\"editor-loading\"]):hover {\n  background: rgba(255, 255, 255, 0.14) !important;\n}\n\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea),\n.surface-composer:has([contenteditable=\"true\"]),\n.surface-composer:has(textarea) {\n  background: rgba(15, 23, 42, 0.74) !important;\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;\n}\n\ndiv[class*=\"bg-card-border\"] > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea) > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]),\n.surface-composer > .surface-composer-card:not([data-mention-menu]):not([role=\"listbox\"]) {\n  background: transparent !important;\n  box-shadow: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\ndiv[data-mention-menu],\ndiv[class*=\"bg-card-border\"] div[data-mention-menu],\ndiv[role=\"listbox\"][data-mention-menu],\ndiv[aria-label=\"Mentions\"],\ndiv[aria-label=\"Typeahead menu\"],\ndiv:has(> [id*=\"typeahead-item\"]) {\n  background-color: var(--ag-surface-popover) !important;\n  background: var(--ag-surface-popover) !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] {\n  color: var(--foreground) !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"][aria-selected=\"true\"],\ndiv[data-mention-menu] [role=\"option\"]:hover,\ndiv[data-mention-menu] [role=\"option\"] > div:hover,\ndiv[data-mention-menu] [role=\"option\"] > div[class*=\"bg-secondary\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.16) !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] svg {\n  color: var(--secondary-foreground) !important;\n}\n\ndiv[data-mention-menu] [class*=\"opacity-50\"],\ndiv[data-mention-menu] [class*=\"text-muted\"] {\n  color: var(--muted-foreground) !important;\n}\n\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.30), inset 0 0 0 1px rgba(var(--ag-accent-rgb), 0.25) !important;\n}\n\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] > div[class*=\"bg-card\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"user-input-step\"],\n[data-testid=\"user-input-step\"] * {\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] {\n  background: var(--ag-surface-user-bubble) !important;\n  background-color: var(--ag-surface-user-bubble) !important;\n  box-shadow: 0 0 20px 10px var(--ag-surface-user-bubble) !important;\n}\n\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] button {\n  color: var(--secondary-foreground) !important;\n}\n\n[data-base-ui-portal] [data-base-ui-focusable]:not(.settings-modal-container):not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [class*=\"bg-card\"]:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] div[role=\"presentation\"]:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]) > div:not(.settings-modal-container):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] > div:not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]) > div:not(.settings-modal-container):not([data-closed]):not([data-dialog-backdrop]):not([data-alert-dialog-backdrop]):not([class*=\"inset-0\"]):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"animate-slideIn\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"w-72\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"tooltip\"]:not([data-closed]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n.compact-tooltip:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-tooltip-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-side]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-floating-ui-portal] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-sonner-toast]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-toast-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"bubble-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv.selection-quote-popup > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-popup\"] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"selection-quote-button\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"quote\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"explain\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"conversation-preview\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *) {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-tooltip) !important;\n}\n\n[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"listbox\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-popover-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-menu-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-select-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-combobox-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-popup]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[popover]:popover-open:not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[class*=\"bg-popover\"]:not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-list]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-dropdown-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-context-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-select-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *) {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n/* Modal & Confirmation Dialogs (Dark Override) */\n[role=\"dialog\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid^=\"overview-panel-host-\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"alertdialog\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[aria-modal=\"true\"]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid^=\"overview-panel-host-\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndialog[open]:not([class*=\"inset-0\"]):not(.settings-modal-container):not([data-testid=\"media-modal\"]),\n[data-dialog-popup]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-alert-dialog-popup]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-dialog-content]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([aria-label=\"Settings\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-alert-dialog-content]:not([class*=\"inset-0\"]):not([data-closed]):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"animate-modalFadeIn\"]:not([class*=\"inset-0\"]):not(:has([data-testid=\"mermaid-lightbox-viewport\"])):not(.settings-modal-container):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n:is([class*=\"fixed\"][class*=\"inset-0\"]):is([class*=\"z-50\"], [class*=\"z-40\"], [class*=\"z-[\"], [class*=\"items-center\"], [class*=\"bg-black\"], [class*=\"animate-backdropFadeIn\"], [class*=\"animate-modalFadeIn\"], [role=\"dialog\"], [role=\"alertdialog\"], [aria-modal=\"true\"]):not(#root):not(#root > div):not(.agy-shell):not(.agy-sheet):not(.agy-inset-shell):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *):not(.settings-modal-backdrop):not(:has(.settings-modal-container)):not(:has([aria-label=\"Settings\"])):not(:has([data-testid=\"mermaid-lightbox-viewport\"])) > div:is([class*=\"rounded-\"], [class*=\"bg-card\"], [class*=\"bg-background\"], [class*=\"bg-popover\"], [class*=\"shadow-\"], [class*=\"border\"]):not([class*=\"inset-0\"]):not([class*=\"pointer-events-none\"]):not([data-testid=\"media-modal\"]):not(.settings-modal-container) {\n  background-color: var(--ag-surface-modal) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n[data-testid=\"title-menu-bar\"] [class*=\"border-menu-border\"],\n[data-testid=\"title-menu-bar\"] div[class*=\"bg-sidebar\"],\n[data-testid=\"title-menu-bar\"] [role=\"menu\"] {\n  background-color: var(--ag-surface-popover) !important;\n  background-image: none !important;\n  backdrop-filter: var(--ag-popover-backdrop) !important;\n  -webkit-backdrop-filter: var(--ag-popover-backdrop) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-popover) !important;\n}\n\n[role=\"menuitem\"],\n[role=\"option\"],\n[data-testid=\"title-menu-bar-option\"] {\n  color: var(--foreground) !important;\n}\n\n[role=\"menuitem\"]:hover,\n[role=\"option\"]:hover,\n[role=\"option\"][aria-selected=\"true\"],\n[cmdk-item][data-selected=\"true\"],\n[cmdk-item]:hover,\n[data-highlighted] {\n  background-color: rgba(var(--ag-accent-rgb), 0.16) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid=\"title-menu-bar\"] button[data-testid=\"title-menu-bar-option\"]:hover,\n[data-testid=\"title-menu-bar\"] button[data-testid=\"title-menu-bar-option\"]:focus-visible,\ndiv[class*=\"bg-sidebar\"] button[data-testid=\"title-menu-bar-option\"]:hover,\ndiv[class*=\"bg-sidebar\"] button[data-testid=\"title-menu-bar-option\"]:focus-visible,\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-option\"]:hover,\n[data-testid=\"title-menu-bar-option\"]:hover {\n  background-color: rgba(var(--ag-accent-rgb), 0.18) !important;\n  border-radius: 6px !important;\n}\n\n[data-testid^=\"overview-panel-host-\"],\n[data-testid=\"overview-panel\"],\n[data-testid=\"aux-pane-new-tab-view\"],\n[data-testid=\"side-panel-new-tab-view\"],\n[data-testid^=\"aux-pane-new-tab-\"],\n[data-testid^=\"side-panel-new-tab-\"] {\n  --overview-item-hover: rgba(var(--ag-accent-rgb), 0.18);\n  --muted: var(--overview-item-hover) !important;\n  --secondary: var(--overview-item-hover) !important;\n  --color-muted: var(--overview-item-hover) !important;\n  --color-secondary: var(--overview-item-hover) !important;\n}\n\n[data-testid=\"context-usage-panel\"] {\n  --context-track: rgba(255, 255, 255, 0.10);\n  --muted: rgba(255, 255, 255, 0.10) !important;\n  --color-muted: rgba(255, 255, 255, 0.10) !important;\n}\n\n[data-testid=\"browser-omnibox-pill\"]:focus-within,\n[data-testid=\"browser-url-input\"]:focus:not([data-testid=\"browser-omnibox-pill\"] *),\n[data-testid=\"browser-url-input\"]:focus-visible:not([data-testid=\"browser-omnibox-pill\"] *),\n[data-testid=\"browser-url-input\"]:focus-within:not([data-testid=\"browser-omnibox-pill\"] *),\n[data-testid=\"new-tab-search-input\"]:focus,\n[data-testid=\"new-tab-search-input\"]:focus-visible,\n[data-testid=\"new-tab-search-input\"]:focus-within {\n  background-color: var(--ag-surface-popover-opaque) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.62) !important;\n  box-shadow: 0 0 0 3px rgba(var(--ag-accent-rgb), 0.18) !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-indicator\"],\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-pending\"] {\n  border-radius: 9999px !important;\n  background-color: rgba(255, 255, 255, 0.08) !important;\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"builtin-browser-pane\"] [data-testid=\"url-security-indicator\"]:hover {\n  background-color: rgba(255, 255, 255, 0.14) !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"],\nbutton[aria-label*=\"Scroll to bottom\" i],\nbutton[aria-label*=\"bottom\" i]:has(svg) {\n  background-color: var(--ag-surface-popover) !important;\n  color: var(--foreground) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-floating) !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"]:hover,\nbutton[aria-label*=\"Scroll to bottom\" i]:hover {\n  background-color: var(--ag-surface-popover) !important;\n  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.65) !important;\n}\n\nbutton[aria-label=\"Scroll to Bottom\"] svg,\nbutton[aria-label*=\"Scroll to bottom\" i] svg {\n  color: var(--foreground) !important;\n}\n\n[data-base-ui-portal] [data-base-ui-focusable] [class*=\"text-muted\"],\n[data-base-ui-portal] [class*=\"bg-card\"] [class*=\"text-muted\"],\n[data-radix-hover-card-content] [class*=\"text-muted\"],\n[data-radix-popper-content-wrapper] [data-side] [class*=\"text-muted\"] {\n  color: var(--muted-foreground) !important;\n}\n\ndiv[class*=\"bubble-menu\"] [class*=\"bg-border\"],\ndiv[class*=\"floating-\"] [class*=\"bg-border\"],\ndiv[class*=\"selection-popup\"] [class*=\"bg-border\"],\n[data-base-ui-portal] [class*=\"bg-border\"],\n[data-base-ui-portal] [role=\"separator\"],\n[role=\"menu\"] [role=\"separator\"],\n[role=\"listbox\"] [role=\"separator\"],\n[data-popover-popup] [role=\"separator\"],\n[data-menu-popup] [role=\"separator\"],\n[data-base-ui-portal] hr {\n  background-color: rgba(255, 255, 255, 0.08) !important;\n  border-color: rgba(255, 255, 255, 0.08) !important;\n}\n\n/* ---------- Dark Settings Modal ---------- */\n.settings-modal-container,\n[role=\"dialog\"][aria-label=\"Settings\"] {\n  --settings-dialog-bg: var(--ag-surface-popover-opaque);\n  --settings-text: var(--ag-fg);\n  --settings-text-muted: var(--ag-fg-muted);\n  --settings-accent-rgb: var(--ag-accent-rgb);\n  --settings-accent: var(--ag-accent);\n  --settings-accent-deep: var(--ag-fg);\n  --settings-card-bg: rgba(255, 255, 255, 0.045);\n  --settings-card-border: rgba(255, 255, 255, 0.10);\n  --settings-card-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);\n  --settings-row-hover: rgba(var(--ag-accent-rgb), 0.10);\n  --settings-control-bg: rgba(255, 255, 255, 0.08);\n  --settings-control-bg-hover: rgba(var(--ag-accent-rgb), 0.16);\n  --settings-control-border: rgba(255, 255, 255, 0.14);\n  --settings-control-top: rgba(255, 255, 255, 0.07);\n  --settings-control-bottom: rgba(255, 255, 255, 0);\n  --settings-control-inset: inset 0 1px 0 rgba(255, 255, 255, 0.06);\n  --settings-control-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);\n  --settings-focus-ring: rgba(var(--ag-accent-rgb), 0.28);\n  --settings-nav-active-bg: rgba(var(--ag-accent-rgb), 0.20);\n  --settings-nav-hover-bg: rgba(255, 255, 255, 0.08);\n  --settings-nav-active-border: rgba(var(--ag-accent-rgb), 0.38);\n  --settings-track-bg: rgba(0, 0, 0, 0.28);\n  --settings-track-border: rgba(255, 255, 255, 0.12);\n  --settings-track-inset: inset 0 1px 2px rgba(0, 0, 0, 0.30);\n  --settings-pressed-bg: rgba(var(--ag-accent-rgb), 0.26);\n  --settings-pressed-fg: #FFFFFF;\n  --settings-pressed-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);\n  --settings-badge-bg: rgba(var(--ag-accent-rgb), 0.20);\n  --settings-badge-fg: var(--ag-fg);\n  --settings-badge-border: rgba(var(--ag-accent-rgb), 0.34);\n  --settings-switch-off: rgba(255, 255, 255, 0.18);\n  --settings-switch-thumb: #FFFFFF;\n  --settings-switch-thumb-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);\n  --settings-code-bg: rgba(0, 0, 0, 0.26);\n  --settings-code-border: rgba(255, 255, 255, 0.12);\n  --settings-code-fg: var(--ag-fg);\n  --settings-picker-border: rgba(255, 255, 255, 0.20);\n  --settings-dialog-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);\n  --secondary: rgba(255, 255, 255, 0.08) !important;\n  --secondary-foreground: var(--ag-fg) !important;\n  --border: rgba(255, 255, 255, 0.14) !important;\n  --sidebar-secondary: rgba(var(--ag-accent-rgb), 0.20) !important;\n  --sidebar-muted: rgba(255, 255, 255, 0.08) !important;\n  --color-secondary: rgba(255, 255, 255, 0.08) !important;\n  --color-secondary-foreground: var(--ag-fg) !important;\n  --color-border: rgba(255, 255, 255, 0.14) !important;\n  --color-sidebar-secondary: rgba(var(--ag-accent-rgb), 0.20) !important;\n  --color-sidebar-muted: rgba(255, 255, 255, 0.08) !important;\n  --sidebar-border: rgba(255, 255, 255, 0.10) !important;\n  --muted: var(--settings-row-hover) !important;\n  --color-muted: var(--settings-row-hover) !important;\n}\n\n/* ---------- Dark Voice Call & Dock Variables ---------- */\n[data-testid=\"voice-call-controls\"],\n[data-testid=\"voice-dock\"],\n[data-testid=\"voice-speed-panel\"],\n[data-popover-popup]:has([data-testid=\"voice-speed-panel\"]),\n[data-testid=\"voice-picker\"],\n[data-testid=\"voice-mic-warning\"],\n[data-testid=\"voice-mic-switched\"],\n[data-testid=\"voice-error-tip\"],\n[data-testid=\"voice-live-pill\"],\n[data-testid=\"voice-start-button\"],\n[data-testid=\"voice-mute-button\"],\n[data-testid=\"voice-call-agent-mute\"],\n[data-testid=\"voice-call-speed\"],\n[data-testid=\"voice-call-collapse\"],\n[data-testid=\"voice-call-end\"],\n[data-testid=\"voice-dock-end\"],\n[data-testid=\"voice-dock-send\"],\n[data-testid=\"voice-dock-compose\"],\n[data-testid=\"voice-dock-composer\"] {\n  --voice-pill-bg: rgba(15, 23, 42, 0.61);\n  --voice-pill-hover: rgba(15, 23, 42, 0.73);\n  --voice-pill-border: rgba(var(--ag-accent-rgb), 0.32);\n  --voice-pill-shadow: 0 2px 6px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.06);\n  --voice-chip-bg: rgba(15, 23, 42, 0.55);\n  --voice-chip-hover: rgba(15, 23, 42, 0.68);\n  --voice-chip-border: rgba(var(--ag-accent-rgb), 0.25);\n  --voice-chip-shadow: 0 1px 3px rgba(0, 0, 0, 0.32);\n  --voice-panel-bg: rgba(15, 23, 42, 0.67);\n  --voice-panel-border: rgba(var(--ag-accent-rgb), 0.32);\n  --voice-panel-gradient: linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.64) 100%);\n  --voice-panel-shadow: 0 12px 32px rgba(0, 0, 0, 0.56), inset 0 1px 0 rgba(255, 255, 255, 0.06);\n  --voice-line: rgba(var(--ag-accent-rgb), 0.48);\n  --voice-track-bg: rgba(var(--ag-accent-rgb), 0.14);\n  --voice-track-border: rgba(var(--ag-accent-rgb), 0.30);\n  --voice-thumb-bg: rgba(15, 23, 42, 0.75);\n  --voice-card-bg: rgba(15, 23, 42, 0.75);\n  --voice-card-border: var(--ag-popover-border);\n  --voice-card-shadow: var(--ag-shadow-popover);\n  --voice-pressed-fg: rgba(15, 23, 42, 0.75);\n  --voice-pressed-border: rgba(255, 255, 255, 0.13);\n}\n\n[data-testid=\"live-docked\"] {\n  --voice-line: rgba(var(--ag-accent-rgb), 0.48);\n  --voice-panel-bg: rgba(15, 23, 42, 0.67);\n  --voice-panel-border: rgba(var(--ag-accent-rgb), 0.32);\n  --voice-panel-gradient: linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.64) 100%);\n  --voice-panel-shadow: 0 12px 32px rgba(0, 0, 0, 0.56), inset 0 1px 0 rgba(255, 255, 255, 0.06);\n}\n\n@keyframes ag-voice-breathe {\n  0%, 100% {\n    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.37), 0 2px 10px rgba(0, 0, 0, 0.65);\n  }\n  50% {\n    box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.21), 0 4px 18px rgba(0, 0, 0, 0.65);\n  }\n}\n\n[data-testid=\"send-button\"]:disabled,\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):disabled {\n  background: rgba(255, 255, 255, 0.08) !important;\n  color: var(--muted-foreground) !important;\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\n  opacity: 1 !important;\n  box-shadow: none !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled),\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):not(:disabled) {\n  background: var(--ag-accent-solid) !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.22) !important;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled):hover,\nbutton[data-tooltip-id=\"input-send-button-send-tooltip\"]:not([aria-label*=\"Cancel\" i]):not(:disabled):hover {\n  background: var(--ag-accent-solid) !important;\n  filter: brightness(1.08);\n  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.42) !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"] {\n  background-color: rgba(255, 255, 255, 0.06) !important;\n  background-image: none !important;\n  color: var(--muted-foreground) !important;\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\n  border-radius: 9999px !important;\n  box-shadow: none !important;\n  opacity: 1 !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"]:hover {\n  background-color: rgba(255, 255, 255, 0.12) !important;\n  color: var(--ag-accent) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.40) !important;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.36) !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"]:disabled {\n  background-color: rgba(255, 255, 255, 0.04) !important;\n  color: var(--muted-foreground) !important;\n  opacity: 0.45 !important;\n  box-shadow: none !important;\n}\n\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-recording=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"recording\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-state=\"active\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][data-active=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"][aria-pressed=\"true\"],\nbutton[data-tooltip-id=\"input-send-button-record-tooltip\"].bg-red-500 {\n  background-color: #EF4444 !important;\n  border-color: rgba(255, 255, 255, 0.55) !important;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18), 0 2px 10px rgba(239, 68, 68, 0.40) !important;\n}\n\n[data-testid=\"overlay-scrollbar\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"],\n.md-table-scroll::-webkit-scrollbar-thumb,\n[data-testid=\"conversation-navigator-turn\"] > span,\n[data-testid=\"conversation-navigator-group\"] > span {\n  background-color: rgba(var(--ag-accent-rgb), 0.42) !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover,\n[data-testid=\"conversation-navigator-turn\"][data-active=\"true\"] > span,\n[data-testid=\"conversation-navigator-turn\"]:hover > span,\n[data-testid=\"conversation-navigator-turn\"]:focus-visible > span,\n[data-testid=\"conversation-navigator-turn\"][data-popup-open] > span,\n[data-testid=\"conversation-navigator-group\"]:hover > span,\n[data-testid=\"conversation-navigator-group\"]:focus-visible > span,\n[data-testid=\"conversation-navigator-group\"][data-popup-open] > span {\n  background: var(--ag-scrollbar-v) !important;\n  box-shadow: 0 0 6px rgba(var(--ag-accent-rgb), 0.35) !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover,\n.md-table-scroll::-webkit-scrollbar-thumb:hover,\n.md-table-scroll::-webkit-scrollbar-thumb:active {\n  background: var(--ag-scrollbar-h) !important;\n  box-shadow: 0 0 6px rgba(var(--ag-accent-rgb), 0.35) !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]) {\n  color: var(--foreground) !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id])[class*=\"bg-secondary\"] {\n  background-color: rgba(0, 0, 0, 0.55) !important;\n  border: 1px solid rgba(255, 255, 255, 0.10) !important;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;\n  color: var(--foreground) !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):hover {\n  background-color: rgba(0, 0, 0, 0.28) !important;\n}\n\n:is(.agy-aux-tab, button[data-tab-id])[class*=\"bg-secondary\"] :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]),\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):hover :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]),\n:is(.agy-aux-tab, button[data-tab-id]):not([class*=\"bg-secondary\"]):focus-within :is(.agy-hover-actions, > div[class*=\"absolute\"][class*=\"right-0\"]) {\n  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.08) 32%, rgba(255, 255, 255, 0.18) 100%) !important;\n}\n\n:is(.agy-aux-tab .agy-hover-actions button, button[data-tab-id] [role=\"button\"]) {\n  color: var(--foreground) !important;\n  pointer-events: auto !important;\n}\n\n:is(.agy-aux-tab .agy-hover-actions button, button[data-tab-id] [role=\"button\"]):hover {\n  background: rgba(255, 255, 255, 0.18) !important;\n  color: #FFFFFF !important;\n  box-shadow: none !important;\n}\n\nbutton[data-testid=\"aux-pane-new-tab-button\"] {\n  color: var(--foreground) !important;\n}\n\nbutton[data-testid=\"aux-pane-new-tab-button\"]:hover {\n  background-color: rgba(255, 255, 255, 0.10) !important;\n}\n\nhtml[data-ag-custom-theme][data-aux-pane-maximized=\"true\"] .agy-sheet > div.relative.flex.w-full.h-full.outline-none > div:last-child div:has(> button[data-tab-id]),\nhtml[data-ag-custom-theme][data-aux-pane-maximized=\"true\"] .agy-sheet > div.relative.flex.w-full.h-full.outline-none > div:last-child div:has(> .agy-aux-tab) {\n  background-color: var(--ag-base-bg) !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-bottom-color: rgba(255, 255, 255, 0.10) !important;\n}\n\n[data-testid=\"mermaid-lightbox-viewport\"] {\n  background-color: var(--ag-mermaid-viewport-bg) !important;\n  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45) !important;\n}\n\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> div > h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"history-search-input\"]),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"customizations-search\"]),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has([data-testid=\"file-diff-accordion-toggle\"]),\ndiv[style*=\"position: sticky\"]:has([data-testid=\"file-diff-accordion-toggle\"]) {\n  background-color: var(--ag-base-bg) !important;\n  background-image: var(--ag-mesh) !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\ndiv:has(> button[data-testid=\"file-diff-accordion-toggle\"]) {\n  border-bottom: 1px solid var(--border) !important;\n}\n\ndiv:has(> input[data-testid=\"history-search-input\"]),\ndiv:has(> input[data-testid=\"customizations-search\"]),\n[data-testid=\"sidecars-view\"] div.relative:has(> input) {\n  background: rgba(15, 23, 42, 0.72) !important;\n  border: 1px solid var(--border) !important;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.28) !important;\n}\n\ndiv:has(> input[data-testid=\"history-search-input\"]):focus-within,\ndiv:has(> input[data-testid=\"customizations-search\"]):focus-within,\n[data-testid=\"sidecars-view\"] div.relative:has(> input):focus-within {\n  background: rgba(15, 23, 42, 0.85) !important;\n  border-color: var(--primary) !important;\n  box-shadow: 0 0 0 2px rgba(var(--ag-accent-rgb), 0.22) !important;\n}\n\n[data-testid=\"sidecars-view\"] button:is([data-testid=\"sidecar-create-with-prompt\"], [data-testid=\"sidecar-new-button\"]) {\n  background: rgba(255, 255, 255, 0.08) !important;\n  border: 1px solid var(--border) !important;\n  border-radius: 8px !important;\n}\n\n[data-testid=\"sidecars-view\"] button:is([data-testid=\"sidecar-create-with-prompt\"], [data-testid=\"sidecar-new-button\"]):hover {\n  background: rgba(255, 255, 255, 0.14) !important;\n}\n\nnav[data-testid=\"plugins-tabs\"],\ndiv.inline-flex.rounded-full:has(> a[href*=\"/plugins\"]) {\n  background: rgba(255, 255, 255, 0.08) !important;\n  backdrop-filter: blur(12px) !important;\n  -webkit-backdrop-filter: blur(12px) !important;\n  border: 1px solid var(--border) !important;\n  border-radius: 8px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.20) !important;\n}\n\nnav[data-testid=\"plugins-tabs\"] [data-testid^=\"plugins-tab-\"][aria-current=\"page\"],\ndiv.inline-flex.rounded-full:has(> a[href*=\"/plugins\"]) a[href*=\"/plugins\"].bg-background {\n  background: rgba(255, 255, 255, 0.16) !important;\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\n  border-radius: 6px !important;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25) !important;\n  color: var(--foreground) !important;\n  font-weight: 600 !important;\n}\n\nnav[data-testid=\"plugins-tabs\"] [data-testid^=\"plugins-tab-\"]:not([aria-current=\"page\"]):hover {\n  background: rgba(255, 255, 255, 0.08) !important;\n  color: var(--foreground) !important;\n}\n\ndiv[class*=\"sticky\"][class*=\"top-0\"] div[class*=\"bg-card\"]:has(svg):not([class*=\"user-input-buttons-container\"]) {\n  background-color: var(--ag-surface-popover) !important;\n  border: 1px solid var(--ag-popover-border) !important;\n  box-shadow: var(--ag-shadow-floating) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked),\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"],\nlabel:has(> textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel:has(> div > textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel[for*=\"__write_in__\"]:has(input:checked) {\n  background-color: rgba(var(--ag-accent-rgb), 0.14) !important;\n  border-color: rgba(var(--ag-accent-rgb), 0.32) !important;\n  box-shadow: none !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"],\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] {\n  background-color: rgba(var(--ag-accent-rgb), 0.20) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"] span,\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] span {\n  color: var(--primary) !important;\n}\n\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) [data-testid=\"ask-question-option-text\"] {\n  color: var(--foreground) !important;\n}\n\n[data-testid=\"terminal-active\"] > div:has(> .xterm) {\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\n  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;\n}\n";
    const TOKEN_KEYS = ["--ag-accent","--ag-accent-deep","--ag-accent-rgb","--ag-accent-solid","--ag-base-bg","--ag-danger","--ag-danger-hover","--ag-fg","--ag-fg-muted","--ag-fg-placeholder","--ag-fg-secondary","--ag-inline-code-bg","--ag-inline-code-border","--ag-inline-code-fg","--ag-mermaid-viewport-bg","--ag-mesh","--ag-popover-backdrop","--ag-popover-border","--ag-scrollbar-h","--ag-scrollbar-v","--ag-settings-bg","--ag-shadow-floating","--ag-shadow-popover","--ag-shadow-tooltip","--ag-spinner-1","--ag-spinner-2","--ag-spinner-3","--ag-spinner-4","--ag-surface-modal","--ag-surface-popover","--ag-surface-popover-opaque","--ag-surface-user-bubble","--ag-terminal-ansi-0","--ag-terminal-ansi-1","--ag-terminal-ansi-2","--ag-terminal-ansi-3","--ag-terminal-ansi-4","--ag-terminal-ansi-5","--ag-terminal-ansi-6","--ag-terminal-ansi-7","--ag-terminal-ansi-8","--ag-terminal-ansi-9","--ag-terminal-cursor","--ag-terminal-panel-bg","--ag-terminal-selection","--agy-inline-code-bg","--agy-inline-code-fg","--background","--border","--card","--card-border","--color-background","--color-background-danger","--color-background-disabled","--color-background-info","--color-background-inverse","--color-background-primary","--color-background-secondary","--color-background-success","--color-background-tertiary","--color-background-warning","--color-border","--color-border-danger","--color-border-info","--color-border-inverse","--color-border-primary","--color-border-secondary","--color-border-success","--color-border-warning","--color-card","--color-card-border","--color-content","--color-foreground","--color-menu","--color-menu-border","--color-muted","--color-muted-foreground","--color-placeholder","--color-popover","--color-popover-foreground","--color-primary","--color-primary-foreground","--color-ring-danger","--color-ring-info","--color-ring-primary","--color-ring-success","--color-ring-warning","--color-secondary","--color-secondary-foreground","--color-sidebar","--color-sidebar-muted","--color-sidebar-secondary","--color-text-danger","--color-text-disabled","--color-text-info","--color-text-inverse","--color-text-primary","--color-text-secondary","--color-text-success","--color-text-tertiary","--color-text-warning","--content","--font-mono","--font-sans","--foreground","--media-capsule-bg","--media-capsule-border","--media-capsule-fg","--media-capsule-hover","--media-modal-bg","--menu","--menu-border","--muted","--muted-foreground","--placeholder","--popover","--popover-foreground","--primary","--primary-foreground","--secondary","--secondary-foreground","--selection","--sidebar","--sidebar-muted","--sidebar-secondary","--sidebar-unified-bg","--terminal-bg"];
    const PRIMARY_TOKEN_IDX = TOKEN_KEYS.indexOf('--primary');
    const THEMES = [{"id":"orbital","variantIdLight":"antigravity-light","variantIdDark":"antigravity-dark","name":"星轨云瓷","nameDark":"星轨岩板","titlebarColor":"#ecf1f5","titlebarColorDark":"#10151c","symbolColor":"#192028","symbolColorDark":"#dee4e9","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-orbital\" x1=\"2\" y1=\"2\" x2=\"14\" y2=\"14\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#86C1FF\"/><stop offset=\"55%\" stop-color=\"#3B82F6\"/><stop offset=\"100%\" stop-color=\"#6366F1\"/></linearGradient></defs><ellipse cx=\"8\" cy=\"8\" rx=\"6.2\" ry=\"2.7\" transform=\"rotate(-28 8 8)\" stroke=\"url(#ag-svg-orbital)\" stroke-width=\"1.45\"/><circle cx=\"8\" cy=\"8\" r=\"2.3\" fill=\"url(#ag-svg-orbital)\"/><circle cx=\"12.5\" cy=\"5.5\" r=\"1.1\" fill=\"#5CD0DC\"/></svg>","t":["#005697","#004981","0, 86, 151","#005697","#f5f9fc","#962b2d","#962b2d","#192028","#5c636a","#5c636a","#383f47","#69a0d81f","rgba(0, 86, 151, 0.24)","#005697","#f5f9fc","linear-gradient(180deg, #ecf1f5 0px, #ecf1f5 34px, rgba(236, 241, 245, 0) 96px), radial-gradient(circle at 18% 18%, rgba(76, 157, 235, 0.16) 0%, transparent 48%), radial-gradient(circle at 82% 18%, rgba(54, 184, 197, 0.12) 0%, transparent 45%), radial-gradient(circle at 84% 82%, rgba(152, 137, 227, 0.12) 0%, transparent 50%), linear-gradient(135deg, #f7fafd 0%, #f0f5fa 52%, #e8eff4 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(31, 116, 191, 0.88) 0%, rgba(0, 132, 143, 0.88) 50%, rgba(117, 100, 189, 0.88) 100%)","linear-gradient(180deg, rgba(31, 116, 191, 0.88) 0%, rgba(0, 132, 143, 0.88) 50%, rgba(117, 100, 189, 0.88) 100%)","#f5f9fc","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#066bb8","#007781","#6a57b3","#007b3d","rgba(249, 252, 254, 0.95)","rgba(249, 252, 254, 0.88)","#f9fcfe","#fdfeff","#192028","#962b2d","#006330","#794900","#005697","#803072","#005f67","#ecf1f5","#383f47","#85171e","#005697","linear-gradient(135deg, rgba(0, 86, 151, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#69a0d847","#69a0d81f","#005697","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#eff3f7","#69a0d821","#192028","#f5f9fc","#ecf1f5","#71b78521","#eff3f7","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#0056974d","#f9fbfd","#97a0a7","#bbc3c9","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#192028 !important","rgba(249, 252, 254, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5c636a !important","#5c636a !important","rgba(249, 252, 254, 0.88) !important","#192028 !important","#005697 !important","#f9fbfd !important","#962b2de0","#005697e0","#005697","#006330e0","#794900e0","transparent !important","#192028 !important","#ecf1f5 !important","transparent !important","transparent !important","#962b2d","#5c636aa6","#005697","#f9fbfd","#192028","#383f47","#006330","#5c636a","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#192028 !important","rgba(250, 253, 255, 0.9) !important","rgba(0, 86, 151, 0.28) !important","#192028 !important","rgba(0, 86, 151, 0.14) !important","#d9dfe4 !important","rgba(249, 252, 254, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5c636a !important","#5c636a !important","rgba(249, 252, 254, 0.88) !important","#192028 !important","#005697 !important","#f9fbfd !important","transparent !important","#192028 !important","#00569738 !important","#ecf1f5 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(235, 241, 247, 0.35), rgba(235, 241, 247, 0.35)), var(--ag-mesh)","#f5f9fc !important"],"td":["#86c1ff","#86c1ff","134, 193, 255","#1164a9","#10151c","#9f3c3e","#ffa09c","#dee4e9","#9da4ac","#9da4ac","#c8ced5","#2266a424","rgba(134, 193, 255, 0.28)","#86c1ff","#161b22","linear-gradient(180deg, #10151c 0px, #10151c 34px, rgba(16, 21, 28, 0) 96px), radial-gradient(circle at 18% 18%, rgba(50, 132, 208, 0.18) 0%, transparent 48%), radial-gradient(circle at 82% 16%, rgba(0, 152, 164, 0.12) 0%, transparent 44%), radial-gradient(circle at 84% 82%, rgba(117, 99, 192, 0.14) 0%, transparent 50%), linear-gradient(135deg, #0a0f14 0%, #10151c 50%, #161b22 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(134, 193, 255, 0.92) 0%, rgba(92, 208, 220, 0.92) 50%, rgba(189, 179, 255, 0.92) 100%)","linear-gradient(180deg, rgba(134, 193, 255, 0.92) 0%, rgba(92, 208, 220, 0.92) 50%, rgba(189, 179, 255, 0.92) 100%)","#10151c","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#86c1ff","#5cd0dc","#bdb3ff","#77d296","rgba(21, 26, 33, 0.92)","rgba(21, 26, 33, 0.78)","#151a21","#1a2028","#1d2229","#ffa09c","#77d296","#ecb75f","#86c1ff","#ed9edb","#5cd0dc","#c8ced5","#9da4ac","#ffb8b5","#86c1ff","linear-gradient(135deg, rgba(134, 193, 255, 0.08) 0%, rgba(12, 17, 23, 0.72) 100%)","#2266a447","#2266a424","#86c1ff","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#1d2229","#2266a424","#dee4e9","#161b22","#10151c","#056f3c24","#1d2229","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#86c1ff5c","#10151c","#767c85","#61676f","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#dee4e9 !important","rgba(21, 26, 33, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9da4ac !important","#9da4ac !important","rgba(21, 26, 33, 0.78) !important","#dee4e9 !important","#86c1ff !important","#fafbfd !important","#ffa09ce0","#86c1ffe0","#86c1ff","#77d296e0","#ecb75fe0","transparent !important","#dee4e9 !important","#10151c !important","transparent !important","transparent !important","#ffa09c","#9da4aca6","#86c1ff","#10151c","#dee4e9","#c8ced5","#77d296","#9da4ac","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#dee4e9 !important","rgba(16, 21, 28, 0.84) !important","rgba(134, 193, 255, 0.3) !important","#dee4e9 !important","rgba(134, 193, 255, 0.22) !important","#070a10 !important","rgba(21, 26, 33, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9da4ac !important","#9da4ac !important","rgba(21, 26, 33, 0.78) !important","#dee4e9 !important","#86c1ff !important","#fafbfd !important","transparent !important","#dee4e9 !important","#86c1ff38 !important","#10151c !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(13, 18, 24, 0.35), rgba(13, 18, 24, 0.35)), var(--ag-mesh)","#10151c !important"]},{"id":"prism","variantIdLight":"antigravity-prism-light","variantIdDark":"antigravity-prism-dark","name":"流光棱镜","nameDark":"暗夜棱光","titlebarColor":"#e7effb","titlebarColorDark":"#0e1622","symbolColor":"#172130","symbolColorDark":"#dfe4ec","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-prism\" x1=\"1\" y1=\"1\" x2=\"15\" y2=\"15\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#4285F4\"/><stop offset=\"35%\" stop-color=\"#8B5CF6\"/><stop offset=\"70%\" stop-color=\"#EC4899\"/><stop offset=\"100%\" stop-color=\"#F59E0B\"/></linearGradient></defs><path d=\"M8 1C8 4.866 4.866 8 1 8C4.866 8 8 11.134 8 15C8 11.134 11.134 8 15 8C11.134 8 8 4.866 8 1Z\" fill=\"url(#ag-svg-prism)\"/><circle cx=\"8\" cy=\"8\" r=\"1.6\" fill=\"#FFFFFF\" fill-opacity=\"0.95\"/></svg>","t":["#1153a0","#00448e","17, 83, 160","#13539f","#f6f9fd","#962b2d","#962b2d","#1a2028","#5d626a","#5d626a","#393f47","#719eda1f","rgba(17, 83, 160, 0.24)","#1153a0","#f6f9fd","linear-gradient(180deg, #e7effb 0px, #e7effb 34px, rgba(231, 239, 251, 0) 96px), radial-gradient(circle at 18% 18%, rgba(74, 145, 248, 0.22) 0%, transparent 48%), radial-gradient(circle at 82% 16%, rgba(236, 90, 94, 0.15) 0%, transparent 45%), radial-gradient(circle at 14% 78%, rgba(59, 179, 96, 0.14) 0%, transparent 45%), radial-gradient(circle at 86% 82%, rgba(156, 107, 238, 0.18) 0%, transparent 50%), linear-gradient(135deg, #f7faff 0%, #eff4fc 50%, #e6eef8 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(41, 115, 208, 0.88) 0%, rgba(129, 90, 196, 0.88) 50%, rgba(199, 74, 81, 0.88) 100%)","linear-gradient(180deg, rgba(41, 115, 208, 0.88) 0%, rgba(129, 90, 196, 0.88) 50%, rgba(199, 74, 81, 0.88) 100%)","#f6f9fd","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#2879dc","#885ed0","#edb333","#cf4047","rgba(249, 252, 255, 0.95)","rgba(249, 252, 255, 0.88)","#f9fcff","#fdfeff","#1a2028","#962b2d","#006330","#794900","#1153a0","#803072","#005f67","#edf0f6","#393f47","#85171e","#1153a0","linear-gradient(135deg, rgba(17, 83, 160, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#719eda47","#719eda1f","#1153a0","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#f0f3f7","#719eda21","#1a2028","#f6f9fd","#edf0f6","#71b78521","#f0f3f7","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#1153a04d","#fafbfd","#999fa7","#bdc2c9","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#1a2028 !important","rgba(249, 252, 255, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5d626a !important","#5d626a !important","rgba(249, 252, 255, 0.88) !important","#1a2028 !important","#1153a0 !important","#f9fbfd !important","#962b2de0","#1153a0e0","#1153a0","#006330e0","#794900e0","transparent !important","#1a2028 !important","#e7effb !important","transparent !important","transparent !important","#962b2d","#5d626aa6","#1153a0","#fafbfd","#1a2028","#393f47","#006330","#5d626a","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#1a2028 !important","rgba(251, 253, 255, 0.9) !important","rgba(17, 83, 160, 0.28) !important","#1a2028 !important","rgba(17, 83, 160, 0.14) !important","#d9dee8 !important","rgba(249, 252, 255, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5d626a !important","#5d626a !important","rgba(249, 252, 255, 0.88) !important","#1a2028 !important","#1153a0 !important","#f9fbfd !important","transparent !important","#1a2028 !important","#1153a038 !important","#e7effb !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(229, 239, 252, 0.35), rgba(229, 239, 252, 0.35)), var(--ag-mesh)","#f6f9fd !important"],"td":["#95c2ff","#95c2ff","149, 194, 255","#2761ab","#11151c","#9f3c3e","#ffa09c","#dfe3ea","#9ea3ac","#9ea3ac","#cbd0d8","#3063a624","rgba(149, 194, 255, 0.28)","#95c2ff","#161b22","linear-gradient(180deg, #0e1622 0px, #0e1622 34px, rgba(14, 22, 34, 0) 96px), radial-gradient(circle at 18% 20%, rgba(61, 132, 234, 0.22) 0%, transparent 48%), radial-gradient(circle at 82% 18%, rgba(222, 77, 82, 0.14) 0%, transparent 45%), radial-gradient(circle at 14% 78%, rgba(46, 169, 87, 0.13) 0%, transparent 46%), radial-gradient(circle at 86% 82%, rgba(144, 95, 225, 0.18) 0%, transparent 50%), linear-gradient(135deg, #070c17 0%, #0b131f 50%, #0f1a28 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(115, 177, 255, 0.92) 0%, rgba(188, 156, 255, 0.92) 50%, rgba(255, 131, 134, 0.92) 100%)","linear-gradient(180deg, rgba(115, 177, 255, 0.92) 0%, rgba(188, 156, 255, 0.92) 50%, rgba(255, 131, 134, 0.92) 100%)","#11151c","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#73b1ff","#b89eff","#f8c153","#ff8382","rgba(18, 27, 40, 0.92)","rgba(18, 27, 40, 0.78)","#121b28","#17212f","#1d2229","#ffa09c","#77d296","#ecb75f","#95c2ff","#ed9edb","#5cd0dc","#cbd0d8","#9ea3ac","#ffb8b5","#95c2ff","linear-gradient(135deg, rgba(149, 194, 255, 0.08) 0%, rgba(13, 17, 23, 0.72) 100%)","#3063a647","#3063a624","#95c2ff","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#1d2229","#3063a624","#dfe3ea","#161b22","#11151c","#056f3c24","#1d2229","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#95c2ff5c","#11151c","#767c86","#62676f","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#dfe3ea !important","rgba(18, 27, 40, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9ea3ac !important","#9ea3ac !important","rgba(18, 27, 40, 0.78) !important","#dfe3ea !important","#95c2ff !important","#fafbfd !important","#ffa09ce0","#95c2ffe0","#95c2ff","#77d296e0","#ecb75fe0","transparent !important","#dfe3ea !important","#0e1622 !important","transparent !important","transparent !important","#ffa09c","#9ea3aca6","#95c2ff","#11151c","#dfe3ea","#cbd0d8","#77d296","#9ea3ac","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#dfe3ea !important","rgba(17, 21, 28, 0.84) !important","rgba(149, 194, 255, 0.3) !important","#dfe3ea !important","rgba(149, 194, 255, 0.22) !important","#050a13 !important","rgba(18, 27, 40, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9ea3ac !important","#9ea3ac !important","rgba(18, 27, 40, 0.78) !important","#dfe3ea !important","#95c2ff !important","#fafbfd !important","transparent !important","#dfe3ea !important","#95c2ff38 !important","#0e1622 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(8, 14, 25, 0.35), rgba(8, 14, 25, 0.35)), var(--ag-mesh)","#11151c !important"]},{"id":"zenith","variantIdLight":"antigravity-zenith-light","variantIdDark":"antigravity-zenith-dark","name":"天穹澄蓝","nameDark":"天穹深蓝","titlebarColor":"#7ec9ef","titlebarColorDark":"#071823","symbolColor":"#0a2230","symbolColorDark":"#d8ebf6","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-zenith-sun\" x1=\"4\" y1=\"4\" x2=\"12\" y2=\"12\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#FDE047\"/><stop offset=\"100%\" stop-color=\"#EA580C\"/></linearGradient><linearGradient id=\"ag-svg-zenith-ray\" x1=\"8\" y1=\"1\" x2=\"8\" y2=\"15\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#F59E0B\"/><stop offset=\"100%\" stop-color=\"#D97706\"/></linearGradient></defs><circle cx=\"8\" cy=\"8\" r=\"3.4\" fill=\"url(#ag-svg-zenith-sun)\"/><path d=\"M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M3.4 12.6L4.5 11.5M11.5 4.5L12.6 3.4\" stroke=\"url(#ag-svg-zenith-ray)\" stroke-width=\"1.6\" stroke-linecap=\"round\"/></svg>","t":["#005c83","#004d6f","0, 92, 131","#005c83","#f5f9fc","#962b2d","#962b2d","#172127","#5b6369","#5b6369","#374046","#56aeb81f","rgba(0, 95, 103, 0.24)","#005f67","#f5f9fc","linear-gradient(180deg, #7ec9ef 0px, #7ec9ef 34px, #a5dcf7 25%, #c7ebfc 50%, #e0f4fd 72%, #f0fafe 88%, #f8fdff 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(0, 132, 186, 0.88) 0%, rgba(1, 155, 194, 0.88) 50%, rgba(0, 119, 186, 0.88) 100%)","linear-gradient(180deg, rgba(0, 132, 186, 0.88) 0%, rgba(1, 155, 194, 0.88) 50%, rgba(0, 119, 186, 0.88) 100%)","#f5f9fc","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#0084ba","#009cbd","#0f72bb","#0098a4","rgba(238, 248, 253, 0.95)","rgba(238, 248, 253, 0.88)","#eef8fd","#fcfeff","#172127","#962b2d","#006330","#794900","#005c83","#803072","#005f67","#ebf1f5","#374046","#85171e","#005c83","linear-gradient(135deg, rgba(0, 92, 131, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#56a5d247","#56aeb81f","#005f67","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#eef3f7","#56a5d221","#172127","#f5f9fc","#ebf1f5","#71b78521","#eef3f7","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#005c834d","#f9fbfd","#97a0a6","#bbc3c8","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#172127 !important","rgba(238, 248, 253, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5b6369 !important","#5b6369 !important","rgba(238, 248, 253, 0.88) !important","#172127 !important","#005c83 !important","#f9fbfd !important","#962b2de0","#005c83e0","#005c83","#006330e0","#794900e0","transparent !important","#172127 !important","#7ec9ef !important","transparent !important","transparent !important","#962b2d","#5b6369a6","#005c83","#f9fbfd","#172127","#374046","#006330","#5b6369","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#172127 !important","rgba(250, 253, 255, 0.9) !important","rgba(0, 92, 131, 0.28) !important","#172127 !important","rgba(0, 92, 131, 0.14) !important","#dfecf4 !important","rgba(238, 248, 253, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#5b6369 !important","#5b6369 !important","rgba(238, 248, 253, 0.88) !important","#172127 !important","#005c83 !important","#f9fbfd !important","transparent !important","#172127 !important","#005c8338 !important","#7ec9ef !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(123, 196, 233, 0.22), rgba(123, 196, 233, 0.22)), var(--ag-mesh)","#f5f9fc !important"],"td":["#70cbff","#70cbff","112, 203, 255","#006a96","#0e161b","#9f3c3e","#ffa09c","#dde4e9","#9ba5ab","#9ba5ab","#c9d1d7","#007a8524","rgba(92, 208, 220, 0.28)","#5cd0dc","#131c21","linear-gradient(180deg, #071823 0px, #071823 34px, rgba(7, 24, 35, 0) 96px), radial-gradient(circle at 20% 22%, rgba(54, 186, 235, 0.22) 0%, transparent 50%), radial-gradient(circle at 82% 24%, rgba(12, 158, 220, 0.16) 0%, transparent 48%), radial-gradient(circle at 50% 85%, rgba(0, 130, 192, 0.15) 0%, transparent 55%), linear-gradient(180deg, #04121b 0%, #071a26 55%, #0a2332 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(63, 192, 242, 0.92) 0%, rgba(12, 158, 220, 0.92) 50%, rgba(0, 130, 196, 0.92) 100%)","linear-gradient(180deg, rgba(63, 192, 242, 0.92) 0%, rgba(12, 158, 220, 0.92) 50%, rgba(0, 130, 196, 0.92) 100%)","#0e161b","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#3fc0f2","#1ca4e2","#238dd4","#53cfdc","rgba(11, 29, 41, 0.92)","rgba(11, 29, 41, 0.78)","#0b1d29","#102431","#1a2328","#ffa09c","#77d296","#ecb75f","#70cbff","#ed9edb","#5cd0dc","#c9d1d7","#9ba5ab","#ffb8b5","#70cbff","linear-gradient(135deg, rgba(112, 203, 255, 0.08) 0%, rgba(11, 18, 22, 0.72) 100%)","#006b9847","#007a8524","#5cd0dc","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#1a2328","#006b9824","#dde4e9","#131c21","#0e161b","#056f3c24","#1a2328","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#70cbff5c","#0e161b","#737d84","#5f686e","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#dde4e9 !important","rgba(11, 29, 41, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9ba5ab !important","#9ba5ab !important","rgba(11, 29, 41, 0.78) !important","#dde4e9 !important","#70cbff !important","#fafbfd !important","#ffa09ce0","#70cbffe0","#70cbff","#77d296e0","#ecb75fe0","transparent !important","#dde4e9 !important","#071823 !important","transparent !important","transparent !important","#ffa09c","#9ba5aba6","#70cbff","#0e161b","#dde4e9","#c9d1d7","#77d296","#9ba5ab","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#dde4e9 !important","rgba(14, 22, 27, 0.84) !important","rgba(112, 203, 255, 0.3) !important","#dde4e9 !important","rgba(112, 203, 255, 0.22) !important","#020d15 !important","rgba(11, 29, 41, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9ba5ab !important","#9ba5ab !important","rgba(11, 29, 41, 0.78) !important","#dde4e9 !important","#70cbff !important","#fafbfd !important","transparent !important","#dde4e9 !important","#70cbff38 !important","#071823 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(4, 19, 29, 0.35), rgba(4, 19, 29, 0.35)), var(--ag-mesh)","#0e161b !important"]},{"id":"lagoon","variantIdLight":"antigravity-lagoon-light","variantIdDark":"antigravity-lagoon-dark","name":"沧澜青瓷","nameDark":"沧澜暗青","titlebarColor":"#74d4c2","titlebarColorDark":"#051c19","symbolColor":"#022b26","symbolColorDark":"#d7f4ed","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-lagoon-crest\" x1=\"1\" y1=\"2\" x2=\"15\" y2=\"14\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#34D399\"/><stop offset=\"60%\" stop-color=\"#059669\"/><stop offset=\"100%\" stop-color=\"#0D9488\"/></linearGradient><linearGradient id=\"ag-svg-lagoon-wave\" x1=\"2\" y1=\"13\" x2=\"14\" y2=\"13\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#06B6D4\"/><stop offset=\"100%\" stop-color=\"#10B981\"/></linearGradient></defs><path d=\"M14 2C10.5 2 6 4 4 8C2.5 11 3.5 13 4.5 13C6.5 13 11 11.5 13 8C14 6 14 3.5 14 2Z\" fill=\"url(#ag-svg-lagoon-crest)\"/><path d=\"M4 8C7 7.5 10 5.5 12 3\" stroke=\"#A7F3D0\" stroke-width=\"1.2\" stroke-linecap=\"round\"/><path d=\"M2 13.5C4 12 6.5 12 8.5 13.5C10.5 15 13 15 15 13.5\" stroke=\"url(#ag-svg-lagoon-wave)\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg>","t":["#006158","#00514a","0, 97, 88","#00635a","#f4faf9","#962b2d","#962b2d","#152220","#596563","#596563","#354140","#5bb0a41f","rgba(0, 97, 88, 0.24)","#006158","#f4faf9","linear-gradient(180deg, #74d4c2 0px, #74d4c2 34px, #a4e3d4 25%, #c7efe5 50%, #e1f7f1 72%, #f0fbf8 88%, #f8fdfc 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(0, 132, 120, 0.88) 0%, rgba(26, 144, 100, 0.88) 50%, rgba(0, 130, 133, 0.88) 100%)","linear-gradient(180deg, rgba(0, 132, 120, 0.88) 0%, rgba(26, 144, 100, 0.88) 50%, rgba(0, 130, 133, 0.88) 100%)","#f4faf9","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#008478","#009163","#00858a","#137d41","rgba(237, 249, 247, 0.95)","rgba(237, 249, 247, 0.88)","#edf9f7","#fbfffe","#152220","#962b2d","#006330","#794900","#005697","#803072","#006158","#ebf2f1","#354140","#85171e","#006158","linear-gradient(135deg, rgba(0, 97, 88, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#5bb0a447","#5bb0a41f","#006158","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#eef4f3","#69a0d821","#152220","#f4faf9","#ebf2f1","#71b78521","#eef4f3","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#0056974d","#f9fcfb","#95a1a0","#b9c4c3","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#152220 !important","rgba(237, 249, 247, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#596563 !important","#596563 !important","rgba(237, 249, 247, 0.88) !important","#152220 !important","#006158 !important","#f9fbfd !important","#962b2de0","#005697e0","#006158","#006330e0","#794900e0","transparent !important","#152220 !important","#74d4c2 !important","transparent !important","transparent !important","#962b2d","#596563a6","#005697","#f9fcfb","#152220","#354140","#006330","#596563","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#152220 !important","rgba(250, 253, 253, 0.9) !important","rgba(0, 97, 88, 0.28) !important","#152220 !important","rgba(0, 97, 88, 0.14) !important","#e4f4f0 !important","rgba(237, 249, 247, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#596563 !important","#596563 !important","rgba(237, 249, 247, 0.88) !important","#152220 !important","#006158 !important","#f9fbfd !important","transparent !important","#152220 !important","#00615838 !important","#74d4c2 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(116, 212, 194, 0.22), rgba(116, 212, 194, 0.22)), var(--ag-mesh)","#f4faf9 !important"],"td":["#66d5c7","#66d5c7","102, 213, 199","#007267","#0d1716","#9f3c3e","#ffa09c","#dce5e4","#9aa6a4","#9aa6a4","#c7d2d1","#007d7224","rgba(102, 213, 199, 0.28)","#66d5c7","#121d1c","linear-gradient(180deg, #051c19 0px, #051c19 34px, rgba(5, 28, 25, 0) 96px), radial-gradient(circle at 20% 22%, rgba(66, 202, 180, 0.2) 0%, transparent 50%), radial-gradient(circle at 82% 25%, rgba(47, 185, 131, 0.15) 0%, transparent 48%), radial-gradient(circle at 50% 82%, rgba(4, 176, 161, 0.15) 0%, transparent 55%), linear-gradient(180deg, #041513 0%, #051e1b 55%, #072724 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(74, 208, 186, 0.92) 0%, rgba(63, 183, 133, 0.92) 50%, rgba(0, 168, 164, 0.92) 100%)","linear-gradient(180deg, rgba(74, 208, 186, 0.92) 0%, rgba(63, 183, 133, 0.92) 50%, rgba(0, 168, 164, 0.92) 100%)","#0d1716","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#4ad0ba","#39bf89","#2bb3b9","#78d197","rgba(9, 33, 30, 0.92)","rgba(9, 33, 30, 0.78)","#09211e","#0d2723","#192423","#ffa09c","#77d296","#ecb75f","#86c1ff","#ed9edb","#66d5c7","#c7d2d1","#9aa6a4","#ffb8b5","#66d5c7","linear-gradient(135deg, rgba(102, 213, 199, 0.08) 0%, rgba(9, 19, 17, 0.72) 100%)","#007d7247","#007d7224","#66d5c7","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#192423","#2266a424","#dce5e4","#121d1c","#0d1716","#056f3c24","#192423","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#86c1ff5c","#0d1716","#727f7d","#5e6968","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#dce5e4 !important","rgba(9, 33, 30, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9aa6a4 !important","#9aa6a4 !important","rgba(9, 33, 30, 0.78) !important","#dce5e4 !important","#66d5c7 !important","#fafbfd !important","#ffa09ce0","#86c1ffe0","#66d5c7","#77d296e0","#ecb75fe0","transparent !important","#dce5e4 !important","#051c19 !important","transparent !important","transparent !important","#ffa09c","#9aa6a4a6","#86c1ff","#0d1716","#dce5e4","#c7d2d1","#77d296","#9aa6a4","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#dce5e4 !important","rgba(13, 23, 22, 0.84) !important","rgba(102, 213, 199, 0.3) !important","#dce5e4 !important","rgba(102, 213, 199, 0.22) !important","#020f0d !important","rgba(9, 33, 30, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#9aa6a4 !important","#9aa6a4 !important","rgba(9, 33, 30, 0.78) !important","#dce5e4 !important","#66d5c7 !important","#fafbfd !important","transparent !important","#dce5e4 !important","#66d5c738 !important","#051c19 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(3, 21, 19, 0.35), rgba(3, 21, 19, 0.35)), var(--ag-mesh)","#0d1716 !important"]},{"id":"solar","variantIdLight":"antigravity-solar-light","variantIdDark":"antigravity-solar-dark","name":"曦光暖橙","nameDark":"日珥暮橙","titlebarColor":"#f7a077","titlebarColorDark":"#22130d","symbolColor":"#3f1f12","symbolColorDark":"#fde9d8","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-solar\" x1=\"8\" y1=\"3\" x2=\"8\" y2=\"9.5\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#FBBF24\"/><stop offset=\"60%\" stop-color=\"#F97316\"/><stop offset=\"100%\" stop-color=\"#E11D48\"/></linearGradient><linearGradient id=\"ag-svg-solar-horizon\" x1=\"2\" y1=\"10\" x2=\"14\" y2=\"14.5\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#EA580C\"/><stop offset=\"50%\" stop-color=\"#FB923C\"/><stop offset=\"100%\" stop-color=\"#FBBF24\"/></linearGradient></defs><path d=\"M3.5 9.5C3.5 7 5.5 5 8 5C10.5 5 12.5 7 12.5 9.5H3.5Z\" fill=\"url(#ag-svg-solar)\"/><path d=\"M8 2.5V3.8M4.2 4.2L5.1 5.1M11.8 4.2L10.9 5.1\" stroke=\"#FBBF24\" stroke-width=\"1.3\" stroke-linecap=\"round\"/><path d=\"M2 10.5H14M3.5 12.5H12.5M5.5 14.5H10.5\" stroke=\"url(#ag-svg-solar-horizon)\" stroke-width=\"1.4\" stroke-linecap=\"round\"/></svg>","t":["#923605","#7e2c00","146, 54, 5","#8f3300","#fcf7f5","#962b2d","#962b2d","#271d18","#695f5b","#695f5b","#463c38","#e38f6f1f","rgba(146, 54, 5, 0.24)","#923605","#fcf7f5","linear-gradient(180deg, #f7a077 0px, #f7a077 34px, #fbba99 25%, #fed4be 50%, #fee8db 72%, #fff3ed 88%, #fffbf8 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(185, 80, 25, 0.88) 0%, rgba(187, 116, 0, 0.88) 50%, rgba(189, 64, 69, 0.88) 100%)","linear-gradient(180deg, rgba(185, 80, 25, 0.88) 0%, rgba(187, 116, 0, 0.88) 50%, rgba(189, 64, 69, 0.88) 100%)","#fcf7f5","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#b95019","#bb7400","#c04448","#137d41","rgba(254, 243, 237, 0.95)","rgba(254, 243, 237, 0.88)","#fef3ed","#fffdfd","#271d18","#962b2d","#006330","#794900","#005697","#803072","#005f67","#f5efec","#463c38","#85171e","#923605","linear-gradient(135deg, rgba(146, 54, 5, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#e38f6f47","#e38f6f1f","#923605","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#f7f1ef","#69a0d821","#271d18","#fcf7f5","#f5efec","#71b78521","#f7f1ef","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#0056974d","#fdfaf9","#a69c97","#c9bfbb","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#271d18 !important","rgba(254, 243, 237, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#695f5b !important","#695f5b !important","rgba(254, 243, 237, 0.88) !important","#271d18 !important","#923605 !important","#f9fbfd !important","#962b2de0","#005697e0","#923605","#006330e0","#794900e0","transparent !important","#271d18 !important","#f7a077 !important","transparent !important","transparent !important","#962b2d","#695f5ba6","#005697","#fdfaf9","#271d18","#463c38","#006330","#695f5b","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#271d18 !important","rgba(255, 252, 250, 0.9) !important","rgba(146, 54, 5, 0.28) !important","#271d18 !important","rgba(146, 54, 5, 0.14) !important","#fdece4 !important","rgba(254, 243, 237, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#695f5b !important","#695f5b !important","rgba(254, 243, 237, 0.88) !important","#271d18 !important","#923605 !important","#f9fbfd !important","transparent !important","#271d18 !important","#92360538 !important","#f7a077 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(247, 160, 119, 0.22), rgba(247, 160, 119, 0.22)), var(--ag-mesh)","#fcf7f5 !important"],"td":["#ffa683","#ffa683","255, 166, 131","#9d4219","#1b130f","#9f3c3e","#ffa09c","#e9e1de","#aba09c","#aba09c","#d7cdc9","#a3513024","rgba(255, 166, 131, 0.28)","#ffa683","#211815","linear-gradient(180deg, #22130d 0px, #22130d 34px, rgba(34, 19, 13, 0) 96px), radial-gradient(circle at 22% 20%, rgba(245, 139, 75, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 24%, rgba(228, 83, 102, 0.13) 0%, transparent 46%), radial-gradient(circle at 50% 84%, rgba(203, 126, 0, 0.15) 0%, transparent 52%), linear-gradient(180deg, #190d09 0%, #22130d 55%, #2d1a12 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(247, 148, 90, 0.92) 0%, rgba(236, 168, 66, 0.92) 50%, rgba(244, 123, 118, 0.92) 100%)","linear-gradient(180deg, rgba(247, 148, 90, 0.92) 0%, rgba(236, 168, 66, 0.92) 50%, rgba(244, 123, 118, 0.92) 100%)","#1b130f","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#f7945a","#edb154","#f47b76","#78d197","rgba(39, 24, 17, 0.92)","rgba(39, 24, 17, 0.78)","#271811","#2e1d16","#281f1b","#ffa09c","#77d296","#ecb75f","#86c1ff","#ed9edb","#5cd0dc","#d7cdc9","#aba09c","#ffb8b5","#ffa683","linear-gradient(135deg, rgba(255, 166, 131, 0.08) 0%, rgba(22, 15, 12, 0.72) 100%)","#a3513047","#a3513024","#ffa683","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#281f1b","#2266a424","#e9e1de","#211815","#1b130f","#056f3c24","#281f1b","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#86c1ff5c","#1b130f","#857974","#6e6460","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#e9e1de !important","rgba(39, 24, 17, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#aba09c !important","#aba09c !important","rgba(39, 24, 17, 0.78) !important","#e9e1de !important","#ffa683 !important","#fafbfd !important","#ffa09ce0","#86c1ffe0","#ffa683","#77d296e0","#ecb75fe0","transparent !important","#e9e1de !important","#22130d !important","transparent !important","transparent !important","#ffa09c","#aba09ca6","#86c1ff","#1b130f","#e9e1de","#d7cdc9","#77d296","#aba09c","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#e9e1de !important","rgba(27, 19, 15, 0.84) !important","rgba(255, 166, 131, 0.3) !important","#e9e1de !important","rgba(255, 166, 131, 0.22) !important","#120805 !important","rgba(39, 24, 17, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#aba09c !important","#aba09c !important","rgba(39, 24, 17, 0.78) !important","#e9e1de !important","#ffa683 !important","#fafbfd !important","transparent !important","#e9e1de !important","#ffa68338 !important","#22130d !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(27, 14, 9, 0.35), rgba(27, 14, 9, 0.35)), var(--ag-mesh)","#1b130f !important"]},{"id":"nova","variantIdLight":"antigravity-nova-light","variantIdDark":"antigravity-nova-dark","name":"绯星初霞","nameDark":"绯星绛夜","titlebarColor":"#ee8691","titlebarColorDark":"#221013","symbolColor":"#3e141a","symbolColorDark":"#fde3e5","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-nova-petal\" x1=\"2\" y1=\"2\" x2=\"14\" y2=\"14\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#FB7185\"/><stop offset=\"50%\" stop-color=\"#E11D48\"/><stop offset=\"100%\" stop-color=\"#BE123C\"/></linearGradient><radialGradient id=\"ag-svg-nova-core\" cx=\"8\" cy=\"8\" r=\"2.2\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#FDE047\"/><stop offset=\"100%\" stop-color=\"#F59E0B\"/></radialGradient></defs><circle cx=\"8\" cy=\"4.8\" r=\"2.7\" fill=\"url(#ag-svg-nova-petal)\"/><circle cx=\"11.2\" cy=\"7.1\" r=\"2.7\" fill=\"url(#ag-svg-nova-petal)\"/><circle cx=\"10\" cy=\"11\" r=\"2.7\" fill=\"url(#ag-svg-nova-petal)\"/><circle cx=\"6\" cy=\"11\" r=\"2.7\" fill=\"url(#ag-svg-nova-petal)\"/><circle cx=\"4.8\" cy=\"7.1\" r=\"2.7\" fill=\"url(#ag-svg-nova-petal)\"/><circle cx=\"8\" cy=\"8\" r=\"2.2\" fill=\"url(#ag-svg-nova-core)\"/><circle cx=\"8\" cy=\"8\" r=\"0.8\" fill=\"#FFFBEB\"/></svg>","t":["#952a3b","#84152c","149, 42, 59","#912a3a","#fcf7f7","#962b2d","#952a3b","#271c1d","#6a5f5f","#6a5f5f","#473b3c","#e7898f1f","rgba(149, 42, 59, 0.24)","#952a3b","#fcf7f7","linear-gradient(180deg, #ee8691 0px, #ee8691 34px, #f4a5ab 25%, #fbc6ca 50%, #fde2e3 72%, #fef1f1 88%, #fffafa 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(188, 63, 81, 0.88) 0%, rgba(175, 74, 136, 0.88) 50%, rgba(195, 95, 54, 0.88) 100%)","linear-gradient(180deg, rgba(188, 63, 81, 0.88) 0%, rgba(175, 74, 136, 0.88) 50%, rgba(195, 95, 54, 0.88) 100%)","#fcf7f7","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#bc3f51","#af4a88","#c35f36","#137d41","rgba(253, 239, 241, 0.95)","rgba(253, 239, 241, 0.88)","#fdeff1","#fffdfd","#271c1d","#952a3b","#006330","#794900","#005697","#803072","#005f67","#f5eeee","#473b3c","#84152c","#952a3b","linear-gradient(135deg, rgba(149, 42, 59, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#e7898f47","#e7898f1f","#952a3b","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e7898f21","#f7f1f1","#69a0d821","#271c1d","#fcf7f7","#f5eeee","#71b78521","#f7f1f1","#daa75a21","rgba(255, 255, 255, 0.35) !important","#952a3b4d","#0056974d","#fdfafa","#a79b9c","#c9bfbf","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#271c1d !important","rgba(253, 239, 241, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#6a5f5f !important","#6a5f5f !important","rgba(253, 239, 241, 0.88) !important","#271c1d !important","#952a3b !important","#f9fbfd !important","#952a3be0","#005697e0","#952a3b","#006330e0","#794900e0","transparent !important","#271c1d !important","#ee8691 !important","transparent !important","transparent !important","#952a3b","#6a5f5fa6","#005697","#fdfafa","#271c1d","#473b3c","#006330","#6a5f5f","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#271c1d !important","rgba(255, 251, 252, 0.9) !important","rgba(149, 42, 59, 0.28) !important","#271c1d !important","rgba(149, 42, 59, 0.14) !important","#fcecec !important","rgba(253, 239, 241, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#6a5f5f !important","#6a5f5f !important","rgba(253, 239, 241, 0.88) !important","#271c1d !important","#952a3b !important","#f9fbfd !important","transparent !important","#271c1d !important","#952a3b38 !important","#ee8691 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(238, 134, 145, 0.22), rgba(238, 134, 145, 0.22)), var(--ag-mesh)","#fcf7f7 !important"],"td":["#ffa1a7","#ffa1a7","255, 161, 167","#9f3b48","#1b1213","#9f3c3e","#ffa1a7","#e9e0e1","#aca0a0","#aca0a0","#d7cdcd","#8c354024","rgba(255, 161, 167, 0.28)","#ffa1a7","#221818","linear-gradient(180deg, #221013 0px, #221013 34px, rgba(34, 16, 19, 0) 96px), radial-gradient(circle at 20% 22%, rgba(241, 111, 124, 0.2) 0%, transparent 50%), radial-gradient(circle at 82% 22%, rgba(220, 75, 105, 0.15) 0%, transparent 48%), radial-gradient(circle at 50% 84%, rgba(195, 69, 127, 0.15) 0%, transparent 52%), linear-gradient(180deg, #1a0b0d 0%, #241014 55%, #30161b 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(253, 137, 147, 0.92) 0%, rgba(232, 133, 191, 0.92) 50%, rgba(250, 157, 104, 0.92) 100%)","linear-gradient(180deg, rgba(253, 137, 147, 0.92) 0%, rgba(232, 133, 191, 0.92) 50%, rgba(250, 157, 104, 0.92) 100%)","#1b1213","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#fd8993","#e88fcb","#eab35f","#78d197","rgba(40, 20, 23, 0.92)","rgba(40, 20, 23, 0.78)","#281417","#2f191c","#291f1f","#ffa1a7","#77d296","#ecb75f","#86c1ff","#ed9edb","#5cd0dc","#d7cdcd","#aca0a0","#ffb7bb","#ffa1a7","linear-gradient(135deg, rgba(255, 161, 167, 0.08) 0%, rgba(22, 14, 15, 0.72) 100%)","#8c354047","#8c354024","#ffa1a7","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8c354024","#291f1f","#2266a424","#e9e0e1","#221818","#1b1213","#056f3c24","#291f1f","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa1a75c","#86c1ff5c","#1b1213","#857879","#6e6464","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#e9e0e1 !important","rgba(40, 20, 23, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#aca0a0 !important","#aca0a0 !important","rgba(40, 20, 23, 0.78) !important","#e9e0e1 !important","#ffa1a7 !important","#fafbfd !important","#ffa1a7e0","#86c1ffe0","#ffa1a7","#77d296e0","#ecb75fe0","transparent !important","#e9e0e1 !important","#221013 !important","transparent !important","transparent !important","#ffa1a7","#aca0a0a6","#86c1ff","#1b1213","#e9e0e1","#d7cdcd","#77d296","#aca0a0","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#e9e0e1 !important","rgba(27, 18, 19, 0.84) !important","rgba(255, 161, 167, 0.3) !important","#e9e0e1 !important","rgba(255, 161, 167, 0.22) !important","#130709 !important","rgba(40, 20, 23, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#aca0a0 !important","#aca0a0 !important","rgba(40, 20, 23, 0.78) !important","#e9e0e1 !important","#ffa1a7 !important","#fafbfd !important","transparent !important","#e9e0e1 !important","#ffa1a738 !important","#221013 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(28, 12, 14, 0.35), rgba(28, 12, 14, 0.35)), var(--ag-mesh)","#1b1213 !important"]},{"id":"nebula","variantIdLight":"antigravity-nebula-light","variantIdDark":"antigravity-nebula-dark","name":"星云霞紫","nameDark":"星云夜紫","titlebarColor":"#9e8df0","titlebarColorDark":"#181227","symbolColor":"#221443","symbolColorDark":"#edeafd","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-nebula\" x1=\"3\" y1=\"2\" x2=\"13\" y2=\"14\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#C4B5FD\"/><stop offset=\"46%\" stop-color=\"#8B5CF6\"/><stop offset=\"100%\" stop-color=\"#5B21B6\"/></linearGradient><linearGradient id=\"ag-svg-nebula-spark\" x1=\"11\" y1=\"1.9\" x2=\"15\" y2=\"5.8\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#FFFFFF\"/><stop offset=\"100%\" stop-color=\"#C084FC\"/></linearGradient></defs><g><ellipse cx=\"8\" cy=\"5.15\" rx=\"2.05\" ry=\"3.1\" transform=\"rotate(0 8 8.6)\" fill=\"url(#ag-svg-nebula)\"/><ellipse cx=\"8\" cy=\"5.15\" rx=\"2.05\" ry=\"3.1\" transform=\"rotate(72 8 8.6)\" fill=\"url(#ag-svg-nebula)\"/><ellipse cx=\"8\" cy=\"5.15\" rx=\"2.05\" ry=\"3.1\" transform=\"rotate(144 8 8.6)\" fill=\"url(#ag-svg-nebula)\"/><ellipse cx=\"8\" cy=\"5.15\" rx=\"2.05\" ry=\"3.1\" transform=\"rotate(216 8 8.6)\" fill=\"url(#ag-svg-nebula)\"/><ellipse cx=\"8\" cy=\"5.15\" rx=\"2.05\" ry=\"3.1\" transform=\"rotate(288 8 8.6)\" fill=\"url(#ag-svg-nebula)\"/><circle cx=\"8\" cy=\"8.6\" r=\"1.5\" fill=\"#F5E9FF\" fill-opacity=\"0.96\"/><circle cx=\"8\" cy=\"8.6\" r=\"0.55\" fill=\"#6D28D9\"/><path d=\"M8 3.15V6.4\" stroke=\"#F3E8FF\" stroke-width=\"0.8\" stroke-linecap=\"round\" stroke-opacity=\"0.8\"/></g><path d=\"M13.05 1.9L13.55 3.35L15 3.85L13.55 4.35L13.05 5.8L12.55 4.35L11.1 3.85L12.55 3.35Z\" fill=\"url(#ag-svg-nebula-spark)\"/></svg>","t":["#5a3f98","#4d3089","90, 63, 152","#5b4098","#f8f8fc","#962b2d","#962b2d","#201e27","#626069","#626069","#3f3d46","#cb87bc1f","rgba(128, 48, 114, 0.24)","#803072","#f8f8fc","linear-gradient(180deg, #9e8df0 0px, #9e8df0 34px, #bcaef9 25%, #cbc1fe 50%, #e0dbfe 72%, #f0eeff 88%, #faf9ff 100%)","blur(24px) saturate(145%)","rgba(15, 23, 42, 0.10)","linear-gradient(90deg, rgba(121, 91, 206, 0.88) 0%, rgba(96, 112, 210, 0.88) 50%, rgba(173, 81, 167, 0.88) 100%)","linear-gradient(180deg, rgba(121, 91, 206, 0.88) 0%, rgba(96, 112, 210, 0.88) 50%, rgba(173, 81, 167, 0.88) 100%)","#f8f8fc","0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)","0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)","0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)","#795bce","#6070d2","#ad51a7","#1b71bc","rgba(243, 241, 254, 0.95)","rgba(243, 241, 254, 0.88)","#f3f1fe","#fefdff","#201e27","#962b2d","#006330","#794900","#005697","#803072","#005f67","#f0eff5","#3f3d46","#85171e","#5a3f98","linear-gradient(135deg, rgba(90, 63, 152, 0.06) 0%, rgba(255, 255, 255, 0.82) 100%)","#a292d847","#cb87bc1f","#803072","transparent !important","rgba(255, 255, 255, 0.35) !important","transparent !important","transparent !important","transparent !important","#e78a8421","#f2f2f7","#69a0d821","#201e27","#f8f8fc","#f0eff5","#71b78521","#f2f2f7","#daa75a21","rgba(255, 255, 255, 0.35) !important","#962b2d4d","#0056974d","#fbfbfd","#9f9da7","#c2c0c9","#0063304d","#7949004d","transparent !important","transparent !important","transparent !important","#201e27 !important","rgba(243, 241, 254, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#626069 !important","#626069 !important","rgba(243, 241, 254, 0.88) !important","#201e27 !important","#5a3f98 !important","#f9fbfd !important","#962b2de0","#005697e0","#5a3f98","#006330e0","#794900e0","transparent !important","#201e27 !important","#9e8df0 !important","transparent !important","transparent !important","#962b2d","#626069a6","#005697","#fbfbfd","#201e27","#3f3d46","#006330","#626069","#794900","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#201e27 !important","rgba(252, 252, 255, 0.9) !important","rgba(90, 63, 152, 0.28) !important","#201e27 !important","rgba(90, 63, 152, 0.14) !important","#edeafd !important","rgba(243, 241, 254, 0.88) !important","rgba(15, 23, 42, 0.10) !important","transparent !important","#626069 !important","#626069 !important","rgba(243, 241, 254, 0.88) !important","#201e27 !important","#5a3f98 !important","#f9fbfd !important","transparent !important","#201e27 !important","#5a3f9838 !important","#9e8df0 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(158, 141, 240, 0.22), rgba(158, 141, 240, 0.22)), var(--ag-mesh)","#f8f8fc !important"],"td":["#c3b2ff","#c3b2ff","195, 178, 255","#674fa4","#15141b","#9f3c3e","#ffa09c","#e3e2e9","#a3a1ab","#a3a1ab","#d0ced7","#89457c24","rgba(237, 158, 219, 0.28)","#ed9edb","#1b1921","linear-gradient(180deg, #181227 0px, #181227 34px, rgba(24, 18, 39, 0) 96px), radial-gradient(circle at 18% 20%, rgba(156, 107, 238, 0.22) 0%, transparent 50%), radial-gradient(circle at 82% 24%, rgba(97, 106, 226, 0.16) 0%, transparent 48%), radial-gradient(circle at 50% 84%, rgba(120, 85, 223, 0.17) 0%, transparent 55%), linear-gradient(180deg, #100b1c 0%, #171126 55%, #201932 100%)","blur(24px) saturate(145%)","rgba(255, 255, 255, 0.10)","linear-gradient(90deg, rgba(186, 152, 255, 0.92) 0%, rgba(148, 162, 255, 0.92) 50%, rgba(227, 143, 219, 0.92) 100%)","linear-gradient(180deg, rgba(186, 152, 255, 0.92) 0%, rgba(148, 162, 255, 0.92) 50%, rgba(227, 143, 219, 0.92) 100%)","#15141b","0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)","0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)","0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)","#ba98ff","#9caaff","#e995e2","#53cfdc","rgba(29, 23, 44, 0.92)","rgba(29, 23, 44, 0.78)","#1d172c","#221c33","#222029","#ffa09c","#77d296","#ecb75f","#86c1ff","#ed9edb","#5cd0dc","#d0ced7","#a3a1ab","#ffb8b5","#c3b2ff","linear-gradient(135deg, rgba(195, 178, 255, 0.08) 0%, rgba(17, 15, 22, 0.72) 100%)","#6853a047","#89457c24","#ed9edb","transparent !important","rgba(255, 255, 255, 0.12) !important","transparent !important","transparent !important","transparent !important","#8d363824","#222029","#2266a424","#e3e2e9","#1b1921","#15141b","#056f3c24","#222029","#92650024","rgba(255, 255, 255, 0.12) !important","#ffa09c5c","#86c1ff5c","#15141b","#7c7a85","#67656e","#77d2965c","#ecb75f5c","transparent !important","transparent !important","transparent !important","#e3e2e9 !important","rgba(29, 23, 44, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#a3a1ab !important","#a3a1ab !important","rgba(29, 23, 44, 0.78) !important","#e3e2e9 !important","#c3b2ff !important","#fafbfd !important","#ffa09ce0","#86c1ffe0","#c3b2ff","#77d296e0","#ecb75fe0","transparent !important","#e3e2e9 !important","#181227 !important","transparent !important","transparent !important","#ffa09c","#a3a1aba6","#86c1ff","#15141b","#e3e2e9","#d0ced7","#77d296","#a3a1ab","#ecb75f","transparent !important","\"SF Mono\", \"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace","-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", \"Segoe UI\", sans-serif","#e3e2e9 !important","rgba(21, 20, 27, 0.84) !important","rgba(195, 178, 255, 0.3) !important","#e3e2e9 !important","rgba(195, 178, 255, 0.22) !important","#0b0715 !important","rgba(29, 23, 44, 0.78) !important","rgba(255, 255, 255, 0.10) !important","transparent !important","#a3a1ab !important","#a3a1ab !important","rgba(29, 23, 44, 0.78) !important","#e3e2e9 !important","#c3b2ff !important","#fafbfd !important","transparent !important","#e3e2e9 !important","#c3b2ff38 !important","#181227 !important","transparent !important","transparent !important","linear-gradient(0deg, rgba(19, 14, 32, 0.35), rgba(19, 14, 32, 0.35)), var(--ag-mesh)","#15141b !important"]},{"id":"stock","name":"官方原版","nameDark":"官方原版","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"ag-svg-stock\" x1=\"2\" y1=\"2\" x2=\"14\" y2=\"14\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0%\" stop-color=\"#3B82F6\"/><stop offset=\"100%\" stop-color=\"#64748B\"/></linearGradient></defs><path d=\"M13.5 6.5C13 4.2 11 2.5 8.5 2.5C5.5 2.5 3 4.8 2.6 7.8M13.5 3V6.5H10\" stroke=\"url(#ag-svg-stock)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M2.5 9.5C3 11.8 5 13.5 7.5 13.5C10.5 13.5 13 11.2 13.4 8.2M2.5 13V9.5H6\" stroke=\"url(#ag-svg-stock)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"}];
    const STYLE_VARS_ID = 'antigravity-theme-vars';
    const STYLE_BASE_ID = 'antigravity-theme-base';
    const STYLE_DARK_ID = 'antigravity-theme-dark';
    const LEGACY_STYLE_ID = 'antigravity-active-theme';

    // 为 SVG icon 中的 id / url(#...) 注入作用域后缀，防止顶栏按钮与下拉菜单产生重复 SVG id
    function renderThemeIcon(iconSvg, scope) {
        if (!iconSvg) return '';
        return iconSvg
            .replace(/id="(ag-svg-[^"]+)"/g, `id="$1-${scope}"`)
            .replace(/url\(#(ag-svg-[^)]+)\)/g, `url(#$1-${scope})`);
    }

    // 宿主外壳类名契约（铁律）：深浅模式全权交由 Antigravity 原生控制（Settings -> Appearance 调节）。
    function isEffectiveDark() {
        return isDarkMode();
    }

    function themeVarsCssFor(theme, dark) {
        if (!theme || theme.id === 'stock') return '';
        const useDark = dark === undefined ? isEffectiveDark() : Boolean(dark);
        const cacheKey = useDark ? '_varsDark' : '_varsLight';
        if (theme[cacheKey] !== undefined) return theme[cacheKey];
        const vals = useDark ? theme.td : theme.t;
        let vars = '';
        if (Array.isArray(vals)) {
            for (let i = 0; i < TOKEN_KEYS.length; i++) {
                const v = vals[i];
                if (v) vars += TOKEN_KEYS[i] + ':' + v + ';';
            }
        } else {
            const tok = useDark ? theme.tokensDark : theme.tokens;
            if (!tok) return '';
            for (const [k, v] of Object.entries(tok)) {
                vars += `${k}:${v};`;
            }
        }
        const css = vars ? `:root{${vars}}` : '';
        theme[cacheKey] = css;
        return css;
    }

    function currentThemeKey(theme, dark) {
        if (!theme || theme.id === 'stock') return 'stock';
        const useDark = dark === undefined ? isEffectiveDark() : Boolean(dark);
        return `${theme.id}:${useDark ? 'dark' : 'light'}`;
    }

    function themeNameFor(theme, isDark) {
        if (!theme) return '';
        const dark = (isDark === undefined) ? isEffectiveDark() : isDark;
        return (dark && theme.nameDark) ? theme.nameDark : theme.name;
    }

    let userInteractionEpoch = 0;
    let nativeWriteQueue = Promise.resolve();

    function queueNativeUpdate(patch) {
        if (!(window.nativeStorage && typeof window.nativeStorage.updateItems === 'function')) return;
        nativeWriteQueue = nativeWriteQueue.then(() => {
            return Promise.resolve(window.nativeStorage.updateItems(patch)).catch(() => {});
        }).catch(() => {});
    }

    let lastAppliedOverlay = null;
    let lastIsDark = null;
    let lastEffectiveDark = null;
    let lastActiveId = null;
    let modalChromeActive = false;
    let modalChromeThemeId = null;
    let modalChromeDark = null;
    let activeModalOverlay = null;
    let titleBarGuardUnwritable = false;

    const THEME_PREF_KEY = 'custom-theme-id';

    function saveThemePref(themeId, persistNative) {
        try {
            localStorage.setItem('antigravity_selected_theme', themeId);
        } catch (e) {}
        if (persistNative === false) return;
        userInteractionEpoch++;
        queueNativeUpdate({ [THEME_PREF_KEY]: themeId });
    }

    const LEGACY_THEME_ID_MAP = {
        gemini: 'prism',
        sky: 'zenith',
        cyan: 'lagoon',
        orange: 'solar',
        red: 'nova',
        purple: 'nebula'
    };

    function normalizeThemeId(rawId) {
        if (!rawId) return '';
        return LEGACY_THEME_ID_MAP[rawId] || rawId;
    }

    function activeThemeId() {
        return lastActiveId || getActiveThemeId();
    }

    function reconcileAllPrefs() {
        try {
            if (!(window.nativeStorage && typeof window.nativeStorage.getItems === 'function')) return;
            const startEpoch = userInteractionEpoch;
            Promise.resolve(window.nativeStorage.getItems()).then((items) => {
                if (userInteractionEpoch !== startEpoch || !items) return;
                const savedTheme = normalizeThemeId(items[THEME_PREF_KEY]);
                let targetTheme = activeThemeId();
                let themeChanged = false;
                if (savedTheme && savedTheme !== lastActiveId && THEMES.some((t) => t.id === savedTheme)) {
                    targetTheme = savedTheme;
                    themeChanged = true;
                }
                if (themeChanged) {
                    applyTheme(targetTheme, false);
                }
            }).catch(() => {});
        } catch (e) {}
    }

    const MODAL_PULSE_MS = 120;
    const MODAL_PULSE_STEP = 16;
    const MODAL_CLOSE_GRACE_MS = 450;
    let modalChromePulseTimer = null;
    let modalChromePulseEnd = 0;
    let modalChromePulseSession = false;
    let modalChromeCloseIntentUntil = 0;
    let modalChromeCloseIntentTimer = null;
    let modalChromeDismissedNode = null;
    let modalDismissListenersInstalled = false;

    function isDarkMode() {
        try {
            return (document.body && (
                       document.body.classList.contains('dark') ||
                       document.body.classList.contains('theme-dark') ||
                       document.body.classList.contains('dark-theme')
                   )) ||
                   document.documentElement.classList.contains('dark') ||
                   document.documentElement.classList.contains('theme-dark') ||
                   document.documentElement.classList.contains('dark-theme');
        } catch (e) {
            return false;
        }
    }

    function actualSurfaceIsDark() {
        const candidates = [];
        const toolbar = document.querySelector('[data-testid="pane-titlebar-toolbar"]');
        if (toolbar) candidates.push(toolbar);
        if (document.body) candidates.push(document.body);
        candidates.push(document.documentElement);
        for (const el of candidates) {
            if (!el) continue;
            const c = parseCssColor(getComputedStyle(el).backgroundColor);
            if (!c || c[3] < 0.2) continue;
            const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
            return lum < 0.55;
        }
        return null;
    }

    function resolveSelectorDark(activeId) {
        if (activeId === 'stock') {
            const sampled = actualSurfaceIsDark();
            if (sampled !== null) return sampled;
            return isDarkMode();
        }
        return isEffectiveDark();
    }

    function getActiveThemeId() {
        try {
            const stored = normalizeThemeId(localStorage.getItem('antigravity_selected_theme'));
            if (stored && THEMES.some((t) => t.id === stored)) return stored;
            return 'orbital';
        } catch (e) {
            return 'orbital';
        }
    }

    function getTheme(id) {
        return THEMES.find(t => t.id === id) || THEMES[0];
    }

    // 把任意 CSS 颜色解析为 [r,g,b,a]，支持 3/4/6/8 位 Hex、rgb/rgba、color(srgb r g b / a)
    function parseCssColor(str) {
        if (!str || str === 'none' || str === 'transparent') return null;
        let m = str.match(/^#([0-9a-fA-F]{3,8})$/);
        if (m) {
            let h = m[1];
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            else if (h.length === 4) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
            if (h.length === 6) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1];
            if (h.length === 8) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), parseInt(h.slice(6,8),16) / 255];
        }
        m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+%?))?\s*\)/);
        if (m) {
            let a = 1;
            if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
            return [+m[1], +m[2], +m[3], a];
        }
        m = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?/);
        if (m) {
            let a = 1;
            if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
            return [Math.round(+m[1]*255), Math.round(+m[2]*255), Math.round(+m[3]*255), a];
        }
        return null;
    }

    function toHex(r, g, b) {
        return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0').toUpperCase()).join('');
    }

    function contrastColor(hex) {
        const c = parseCssColor(hex);
        if (!c) return '#1B2A4A';
        const lum = (0.299*c[0] + 0.587*c[1] + 0.114*c[2]) / 255;
        return lum > 0.55 ? '#1B2A4A' : '#FFFFFF';
    }

    // 终端（xterm）浅色基底定向桥接
    try {
        const origGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
        const rootDeclarations = new WeakSet();
        try {
            if (document.documentElement) {
                rootDeclarations.add(document.documentElement.style);
                if (typeof window.getComputedStyle === 'function') {
                    const origGetComputedStyle = window.getComputedStyle;
                    rootDeclarations.add(origGetComputedStyle.call(window, document.documentElement));
                    window.getComputedStyle = function(el, pseudo) {
                        const decl = origGetComputedStyle.call(window, el, pseudo);
                        try {
                            if (el === document.documentElement && !pseudo) rootDeclarations.add(decl);
                        } catch (e) {}
                        return decl;
                    };
                }
            }
        } catch (e) {}

        CSSStyleDeclaration.prototype.getPropertyValue = function(prop) {
            const val = origGetPropertyValue.call(this, prop);
            if (prop === '--background' && val && val.trim() === 'transparent' && activeThemeId() !== 'stock') {
                let isRoot = false;
                try {
                    isRoot = (this === document.documentElement.style) || rootDeclarations.has(this);
                } catch (e) {}
                if (isRoot) {
                    const termBg = origGetPropertyValue.call(this, '--terminal-bg').trim();
                    if (termBg) return termBg;
                }
            }
            return val;
        };
    } catch (e) {}

    // 复用持久隐蔽探测节点，替代每次向 body 插拔 div
    let cssVarProbeEl = null;
    function getCssVarProbe() {
        if (cssVarProbeEl && cssVarProbeEl.isConnected) return cssVarProbeEl;
        const host = document.body || document.documentElement;
        if (!host) return null;
        if (!cssVarProbeEl) {
            cssVarProbeEl = document.createElement('div');
            cssVarProbeEl.setAttribute('aria-hidden', 'true');
            cssVarProbeEl.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;visibility:hidden;pointer-events:none;';
        }
        host.appendChild(cssVarProbeEl);
        return cssVarProbeEl;
    }

    function readCssVarHex(varName, fallback) {
        try {
            const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            if (!raw || raw === 'transparent' || raw === 'inherit' || raw === 'initial' || raw === 'unset') return fallback;

            if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
                return '#' + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3];
            }
            if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;

            const probe = getCssVarProbe();
            if (!probe) return fallback;
            probe.style.color = raw;
            const computed = getComputedStyle(probe).color;
            const c = parseCssColor(computed);
            if (!c || c[3] < 0.95) return fallback;
            return toHex(c[0], c[1], c[2]);
        } catch (e) {}
        return fallback;
    }

    function setAttrIfChanged(el, name, value) {
        if (el.getAttribute(name) !== value) el.setAttribute(name, value);
    }

    function removeAttrIfPresent(el, name) {
        if (el.hasAttribute(name)) el.removeAttribute(name);
    }

    function setPropIfChanged(el, prop, value) {
        if (el.style.getPropertyValue(prop) !== value) el.style.setProperty(prop, value);
    }

    function removePropIfPresent(el, prop) {
        if (el.style.getPropertyValue(prop)) el.style.removeProperty(prop);
    }

    function ensureThemeAttributes(themeId) {
        try {
            const root = document.documentElement;
            if (!themeId || themeId === 'stock') {
                removePropIfPresent(root, '--antigravity-active-theme-id');
                removeAttrIfPresent(root, 'data-ag-custom-theme');
                removeAttrIfPresent(root, 'data-ag-theme-id');
                removeAttrIfPresent(root, 'data-ag-color-scheme');
                removeAttrIfPresent(root, 'data-antigravity-theme');
            } else {
                const theme = getTheme(themeId);
                const darkNow = isEffectiveDark();
                const variantId = darkNow ? (theme.variantIdDark || themeId) : (theme.variantIdLight || themeId);
                setPropIfChanged(root, '--antigravity-active-theme-id', themeId);
                setAttrIfChanged(root, 'data-ag-custom-theme', 'true');
                setAttrIfChanged(root, 'data-ag-theme-id', themeId);
                setAttrIfChanged(root, 'data-ag-color-scheme', darkNow ? 'dark' : 'light');
                setAttrIfChanged(root, 'data-antigravity-theme', variantId);
            }
        } catch (e) {}
    }

    function setStyleDisabled(el, disabled) {
        if (!el) return;
        const targetMedia = disabled ? 'not all' : 'all';
        if (el.media !== targetMedia) el.media = targetMedia;
        if (el.disabled !== disabled) el.disabled = disabled;
    }

    function ensureThemeStyleLayers() {
        const container = document.head || document.documentElement;
        if (!container) return null;
        const legacyEl = document.getElementById(LEGACY_STYLE_ID);
        if (legacyEl) legacyEl.remove();

        let varsEl = document.getElementById(STYLE_VARS_ID);
        let baseEl = document.getElementById(STYLE_BASE_ID);
        let darkEl = document.getElementById(STYLE_DARK_ID);
        let recreated = false;

        if (!varsEl) {
            varsEl = document.createElement('style');
            varsEl.id = STYLE_VARS_ID;
            container.appendChild(varsEl);
            recreated = true;
        }
        if (!baseEl) {
            baseEl = document.createElement('style');
            baseEl.id = STYLE_BASE_ID;
            baseEl.textContent = BASE_CSS;
            container.appendChild(baseEl);
            recreated = true;
        } else if (!baseEl.textContent) {
            baseEl.textContent = BASE_CSS;
            recreated = true;
        }
        if (!darkEl) {
            darkEl = document.createElement('style');
            darkEl.id = STYLE_DARK_ID;
            darkEl.textContent = DARK_DELTA_CSS;
            container.appendChild(darkEl);
            recreated = true;
        } else if (!darkEl.textContent) {
            darkEl.textContent = DARK_DELTA_CSS;
            recreated = true;
        }

        if (varsEl.nextElementSibling !== baseEl) {
            varsEl.after(baseEl);
        }
        if (baseEl.nextElementSibling !== darkEl) {
            baseEl.after(darkEl);
        }

        return { varsEl, baseEl, darkEl, recreated };
    }

    function syncThemeStyleSheets(theme, dark) {
        const layers = ensureThemeStyleLayers();
        if (!layers) return false;
        const { varsEl, baseEl, darkEl, recreated } = layers;
        const isStock = !theme || theme.id === 'stock';
        const useDark = dark === undefined ? isEffectiveDark() : Boolean(dark);
        const desiredKey = currentThemeKey(theme, useDark);

        if (recreated || varsEl.dataset.themeKey !== desiredKey) {
            const nextVars = isStock ? '' : themeVarsCssFor(theme, useDark);
            if (varsEl.textContent !== nextVars) {
                varsEl.textContent = nextVars;
            }
            varsEl.dataset.themeKey = desiredKey;
        }
        setStyleDisabled(varsEl, isStock);
        setStyleDisabled(baseEl, isStock);
        setStyleDisabled(darkEl, isStock || !useDark);
        return recreated;
    }

    function applyTheme(themeId, persistNative) {
        const theme = getTheme(themeId);
        saveThemePref(theme.id, persistNative);

        lastActiveId = theme.id;
        lastEffectiveDark = isEffectiveDark();
        lastIsDark = isDarkMode();

        syncThemeStyleSheets(theme, lastEffectiveDark);
        ensureThemeAttributes(theme.id);

        enforceTitleBarColor(true);
        updateSelectorUI(theme.id);
        syncModalChrome();
        syncAuxPaneState();
    }

    function titleBarBaseColors() {
        const activeId = activeThemeId();
        if (activeId === 'stock') {
            const isDark = isDarkMode();
            return {
                color: readCssVarHex('--sidebar', isDark ? '#161616' : '#FAFAFA'),
                symbolColor: readCssVarHex('--foreground', isDark ? '#CCCCCC' : '#101010')
            };
        }
        const theme = getTheme(activeId);
        const darkNow = isEffectiveDark();
        return {
            color: (darkNow && theme.titlebarColorDark) ? theme.titlebarColorDark : (theme.titlebarColor || '#F3F3F3'),
            symbolColor: (darkNow && theme.symbolColorDark) ? theme.symbolColorDark : (theme.symbolColor || '#1B2A4A')
        };
    }

    function compositeOverBase(overlayColor, baseColor) {
        const c = parseCssColor(overlayColor);
        if (!c) return null;
        if (c[3] >= 0.95) return toHex(c[0], c[1], c[2]);
        if (c[3] < 0.05) return null;
        const base = parseCssColor(baseColor);
        if (!base) return null;
        const a = c[3];
        return toHex(
            c[0] * a + base[0] * (1 - a),
            c[1] * a + base[1] * (1 - a),
            c[2] * a + base[2] * (1 - a)
        );
    }

    let lastSyncedSurfaceColor = null;

    function safeSetTitleBarOverlay(overlay, forceSurfaceSync = false) {
        try {
            window.electronNative?.setTitleBarOverlay?.(overlay);
        } catch (e) {}
        try {
            const rawColor = overlay && overlay.color;
            if (rawColor) {
                let hex = rawColor;
                if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
                    const parsed = parseCssColor(rawColor);
                    if (parsed) hex = toHex(parsed[0], parsed[1], parsed[2]);
                }
                if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
                    const normalized = hex.toUpperCase();
                    if (forceSurfaceSync || normalized !== lastSyncedSurfaceColor) {
                        lastSyncedSurfaceColor = normalized;
                        window.electronNative?.wcvBrowser?.setThemeColor?.(normalized);
                    }
                }
            }
        } catch (e) {}
    }

    function enforceTitleBarColor(force = false) {
        const base = titleBarBaseColors();
        if (!force && lastAppliedOverlay &&
            lastAppliedOverlay.color === base.color &&
            lastAppliedOverlay.symbolColor === base.symbolColor &&
            lastAppliedOverlay.height === 30) {
            return;
        }
        lastAppliedOverlay = { color: base.color, symbolColor: base.symbolColor, height: 30 };
        safeSetTitleBarOverlay(lastAppliedOverlay, force);
    }

    const MODAL_SELECTOR = [
        '[data-testid="media-modal"]',
        '[data-testid="mermaid-lightbox-viewport"]',
        '.settings-modal-backdrop',
        '[role="dialog"].settings-modal-container',
        '[role="dialog"][aria-label="Settings"]'
    ].join(', ');
    const SETTINGS_WRAP_SELECTOR = 'div:has(> [role="dialog"][aria-label="Settings"])';

    function installTitleBarOverlayGuard() {
        const native = window.electronNative;
        if (!native) return false;
        try {
            const wcv = native.wcvBrowser;
            if (wcv && typeof wcv.setThemeColor === 'function' && !wcv.__antigravitySurfaceColorGuardInstalled && !Object.isFrozen(wcv) && !Object.isSealed(wcv)) {
                const wcvDesc = Object.getOwnPropertyDescriptor(wcv, 'setThemeColor');
                if (!wcvDesc || wcvDesc.writable || wcvDesc.set) {
                    const origSetThemeColor = wcv.setThemeColor.bind(wcv);
                    wcv.__antigravityOriginalSetThemeColor = origSetThemeColor;
                    wcv.setThemeColor = function (hex, ...rest) {
                        if (modalChromeActive && activeModalOverlay && activeModalOverlay.color) {
                            return origSetThemeColor(activeModalOverlay.color, ...rest);
                        }
                        if (activeThemeId() !== 'stock' && lastAppliedOverlay && lastAppliedOverlay.color && (!hex || hex === 'transparent')) {
                            return origSetThemeColor(lastAppliedOverlay.color, ...rest);
                        }
                        return origSetThemeColor(hex, ...rest);
                    };
                    wcv.__antigravitySurfaceColorGuardInstalled = true;
                }
            }
        } catch (e) {}
        if (titleBarGuardUnwritable) return false;
        if (typeof native.setTitleBarOverlay !== 'function') return false;
        if (native.__antigravityTitleBarGuardInstalled) return true;
        if (Object.isFrozen(native) || Object.isSealed(native)) {
            titleBarGuardUnwritable = true;
            return false;
        }
        const desc = Object.getOwnPropertyDescriptor(native, 'setTitleBarOverlay');
        if (desc && !desc.writable && !desc.set) {
            titleBarGuardUnwritable = true;
            return false;
        }
        const original = native.setTitleBarOverlay.bind(native);
        try {
            native.__antigravityOriginalSetTitleBarOverlay = original;
            native.setTitleBarOverlay = function (...args) {
                if (modalChromeActive && activeModalOverlay) {
                    return original(activeModalOverlay);
                }
                return original(...args);
            };
            native.__antigravityTitleBarGuardInstalled = true;
            return true;
        } catch (e) {
            titleBarGuardUnwritable = true;
            return false;
        }
    }

    function isVisibleNode(el) {
        if (!el || !el.isConnected) return false;
        try {
            if (el.offsetWidth <= 1 && el.offsetHeight <= 1) return false;
            const cs = getComputedStyle(el);
            return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
        } catch (e) {
            return true;
        }
    }

    function visibleModal(selector) {
        let nodes;
        try {
            nodes = document.querySelectorAll(selector);
        } catch (e) {
            return null;
        }
        for (const el of nodes) {
            if (isVisibleNode(el)) return el;
        }
        return null;
    }

    function collectVisibleModals() {
        const state = { any: null, media: null, mermaid: null, settingsBackdrop: null, settingsDialog: null };
        let nodes;
        try {
            nodes = document.querySelectorAll(MODAL_SELECTOR);
        } catch (e) {
            return state;
        }
        for (const el of nodes) {
            if (!isVisibleNode(el)) continue;
            if (!state.any) state.any = el;
            if (!state.media && el.matches('[data-testid="media-modal"]')) state.media = el;
            if (!state.mermaid && el.matches('[data-testid="mermaid-lightbox-viewport"]')) state.mermaid = el;
            if (!state.settingsBackdrop && el.classList.contains('settings-modal-backdrop')) state.settingsBackdrop = el;
            if (!state.settingsDialog && el.matches('[role="dialog"].settings-modal-container, [role="dialog"][aria-label="Settings"]')) state.settingsDialog = el;
        }
        return state;
    }

    function coversViewport(el) {
        if (!el) return false;
        try {
            const rect = el.getBoundingClientRect();
            return rect.width >= innerWidth * 0.9 && rect.height >= innerHeight * 0.9;
        } catch (e) {
            return false;
        }
    }

    function applyModalChrome(force, modalState) {
        const activeId = activeThemeId();
        const snapshot = modalState || collectVisibleModals();
        const mediaModal = snapshot.media;
        const mermaidViewport = snapshot.mermaid;
        const settingsBackdrop = snapshot.settingsBackdrop;
        const settingsDialog = snapshot.settingsDialog;
        if (!mediaModal && !mermaidViewport && !settingsBackdrop && !settingsDialog) return;

        const darkNow = isEffectiveDark();
        if (modalChromeActive && modalChromeThemeId === activeId && modalChromeDark === darkNow && !force) return;

        const baseColors = titleBarBaseColors();
        let rawColor = null;

        if (mediaModal) {
            rawColor = getComputedStyle(mediaModal).backgroundColor;
        } else if (mermaidViewport) {
            const backdrop = document.querySelector('div[class*="animate-backdropFadeIn"]:has(~ * [data-testid="mermaid-lightbox-viewport"])');
            if (backdrop) rawColor = getComputedStyle(backdrop).backgroundColor;
        } else {
            let settingsWrap = null;
            if (!settingsBackdrop && settingsDialog) {
                settingsWrap = visibleModal(SETTINGS_WRAP_SELECTOR);
                if (settingsWrap && !coversViewport(settingsWrap)) settingsWrap = null;
            }
            let layer = settingsBackdrop || settingsWrap;
            let layerBg = layer ? parseCssColor(getComputedStyle(layer).backgroundColor) : null;
            if ((!layer || !layerBg || layerBg[3] < 0.05) && settingsDialog) {
                let node = settingsDialog.parentElement;
                while (node && node !== document.body) {
                    const c = parseCssColor(getComputedStyle(node).backgroundColor);
                    if (c && c[3] > 0.05 && coversViewport(node)) { layer = node; layerBg = c; break; }
                    node = node.parentElement;
                }
            }
            if (!layer || !layerBg || layerBg[3] < 0.05) {
                const rect = settingsDialog ? settingsDialog.getBoundingClientRect() : null;
                const dialogFullscreen = !!rect && rect.width >= innerWidth * 0.9 && rect.height >= innerHeight * 0.9;
                layer = dialogFullscreen ? settingsDialog : null;
            }
            rawColor = layer ? getComputedStyle(layer).backgroundColor : null;
        }

        let color = compositeOverBase(rawColor, baseColors.color);

        if (!color && (mediaModal || mermaidViewport)) {
            const varColor = readCssVarHex('--media-modal-bg', isDarkMode() ? '#18181B' : '#E4E4E7');
            color = compositeOverBase(varColor, baseColors.color);
        }

        if (!color) {
            let base = parseCssColor(baseColors.color);
            if (!base && document.body) {
                base = parseCssColor(getComputedStyle(document.body).backgroundColor);
            }
            if (!base || base[3] < 0.05) {
                base = parseCssColor(getComputedStyle(document.documentElement).backgroundColor);
            }
            if (!base) return;
            let r = base[0], g = base[1], b = base[2];
            const layers = [];
            const portals = document.body ? document.body.children : [];
            for (const el of portals) {
                const cs = getComputedStyle(el);
                if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
                if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
                const c = parseCssColor(cs.backgroundColor);
                if (!c || c[3] <= 0.01) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width < innerWidth * 0.9 || rect.height < innerHeight * 0.9) continue;
                layers.push({ z: parseInt(cs.zIndex, 10) || 0, c });
            }
            layers.sort((m, n) => m.z - n.z);
            for (const { c } of layers) {
                const a = c[3];
                r = c[0] * a + r * (1 - a);
                g = c[1] * a + g * (1 - a);
                b = c[2] * a + b * (1 - a);
            }
            color = toHex(r, g, b);
        }

        modalChromeActive = true;
        modalChromeThemeId = activeId;
        modalChromeDark = darkNow;

        const overlay = { color: color, symbolColor: contrastColor(color), height: 30 };
        activeModalOverlay = overlay;
        lastAppliedOverlay = overlay;
        safeSetTitleBarOverlay(overlay);
    }

    function restoreModalChrome() {
        if (!modalChromeActive) {
            activeModalOverlay = null;
            return;
        }
        modalChromeActive = false;
        modalChromeThemeId = null;
        modalChromeDark = null;
        activeModalOverlay = null;

        const baseColors = titleBarBaseColors();
        lastAppliedOverlay = { color: baseColors.color, symbolColor: baseColors.symbolColor, height: 30 };
        safeSetTitleBarOverlay(lastAppliedOverlay, true);
    }

    function stopModalChromePulse() {
        if (modalChromePulseTimer !== null) {
            clearTimeout(modalChromePulseTimer);
            modalChromePulseTimer = null;
        }
        modalChromePulseEnd = 0;
        modalChromePulseSession = false;
    }

    function startModalChromePulse() {
        if (modalChromePulseSession) return;
        modalChromePulseSession = true;
        modalChromePulseEnd = performance.now() + MODAL_PULSE_MS;
        const tick = () => {
            modalChromePulseTimer = null;
            if (!modalChromeActive) return;
            if (performance.now() < modalChromeCloseIntentUntil) return;
            if (performance.now() > modalChromePulseEnd) return;
            const still = collectVisibleModals();
            if (!still.any) {
                stopModalChromePulse();
                restoreModalChrome();
                return;
            }
            applyModalChrome(true, still);
            if (performance.now() < modalChromePulseEnd) {
                modalChromePulseTimer = setTimeout(tick, MODAL_PULSE_STEP);
            }
        };
        modalChromePulseTimer = setTimeout(tick, MODAL_PULSE_STEP);
    }

    function clearModalCloseIntent() {
        modalChromeCloseIntentUntil = 0;
        modalChromeDismissedNode = null;
        if (modalChromeCloseIntentTimer !== null) {
            clearTimeout(modalChromeCloseIntentTimer);
            modalChromeCloseIntentTimer = null;
        }
    }

    function beginModalDismiss() {
        if (!modalChromeActive) return;
        const snapshot = collectVisibleModals();
        modalChromeDismissedNode = snapshot.any;
        modalChromeCloseIntentUntil = performance.now() + MODAL_CLOSE_GRACE_MS;
        stopModalChromePulse();
        restoreModalChrome();
        if (modalChromeCloseIntentTimer !== null) clearTimeout(modalChromeCloseIntentTimer);
        modalChromeCloseIntentTimer = setTimeout(() => {
            modalChromeCloseIntentTimer = null;
            modalChromeCloseIntentUntil = 0;
            modalChromeDismissedNode = null;
            if (collectVisibleModals().any) syncModalChrome();
        }, MODAL_CLOSE_GRACE_MS);
    }

    function isModalDismissTarget(target) {
        if (!target || target.nodeType !== 1) return false;
        const modal = target.closest(MODAL_SELECTOR);
        if (!modal) return false;
        if (target === modal) return true;
        if (modal.classList.contains('settings-modal-backdrop') && !target.closest('[role="dialog"]')) return true;
        const control = target.closest('button, [role="button"]');
        if (!control || !modal.contains(control)) return false;
        const label = ((control.getAttribute('aria-label') || '') + ' ' + (control.getAttribute('title') || '')).toLowerCase();
        const testid = (control.getAttribute('data-testid') || '').toLowerCase();
        return testid.indexOf('close') >= 0 ||
            /(^|[\s_-])(close|dismiss)([\s_-]|$)/.test(label) ||
            label.indexOf('关闭') >= 0;
    }

    function installModalDismissListeners() {
        if (modalDismissListenersInstalled) return;
        modalDismissListenersInstalled = true;
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !modalChromeActive) return;
            beginModalDismiss();
        }, true);
        document.addEventListener('click', (e) => {
            if (!modalChromeActive || !isModalDismissTarget(e.target)) return;
            beginModalDismiss();
        }, true);
    }

    let auxPaneResizingUntil = 0;

    function syncModalChrome() {
        const modals = collectVisibleModals();
        if (performance.now() < modalChromeCloseIntentUntil) {
            if (!modals.any) {
                clearModalCloseIntent();
                stopModalChromePulse();
                restoreModalChrome();
                return;
            }
            if (modals.any === modalChromeDismissedNode) return;
            clearModalCloseIntent();
        }
        if (modals.any) {
            applyModalChrome(false, modals);
            startModalChromePulse();
        } else {
            clearModalCloseIntent();
            stopModalChromePulse();
            restoreModalChrome();
        }
    }

    function syncThemeState() {
        const activeId = activeThemeId();
        const currentDark = isDarkMode();
        const currentEffectiveDark = isEffectiveDark();
        if (currentDark === lastIsDark && currentEffectiveDark === lastEffectiveDark) return;
        lastIsDark = currentDark;
        const effectiveChanged = currentEffectiveDark !== lastEffectiveDark;
        lastEffectiveDark = currentEffectiveDark;

        if (effectiveChanged) {
            ensureThemeAttributes(activeId);
            syncThemeStyleSheets(getTheme(activeId), currentEffectiveDark);
            enforceTitleBarColor(true);
            syncModalChrome();
        }
        updateSelectorUI(activeId);
    }

    function syncAuxPaneState() {
        try {
            const root = document.documentElement;
            if (!root.hasAttribute('data-ag-custom-theme')) {
                removeAttrIfPresent(root, 'data-aux-pane-maximized');
                return;
            }
            const btns = document.querySelectorAll('[data-testid="toggle-maximize-pane"]');
            let maximized = false;
            for (const btn of btns) {
                if (btn.getAttribute('aria-label') === 'Restore Pane') { maximized = true; break; }
            }
            if (maximized) setAttrIfChanged(root, 'data-aux-pane-maximized', 'true');
            else removeAttrIfPresent(root, 'data-aux-pane-maximized');
        } catch (e) {}
    }

    if (!window.__antigravityAuxPaneListenersAttached) {
        window.__antigravityAuxPaneListenersAttached = true;
        document.addEventListener('click', (e) => {
            if (activeThemeId() === 'stock') return;
            const target = e.target && e.target.closest
                ? e.target.closest('[data-testid="toggle-maximize-pane"]')
                : null;
            if (target) {
                auxPaneResizingUntil = performance.now() + 350;
                setTimeout(syncAuxPaneState, 50);
                setTimeout(syncAuxPaneState, 200);
                setTimeout(syncAuxPaneState, 360);
            }
        }, true);
    }

    function themePreviewSwatches(t, isDark) {
        if (!t || t.id === 'stock') {
            return isDark
                ? { base: '#18181b', accent: '#6b7280' }
                : { base: '#f4f4f5', accent: '#6b7280' };
        }
        let rawAccent = '';
        const vals = (isDark && t.td) ? t.td : t.t;
        if (Array.isArray(vals) && PRIMARY_TOKEN_IDX >= 0) {
            rawAccent = vals[PRIMARY_TOKEN_IDX] || '';
        } else {
            const rawTokens = (isDark && t.tokensDark) ? t.tokensDark : (t.tokens || {});
            rawAccent = rawTokens['--primary'] || '';
        }
        const accent = String(rawAccent).replace(/\s*!important\s*$/i, '').trim() || (isDark ? '#86C1FF' : '#005697');
        const base = (isDark ? t.titlebarColorDark : t.titlebarColor) || (isDark ? '#10151c' : '#ecf1f5');
        return { base, accent };
    }

    function updateSelectorUI(activeId) {
        const theme = getTheme(activeId);
        const isDarkTheme = resolveSelectorDark(activeId);
        const effectiveDark = isEffectiveDark();
        const iconEl = document.getElementById('antigravity-theme-icon');
        const btn = document.getElementById('antigravity-theme-btn');
        const dropdown = document.getElementById('antigravity-theme-dropdown');
        const labelText = themeNameFor(theme, effectiveDark);
        const swatchRing = isDarkTheme ? 'rgba(255, 255, 255, 0.24)' : 'rgba(15, 23, 42, 0.16)';

        if (iconEl) iconEl.innerHTML = renderThemeIcon(theme.icon, 'btn');

        if (btn) {
            btn.dataset.themeMode = isDarkTheme ? 'dark' : 'light';
            btn.style.color = isDarkTheme ? '#F3F4F6' : '#374151';
            btn.title = `主题: ${labelText}`;
            btn.setAttribute('aria-label', `切换主题 (${labelText})`);
        }

        if (dropdown) {
            if (activeId !== 'stock') {
                const fallbackBg = isDarkTheme ? 'rgba(18, 24, 34, 0.78)' : 'rgba(248, 251, 255, 0.88)';
                const fallbackBorder = isDarkTheme ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.10)';
                const fallbackShadow = isDarkTheme
                    ? '0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)'
                    : '0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)';
                dropdown.style.background = `var(--ag-surface-popover, ${fallbackBg})`;
                dropdown.style.borderColor = `var(--ag-popover-border, ${fallbackBorder})`;
                dropdown.style.boxShadow = `var(--ag-shadow-popover, ${fallbackShadow})`;
            } else if (isDarkTheme) {
                dropdown.style.background = 'rgba(24, 24, 27, 0.94)';
                dropdown.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                dropdown.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)';
            } else {
                dropdown.style.background = 'rgba(255, 255, 255, 0.96)';
                dropdown.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                dropdown.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)';
            }
        }

        document.querySelectorAll('.antigravity-theme-item').forEach(el => {
            const tid = el.dataset.themeId;
            const isCurrent = tid === activeId;
            const t = getTheme(tid);
            el.style.color = isDarkTheme ? '#F3F4F6' : '#1B2A4A';
            el.style.background = isCurrent
                ? (isDarkTheme ? 'rgba(66, 133, 244, 0.25)' : 'rgba(66, 133, 244, 0.12)')
                : 'transparent';
            el.style.fontWeight = isCurrent ? '600' : 'normal';
            const nameSpan = el.querySelector('.antigravity-theme-item-text');
            if (nameSpan && t) {
                nameSpan.textContent = themeNameFor(t, effectiveDark);
            }
            if (t) {
                const swatch = themePreviewSwatches(t, effectiveDark);
                const baseDot = el.querySelector('.ag-swatch-base');
                const accentDot = el.querySelector('.ag-swatch-accent');
                if (baseDot) {
                    baseDot.style.background = swatch.base;
                    baseDot.style.borderColor = swatchRing;
                }
                if (accentDot) {
                    accentDot.style.background = swatch.accent;
                    accentDot.style.borderColor = swatchRing;
                }
            }
        });

        const modeHint = document.getElementById('antigravity-theme-mode-hint');
        if (modeHint) {
            modeHint.textContent = effectiveDark ? '深色外观 · 跟随宿主' : '浅色外观 · 跟随宿主';
            modeHint.style.borderTopColor = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
            modeHint.style.color = isDarkTheme ? 'rgba(243, 244, 246, 0.56)' : 'rgba(27, 42, 74, 0.54)';
        }
    }

    let lastToolbarNodes = [];

    function sameElementList(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function findActiveToolbar(toolbarsInput) {
        const toolbars = toolbarsInput || Array.from(document.querySelectorAll('[data-testid="pane-titlebar-toolbar"]'));
        if (!toolbars.length) return null;
        const measured = [];
        for (const el of toolbars) {
            try {
                if (el.closest('[aria-hidden="true"]')) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    measured.push({ el, rect });
                }
            } catch (e) {}
        }
        if (measured.length === 1) return measured[0].el;
        if (measured.length > 1) {
            measured.sort((a, b) => {
                if (Math.abs(a.rect.top - b.rect.top) > 12) return a.rect.top - b.rect.top;
                return b.rect.right - a.rect.right;
            });
            return measured[0].el;
        }
        return toolbars[0] || null;
    }

    function ensureSelectorMounted(forceLayoutCheck = false) {
        const toolbars = Array.from(document.querySelectorAll('[data-testid="pane-titlebar-toolbar"]'));
        if (!toolbars.length) {
            lastToolbarNodes = [];
            return;
        }
        const listChanged = !sameElementList(toolbars, lastToolbarNodes);
        if (!forceLayoutCheck && !listChanged) {
            const existing = document.getElementById('antigravity-theme-selector');
            if (existing && existing.isConnected) {
                const parentTb = existing.closest('[data-testid="pane-titlebar-toolbar"]');
                if (parentTb && !parentTb.closest('[aria-hidden="true"]')) {
                    return;
                }
            }
        }
        lastToolbarNodes = toolbars;
        mountThemeSelector(toolbars);
    }

    function resolveToolbarMountTarget(toolbar) {
        if (!toolbar) return null;
        try {
            for (const child of toolbar.children) {
                if (child.tagName !== 'DIV') continue;
                const inlineStyle = child.getAttribute('style') || '';
                const appRegion = child.style && (child.style.webkitAppRegion || child.style.appRegion);
                if (appRegion === 'no-drag' || /app-region\s*:\s*no-drag/i.test(inlineStyle) || child.classList.contains('flex')) {
                    return child;
                }
            }
        } catch (e) {}
        return toolbar;
    }

    function applyNoDragStyle(el) {
        if (!el || !el.style) return;
        try {
            el.style.setProperty('-webkit-app-region', 'no-drag', 'important');
            el.style.setProperty('app-region', 'no-drag', 'important');
        } catch (e) {}
    }

    function setDropdownOpenState(dropdown, open, btn) {
        if (!dropdown) return;
        const targetBtn = btn || document.getElementById('antigravity-theme-btn');
        if (open) {
            if (targetBtn) {
                const rect = targetBtn.getBoundingClientRect();
                const ddWidth = Math.max(Math.round(rect.width), 168);
                const rightAnchor = rect.right || (rect.left + rect.width);
                const maxLeft = Math.max(8, (window.innerWidth || 1200) - ddWidth - 8);
                const left = Math.max(8, Math.min(Math.round(rightAnchor - ddWidth), maxLeft));
                dropdown.style.top = `${Math.round(rect.bottom + 6)}px`;
                dropdown.style.left = `${left}px`;
                dropdown.style.right = 'auto';
                dropdown.style.width = `${ddWidth}px`;
                dropdown.style.minWidth = 'unset';
                dropdown.style.boxSizing = 'border-box';
                targetBtn.setAttribute('aria-expanded', 'true');
            }
            dropdown.style.display = 'block';
            dropdown.setAttribute('data-browser-occluder', 'true');
        } else {
            if (targetBtn) targetBtn.setAttribute('aria-expanded', 'false');
            dropdown.style.display = 'none';
            dropdown.removeAttribute('data-browser-occluder');
        }
    }

    function mountThemeSelector(toolbarsInput) {
        const toolbars = toolbarsInput || Array.from(document.querySelectorAll('[data-testid="pane-titlebar-toolbar"]'));
        lastToolbarNodes = toolbars;
        const toolbar = findActiveToolbar(toolbars);
        const mountTarget = resolveToolbarMountTarget(toolbar);
        if (!toolbar || !mountTarget || !document.body) return;

        const existing = document.getElementById('antigravity-theme-selector');
        if (existing) {
            if (mountTarget.contains(existing)) return;
            existing.remove();
        }

        const currentId = activeThemeId();
        const currentTheme = getTheme(currentId);

        const container = document.createElement('div');
        container.id = 'antigravity-theme-selector';
        container.style.cssText = 'position: relative; display: inline-flex; align-items: center; margin-right: 2px; flex: 0 0 auto; user-select: none; pointer-events: auto; z-index: 10000;';
        applyNoDragStyle(container);

        const initialLabel = themeNameFor(currentTheme, isEffectiveDark());
        const btn = document.createElement('button');
        btn.id = 'antigravity-theme-btn';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', `切换主题 (${initialLabel})`);
        btn.title = `主题: ${initialLabel}`;
        btn.style.cssText = `
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 26px;
            width: 26px;
            min-width: 26px;
            max-width: 26px;
            padding: 0;
            color: #374151;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 6px;
            box-shadow: none;
            cursor: pointer;
            transition: opacity 0.15s ease, filter 0.15s ease, background-color 0.15s ease;
            outline: none;
            font-family: inherit;
            line-height: 1;
            flex: 0 0 auto;
            user-select: none;
            pointer-events: auto;
        `;
        applyNoDragStyle(btn);

        btn.innerHTML = `<span id="antigravity-theme-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; line-height: 1;">${renderThemeIcon(currentTheme.icon, 'btn')}</span><span id="antigravity-theme-update-dot" style="display: none; position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background: #3B82F6; box-shadow: 0 0 0 1.5px rgba(255,255,255,0.85); pointer-events: none;"></span>`;

        let dropdown = document.getElementById('antigravity-theme-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'antigravity-theme-dropdown';
            document.body.appendChild(dropdown);
        }

        dropdown.style.cssText = `
            display: none;
            position: fixed;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
            padding: 4px;
            box-sizing: border-box;
            max-height: 310px;
            overflow-y: auto;
            scrollbar-width: thin;
            pointer-events: auto;
            z-index: 9999999;
        `;
        dropdown.removeAttribute('data-browser-occluder');
        applyNoDragStyle(dropdown);
        dropdown.innerHTML = '';

        THEMES.forEach(t => {
            const isCurrent = t.id === currentId;
            const item = document.createElement('div');
            item.className = 'antigravity-theme-item';
            item.dataset.themeId = t.id;
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                color: #1B2A4A;
                transition: background-color 0.12s ease, color 0.12s ease;
                margin-bottom: 2px;
                font-weight: ${isCurrent ? '600' : 'normal'};
                background: ${isCurrent ? 'rgba(66, 133, 244, 0.12)' : 'transparent'};
                box-sizing: border-box;
                pointer-events: auto;
            `;
            applyNoDragStyle(item);
            const effectiveDark = isEffectiveDark();
            const initialDark = resolveSelectorDark(currentId);
            const swatch = themePreviewSwatches(t, effectiveDark);
            const swatchRing = initialDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(15, 23, 42, 0.16)';
            item.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 7px; width: 100%; min-width: 0;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; flex-shrink: 0; line-height: 1;">${renderThemeIcon(t.icon, 'dd-' + t.id)}</span>
                    <span class="antigravity-theme-item-text" style="font-size: 12px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">${themeNameFor(t, effectiveDark)}</span>
                    <span class="antigravity-theme-item-swatch" style="display: inline-flex; align-items: center; flex-shrink: 0; margin-left: 6px;">
                        <span class="ag-swatch-base" style="width: 10px; height: 10px; border-radius: 50%; background: ${swatch.base}; border: 1px solid ${swatchRing}; box-sizing: border-box;"></span>
                        <span class="ag-swatch-accent" style="width: 10px; height: 10px; border-radius: 50%; background: ${swatch.accent}; border: 1px solid ${swatchRing}; margin-left: -3px; box-sizing: border-box;"></span>
                    </span>
                </span>
            `;

            item.onmouseenter = () => {
                if (item.dataset.themeId !== activeThemeId()) {
                    const isDarkTheme = resolveSelectorDark(activeThemeId());
                    item.style.background = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(66, 133, 244, 0.08)';
                }
            };
            item.onmouseleave = () => {
                const isNow = item.dataset.themeId === activeThemeId();
                const isDarkTheme = resolveSelectorDark(activeThemeId());
                item.style.background = isNow
                    ? (isDarkTheme ? 'rgba(66, 133, 244, 0.25)' : 'rgba(66, 133, 244, 0.12)')
                    : 'transparent';
            };
            item.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                applyTheme(t.id);
                setDropdownOpenState(dropdown, false);
            };
            dropdown.appendChild(item);
        });

        const modeHintDark = resolveSelectorDark(currentId);
        const modeHint = document.createElement('div');
        modeHint.id = 'antigravity-theme-mode-hint';
        modeHint.style.cssText = `
            margin-top: 4px;
            padding: 5px 8px 2px;
            border-top: 1px solid ${modeHintDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
            font-size: 10.5px;
            line-height: 1.3;
            color: ${modeHintDark ? 'rgba(243, 244, 246, 0.56)' : 'rgba(27, 42, 74, 0.54)'};
            text-align: center;
            user-select: none;
            pointer-events: none;
        `;
        modeHint.textContent = isEffectiveDark() ? '深色外观 · 跟随宿主' : '浅色外观 · 跟随宿主';
        dropdown.appendChild(modeHint);

        const updateBanner = document.createElement('div');
        updateBanner.id = 'antigravity-theme-update-banner';
        updateBanner.style.cssText = `
            display: none;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
            padding: 5px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.25;
            color: ${modeHintDark ? '#93C5FD' : '#1D4ED8'};
            background: ${modeHintDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.10)'};
            cursor: pointer;
            user-select: none;
            pointer-events: auto;
            transition: background-color 0.15s ease;
        `;
        applyNoDragStyle(updateBanner);
        updateBanner.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetUrl = updateBanner.dataset.releaseUrl || `https://github.com/${THEME_PACK_REPO}/releases/latest`;
            try { window.open(targetUrl, '_blank', 'noopener,noreferrer'); } catch (err) {}
            setDropdownOpenState(dropdown, false);
        };
        dropdown.appendChild(updateBanner);

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            setDropdownOpenState(dropdown, !isOpen, btn);
        };

        if (!window.__antigravityThemeListenersAttached) {
            window.__antigravityThemeListenersAttached = true;
            document.addEventListener('click', (e) => {
                const dd = document.getElementById('antigravity-theme-dropdown');
                const b = document.getElementById('antigravity-theme-btn');
                if (dd && b && !b.contains(e.target) && !dd.contains(e.target)) {
                    setDropdownOpenState(dd, false);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const dd = document.getElementById('antigravity-theme-dropdown');
                    if (dd) setDropdownOpenState(dd, false);
                }
            });

            let resizeAnchorQueued = false;
            window.addEventListener('resize', () => {
                const dd = document.getElementById('antigravity-theme-dropdown');
                if (dd) setDropdownOpenState(dd, false);
                if (!resizeAnchorQueued) {
                    resizeAnchorQueued = true;
                    scheduleFrame(() => {
                        resizeAnchorQueued = false;
                        ensureSelectorMounted(true);
                    });
                }
            });
        }

        container.appendChild(btn);
        mountTarget.insertBefore(container, mountTarget.firstChild);
        updateSelectorUI(currentId);
        renderUpdateBadgeUI();
        checkThemeUpdateOnce();
        enforceTitleBarColor(true);
    }

    const scheduleFrame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 16);

    function isInsideXterm(node) {
        const el = node && (node.nodeType === 1 ? node : node.parentElement);
        return Boolean(el && el.closest && el.closest('.xterm'));
    }

    installTitleBarOverlayGuard();
    installModalDismissListeners();

    applyTheme(getActiveThemeId(), false);
    reconcileAllPrefs();

    try {
        const schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const onSchemeChange = () => {
            syncThemeState();
        };
        if (schemeQuery.addEventListener) schemeQuery.addEventListener('change', onSchemeChange);
        else if (schemeQuery.addListener) schemeQuery.addListener(onSchemeChange);
    } catch (e) {}

    ensureSelectorMounted(true);
    syncModalChrome();
    syncAuxPaneState();

    let bodySchemeObserved = false;
    const schemeObs = new MutationObserver(() => {
        syncThemeState();
    });
    schemeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    function ensureBodySchemeObserved() {
        if (!bodySchemeObserved && document.body) {
            bodySchemeObserved = true;
            schemeObs.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }
    ensureBodySchemeObserved();

    const observedMaximizeBtns = new WeakSet();
    const maximizeObs = new MutationObserver(() => {
        if (activeThemeId() !== 'stock') syncAuxPaneState();
    });
    function attachMaximizeBtnObservers() {
        const btns = document.querySelectorAll('[data-testid="toggle-maximize-pane"]');
        for (const btn of btns) {
            if (observedMaximizeBtns.has(btn)) continue;
            observedMaximizeBtns.add(btn);
            maximizeObs.observe(btn, {
                attributes: true,
                attributeFilter: ['aria-label']
            });
        }
    }
    attachMaximizeBtnObservers();

    let structRafQueued = false;
    const structObs = new MutationObserver((records) => {
        if (structRafQueued) return;
        let hasRelevantMutation = false;
        for (const r of records) {
            if (!r.addedNodes.length && !r.removedNodes.length) continue;
            if (isInsideXterm(r.target)) continue;
            hasRelevantMutation = true;
            break;
        }
        if (!hasRelevantMutation) return;
        structRafQueued = true;
        scheduleFrame(() => {
            structRafQueued = false;
            ensureBodySchemeObserved();
            ensureSelectorMounted(false);
            if (performance.now() >= auxPaneResizingUntil) syncModalChrome();
            if (activeThemeId() !== 'stock') syncAuxPaneState();
            attachMaximizeBtnObservers();
        });
    });
    structObs.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    const SELF_HEAL_INTERVAL_MS = 4000;
    function selfHealTick() {
        try {
            if (document.hidden || !document.body) return;
            ensureBodySchemeObserved();
            installTitleBarOverlayGuard();
            const activeId = activeThemeId();
            const theme = getTheme(activeId);
            ensureThemeAttributes(activeId);
            if (activeId !== 'stock') {
                syncAuxPaneState();
            }
            const recreated = syncThemeStyleSheets(theme, isEffectiveDark());
            if (recreated) {
                enforceTitleBarColor(true);
            }
            ensureSelectorMounted(false);
            attachMaximizeBtnObservers();
        } catch (e) {}
    }
    const selfHealTimerId = setInterval(selfHealTick, SELF_HEAL_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) selfHealTick();
    });
    window.addEventListener('unload', () => {
        clearInterval(selfHealTimerId);
        schemeObs.disconnect();
        structObs.disconnect();
        maximizeObs.disconnect();
    });
})();
