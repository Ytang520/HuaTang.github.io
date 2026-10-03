(function () {
  'use strict';
  var root = document.querySelector('[data-home-interests]');
  if (!root) return;
  var choices = Array.from(root.querySelectorAll('[data-home-choice]'));
  var panels = choices.map(function (button) {
    return document.getElementById(button.getAttribute('aria-controls'));
  });
  if (panels.some(function (panel) { return !panel; })) return;

  function selectPanel(selected) {
    panels.forEach(function (panel, index) {
      panel.open = panel === selected;
      choices[index].setAttribute('aria-expanded', String(panel.open));
    });
  }

  choices.forEach(function (button, index) {
    button.addEventListener('click', function () {
      selectPanel(panels[index].open ? null : panels[index]);
    });
    panels[index].setAttribute('aria-labelledby', button.id);
    panels[index].addEventListener('toggle', function () {
      button.setAttribute('aria-expanded', String(panels[index].open));
    });
  });
  root.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var index = panels.findIndex(function (panel) { return panel.open; });
    if (index < 0) return;
    selectPanel(null);
    choices[index].focus();
    event.preventDefault();
  });
  selectPanel(null);
  root.setAttribute('data-home-ready', 'true');
  root.querySelector('[data-home-choices]').hidden = false;
}());
