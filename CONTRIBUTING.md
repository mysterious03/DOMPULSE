# Contributing to DOMPulse ⚡

Thank you for your interest in contributing to **DOMPulse**! As an open-source project, we welcome contributions of all kinds: bug reports, documentation improvements, benchmark scenarios, and code optimizations.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Google Chrome**: (or any Chromium-based browser)

### 2. Clone and Install
```bash
git clone https://github.com/mysterious03/DOMPULSE.git
cd DOMPULSE
npm install
```

### 3. Run the Test Suite
All core logic is covered by automated unit tests in `tests/`:
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### 4. Build the Chrome Extension
```bash
npm run build
```
This outputs a production-ready extension in the `dist/` directory.

### 5. Load into Chrome
1. Navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `dist/` folder.

### 6. Interactive Testbench
Run the local sandbox to test scenarios and mutation storms:
```bash
npm run dev
# Open http://localhost:5173/testbench/index.html
```

---

## 📋 Pull Request Guidelines

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. **Ensure Tests Pass:**
   No PR will be merged if `npm test` fails.
3. **Follow Semantic Commit Messages:**
   * `feat: ...` for new features
   * `fix: ...` for bug fixes
   * `docs: ...` for documentation changes
   * `perf: ...` for performance optimizations
4. **Submit Your PR:**
   Open a pull request against the `main` branch with a clear description of the problem and your solution.

---

## 🐛 Reporting Bugs

Please open an issue on GitHub with:
* Steps to reproduce the bug
* Expected vs actual behavior
* Chrome version and OS
* Relevant console logs or event dumps

---

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
