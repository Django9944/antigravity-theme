import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_JS = readFileSync(resolve(ROOT_DIR, 'dist/runtime/current.js'), 'utf8');
const ROOT_MANIFEST = JSON.parse(readFileSync(resolve(ROOT_DIR, 'manifest.json'), 'utf8')) as {
  version: string;
};

const activeWindows: Window[] = [];

async function flushMicrotasks(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

function mockBox(el: object, rect: { left: number; top: number; width: number; height: number }): void {
  const fullRect = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return this;
    },
  };
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => fullRect,
  });
  Object.defineProperty(el, 'offsetWidth', {
    configurable: true,
    get: () => rect.width,
  });
  Object.defineProperty(el, 'offsetHeight', {
    configurable: true,
    get: () => rect.height,
  });
}

function createWindow(setup?: (win: Window) => void): Window {
  const win = new Window({ url: 'https://127.0.0.1/', width: 1200, height: 800 });
  activeWindows.push(win);
  Object.defineProperty(win, 'fetch', {
    configurable: true,
    writable: true,
    value: vi.fn(() => Promise.reject(new Error('network disabled in test'))),
  });
  if (setup) setup(win);
  return win;
}

afterEach(async () => {
  while (activeWindows.length > 0) {
    const win = activeWindows.pop()!;
    await win.happyDOM.close();
  }
  vi.restoreAllMocks();
});

