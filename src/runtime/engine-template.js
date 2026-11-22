// Antigravity Theme — Compiled Runtime Engine
// Copyright (c) 2026 Django9944, licensed under the MIT License.
// 自动注入顶栏主题胶囊切换器 + 下拉菜单选择（深浅自适应交由 Antigravity 宿主原生控制）
(() => {
    'use strict';
    if (window.__antigravityThemeEngineLoaded) return;
    window.__antigravityThemeEngineLoaded = true;

    const THEME_PACK_VERSION = __THEME_PACK_VERSION__;
    const THEME_PACK_REPO = __THEME_PACK_REPO__;
    const UPDATE_CACHE_KEY = 'ag_custom_theme_update_cache_v1';
    const UPDATE_CHECK_TTL_MS = 24 * 60 * 60 * 1000;
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

    function checkThemeUpdateOnce() {
        if (window.__antigravityThemeUpdateChecked) return;
        window.__antigravityThemeUpdateChecked = true;
        try {
            const raw = localStorage.getItem(UPDATE_CACHE_KEY);
            if (raw) {
                const cached = JSON.parse(raw);
                if (cached && cached.checkedAt && (Date.now() - cached.checkedAt) < UPDATE_CHECK_TTL_MS && cached.localVersion === THEME_PACK_VERSION) {
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
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data || !data.tag_name) return;
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
            .catch(() => {});
    }

    const BASE_CSS = __BASE_CSS__;
    const DARK_DELTA_CSS = __DARK_DELTA_CSS__;
    const THEMES = __THEMES_JSON__;

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

    function themeCssFor(theme) {
        if (!theme || theme.id === 'stock') return '';
        const dark = isEffectiveDark();
        const cacheKey = dark ? '_cssDark' : '_cssLight';
        if (theme[cacheKey]) return theme[cacheKey];
        const tok = dark ? theme.tokensDark : theme.tokens;
        if (!tok) return '';
        const vars = Object.entries(tok).map(([k, v]) => `${k}:${v};`).join('');
        const css = `:root{${vars}}\n` + BASE_CSS + (dark ? '\n' + DARK_DELTA_CSS : '');
        theme[cacheKey] = css;
        return css;
    }

    function currentThemeKey(theme) {
        if (!theme || theme.id === 'stock') return 'stock';
        return `${theme.id}:${isEffectiveDark() ? 'dark' : 'light'}`;
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
    let modalChromeSyncQueued = false;
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

    function ensureThemeAttributes(themeId) {
        try {
            const root = document.documentElement;
            if (!themeId || themeId === 'stock') {
                root.style.removeProperty('--antigravity-active-theme-id');
                root.removeAttribute('data-ag-custom-theme');
                root.removeAttribute('data-ag-theme-id');
                root.removeAttribute('data-ag-color-scheme');
                root.removeAttribute('data-antigravity-theme');
            } else {
                const theme = getTheme(themeId);
                const darkNow = isEffectiveDark();
                const variantId = darkNow ? (theme.variantIdDark || themeId) : (theme.variantIdLight || themeId);
                root.style.setProperty('--antigravity-active-theme-id', themeId);
                root.setAttribute('data-ag-custom-theme', 'true');
                root.setAttribute('data-ag-theme-id', themeId);
                root.setAttribute('data-ag-color-scheme', darkNow ? 'dark' : 'light');
                root.setAttribute('data-antigravity-theme', variantId);
            }
        } catch (e) {}
    }

    function applyTheme(themeId, persistNative) {
        const theme = getTheme(themeId);
        saveThemePref(theme.id, persistNative);

        lastActiveId = theme.id;
        lastEffectiveDark = isEffectiveDark();
        lastIsDark = isDarkMode();

        let styleEl = document.getElementById('antigravity-active-theme');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'antigravity-active-theme';
            (document.head || document.documentElement).appendChild(styleEl);
        }
        styleEl.textContent = themeCssFor(theme);
        styleEl.dataset.themeKey = currentThemeKey(theme);

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

        let settingsWrap = settingsDialog ? visibleModal(SETTINGS_WRAP_SELECTOR) : null;
        if (settingsWrap && !coversViewport(settingsWrap)) settingsWrap = null;
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

    function scheduleModalChromeSync() {
        if (modalChromeSyncQueued) return;
        if (performance.now() < auxPaneResizingUntil) return;
        modalChromeSyncQueued = true;
        queueMicrotask(() => {
            modalChromeSyncQueued = false;
            syncModalChrome();
        });
    }

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
            if (activeId !== 'stock') {
                const theme = getTheme(activeId);
                let styleEl = document.getElementById('antigravity-active-theme');
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = 'antigravity-active-theme';
                    (document.head || document.documentElement).appendChild(styleEl);
                }
                styleEl.textContent = themeCssFor(theme);
                styleEl.dataset.themeKey = currentThemeKey(theme);
            }
            enforceTitleBarColor(true);
            syncModalChrome();
        }
        updateSelectorUI(activeId);
    }

    function syncAuxPaneState() {
        try {
            const root = document.documentElement;
            if (!root.hasAttribute('data-ag-custom-theme')) {
                root.removeAttribute('data-aux-pane-maximized');
                return;
            }
            const btns = document.querySelectorAll('[data-testid="toggle-maximize-pane"]');
            let maximized = false;
            for (const btn of btns) {
                if (btn.getAttribute('aria-label') === 'Restore Pane') { maximized = true; break; }
            }
            if (maximized) root.setAttribute('data-aux-pane-maximized', 'true');
            else root.removeAttribute('data-aux-pane-maximized');
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
        const rawTokens = (isDark && t.tokensDark) ? t.tokensDark : (t.tokens || {});
        const rawAccent = rawTokens['--primary'] || '';
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

    function findActiveToolbar() {
        const toolbars = Array.from(document.querySelectorAll('[data-testid="pane-titlebar-toolbar"]'));
        if (!toolbars.length) return null;
        const visible = toolbars.filter((el) => {
            try {
                if (el.closest('[aria-hidden="true"]')) return false;
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            } catch (e) { return false; }
        });
        const candidates = visible.length ? visible : toolbars;
        candidates.sort((a, b) => {
            try {
                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();
                if (Math.abs(ra.top - rb.top) > 12) return ra.top - rb.top;
                return rb.right - ra.right;
            } catch (e) { return 0; }
        });
        return candidates[0] || null;
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

    function mountThemeSelector() {
        const toolbar = findActiveToolbar();
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

            window.addEventListener('resize', () => {
                const dd = document.getElementById('antigravity-theme-dropdown');
                if (dd) setDropdownOpenState(dd, false);
            });
        }

        container.appendChild(btn);
        mountTarget.insertBefore(container, mountTarget.firstChild);
        updateSelectorUI(currentId);
        renderUpdateBadgeUI();
        checkThemeUpdateOnce();
        enforceTitleBarColor(true);
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

    mountThemeSelector();
    syncModalChrome();
    syncAuxPaneState();

    const observer = new MutationObserver((records) => {
        if (records && records.length && records.every((r) => {
            const el = r.target && (r.target.nodeType === 1 ? r.target : r.target.parentElement);
            return el && el.closest && el.closest('.xterm');
        })) return;
        mountThemeSelector();
        scheduleModalChromeSync();
        syncThemeState();
        if (activeThemeId() !== 'stock') {
            syncAuxPaneState();
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-label']
    });

    setInterval(() => {
        try {
            if (!document.body) return;
            installTitleBarOverlayGuard();
            const activeId = activeThemeId();
            const theme = getTheme(activeId);
            const desiredKey = currentThemeKey(theme);
            ensureThemeAttributes(activeId);
            if (activeId !== 'stock') {
                syncAuxPaneState();
            }
            let styleEl = document.getElementById('antigravity-active-theme');
            const missing = !styleEl;
            if (missing) {
                styleEl = document.createElement('style');
                styleEl.id = 'antigravity-active-theme';
                (document.head || document.documentElement).appendChild(styleEl);
            }
            if (styleEl.dataset.themeKey !== desiredKey) {
                styleEl.textContent = activeId === 'stock' ? '' : themeCssFor(theme);
                styleEl.dataset.themeKey = desiredKey;
            }
            if (missing) {
                enforceTitleBarColor(true);
                mountThemeSelector();
                return;
            }
            const currentSelector = document.getElementById('antigravity-theme-selector');
            const target = resolveToolbarMountTarget(findActiveToolbar());
            if (target && (!currentSelector || !target.contains(currentSelector))) {
                mountThemeSelector();
            }
        } catch (e) {}
    }, 1000);
})();
