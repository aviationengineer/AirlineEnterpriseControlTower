@echo off
REM WestJet Enterprise Aviation Control Tower — Streamlit launcher.
REM Requires Python 3.12 with the pinned dependencies installed:
REM   pip install -r requirements.txt
REM The app reads data\WestJet_Enterprise_Control_Tower_Input_Template.xlsx
REM from this folder. If the workbook is missing, upload it there first.
cd /d "%~dp0"
python -m streamlit run app.py
pause
