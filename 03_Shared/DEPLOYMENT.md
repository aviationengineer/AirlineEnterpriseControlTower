# Deployment — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Implemented 2026-11-08. Local run and serve steps below are
verified (see §6); Streamlit Community Cloud deployment has **not**
been performed for this project — the target repo
`aviationengineer/AirlineEnterpriseControlTower` is empty and no push
has been made, so §5 is the procedure to follow, not a record of a
completed deployment.
**Spelling:** en-GB throughout.

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Running the Streamlit app locally](#2-running-the-streamlit-app-locally)
3. [Serving the HTML/JS app locally](#3-serving-the-htmljs-app-locally)
4. [Regenerating the HTML app's data](#4-regenerating-the-html-apps-data)
5. [Streamlit Community Cloud notes](#5-streamlit-community-cloud-notes)
6. [Verification performed 2026-11-08](#6-verification-performed-2026-11-08)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

| Requirement | Streamlit app | HTML/JS app |
|---|---|---|
| Python | 3.12 (project venv `.venv` is Python 3.12.3) | Python 3 (only for the static server; any recent 3.x) |
| Node.js | Not needed | Needed only to run `tests/test.js` and `tests/smoke.js` (verification, not serving) |
| Browser | Any modern browser | Any modern browser with JavaScript enabled |
| Network | None at run time (all data is local) | Chart.js 4.4.1 loads from a CDN — see §3.1 for offline use |
| Credentials | None | None |
| Input workbook | Bundled at `data/WestJet_Enterprise_Control_Tower_Input_Template.xlsx` | Bundled as converted JSON at `data/sample-data.json` (plus a workbook copy for reference) |

No account, API key, connection string or environment variable is
needed to run either app. There is no server-side code and no
database.

## 2. Running the Streamlit app locally

The Streamlit package has its own virtual environment and a pinned
requirements file:

```
01_WestJet_Control_Tower_Streamlit/
├── .venv/              # Project virtual environment (Python 3.12.3)
└── requirements.txt    # Pinned: streamlit==1.67.0, pandas==3.1.1,
                        # openpyxl==3.1.5, plotly==7.1.0, pytest==9.2.0
```

### 2.1 First-time setup (if the venv is ever rebuilt)

```sh
cd 01_WestJet_Control_Tower_Streamlit
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Do not install the packages globally and do not mix in a different
Streamlit or pandas version: the pinned versions are the ones the
69-test suite was run against (see §6).

### 2.2 Start the app

```sh
cd 01_WestJet_Control_Tower_Streamlit
.venv/bin/streamlit run app.py
```

Streamlit serves on **http://localhost:8501** by default. Open that
URL in a browser. To use a different port:

```sh
.venv/bin/streamlit run app.py --server.port 8502
```

Alternatively, activate the venv first and then run Streamlit
without the path prefix:

```sh
source .venv/bin/activate
streamlit run app.py
```

The app loads the workbook from `data/` relative to the package on
start-up. It does not need to be run from a particular working
directory beyond the package folder itself — `config.py` resolves
the workbook path from the package location.

### 2.3 Stopping the app

Press `Ctrl+C` in the terminal where Streamlit is running.

### 2.4 Note on `run.bat`

`run.bat` in the Streamlit package still contains the scaffold
placeholder text ("Skeleton only — implementation pending the input
workbook") and does not launch the app. Use the commands in §2.2
instead. Updating `run.bat` to launch `.venv\Scripts\streamlit.exe
run app.py` is a small follow-up; it was left untouched during the
documentation pass so that no application file was modified.

## 3. Serving the HTML/JS app locally

The HTML/JS app is static files — there is no build step and no
server-side code. It must be served over HTTP: browsers block
`fetch` from `file://`, so opening `index.html` directly will show
the "Input workbook not found" error with an upload control instead
of the dashboards.

```sh
cd 02_WestJet_Control_Tower_HTML_JS
python3 -m http.server 8000
# open http://localhost:8000/
```

Any static server works (e.g. `npx serve`, nginx, or any hosting
that serves static files). The app loads `data/sample-data.json`
relative to `index.html`, so serve the package folder itself, not a
parent folder, and keep the `data/`, `js/` and `css/` subfolders
alongside `index.html`.

### 3.1 Chart.js and offline use

Chart.js 4.4.1 is loaded from a CDN (as the wireframe used). With no
network access the charts do not render — but the app degrades
gracefully: every chart falls back to a data table rather than a
blank panel. For fully offline use, vendor the library: download
`chart.umd.min.js`, place it in the package folder, and point the
`<script>` tag in `index.html` at the local file.

### 3.2 Loading a different workbook

The browser app does not parse `.xlsx`. To load a different
workbook, convert it to JSON first (see §4) and either replace
`data/sample-data.json` or use the in-app upload control, which
accepts a converted JSON file and loads it without a server restart.

## 4. Regenerating the HTML app's data

`data/sample-data.json` is generated output from the Python core —
do not edit its values by hand. Regenerate it after any workbook
change:

```sh
cd 01_WestJet_Control_Tower_Streamlit
.venv/bin/python -m data.export_web_json
```

This converts the workbook plus the computed KPIs into the JSON the
HTML/JS app loads: domain tables, `kpi_calculated` rows, targets,
KPI definitions, the nine preset scenarios S001–S009, the Python
`preset_results`, route aggregates and the validation block. Copy the
regenerated file to `02_WestJet_Control_Tower_HTML_JS/data/
sample-data.json`, then re-run `node tests/test.js` (see §6) to
confirm the JS engines still match the Python ground truth.

## 5. Streamlit Community Cloud notes

Not yet deployed — the target repo is empty and no push has been
made. When the repo is populated, the deployment steps are:

1. Push the project to the repo (the whole
   `westjet-control-tower/` tree, or the Streamlit package on its
   own — see step 2).
2. In Streamlit Community Cloud, create a new app pointing at the
   repository, branch, and the app file
   `01_WestJet_Control_Tower_Streamlit/app.py` (or `app.py` if the
   package is deployed as the repo root). The main file path must
   match where the file actually sits in the repo.
3. **Dependencies.** Streamlit Cloud installs from a
   `requirements.txt` it can find — at the repo root, or in the same
   directory as the app file. If the app is deployed from its
   subfolder, make sure a `requirements.txt` with the pinned
   versions (§2) is discoverable at one of those locations; do not
   rely on the local `.venv/` folder, which must not be committed.
4. **Workbook path.** The app resolves the workbook relative to the
   package (`data/WestJet_Enterprise_Control_Tower_Input_Template.
   xlsx`), so the `data/` folder must be deployed alongside
   `app.py`. Keep the workbook filename exactly as supplied.
5. **No secrets are needed.** There are no credentials, API keys or
   environment variables in this build. Do not add any to the Cloud
   secrets store for this app.
6. **Verify after deploy.** Open the deployed URL and check: the
   Executive Overview renders with 14 KPI cards; the DATA STATUS
   banner reads **Warning, score 95.0, 0 errors, 5 warnings** on
   the supplied workbook; the Simulator page applies the S001 Fuel
   Shock preset; the Outcome page shows Actual vs Baseline vs
   Simulated. If the Cloud app fails at import after a push, check
   the Manage-page logs first — a partial checkout can leave a
   stale module alongside a new one (this failure mode has been seen
   on other Streamlit apps in this workspace); rebooting the app
   from the Manage page forces a fresh clone.
7. **Data updates.** Replacing the workbook means redeploying (push
   the new file; Cloud rebuilds). The app detects the date range
   dynamically, so a 2-, 3-, 4- or 5-year workbook needs no code
   change — but regenerate `sample-data.json` (§4) as well if the
   HTML app is deployed from the same repo.

## 6. Verification performed 2026-11-08

All of the following were run during the final verification pass
and passed:

| Check | Command (from the package folder) | Result |
|---|---|---|
| Streamlit pytest suite | `.venv/bin/python -m pytest tests/ -q` (from `01_…/`) | **69 passed** in ~25 s |
| JS syntax | `for f in js/*.js js/dashboards/*.js tests/*.js; do node --check "$f"; done` (from `02_…/`) | **28/28 files pass** |
| JS engine verification | `node tests/test.js` (from `02_…/`) | **18/18 checks pass** — JS KPI/scenario engines match the Python ground truth |
| JS smoke test | `node tests/smoke.js` (from `02_…/`) | **Pass** — all 18 pages render headlessly, simulator/outcome share state, no runtime errors |
| Streamlit HTTP | `.venv/bin/streamlit run app.py --server.port 8502`, then `curl http://localhost:8502/` | **HTTP 200** |
| HTML HTTP | `python3 -m http.server 8001` (from `02_…/`), then `curl` | **HTTP 200** for `/`, `/index.html` and `/data/sample-data.json` |

One item was **not** verified: a real browser render of the HTML
app (no live-browser access in the verification pass). The headless
smoke test covers page rendering without a browser; a visual check
in a real browser is still outstanding — see `USER_GUIDE.md` and the
verification report.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Streamlit: "Input workbook not found. Please upload: WestJet_Enterprise_Control_Tower_Input_Template.xlsx" | The workbook file is missing from `01_…/data/` (or the app was started from a copied folder without it) | Restore `data/WestJet_Enterprise_Control_Tower_Input_Template.xlsx` to the package's `data/` folder and restart |
| Streamlit: "Input workbook is missing sheet: [Sheet]" | A required sheet was removed or renamed in the workbook | Restore the sheet with its exact name (`DATA_MODEL.md` §2 lists all 23) |
| Streamlit: "Sheet: [Sheet] / Missing column: [Column]" | A required column was removed or renamed (names are case-sensitive, including "%") | Restore the column with its exact name (`DATA_MODEL.md` §3–§5) |
| Streamlit: `ModuleNotFoundError` on start | Wrong interpreter — the system Python instead of the project venv | Use `.venv/bin/streamlit run app.py` (§2.2); if the venv is missing, rebuild it per §2.1 |
| Streamlit: port 8501 already in use | Another Streamlit app (or a previous run) is still holding the port | Stop the other process, or start on another port with `--server.port 8502` |
| Streamlit: app renders but a page shows an error instead of KPIs | A Critical validation failure (missing sheet/column, or DQ001/DQ002) for that page's domain | Read the DATA STATUS area / validation expander for the exact message; fix the workbook, not the code |
| HTML: "Input workbook not found" on opening `index.html` directly | Opened via `file://` — browsers block `fetch` from local files | Serve over HTTP per §3; do not double-click `index.html` |
| HTML: "Input workbook not found" when served | `data/sample-data.json` is missing, or the server root is not the package folder | Serve from `02_WestJet_Control_Tower_HTML_JS/` itself (§3) and check `data/sample-data.json` exists |
| HTML: charts show tables instead of charts | Chart.js CDN unreachable (offline) or blocked | Vendor `chart.umd.min.js` locally per §3.1, or restore network access |
| HTML: `node tests/test.js` fails after a workbook change | `sample-data.json` is stale relative to the workbook | Regenerate per §4 and re-run the test |
| Either app: DATA STATUS is Warning with 5 warnings | Expected on the supplied workbook — the 5 warnings are the documented workbook quirks (`DATA_MODEL.md` §7), not data errors | No action. The status is Warning by design; see `USER_GUIDE.md` (reading the validation area) |
| Either app: values look wrong for a multi-month selection | Probably the Aircraft Utilisation period-total presentation (§6.4 in `ARCHITECTURE.md`) or the illustrative cash impact (`SCENARIO_ENGINE.md` §11) | Read the known caveats in `USER_GUIDE.md` before treating it as a bug |

If a failure is not listed here, capture the exact message shown in
the app (never a bare traceback — the apps are built to show the
brief §20 wording instead) and the steps that produced it, and raise
it against the build with the workbook file attached.

---

*End of Deployment. Companion docs: `ARCHITECTURE.md`,
`SCENARIO_ENGINE.md`, `USER_GUIDE.md`, `KPI_DICTIONARY.md`,
`DATA_MODEL.md`.*
