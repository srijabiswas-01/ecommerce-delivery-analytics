# Ecommerce Delivery Analytics Dashboard

Full D3.js + Bootstrap + Crossfilter2 + Vite dashboard for `Ecommerce_Delivery_Analytics_New.csv`.

## Features

- CSV preprocessing and derived metrics
- KPI cards
- Cross-filtering by platform, category, rating, delay, and refund
- Revenue trend with zoom and pan
- Platform bar chart
- Category treemap
- Delivery scatter plot
- Satisfaction heatmap
- Sankey flow diagram
- Feedback intelligence network graph
- Hover tooltips
- Animated transitions
- Dynamic dark mode
- Export dashboard as PNG

## Run

### Vite project

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

### Standalone static version

Use this if Node.js/npm is not installed:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/standalone.html
```

## Upload To GitHub

If Git is not installed, use GitHub's browser upload:

1. Create a new repository on GitHub.
2. Choose **Add file > Upload files**.
3. Upload this whole project folder's contents.
4. Commit the files.
5. Go to **Settings > Pages**.
6. Set **Source** to `Deploy from a branch`.
7. Select branch `main` and folder `/root`.
8. Open the published link and add `/standalone.html` at the end.

If Git is installed:

```bash
git init
git add .
git commit -m "Add ecommerce delivery analytics dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
