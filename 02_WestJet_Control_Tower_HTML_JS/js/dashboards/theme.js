/* dashboards/theme.js — Theme & Branding (19th page). Pick one of the
 * starter airline themes or add a custom airline. The choice is applied
 * immediately (CSS custom properties + header brand) and saved in
 * localStorage, so it survives reloads. The data stays WestJet synthetic
 * data whatever the theme — only the branding changes. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  function swatches(theme) {
    var fields = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
    return '<span class="theme-swatches">' + fields.map(function (f) {
      return '<span title="' + U.esc(f) + ': ' + U.esc(theme[f]) + '" style="background:' + U.esc(theme[f]) + '"></span>';
    }).join('') + '</span>';
  }
  function themeCard(theme, active) {
    var logo = theme.logo_url
      ? '<img src="' + U.esc(theme.logo_url) + '" alt="' + U.esc(theme.airline) + ' logo" onerror="this.style.display=\'none\'">'
      : '';
    return '<button type="button" class="theme-card' + (active ? ' active' : '') + '" data-theme-id="' + U.esc(theme.id) + '">' +
      logo +
      '<strong>' + U.esc(theme.airline) + ' (' + U.esc(theme.iata) + ')</strong>' +
      swatches(theme) +
      (theme.notes ? '<span class="theme-note">' + U.esc(theme.notes) + '</span>' : '') +
      '</button>';
  }
  WJ.pages.theme = {
    title: 'Theme & Branding',
    subtitle: 'Re-skin the control tower with an airline theme',
    render: function (ctx) {
      var themes = WJ.theme.listThemes();
      var current = WJ.theme.currentTheme();
      var h = '<p class="panel-note">The theme changes the header, navigation, buttons, links and KPI-card accents. ' +
        'The data stays WestJet synthetic data — theming changes branding only, never the numbers.</p>';
      if (!themes.length) {
        return h + '<section class="panel"><h2>Themes could not be loaded</h2>' +
          '<p>The theme file (data/themes.json) could not be read. The default WestJet styling stays in place.</p></section>';
      }
      h += '<section class="panel"><h2>Current theme</h2>' +
        '<p><strong>' + U.esc(current.airline) + ' (' + U.esc(current.iata) + ')</strong></p>' +
        (current.logo_url ? '<img src="' + U.esc(current.logo_url) + '" alt="' + U.esc(current.airline) + ' logo" style="max-height:48px;max-width:200px;" onerror="this.style.display=\'none\'">' : '') +
        swatches(current) +
        '<p class="panel-note">Primary ' + U.esc(current.primary) + ' · Secondary ' + U.esc(current.secondary) +
        ' · Accent ' + U.esc(current.accent) + ' · Background ' + U.esc(current.background) +
        ' · Surface ' + U.esc(current.surface) + ' · Text ' + U.esc(current.text) + '</p>' +
        (current.notes ? '<p class="panel-note">' + U.esc(current.notes) + '</p>' : '') +
        '</section>';
      h += '<section class="panel"><h2>Choose an airline theme</h2>' +
        '<div class="theme-grid">' + themes.map(function (t) { return themeCard(t, current && t.id === current.id); }).join('') + '</div>' +
        '<p class="panel-note">The theme applies immediately on every page and is remembered in this browser.</p></section>';
      h += '<section class="panel"><h2>Add a custom airline</h2>' +
        '<p class="panel-note">Colours must be #RRGGBB hex and the logo URL must be an http(s) link ' +
        '(a Wikimedia Commons file URL works well). Custom themes are saved in this browser only — ' +
        'they disappear if the browser data is cleared.</p>' +
        '<form id="add-theme-form" class="theme-form">' +
        '<label>Airline name<input id="ct-name" type="text" required placeholder="e.g. WestJet"></label>' +
        '<label>IATA code<input id="ct-iata" type="text" required maxlength="3" placeholder="e.g. WS"></label>' +
        '<label>Primary colour<input id="ct-primary" type="color" value="#002855"></label>' +
        '<label>Secondary colour<input id="ct-secondary" type="color" value="#0E7C7B"></label>' +
        '<label>Accent colour<input id="ct-accent" type="color" value="#FFC72C"></label>' +
        '<label>Background<input id="ct-background" type="color" value="#FFFFFF"></label>' +
        '<label>Surface<input id="ct-surface" type="color" value="#F2F4F7"></label>' +
        '<label>Text<input id="ct-text" type="color" value="#1F2937"></label>' +
        '<label>Logo URL (optional)<input id="ct-logo" type="url" placeholder="https://upload.wikimedia.org/…/logo.svg"></label>' +
        '<span></span><button class="btn" type="submit">Add custom airline</button>' +
        '</form><p id="ct-errors" class="panel-note" role="alert"></p></section>';
      var customList = themes.filter(function (t) { return t.custom; });
      if (customList.length) {
        h += '<section class="panel"><h2>Custom themes (this browser)</h2><ul>' +
          customList.map(function (t) {
            return '<li>' + U.esc(t.airline) + ' (' + U.esc(t.iata) + ') ' +
              '<button class="btn btn-small" type="button" data-remove-theme="' + U.esc(t.id) + '">Remove</button></li>';
          }).join('') + '</ul></section>';
      }
      var sheet = WJ.theme.sheetUrl();
      h += '<section class="panel"><h2>Reference sheet</h2>' +
        (sheet
          ? '<p>The starter themes are also kept in the <a href="' + U.esc(sheet) + '">Airline Themes &amp; Branding</a> Google Sheet — the human-readable reference for the values the apps bundle. To add an airline permanently, add a row there and to the runtime theme files; the form above is browser-only.</p>'
          : '<p>The starter themes are also kept in the “Airline Themes &amp; Branding” Google Sheet — the human-readable reference for the values the apps bundle.</p>') +
        '<p class="panel-note">Logos are linked, never stored in the repo: a missing or unreachable logo falls back to the airline name.</p></section>';
      return h;
    },
    mount: function (ctx) {
      var host = document.getElementById('page');
      if (!host) return;
      host.querySelectorAll('[data-theme-id]').forEach(function (el) {
        el.addEventListener('click', function () {
          WJ.theme.applyTheme(el.getAttribute('data-theme-id'));
          WJ.app.goTo('theme');
        });
      });
      host.querySelectorAll('[data-remove-theme]').forEach(function (el) {
        el.addEventListener('click', function () {
          WJ.theme.removeCustomTheme(el.getAttribute('data-remove-theme'));
          WJ.app.goTo('theme');
        });
      });
      var form = document.getElementById('add-theme-form');
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
        var candidate = {
          airline: val('ct-name').trim(), iata: val('ct-iata').trim().toUpperCase(),
          primary: val('ct-primary'), secondary: val('ct-secondary'), accent: val('ct-accent'),
          background: val('ct-background'), surface: val('ct-surface'), text: val('ct-text'),
          logo_url: val('ct-logo').trim(), notes: 'Custom airline theme added in this browser.'
        };
        var res = WJ.theme.addCustomTheme(candidate);
        var errEl = document.getElementById('ct-errors');
        if (!res.ok) {
          if (errEl) errEl.textContent = res.errors.join(' ');
          return;
        }
        WJ.theme.applyTheme(res.id);
        WJ.app.goTo('theme');
      });
    },
    exportRows: function (ctx) {
      var rows = [['Airline', 'IATA', 'Primary', 'Secondary', 'Accent', 'Background', 'Surface', 'Text', 'Logo URL', 'Notes']];
      WJ.theme.listThemes().forEach(function (t) {
        rows.push([t.airline, t.iata, t.primary, t.secondary, t.accent, t.background, t.surface, t.text, t.logo_url || '', t.notes || '']);
      });
      return rows;
    }
  };
})();