describe('Desktop Runtime Engine (dist/runtime/current.js)', () => {
  it('mounts vars -> base -> dark layers in order and avoids rewriting base/dark on theme or mode switches (F5)', async () => {
    const win = createWindow((w) => {
      w.document.body.innerHTML =
        '<div data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
    });

    win.eval(RUNTIME_JS);

    expect(win.document.getElementById('antigravity-active-theme')).toBeNull();

    const varsEl = win.document.getElementById('antigravity-theme-vars') as {
      nextElementSibling: unknown;
      textContent: string | null;
      disabled: boolean;
      media: string;
    } | null;
    const baseEl = win.document.getElementById('antigravity-theme-base') as {
      nextElementSibling: unknown;
      textContent: string | null;
      disabled: boolean;
      media: string;
    } | null;
    const darkEl = win.document.getElementById('antigravity-theme-dark') as {
      nextElementSibling: unknown;
      textContent: string | null;
      disabled: boolean;
      media: string;
    } | null;
    expect(varsEl).not.toBeNull();
    expect(baseEl).not.toBeNull();
    expect(darkEl).not.toBeNull();
    expect(varsEl!.nextElementSibling).toBe(baseEl);
    expect(baseEl!.nextElementSibling).toBe(darkEl);
    expect(baseEl!.textContent!.length).toBeGreaterThan(50_000);
    expect(darkEl!.textContent!.length).toBeGreaterThan(10_000);
    expect(baseEl!.disabled).toBe(false);
    expect(baseEl!.media).toBe('all');
    expect(darkEl!.disabled).toBe(true);
    expect(darkEl!.media).toBe('not all');

    const elemTextProtoDesc = Object.getOwnPropertyDescriptor(win.Element.prototype, 'textContent')!;
    let baseTextWrites = 0;
    let darkTextWrites = 0;
    Object.defineProperty(baseEl!, 'textContent', {
      configurable: true,
      get() {
        return elemTextProtoDesc.get!.call(this);
      },
      set(v: string) {
        baseTextWrites++;
        elemTextProtoDesc.set!.call(this, v);
      },
    });
    Object.defineProperty(darkEl!, 'textContent', {
      configurable: true,
      get() {
        return elemTextProtoDesc.get!.call(this);
      },
      set(v: string) {
        darkTextWrites++;
        elemTextProtoDesc.set!.call(this, v);
      },
    });

    const clickTheme = (id: string) => {
      const item = win.document.querySelector(
        `.antigravity-theme-item[data-theme-id="${id}"]`,
      ) as { click(): void } | null;
      expect(item).not.toBeNull();
      item!.click();
    };

    clickTheme('prism');
    expect(win.document.documentElement.getAttribute('data-ag-theme-id')).toBe('prism');
    expect(varsEl!.textContent).toContain('--primary:');
    expect(baseEl!.disabled).toBe(false);
    expect(darkEl!.disabled).toBe(true);

    clickTheme('stock');
    expect(win.document.documentElement.hasAttribute('data-ag-custom-theme')).toBe(false);
    expect(varsEl!.textContent).toBe('');
    expect(varsEl!.disabled).toBe(true);
    expect(varsEl!.media).toBe('not all');
    expect(baseEl!.disabled).toBe(true);
    expect(baseEl!.media).toBe('not all');
    expect(darkEl!.disabled).toBe(true);
    expect(darkEl!.media).toBe('not all');

    clickTheme('orbital');
    expect(win.document.documentElement.getAttribute('data-ag-theme-id')).toBe('orbital');
    expect(baseEl!.disabled).toBe(false);
    expect(baseEl!.media).toBe('all');
    expect(darkEl!.disabled).toBe(true);

    win.document.documentElement.classList.add('dark');
    await flushMicrotasks();
    expect(win.document.documentElement.getAttribute('data-ag-color-scheme')).toBe('dark');
    expect(darkEl!.disabled).toBe(false);
    expect(darkEl!.media).toBe('all');

    win.document.documentElement.classList.remove('dark');
    await flushMicrotasks();
    expect(win.document.documentElement.getAttribute('data-ag-color-scheme')).toBe('light');
    expect(darkEl!.disabled).toBe(true);
    expect(darkEl!.media).toBe('not all');

    expect(baseTextWrites).toBe(0);
    expect(darkTextWrites).toBe(0);
  });

  it('coalesces streaming DOM mutations to 1 rAF with 0 getBoundingClientRect calls and ignores .xterm (F1)', async () => {
    let rafQueue: Array<() => void> = [];
    let rafScheduleCount = 0;

    const win = createWindow((w) => {
      w.document.body.innerHTML = [
        '<div id="tb1" data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>',
        '<div id="chat"></div>',
        '<div class="xterm"><div class="xterm-rows"></div></div>',
      ].join('');
      const tb1 = w.document.getElementById('tb1')!;
      mockBox(tb1, { left: 600, top: 0, width: 200, height: 30 });
      Object.defineProperty(w, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: (cb: () => void) => {
          rafScheduleCount++;
          rafQueue.push(cb);
          return rafScheduleCount;
        },
      });
    });

    win.eval(RUNTIME_JS);
    rafQueue = [];
    rafScheduleCount = 0;

    let rectCalls = 0;
    const origGetRect = win.Element.prototype.getBoundingClientRect;
    Object.defineProperty(win.Element.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function (this: Element) {
        rectCalls++;
        return origGetRect.call(this);
      },
    });

    const chat = win.document.getElementById('chat')!;
    for (let i = 0; i < 20; i++) {
      const msg = win.document.createElement('div');
      msg.textContent = `token-${i}`;
      chat.appendChild(msg);
    }
    await flushMicrotasks();

    expect(rafScheduleCount).toBe(1);
    expect(rafQueue.length).toBe(1);
    const pending = rafQueue.splice(0);
    for (const cb of pending) cb();
    expect(rectCalls).toBe(0);

    rafScheduleCount = 0;
    rectCalls = 0;
    const xtermRows = win.document.querySelector('.xterm-rows')!;
    for (let i = 0; i < 20; i++) {
      const span = win.document.createElement('span');
      span.textContent = `row-${i}`;
      xtermRows.appendChild(span);
    }
    await flushMicrotasks();

    expect(rafScheduleCount).toBe(0);
    expect(rafQueue.length).toBe(0);
    expect(rectCalls).toBe(0);
  });

  it('relocates theme selector to rightmost toolbar when split pane opens (F1 regression guard)', async () => {
    const rafQueue: Array<() => void> = [];
    const win = createWindow((w) => {
      w.document.body.innerHTML =
        '<div id="tb1" data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
      const tb1 = w.document.getElementById('tb1')!;
      mockBox(tb1, { left: 0, top: 0, width: 500, height: 30 });
      Object.defineProperty(w, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: (cb: () => void) => {
          rafQueue.push(cb);
          return rafQueue.length;
        },
      });
    });

    win.eval(RUNTIME_JS);
    const tb1 = win.document.getElementById('tb1')!;
    expect(tb1.querySelector('#antigravity-theme-selector')).not.toBeNull();

    const tb2 = win.document.createElement('div');
    tb2.id = 'tb2';
    tb2.setAttribute('data-testid', 'pane-titlebar-toolbar');
    const flex2 = win.document.createElement('div');
    flex2.className = 'flex';
    tb2.appendChild(flex2);
    mockBox(tb2, { left: 500, top: 0, width: 500, height: 30 });
    win.document.body.appendChild(tb2);

    await flushMicrotasks();
    while (rafQueue.length > 0) {
      rafQueue.shift()!();
    }

    expect(tb1.querySelector('#antigravity-theme-selector')).toBeNull();
    expect(tb2.querySelector('#antigravity-theme-selector')).not.toBeNull();
  });

  it('skips SETTINGS_WRAP_SELECTOR query when modal chrome is already active (F8)', async () => {
    const rafQueue: Array<() => void> = [];
    const setOverlayCalls: unknown[] = [];
    const win = createWindow((w) => {
      (w as unknown as { electronNative: unknown }).electronNative = {
        setTitleBarOverlay: (overlay: unknown) => {
          setOverlayCalls.push(overlay);
        },
      };
      w.document.body.style.backgroundColor = 'rgb(255, 255, 255)';
      w.document.body.innerHTML = [
        '<div id="tb1" data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>',
        '<div id="settings-wrap" style="background-color: rgba(0, 0, 0, 0.5)"><div id="settings-dialog" role="dialog" aria-label="Settings">Settings</div></div>',
        '<div id="chat"></div>',
      ].join('');
      mockBox(w.document.getElementById('tb1')!, { left: 600, top: 0, width: 200, height: 30 });
      mockBox(w.document.getElementById('settings-wrap')!, {
        left: 0,
        top: 0,
        width: 1200,
        height: 800,
      });
      mockBox(w.document.getElementById('settings-dialog')!, {
        left: 100,
        top: 100,
        width: 800,
        height: 600,
      });
      Object.defineProperty(w, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: (cb: () => void) => {
          rafQueue.push(cb);
          return rafQueue.length;
        },
      });
    });

    win.eval(RUNTIME_JS);
    expect(setOverlayCalls.length).toBeGreaterThanOrEqual(2);

    const queriedSelectors: string[] = [];
    const origQsa = win.document.querySelectorAll.bind(win.document);
    Object.defineProperty(win.document, 'querySelectorAll', {
      configurable: true,
      value: (selector: string) => {
        queriedSelectors.push(selector);
        return origQsa(selector);
      },
    });

    const node = win.document.createElement('div');
    node.textContent = 'stream';
    win.document.getElementById('chat')!.appendChild(node);
    await flushMicrotasks();
    while (rafQueue.length > 0) {
      rafQueue.shift()!();
    }

    expect(
      queriedSelectors.some((s) => s.includes('div:has(> [role="dialog"][aria-label="Settings"])')),
    ).toBe(false);
  });

  it('avoids redundant root writes in selfHealTick, skips when hidden, and heals on visibilitychange (F4)', () => {
    let capturedTick: (() => void) | null = null;
    let capturedDelay: number | null = null;
    let hiddenFlag = false;

    const win = createWindow((w) => {
      w.document.body.innerHTML =
        '<div id="tb1" data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
      Object.defineProperty(w.document, 'hidden', {
        configurable: true,
        get: () => hiddenFlag,
      });
      const origSetInterval = w.setInterval.bind(w);
      Object.defineProperty(w, 'setInterval', {
        configurable: true,
        writable: true,
        value: (fn: () => void, ms: number) => {
          if (ms >= 1000) {
            capturedTick = fn;
            capturedDelay = ms;
          }
          return origSetInterval(fn, ms);
        },
      });
    });

    win.eval(RUNTIME_JS);
    expect(capturedTick).not.toBeNull();
    expect(capturedDelay).toBe(4000);

    const root = win.document.documentElement;
    const setAttrSpy = vi.spyOn(root, 'setAttribute');
    const removeAttrSpy = vi.spyOn(root, 'removeAttribute');
    const setPropSpy = vi.spyOn(root.style, 'setProperty');

    capturedTick!();
    capturedTick!();
    capturedTick!();
    expect(setAttrSpy).not.toHaveBeenCalled();
    expect(removeAttrSpy).not.toHaveBeenCalled();
    expect(setPropSpy).not.toHaveBeenCalled();

    const qsaSpy = vi.spyOn(win.document, 'querySelectorAll');
    hiddenFlag = true;
    capturedTick!();
    capturedTick!();
    expect(qsaSpy).not.toHaveBeenCalled();

    hiddenFlag = false;
    win.document.dispatchEvent(new win.Event('visibilitychange'));
    expect(qsaSpy).toHaveBeenCalled();
  });

  it('caches failed update checks for 1h and skips fetch when opt-out flag is set (F17)', async () => {
    const fetchFail = vi.fn(() => Promise.reject(new Error('offline')));
    const win1 = createWindow((w) => {
      w.document.body.innerHTML =
        '<div data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
      Object.defineProperty(w, 'fetch', {
        configurable: true,
        writable: true,
        value: fetchFail,
      });
    });

    win1.eval(RUNTIME_JS);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchFail).toHaveBeenCalledTimes(1);
    const cachedRaw = win1.localStorage.getItem('ag_custom_theme_update_cache_v1');
    expect(cachedRaw).toBeTruthy();
    const cached = JSON.parse(cachedRaw!) as {
      failed?: boolean;
      hasUpdate?: boolean;
      localVersion?: string;
    };
    expect(cached.failed).toBe(true);
    expect(cached.hasUpdate).toBe(false);
    expect(cached.localVersion).toBe(ROOT_MANIFEST.version);

    const fetchCached = vi.fn(() => Promise.reject(new Error('should not fetch')));
    const win2 = createWindow((w) => {
      w.document.body.innerHTML =
        '<div data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
      w.localStorage.setItem(
        'ag_custom_theme_update_cache_v1',
        JSON.stringify({
          checkedAt: Date.now() - 10 * 60 * 1000,
          localVersion: ROOT_MANIFEST.version,
          failed: true,
          hasUpdate: false,
        }),
      );
      Object.defineProperty(w, 'fetch', {
        configurable: true,
        writable: true,
        value: fetchCached,
      });
    });
    win2.eval(RUNTIME_JS);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchCached).not.toHaveBeenCalled();

    const fetchOptOut = vi.fn(() => Promise.reject(new Error('should not fetch')));
    const win3 = createWindow((w) => {
      w.document.body.innerHTML =
        '<div data-testid="pane-titlebar-toolbar"><div class="flex"></div></div>';
      w.localStorage.setItem('ag_custom_theme_disable_update_check', '1');
      Object.defineProperty(w, 'fetch', {
        configurable: true,
        writable: true,
        value: fetchOptOut,
      });
    });
    win3.eval(RUNTIME_JS);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchOptOut).not.toHaveBeenCalled();
  });
});
