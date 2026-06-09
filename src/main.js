import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';
import { loadData } from './preprocess.js';
import { Dashboard } from './dashboard.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <nav class="topbar">
    <div>
      <h1>Ecommerce Delivery Analytics</h1>
      <p>Cross-filtered operations, revenue, delay, refund, and feedback intelligence.</p>
    </div>
    <div class="topbar-actions">
      <button id="resetFilters" class="btn btn-outline-secondary btn-sm">Reset</button>
      <button id="themeToggle" class="btn btn-outline-secondary btn-sm">Dark</button>
      <button id="exportPng" class="btn btn-primary btn-sm">Export PNG</button>
    </div>
  </nav>

  <main id="dashboard" class="dashboard-shell">
    <aside class="sidebar">
      <section class="panel">
        <h2>Filters</h2>
        <label class="form-label">Platform</label>
        <div id="platformFilters" class="chip-list"></div>
        <label class="form-label mt-3">Category</label>
        <div id="categoryFilters" class="chip-list"></div>
        <label class="form-label mt-3">Rating</label>
        <select id="ratingFilter" class="form-select form-select-sm">
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <label class="form-label mt-3">Delivery Delay</label>
        <select id="delayFilter" class="form-select form-select-sm">
          <option value="all">All</option>
          <option value="Yes">Delayed</option>
          <option value="No">Not delayed</option>
        </select>
        <label class="form-label mt-3">Refund Requested</label>
        <select id="refundFilter" class="form-select form-select-sm">
          <option value="all">All</option>
          <option value="Yes">Refund</option>
          <option value="No">No refund</option>
        </select>
      </section>
    </aside>

    <section class="content">
      <div id="kpis" class="kpi-grid"></div>
      <section class="panel wide"><div class="panel-title"><h2>Revenue Trend</h2><span>Zoom, pan, and brush by time bucket</span></div><div id="revenueTrend" class="chart tall"></div></section>
      <div class="grid-2">
        <section class="panel"><div class="panel-title"><h2>Platform Performance</h2><span>Click a bar to filter</span></div><div id="platformBar" class="chart"></div></section>
        <section class="panel"><div class="panel-title"><h2>Category Revenue Treemap</h2><span>Size by revenue, color by rating</span></div><div id="treemap" class="chart"></div></section>
      </div>
      <div class="grid-2">
        <section class="panel"><div class="panel-title"><h2>Delivery Efficiency</h2><span>Order value vs delivery time</span></div><div id="scatter" class="chart"></div></section>
        <section class="panel"><div class="panel-title"><h2>Satisfaction Heatmap</h2><span>Category by rating</span></div><div id="heatmap" class="chart"></div></section>
      </div>
      <section class="panel wide"><div class="panel-title"><h2>Delay and Refund Flow</h2><span>Platform to category to delay to refund</span></div><div id="sankey" class="chart tall"></div></section>
      <section class="panel wide"><div class="panel-title"><h2>Feedback Intelligence Network</h2><span>Platform, feedback signal, and outcome relationships</span></div><div id="network" class="chart tall"></div></section>
    </section>
  </main>
`;

loadData('/data/Ecommerce_Delivery_Analytics_New.csv')
  .then((rows) => new Dashboard(rows).init())
  .catch((error) => {
    app.innerHTML = `<div class="load-error"><h1>Could not load dashboard</h1><pre>${error.stack || error.message}</pre></div>`;
  });
