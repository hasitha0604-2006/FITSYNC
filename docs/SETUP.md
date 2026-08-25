# Technical Installation & Deployment Guide

This document contains instructions to set up, troubleshoot, and run the FitSync AI unified application locally on a Windows machine.

---

## 🛠️ Step-by-Step Installation

### Prerequisites
1. **Python 3.10 to 3.14**: [Download Python for Windows](https://www.python.org/downloads/). Ensure you check **"Add Python to PATH"** during installation.
2. **VS Code (Recommended)**: For accessing the integrated terminal.

---

### Standard CLI Setup

#### Step 1: Open Terminal
Open VS Code in the root `FITSYNC-AI-SIH` directory and open an integrated PowerShell terminal.

#### Step 2: Create Virtual Environment
Run the following command to create a local virtual environment:
```powershell
python -m venv venv
```

#### Step 3: Activate Virtual Environment
* **PowerShell**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **Command Prompt**:
  ```cmd
  venv\Scripts\activate
  ```

#### Step 4: Install Dependencies
Install Flask, SQLAlchemy, and environmental helpers:
```bash
pip install -r requirements.txt
```

#### Step 5: Start FitSync AI
Start the unified application:
```bash
python app.py
```
* The SQLite database initializes and seeds the demo account automatically.
* A daemon thread starts in the background and opens `http://127.0.0.1:5000` in your default browser.

---

## 🚀 One-Click Launcher Setup

We have provided a Windows batch script (`run.bat`) to automate environment checks and startup:
1. Double-click **`run.bat`** in the project root folder.
2. The script checks for the `venv/` directory, installs dependencies if they are missing, and runs `python app.py` automatically.

---

## 🩺 Troubleshooting

### 1. Permission Denied Errors on Deletion
If you see errors related to locked python executables when running git actions:
* **Solution**: Ensure no backend servers are running. In PowerShell, execute:
  ```powershell
  Stop-Process -Name python -Force -ErrorAction SilentlyContinue
  ```

### 2. SQLite Database Lock Errors
If the server reports table compile issues:
* **Solution**: Make sure no external database browsers are holding locks on `instance/fitsync.db`. You can safely delete the `instance/` folder and boot the server; it will seed all tables again.
