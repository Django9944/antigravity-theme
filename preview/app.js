const htmlEl = document.documentElement;
const bodyEl = document.body;
const familySelect = document.getElementById('family-select');
const backdropSelect = document.getElementById('backdrop-select');
const reducedToggle = document.getElementById('reduced-transparency-toggle');
const schemeButtons = document.querySelectorAll('[data-scheme-btn]');
const ghostSwitcherBtn = document.getElementById('ghost-switcher-btn');
const ghostSwitcherMenu = document.getElementById('ghost-switcher-menu');
const ghostSwitcherLabel = document.getElementById('ghost-switcher-label');
const ghostMenuItems = document.querySelectorAll('[data-ghost-family]');
const auxTabs = Array.from(document.querySelectorAll('.aux-tab'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
const popoverBtn = document.getElementById('toggle-popover-btn');
const popover = document.getElementById('composer-popover');
const approveBtn = document.getElementById('btn-approve');
const rejectBtn = document.getElementById('btn-reject');
const approvalCard = document.getElementById('approval-card');
const approvalStatus = document.getElementById('approval-status');
const tabLinks = document.querySelectorAll('[data-activate-tab]');

const FAMILY_LABELS = {
  orbital: 'Orbital',
  prism: 'Prism',
  zenith: 'Zenith',
  lagoon: 'Lagoon',
  solar: 'Solar',
  nova: 'Nova',
  nebula: 'Nebula',
  stock: 'Stock',
};

const themeState = {
  family: 'orbital',
  scheme: 'dark',
};

function resolveThemeAttribute(family, scheme) {
  if (family === 'stock') {
    return `stock-${scheme}`;
  }
  if (family === 'orbital') {
    return scheme === 'light' ? 'antigravity-light' : 'antigravity-dark';
  }
  return `antigravity-${family}-${scheme}`;
}

function setBackdrop(backdropClass) {
  bodyEl.classList.remove(
    'backdrop-aurora',
    'backdrop-orbital',
    'backdrop-daylight',
    'backdrop-white',
    'backdrop-black',
  );
  bodyEl.classList.add(backdropClass);
  if (backdropSelect) {
    backdropSelect.value = backdropClass;
  }
}

function applyThemeState() {
  const { family, scheme } = themeState;
  htmlEl.setAttribute('data-antigravity-theme', resolveThemeAttribute(family, scheme));

  if (familySelect) {
    familySelect.value = family;
  }
  if (ghostSwitcherLabel) {
    ghostSwitcherLabel.textContent = FAMILY_LABELS[family] || family;
  }

  schemeButtons.forEach((btn) => {
    const active = btn.getAttribute('data-scheme-btn') === scheme;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  ghostMenuItems.forEach((item) => {
    const active = item.getAttribute('data-ghost-family') === family;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-checked', String(active));
  });

  const currentBackdrop = backdropSelect ? backdropSelect.value : 'backdrop-aurora';
  if (currentBackdrop === 'backdrop-orbital' || currentBackdrop === 'backdrop-daylight') {
    setBackdrop(scheme === 'light' ? 'backdrop-daylight' : 'backdrop-orbital');
  }
}

function setGhostMenuOpen(open) {
  if (!ghostSwitcherMenu || !ghostSwitcherBtn) return;
  ghostSwitcherMenu.toggleAttribute('hidden', !open);
  ghostSwitcherBtn.setAttribute('aria-expanded', String(open));
}

if (familySelect) {
  familySelect.addEventListener('change', (e) => {
    const target = e.target;
    if (target instanceof HTMLSelectElement) {
      themeState.family = target.value;
      applyThemeState();
    }
  });
}

schemeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const scheme = btn.getAttribute('data-scheme-btn');
    if (scheme !== 'dark' && scheme !== 'light') return;
    themeState.scheme = scheme;
    applyThemeState();
  });
});

