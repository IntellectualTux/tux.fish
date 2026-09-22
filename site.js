// tux.fish -- dynamic loader & client functionality
(function () {
  // Theme Toggle: defaults to light, manual toggle persists in localStorage
  function initTheme() {
    const savedTheme = localStorage.getItem('tux_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    updateThemeButton();

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';

        if (nextTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('tux_theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('tux_theme', 'light');
        }
        updateThemeButton();
      });
    }
  }

  function updateThemeButton() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggleBtn.innerHTML = `<span aria-hidden="true">${isDark ? '☼' : '☾'}</span>`;
  }

  // Clickable card delegation: clicking the card navigates, but clicking inner <a> works directly
  function initCardClicks() {
    document.addEventListener('click', function (e) {
      // If user clicked directly on or inside an anchor or button, let the native link work
      if (e.target.closest('a, button')) return;

      const card = e.target.closest('.info-card[data-href], .callout[data-href]');
      if (!card) return;

      const href = card.dataset.href;
      if (href) {
        if (href.startsWith('mailto:')) {
          window.location.href = href;
        } else {
          window.location.href = href;
        }
      }
    });

    // Keyboard support for cards
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.info-card[data-href], .callout[data-href]')) {
        e.preventDefault();
        const href = e.target.dataset.href;
        if (href) window.location.href = href;
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderProject(item, showBadge) {
    // Color comes from CSS (styles.css targets #project-<id> .name a), not inline styles.
    const nameHtml = item.url
      ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>`
      : escapeHtml(item.name);

    let blurbHtml = '';
    if (item.desc) {
      blurbHtml = escapeHtml(item.desc);
    } else if (item.placeholder) {
      blurbHtml = `<span class="placeholder">${escapeHtml(item.placeholder)}</span>`;
    }

    const badgeHtml = (showBadge && item.status)
      ? `<div class="badge ${escapeHtml(item.badge || 'running')}">${escapeHtml(item.status)}</div>`
      : '';

    return `
      <article class="project" id="project-${escapeHtml(item.id)}">
        <div class="left">
          <div class="name">${nameHtml}</div>
          <div class="blurb">${blurbHtml}</div>
        </div>
        ${badgeHtml}
      </article>
    `.trim();
  }

  function renderFriend(item) {
    // Color comes from CSS (styles.css targets #<id>-title a), not inline styles.
    const nameHtml = item.url
      ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>`
      : escapeHtml(item.name);

    return `
      <div class="info-card friend-card" data-href="${escapeHtml(item.url || '')}" tabindex="0" role="link" aria-label="${escapeHtml(item.name)}">
        <div class="card-title" id="${escapeHtml(item.id)}-title">${nameHtml}</div>
        <div class="card-desc">${escapeHtml(item.desc || '')}</div>
      </div>
    `.trim();
  }

  async function loadProjects() {
    try {
      const response = await fetch('projects.json');
      if (!response.ok) return;
      const data = await response.json();

      // index.html: no pill badges on the main page
      const runningContainer = document.getElementById('running-projects-list');
      if (runningContainer && Array.isArray(data.running)) {
        runningContainer.innerHTML = data.running.map(item => renderProject(item, false)).join('\n');
      }

      const upcomingContainer = document.getElementById('upcoming-projects-list');
      if (upcomingContainer && Array.isArray(data.upcoming)) {
        upcomingContainer.innerHTML = data.upcoming.map(item => renderProject(item, false)).join('\n');
      }

      const deprecatedContainer = document.getElementById('deprecated-projects-list');
      if (deprecatedContainer && Array.isArray(data.deprecated)) {
        deprecatedContainer.innerHTML = data.deprecated.map(item => renderProject(item, false)).join('\n');
      }

      // status.html: running projects WITH status badge
      const statusContainer = document.getElementById('status-projects-list');
      if (statusContainer && Array.isArray(data.running)) {
        statusContainer.innerHTML = data.running.map(item => renderProject(item, true)).join('\n');
      }
    } catch {
      // Fallback: static HTML is preserved
    }
  }

  async function loadFriends() {
    const friendsContainer = document.getElementById('friends-list');
    if (!friendsContainer) return;

    try {
      const response = await fetch('friends.json');
      if (!response.ok) return;
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.friends;

      if (Array.isArray(list)) {
        friendsContainer.innerHTML = list.map(renderFriend).join('\n');
      }
    } catch {
      // Fallback: static HTML is preserved
    }
  }

  // Early theme initialization
  initTheme();
  initCardClicks();

  function initData() {
    loadProjects();
    loadFriends();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initData);
  } else {
    initData();
  }
})();
