(function () {
  'use strict';

  function normalize(value) {
    return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function initialize(root) {
    if (root.getAttribute('data-vibe-ready') === 'true') return;
    var filters = root.querySelector('[data-vibe-filters]');
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-vibe-entry]'));
    var count = root.querySelector('[data-vibe-count]');
    var total = root.querySelector('[data-vibe-total]');
    var empty = root.querySelector('[data-vibe-empty]');
    var search = root.querySelector('[data-vibe-query]');
    var clearSearch = root.querySelector('[data-vibe-clear-search]');
    var list = root.querySelector('[data-vibe-list]');
    var pinned = root.querySelector('[data-vibe-pinned]');
    if (!filters || !count || !total || !empty || !search || !clearSearch || !list || !pinned) return;

    var experience = cards.find(function (card) { return card.getAttribute('data-kind') === 'experience'; });
    var searchText = cards.map(function (card) { return normalize(card.getAttribute('data-vibe-search') || ''); });
    var searchOrder = cards.slice().sort(function (a, b) {
      return normalize(a.getAttribute('data-vibe-title') || '').localeCompare(normalize(b.getAttribute('data-vibe-title') || ''));
    });
    var searching = false;

    var groups = Array.prototype.slice.call(filters.querySelectorAll('[data-vibe-group]'));
    var state = Object.create(null);
    var allowed = Object.create(null);
    groups.forEach(function (group) {
      var key = group.getAttribute('data-vibe-group');
      state[key] = 'all';
      allowed[key] = Array.prototype.map.call(group.querySelectorAll('[data-vibe-value]'), function (button) {
        return button.getAttribute('data-vibe-value');
      });
    });
    var keys = Object.keys(state);
    if (!keys.length) return;

    function setSearchMode(active) {
      if (searching === active) return;
      searching = active;
      // Move existing cards only when entering/leaving search; never duplicate them.
      if (active) searchOrder.forEach(function (card) { list.appendChild(card); });
      else cards.forEach(function (card) { (card === experience ? pinned : list).appendChild(card); });
      pinned.hidden = active;
      if (experience) {
        experience.classList.toggle('vibe-card--pinned', !active);
        var pinLabel = experience.querySelector('[data-vibe-pin]');
        if (pinLabel) pinLabel.hidden = active;
      }
      root.querySelector('[data-vibe-project-label]').hidden = active;
      root.querySelector('[data-vibe-result-label]').hidden = !active;
    }

    function update() {
      var query = normalize(search.value);
      var words = query ? query.split(' ') : [];
      setSearchMode(words.length > 0);
      var visible = 0;
      cards.forEach(function (card, index) {
        if (card === experience && !searching) {
          card.hidden = false;
          return;
        }
        var matches = words.every(function (word) { return searchText[index].indexOf(word) !== -1; }) && keys.every(function (key) {
          return state[key] === 'all' || card.getAttribute('data-' + key) === state[key];
        });
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      root.querySelectorAll('button[data-vibe-filter]').forEach(function (button) {
        var key = button.getAttribute('data-vibe-filter');
        button.setAttribute('aria-pressed', String(state[key] === button.getAttribute('data-vibe-value')));
      });
      var isDefault = keys.every(function (key) { return state[key] === 'all'; });
      root.querySelectorAll('[data-vibe-reset]').forEach(function (button) { button.disabled = isDefault; });
      count.textContent = String(visible);
      total.textContent = String(cards.length - (!searching && experience ? 1 : 0));
      clearSearch.hidden = search.value.length === 0;
      empty.hidden = visible !== 0;
    }

    search.addEventListener('input', update);
    search.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        search.value = '';
        update();
      }
    });

    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-vibe-filter], button[data-vibe-reset], button[data-vibe-reset-all], button[data-vibe-clear-search]');
      if (!button || !root.contains(button) || button.disabled) return;
      if (button.hasAttribute('data-vibe-clear-search')) {
        search.value = '';
        search.focus();
      } else if (button.hasAttribute('data-vibe-reset') || button.hasAttribute('data-vibe-reset-all')) {
        keys.forEach(function (key) { state[key] = 'all'; });
        if (button.hasAttribute('data-vibe-reset-all')) {
          search.value = '';
          search.focus();
        }
      } else {
        var key = button.getAttribute('data-vibe-filter');
        var value = button.getAttribute('data-vibe-value');
        if (!allowed[key] || allowed[key].indexOf(value) === -1) return;
        state[key] = state[key] === value ? 'all' : value;
      }
      update();
    });

    var languageButton = document.getElementById('lang-toggle');
    function updatePlaceholder() {
      var language = languageButton && languageButton.textContent.trim() === 'ZH' ? 'zh' : 'en';
      search.placeholder = search.getAttribute('data-placeholder-' + language);
    }
    if (languageButton) languageButton.addEventListener('click', updatePlaceholder);
    updatePlaceholder();

    var panel = filters.querySelector('[data-vibe-filter-panel]');
    var desktop = window.matchMedia('(min-width: 925px)');
    function resizePanel() { panel.open = desktop.matches; }
    if (panel) {
      resizePanel();
      desktop.addEventListener('change', resizePanel);
    }

    root.querySelectorAll('button[data-vibe-filter]').forEach(function (button) { button.disabled = false; });
    update();
    root.setAttribute('data-vibe-ready', 'true');
    filters.hidden = false;
    root.querySelector('[data-vibe-search-controls]').hidden = false;
    root.querySelector('[data-vibe-results-bar]').hidden = false;
  }

  function start() { document.querySelectorAll('[data-vibe-index]').forEach(initialize); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