if (ghostSwitcherBtn && ghostSwitcherMenu) {
  ghostSwitcherBtn.addEventListener('click', () => {
    const isHidden = ghostSwitcherMenu.hasAttribute('hidden');
    setGhostMenuOpen(isHidden);
  });

  ghostMenuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const nextFamily = item.getAttribute('data-ghost-family');
      if (!nextFamily) return;
      themeState.family = nextFamily;
      applyThemeState();
      setGhostMenuOpen(false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ghostSwitcherMenu.hasAttribute('hidden')) {
      setGhostMenuOpen(false);
      ghostSwitcherBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      !ghostSwitcherMenu.hasAttribute('hidden') &&
      e.target instanceof Node &&
      !ghostSwitcherMenu.contains(e.target) &&
      !ghostSwitcherBtn.contains(e.target)
    ) {
      setGhostMenuOpen(false);
    }
  });
}

applyThemeState();

if (backdropSelect) {
  backdropSelect.addEventListener('change', (e) => {
    const target = e.target;
    if (target instanceof HTMLSelectElement) {
      setBackdrop(target.value);
    }
  });
}

if (reducedToggle) {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-transparency: reduce)');
  if (prefersReduced?.matches) {
    reducedToggle.checked = true;
    bodyEl.classList.add('reduced-transparency');
  }
  reducedToggle.addEventListener('change', () => {
    bodyEl.classList.toggle('reduced-transparency', reducedToggle.checked);
  });
}

function activateTab(targetName, focusTab = false) {
  auxTabs.forEach((t) => {
    const active = t.getAttribute('data-tab') === targetName;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
    t.setAttribute('tabindex', active ? '0' : '-1');
    if (active && focusTab && t instanceof HTMLElement) {
      t.focus();
    }
  });
  tabPanels.forEach((panel) => {
    const show = panel.getAttribute('data-panel') === targetName;
    panel.classList.toggle('is-active', show);
    panel.toggleAttribute('hidden', !show);
  });
}

auxTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    const targetName = tab.getAttribute('data-tab');
    if (targetName) activateTab(targetName);
  });

  tab.addEventListener('keydown', (e) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % auxTabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + auxTabs.length) % auxTabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = auxTabs.length - 1;
    else return;

    e.preventDefault();
    const targetName = auxTabs[nextIndex]?.getAttribute('data-tab');
    if (targetName) activateTab(targetName, true);
  });
});

tabLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetName = link.getAttribute('data-activate-tab');
    if (targetName) {
      e.preventDefault();
      activateTab(targetName, true);
    }
  });
});

function setPopoverOpen(open) {
  if (!popover || !popoverBtn) return;
  popover.toggleAttribute('hidden', !open);
  popoverBtn.setAttribute('aria-expanded', String(open));
}

if (popoverBtn && popover) {
  popoverBtn.addEventListener('click', () => {
    const isHidden = popover.hasAttribute('hidden');
    setPopoverOpen(isHidden);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.hasAttribute('hidden')) {
      setPopoverOpen(false);
      popoverBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      !popover.hasAttribute('hidden') &&
      e.target instanceof Node &&
      !popover.contains(e.target) &&
      !popoverBtn.contains(e.target)
    ) {
      setPopoverOpen(false);
    }
  });
}

if (approveBtn && approvalStatus && approvalCard) {
  approveBtn.addEventListener('click', () => {
    approvalStatus.textContent = 'Approved';
    approvalStatus.className = 'badge badge-done';
    approvalCard.classList.remove('is-approval', 'is-error');
    approvalCard.classList.add('is-done');
  });
}

if (rejectBtn && approvalStatus && approvalCard) {
  rejectBtn.addEventListener('click', () => {
    approvalStatus.textContent = 'Rejected';
    approvalStatus.className = 'badge badge-error-solid';
    approvalCard.classList.remove('is-approval', 'is-done');
    approvalCard.classList.add('is-error');
  });
}
