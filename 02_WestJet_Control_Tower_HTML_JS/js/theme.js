/* theme.js — airline theme engine: theme data, validation, applying a
 * theme (CSS custom properties on :root + header brand), persistence.
 * The 8 starter themes live in data/themes.json; this module holds no
 * theme data itself except the field list and the WestJet default.
 * Logos are remote URLs only (Wikimedia Commons, verified) — no logo
 * binaries in the repo; a missing or unreachable logo falls back to the
 * airline name. Custom themes are stored in localStorage in the browser
 * (in-memory under Node) and disappear if the browser data is cleared.
 * Works in the browser (window.WJ) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var THEME_FIELDS = ['airline', 'iata', 'primary', 'secondary', 'accent', 'background', 'surface', 'text', 'logo_url', 'notes'];
  var HEX_FIELDS = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
  var HEX_RE = /^#[0-9a-fA-F]{6}$/;
  var URL_RE = /^https?:\/\/.+/;
  var DEFAULT_THEME_ID = 'westjet';
  var STORAGE_KEY = 'wj-theme-id';
  var CUSTOM_KEY = 'wj-custom-themes';
  var _themes = {}; // id -> theme (starters, from themes.json)
  var _custom = {}; // id -> theme (added in-app, localStorage)
  var _currentId = DEFAULT_THEME_ID;
  var _sheetUrl = '';
  var _store = null; // localStorage when available, else null

  function storage() {
    if (_store !== null) return _store;
    try { _store = (typeof localStorage !== 'undefined') ? localStorage : null; }
    catch (e) { _store = null; }
    return _store;
  }
  function isHex(v) { return typeof v === 'string' && HEX_RE.test(v); }
  function isHttpUrl(v) { return typeof v === 'string' && URL_RE.test(v); }
  function slug(name) {
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-airline';
  }
  /* Validate a theme object. Returns an array of error strings (empty = valid).
   * Required: every field except logo_url and notes; colours #RRGGBB;
   * IATA 2-3 letters; a non-empty logo URL must be http(s). */
  function validateTheme(t) {
    var errors = [];
    if (!t || typeof t !== 'object') return ['Theme must be an object'];
    THEME_FIELDS.forEach(function (f) {
      if (f === 'logo_url' || f === 'notes') return;
      var v = t[f];
      if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) errors.push('Missing value: ' + f);
    });
    HEX_FIELDS.forEach(function (f) {
      if (t[f] !== null && t[f] !== undefined && !isHex(t[f])) errors.push('Invalid hex colour for ' + f + ': ' + t[f]);
    });
    var iata = t.iata;
    if (iata !== null && iata !== undefined && (typeof iata !== 'string' || !/^[A-Za-z]{2,3}$/.test(iata))) errors.push('Invalid IATA code: ' + iata + ' (2–3 letters)');
    var logo = t.logo_url;
    if (logo && (typeof logo !== 'string' || !isHttpUrl(logo))) errors.push('Invalid logo URL: ' + logo + ' (must be http(s))');
    return errors;
  }
  /* Load starter themes from a parsed themes.json object:
   * {default_theme_id, reference_sheet_url, themes: [...]}.
   * Returns {loaded, errors}. Invalid entries are skipped, never fatal. */
  function setThemes(data) {
    var errors = [];
    if (!data || !Array.isArray(data.themes)) return { loaded: 0, errors: ['themes.json is missing the "themes" list'] };
    if (typeof data.reference_sheet_url === 'string') _sheetUrl = data.reference_sheet_url;
    var loaded = 0;
    data.themes.forEach(function (t) {
      var errs = validateTheme(t);
      if (errs.length) { errors.push((t && t.airline ? t.airline : '?') + ': ' + errs.join('; ')); return; }
      _themes[t.id] = {
        id: t.id, airline: t.airline, iata: String(t.iata).toUpperCase(),
        primary: t.primary, secondary: t.secondary, accent: t.accent,
        background: t.background, surface: t.surface, text: t.text,
        logo_url: t.logo_url || '', notes: t.notes || '', custom: false
      };
      loaded++;
    });
    return { loaded: loaded, errors: errors };
  }
  function loadThemes(url) {
    if (typeof fetch === 'undefined') return Promise.resolve({ loaded: 0, errors: ['fetch is unavailable'] });
    return fetch(url || 'data/themes.json').then(function (res) {
      if (!res.ok) throw new Error('themes.json not found (HTTP ' + res.status + ')');
      return res.json();
    }).then(function (data) { return setThemes(data); });
  }
  function allThemes() {
    var out = {};
    Object.keys(_themes).forEach(function (k) { out[k] = _themes[k]; });
    Object.keys(_custom).forEach(function (k) { out[k] = _custom[k]; });
    return out;
  }
  function getTheme(id) {
    var all = allThemes();
    if (id && all[id]) return all[id];
    if (all[DEFAULT_THEME_ID]) return all[DEFAULT_THEME_ID];
    var keys = Object.keys(all);
    return keys.length ? all[keys[0]] : null;
  }
  function listThemes() {
    var all = allThemes();
    return Object.keys(all).map(function (k) { return all[k]; });
  }
  /* CSS custom properties for a theme: primary drives the header, nav,
   * buttons and KPI-card accent; accent drives active navigation and
   * highlights; secondary drives hover states. */
  function cssVars(theme) {
    if (!theme) return {};
    return {
      '--wj-navy': theme.primary,
      '--wj-blue': theme.secondary,
      '--wj-yellow': theme.accent,
      '--wj-white': theme.background,
      '--wj-grey-light': theme.surface,
      '--wj-charcoal': theme.text
    };
  }
  function updateBrand(theme) {
    if (typeof document === 'undefined' || !document.getElementById) return;
    if (typeof document.title === 'string') document.title = theme.airline + ' Enterprise Aviation Control Tower';
    var nameEl = document.getElementById('brand-name');
    if (nameEl) nameEl.textContent = theme.airline.toUpperCase();
    var logoEl = document.getElementById('brand-logo');
    if (logoEl) {
      if (theme.logo_url) {
        logoEl.src = theme.logo_url; logoEl.alt = theme.airline + ' logo'; logoEl.hidden = false;
      } else {
        if (typeof logoEl.removeAttribute === 'function') logoEl.removeAttribute('src');
        logoEl.hidden = true;
      }
    }
  }
  /* Apply a theme by id (unknown ids fall back to WestJet). Sets the CSS
   * variables on :root, updates the header brand, persists the choice in
   * localStorage, and returns the applied CSS variables ({} when no theme
   * is loaded yet). */
  function applyTheme(id) {
    var theme = getTheme(id);
    if (!theme) return {};
    _currentId = theme.id;
    var vars = cssVars(theme);
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style &&
        typeof document.documentElement.style.setProperty === 'function') {
      Object.keys(vars).forEach(function (k) { document.documentElement.style.setProperty(k, vars[k]); });
    }
    updateBrand(theme);
    var s = storage();
    if (s) { try { s.setItem(STORAGE_KEY, theme.id); } catch (e) { /* private mode */ } }
    return vars;
  }
  function currentThemeId() { return _currentId; }
  function currentTheme() { return getTheme(_currentId); }
  function persistCustoms() {
    var s = storage();
    if (!s) return;
    try { s.setItem(CUSTOM_KEY, JSON.stringify(_custom)); } catch (e) { /* private mode */ }
  }
  function restoreCustoms() {
    var s = storage();
    if (!s) return;
    try {
      var raw = s.getItem(CUSTOM_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      Object.keys(parsed || {}).forEach(function (k) {
        if (validateTheme(parsed[k]).length === 0) _custom[k] = parsed[k];
      });
    } catch (e) { /* corrupt stored data: ignore */ }
  }
  /* Add a custom airline theme. Returns {ok, id} or {ok:false, errors}. */
  function addCustomTheme(t) {
    var errors = validateTheme(t || {});
    var id = slug(t && t.airline);
    if (_themes[id] || _custom[id]) errors.push('An airline theme named "' + (t && t.airline) + '" already exists.');
    var clash = listThemes().some(function (x) { return x.iata.toUpperCase() === String(t && t.iata || '').toUpperCase(); });
    if (clash) errors.push('IATA code "' + (t && t.iata) + '" is already in use.');
    if (errors.length) return { ok: false, errors: errors };
    var theme = {
      id: id, airline: t.airline, iata: String(t.iata).toUpperCase(),
      primary: t.primary, secondary: t.secondary, accent: t.accent,
      background: t.background || '#FFFFFF', surface: t.surface || '#F2F4F7', text: t.text || '#1F2937',
      logo_url: t.logo_url || '', notes: t.notes || 'Custom airline theme added in this browser.', custom: true
    };
    _custom[id] = theme;
    persistCustoms();
    return { ok: true, id: id };
  }
  function removeCustomTheme(id) {
    if (!_custom[id]) return false;
    delete _custom[id];
    persistCustoms();
    if (_currentId === id) applyTheme(DEFAULT_THEME_ID);
    return true;
  }
  /* Load themes.json, restore the stored selection and any custom themes,
   * and apply the result. Never throws: on failure the default WestJet
   * CSS tokens stay in place. */
  function init(url) {
    restoreCustoms();
    return loadThemes(url).then(function (res) {
      var s = storage();
      var stored = null;
      if (s) { try { stored = s.getItem(STORAGE_KEY); } catch (e) { stored = null; } }
      applyTheme(stored || DEFAULT_THEME_ID);
      return res;
    }).catch(function (err) {
      applyTheme(DEFAULT_THEME_ID);
      return { loaded: 0, errors: [String(err && err.message || err)] };
    });
  }
  var T = {
    THEME_FIELDS: THEME_FIELDS, HEX_FIELDS: HEX_FIELDS, DEFAULT_THEME_ID: DEFAULT_THEME_ID,
    STORAGE_KEY: STORAGE_KEY, CUSTOM_KEY: CUSTOM_KEY,
    isHex: isHex, isHttpUrl: isHttpUrl, validateTheme: validateTheme,
    setThemes: setThemes, loadThemes: loadThemes, getTheme: getTheme,
    listThemes: listThemes, cssVars: cssVars, applyTheme: applyTheme,
    currentThemeId: currentThemeId, currentTheme: currentTheme,
    addCustomTheme: addCustomTheme, removeCustomTheme: removeCustomTheme,
    restoreCustoms: restoreCustoms, init: init,
    sheetUrl: function () { return _sheetUrl; }
  };
  WJ.theme = T;
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
