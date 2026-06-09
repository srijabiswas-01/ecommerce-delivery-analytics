import crossfilter from 'crossfilter2';
import html2canvas from 'html2canvas';
import * as d3 from 'd3';
import {
  renderHeatmap,
  renderNetwork,
  renderPlatformBar,
  renderRevenueTrend,
  renderSankey,
  renderScatter,
  renderTreemap
} from './visuals.js';

export class Dashboard {
  constructor(rows) {
    this.rows = rows;
    this.state = {
      platforms: new Set(),
      categories: new Set(),
      rating: 'all',
      delay: 'all',
      refund: 'all'
    };
    this.cf = crossfilter(rows);
    this.dimensions = {
      platform: this.cf.dimension((d) => d.platform),
      category: this.cf.dimension((d) => d.category),
      rating: this.cf.dimension((d) => d.rating),
      delay: this.cf.dimension((d) => d.delay),
      refund: this.cf.dimension((d) => d.refund)
    };
  }

  init() {
    this.buildFilters();
    this.bindChrome();
    this.render();
  }

  buildFilters() {
    this.renderChipGroup('platformFilters', [...new Set(this.rows.map((d) => d.platform))].sort(), 'platforms');
    this.renderChipGroup('categoryFilters', [...new Set(this.rows.map((d) => d.category))].sort(), 'categories');
    d3.select('#ratingFilter').on('change', (event) => {
      this.state.rating = event.target.value;
      this.applyFilters();
    });
    d3.select('#delayFilter').on('change', (event) => {
      this.state.delay = event.target.value;
      this.applyFilters();
    });
    d3.select('#refundFilter').on('change', (event) => {
      this.state.refund = event.target.value;
      this.applyFilters();
    });
  }

  renderChipGroup(id, values, key) {
    const wrap = d3.select(`#${id}`);
    const chips = wrap.selectAll('button').data(values).join('button').attr('type', 'button').attr('class', 'chip');
    chips.text((d) => d).on('click', (_, value) => {
      this.state[key].has(value) ? this.state[key].delete(value) : this.state[key].add(value);
      this.applyFilters();
    });
  }

  bindChrome() {
    d3.select('#resetFilters').on('click', () => {
      this.state.platforms.clear();
      this.state.categories.clear();
      this.state.rating = 'all';
      this.state.delay = 'all';
      this.state.refund = 'all';
      d3.selectAll('select').property('value', 'all');
      this.applyFilters();
    });
    d3.select('#themeToggle').on('click', () => {
      document.body.classList.toggle('dark');
      d3.select('#themeToggle').text(document.body.classList.contains('dark') ? 'Light' : 'Dark');
    });
    d3.select('#exportPng').on('click', async () => {
      const canvas = await html2canvas(document.querySelector('#dashboard'), { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = 'ecommerce-delivery-dashboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  applyFilters() {
    this.dimensions.platform.filterFunction((d) => !this.state.platforms.size || this.state.platforms.has(d));
    this.dimensions.category.filterFunction((d) => !this.state.categories.size || this.state.categories.has(d));
    this.dimensions.rating.filterFunction((d) => this.state.rating === 'all' || d === +this.state.rating);
    this.dimensions.delay.filterFunction((d) => this.state.delay === 'all' || d === this.state.delay);
    this.dimensions.refund.filterFunction((d) => this.state.refund === 'all' || d === this.state.refund);
    d3.selectAll('#platformFilters .chip').classed('active', (d) => this.state.platforms.has(d));
    d3.selectAll('#categoryFilters .chip').classed('active', (d) => this.state.categories.has(d));
    this.render();
  }

  data() {
    return this.dimensions.platform.top(Infinity);
  }

  render() {
    const data = this.data();
    this.renderKpis(data);
    renderRevenueTrend('#revenueTrend', data);
    renderPlatformBar('#platformBar', data, (platform) => {
      this.state.platforms.has(platform) ? this.state.platforms.delete(platform) : this.state.platforms.add(platform);
      this.applyFilters();
    });
    renderTreemap('#treemap', data);
    renderScatter('#scatter', data);
    renderHeatmap('#heatmap', data);
    renderSankey('#sankey', data);
    renderNetwork('#network', data);
  }

  renderKpis(data) {
    const count = data.length;
    const revenue = d3.sum(data, (d) => d.orderValue);
    const avgDelivery = d3.mean(data, (d) => d.deliveryMinutes) || 0;
    const refundRate = count ? d3.mean(data, (d) => d.refund === 'Yes') : 0;
    const delayRate = count ? d3.mean(data, (d) => d.delay === 'Yes') : 0;
    const satisfaction = d3.mean(data, (d) => d.satisfactionIndex) || 0;
    const efficiency = d3.mean(data, (d) => d.platformEfficiency) || 0;
    const cards = [
      ['Total Orders', d3.format(',')(count), 'Filtered order volume'],
      ['Total Revenue', `₹${d3.format(',.0f')(revenue)}`, 'Order value in INR'],
      ['Avg Delivery', `${avgDelivery.toFixed(1)} min`, 'Operational speed'],
      ['Refund Rate', d3.format('.1%')(refundRate), 'Requested refunds'],
      ['Delay Rate', d3.format('.1%')(delayRate), 'Delayed deliveries'],
      ['Satisfaction', `${satisfaction.toFixed(1)}/100`, 'Rating index'],
      ['Efficiency', efficiency.toFixed(1), 'Value x rating / minute']
    ];
    d3.select('#kpis').selectAll('.kpi-card').data(cards).join('article').attr('class', 'kpi-card').html(
      (d) => `<span>${d[0]}</span><strong>${d[1]}</strong><small>${d[2]}</small>`
    );
  }
}
