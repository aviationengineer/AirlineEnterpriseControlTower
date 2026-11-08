/* data-loader.js — loads the converted workbook JSON (data/sample-data.json).
 * The browser app loads converted JSON generated from the input workbook;
 * it does not parse .xlsx in the browser. Error messages follow brief §20
 * exactly and never surface an obscure JavaScript error.
 * Works in the browser (window.WJ) and in Node (module.exports, fs fallback).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var WORKBOOK_NAME = 'WestJet_Enterprise_Control_Tower_Input_Template.xlsx';
  var MISSING_WORKBOOK_MSG = 'Input workbook not found. Please upload: ' + WORKBOOK_NAME;
  function loadError(message, kind) {
    var e = new Error(message);
    e.kind = kind || 'load';
    return e;
  }
  function checkShape(data) {
    if (!data || typeof data !== 'object') throw loadError('Input workbook could not be read. Please check the file is a valid Excel workbook and try again.', 'unreadable');
    var required = ['metadata', 'domains', 'kpi_calculated', 'targets', 'kpi_definitions', 'scenarios'];
    var missing = required.filter(function (k) { return !(k in data); });
    if (missing.length) throw loadError('Input workbook is missing sheet: ' + missing[0] + ' (converted data is missing the "' + missing[0] + '" section).', 'missing-sheet');
    return data;
  }
  async function loadData(url) {
    var target = url || 'data/sample-data.json';
    var res;
    try {
      res = await fetch(target);
    } catch (err) {
      throw loadError(MISSING_WORKBOOK_MSG, 'missing-workbook');
    }
    if (!res.ok) throw loadError(MISSING_WORKBOOK_MSG, 'missing-workbook');
    var data;
    try { data = await res.json(); }
    catch (err) { throw loadError('Input workbook could not be read. Please check the file is a valid Excel workbook and try again.', 'unreadable'); }
    return checkShape(data);
  }
  /* Load converted JSON from a user-supplied file (upload control). */
  function loadDataFromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(loadError(MISSING_WORKBOOK_MSG, 'missing-workbook'));
      if (!/\.json$/i.test(file.name)) return reject(loadError('Please upload an Excel workbook (.xlsx).', 'wrong-type'));
      var reader = new FileReader();
      reader.onerror = function () { reject(loadError('Input workbook could not be read. Please check the file is a valid Excel workbook and try again.', 'unreadable')); };
      reader.onload = function () {
        try { resolve(checkShape(JSON.parse(String(reader.result)))); }
        catch (err) { reject(err.kind ? err : loadError('Input workbook could not be read. Please check the file is a valid Excel workbook and try again.', 'unreadable')); }
      };
      reader.readAsText(file);
    });
  }
  var L = { WORKBOOK_NAME: WORKBOOK_NAME, MISSING_WORKBOOK_MSG: MISSING_WORKBOOK_MSG, loadData: loadData, loadDataFromFile: loadDataFromFile, checkShape: checkShape };
  WJ.loader = L;
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
