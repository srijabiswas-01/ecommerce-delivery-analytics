import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const palette = ['#2563eb', '#059669', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#be123c'];
const tip = () => d3.select('#tooltip');

function frame(selector, height = 320) {
  const node = document.querySelector(selector);
  const width = Math.max(node.clientWidth, 320);
  d3.select(selector).selectAll('*').remove();
  const svg = d3.select(selector).append('svg').attr('viewBox', [0, 0, width, height]).attr('width', '100%').attr('height', height);
  return { svg, width, height };
}

function showTip(event, html) {
  tip().style('opacity', 1).style('left', `${event.pageX + 14}px`).style('top', `${event.pageY + 10}px`).html(html);
}

function hideTip() {
  tip().style('opacity', 0);
}

function grouped(data, key) {
  return d3.rollups(data, (v) => ({ count: v.length, revenue: d3.sum(v, (d) => d.orderValue), rating: d3.mean(v, (d) => d.rating) || 0 }), key);
}

export function renderRevenueTrend(selector, data) {
  const { svg, width, height } = frame(selector, 360);
  const margin = { top: 20, right: 28, bottom: 42, left: 72 };
  const values = grouped(data, (d) => d.timeBucket).map(([bucket, v]) => ({ bucket, ...v })).sort((a, b) => d3.ascending(a.bucket, b.bucket));
  if (!values.length) return empty(svg, width, height);
  const x = d3.scalePoint(values.map((d) => d.bucket), [margin.left, width - margin.right]);
  const y = d3.scaleLinear([0, d3.max(values, (d) => d.revenue) || 1], [height - margin.bottom, margin.top]).nice();
  const gx = svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickValues(values.filter((_, i) => i % 6 === 0).map((d) => d.bucket)));
  const gy = svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((d) => `₹${d3.format('.2s')(d)}`));
  const line = d3.line().x((d) => x(d.bucket)).y((d) => y(d.revenue)).curve(d3.curveMonotoneX);
  const path = svg.append('path').datum(values).attr('fill', 'none').attr('stroke', palette[0]).attr('stroke-width', 2.5).attr('d', line);
  const length = path.node().getTotalLength();
  path.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length).transition().duration(900).attr('stroke-dashoffset', 0);
  svg.selectAll('circle').data(values).join('circle').attr('cx', (d) => x(d.bucket)).attr('cy', (d) => y(d.revenue)).attr('r', 3).attr('fill', palette[0])
    .on('mousemove', (event, d) => showTip(event, `<b>${d.bucket}</b><br>Revenue: ₹${d3.format(',')(Math.round(d.revenue))}<br>Orders: ${d3.format(',')(d.count)}`)).on('mouseleave', hideTip);
  svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[margin.left, 0], [width, height]]).on('zoom', ({ transform }) => {
    svg.selectAll('path').attr('transform', transform);
    svg.selectAll('circle').attr('transform', transform);
    gx.call(d3.axisBottom(transform.rescaleX(d3.scaleLinear([0, values.length - 1], [margin.left, width - margin.right]))).ticks(8));
  }));
}

export function renderPlatformBar(selector, data, onClick) {
  const { svg, width, height } = frame(selector);
  const margin = { top: 18, right: 24, bottom: 48, left: 78 };
  const values = grouped(data, (d) => d.platform).map(([platform, v]) => ({ platform, ...v })).sort((a, b) => b.revenue - a.revenue);
  if (!values.length) return empty(svg, width, height);
  const x = d3.scaleBand(values.map((d) => d.platform), [margin.left, width - margin.right]).padding(0.22);
  const y = d3.scaleLinear([0, d3.max(values, (d) => d.revenue) || 1], [height - margin.bottom, margin.top]).nice();
  svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((d) => `₹${d3.format('.2s')(d)}`));
  svg.selectAll('rect').data(values).join('rect').attr('x', (d) => x(d.platform)).attr('y', height - margin.bottom).attr('width', x.bandwidth()).attr('height', 0).attr('rx', 4).attr('fill', (_, i) => palette[i])
    .on('click', (_, d) => onClick(d.platform)).on('mousemove', (event, d) => showTip(event, `<b>${d.platform}</b><br>Revenue: ₹${d3.format(',')(Math.round(d.revenue))}<br>Orders: ${d3.format(',')(d.count)}<br>Avg rating: ${d.rating.toFixed(2)}`)).on('mouseleave', hideTip)
    .transition().duration(700).attr('y', (d) => y(d.revenue)).attr('height', (d) => height - margin.bottom - y(d.revenue));
}

export function renderTreemap(selector, data) {
  const { svg, width, height } = frame(selector);
  const values = grouped(data, (d) => d.category).map(([name, v]) => ({ name, ...v }));
  if (!values.length) return empty(svg, width, height);
  const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([1, 5]);
  const root = d3.hierarchy({ children: values }).sum((d) => d.revenue).sort((a, b) => b.value - a.value);
  d3.treemap().size([width, height]).padding(4)(root);
  const cell = svg.selectAll('g').data(root.leaves()).join('g').attr('transform', (d) => `translate(${d.x0},${d.y0})`);
  cell.append('rect').attr('width', (d) => d.x1 - d.x0).attr('height', (d) => d.y1 - d.y0).attr('rx', 5).attr('fill', (d) => color(d.data.rating)).on('mousemove', (event, d) => showTip(event, `<b>${d.data.name}</b><br>Revenue: ₹${d3.format(',')(Math.round(d.data.revenue))}<br>Rating: ${d.data.rating.toFixed(2)}`)).on('mouseleave', hideTip);
  cell.append('text').attr('x', 8).attr('y', 18).attr('fill', '#fff').attr('font-size', 12).attr('font-weight', 700).text((d) => d.data.name).each(wrapText);
}

export function renderScatter(selector, data) {
  const { svg, width, height } = frame(selector);
  const margin = { top: 18, right: 24, bottom: 48, left: 58 };
  const sample = data.length > 2500 ? d3.shuffle([...data]).slice(0, 2500) : data;
  if (!sample.length) return empty(svg, width, height);
  const x = d3.scaleLinear(d3.extent(sample, (d) => d.orderValue), [margin.left, width - margin.right]).nice();
  const y = d3.scaleLinear(d3.extent(sample, (d) => d.deliveryMinutes), [height - margin.bottom, margin.top]).nice();
  const color = d3.scaleOrdinal([...new Set(data.map((d) => d.platform))], palette);
  svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));
  svg.selectAll('circle').data(sample).join('circle').attr('cx', (d) => x(d.orderValue)).attr('cy', (d) => y(d.deliveryMinutes)).attr('r', 0).attr('fill', (d) => color(d.platform)).attr('opacity', 0.45)
    .on('mousemove', (event, d) => showTip(event, `<b>${d.id}</b><br>${d.platform}<br>₹${d.orderValue}, ${d.deliveryMinutes} min<br>${d.feedbackSignal}`)).on('mouseleave', hideTip)
    .transition().duration(600).attr('r', 3.2);
}

export function renderHeatmap(selector, data) {
  const { svg, width, height } = frame(selector);
  const margin = { top: 18, right: 24, bottom: 42, left: 118 };
  const categories = [...new Set(data.map((d) => d.category))].sort();
  const ratings = [1, 2, 3, 4, 5];
  const counts = d3.rollup(data, (v) => v.length, (d) => d.category, (d) => d.rating);
  const x = d3.scaleBand(ratings, [margin.left, width - margin.right]).padding(0.08);
  const y = d3.scaleBand(categories, [margin.top, height - margin.bottom]).padding(0.08);
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(categories, (c) => d3.max(ratings, (r) => counts.get(c)?.get(r) || 0)) || 1]);
  svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat((d) => `${d}★`));
  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
  svg.selectAll('rect').data(categories.flatMap((c) => ratings.map((r) => ({ c, r, count: counts.get(c)?.get(r) || 0 })))).join('rect')
    .attr('x', (d) => x(d.r)).attr('y', (d) => y(d.c)).attr('width', x.bandwidth()).attr('height', y.bandwidth()).attr('rx', 4).attr('fill', (d) => color(d.count))
    .on('mousemove', (event, d) => showTip(event, `<b>${d.c}</b><br>${d.r} stars: ${d3.format(',')(d.count)} orders`)).on('mouseleave', hideTip);
}

export function renderSankey(selector, data) {
  const { svg, width, height } = frame(selector, 380);
  const graph = buildSankey(data);
  if (!graph.nodes.length) return empty(svg, width, height);
  sankey()
    .nodeId((d) => d.name)
    .nodeWidth(16)
    .nodePadding(12)
    .extent([[8, 8], [width - 8, height - 8]])(graph);
  svg.append('g').selectAll('path').data(graph.links).join('path').attr('d', sankeyLinkHorizontal()).attr('stroke', '#64748b').attr('stroke-width', (d) => Math.max(1, d.width)).attr('fill', 'none').attr('opacity', 0.28)
    .on('mousemove', (event, d) => showTip(event, `<b>${d.source.name}</b> -> <b>${d.target.name}</b><br>${d3.format(',')(d.value)} orders`)).on('mouseleave', hideTip);
  const node = svg.append('g').selectAll('g').data(graph.nodes).join('g');
  node.append('rect').attr('x', (d) => d.x0).attr('y', (d) => d.y0).attr('width', (d) => d.x1 - d.x0).attr('height', (d) => Math.max(1, d.y1 - d.y0)).attr('rx', 3).attr('fill', (_, i) => palette[i % palette.length]);
  node.append('text').attr('x', (d) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6).attr('y', (d) => (d.y0 + d.y1) / 2).attr('dy', '0.35em').attr('text-anchor', (d) => d.x0 < width / 2 ? 'start' : 'end').text((d) => d.name);
}

export function renderNetwork(selector, data) {
  const { svg, width, height } = frame(selector, 390);
  const graph = buildNetwork(data);
  if (!graph.nodes.length) return empty(svg, width, height);
  const color = d3.scaleOrdinal(['platform', 'feedback', 'outcome'], [palette[0], palette[3], palette[2]]);
  const simulation = d3.forceSimulation(graph.nodes).force('link', d3.forceLink(graph.links).id((d) => d.id).distance(80).strength(0.25)).force('charge', d3.forceManyBody().strength(-180)).force('center', d3.forceCenter(width / 2, height / 2)).force('collision', d3.forceCollide(26));
  const link = svg.append('g').selectAll('line').data(graph.links).join('line').attr('stroke', '#94a3b8').attr('stroke-opacity', 0.45).attr('stroke-width', (d) => Math.sqrt(d.value) / 14);
  const node = svg.append('g').selectAll('g').data(graph.nodes).join('g').call(d3.drag().on('start', dragStarted).on('drag', dragged).on('end', dragEnded));
  node.append('circle').attr('r', (d) => Math.max(8, Math.sqrt(d.value) / 13)).attr('fill', (d) => color(d.type)).on('mousemove', (event, d) => showTip(event, `<b>${d.id}</b><br>${d3.format(',')(d.value)} linked orders`)).on('mouseleave', hideTip);
  node.append('text').attr('dy', 24).attr('text-anchor', 'middle').text((d) => d.id).attr('font-size', 11);
  simulation.on('tick', () => {
    link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
  });
  function dragStarted(event) { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
  function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
  function dragEnded(event) { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }
}

function buildSankey(data) {
  const links = [];
  const add = (source, target, value) => links.push({ source, target, value });
  d3.rollups(data, (v) => v.length, (d) => d.platform, (d) => d.category).forEach(([p, cats]) => cats.forEach(([c, n]) => add(p, c, n)));
  d3.rollups(data, (v) => v.length, (d) => d.category, (d) => `Delay: ${d.delay}`).forEach(([c, delays]) => delays.forEach(([delay, n]) => add(c, delay, n)));
  d3.rollups(data, (v) => v.length, (d) => `Delay: ${d.delay}`, (d) => `Refund: ${d.refund}`).forEach(([delay, refunds]) => refunds.forEach(([refund, n]) => add(delay, refund, n)));
  const names = [...new Set(links.flatMap((d) => [d.source, d.target]))];
  return { nodes: names.map((name) => ({ name })), links: links.map((d) => ({ ...d })) };
}

function buildNetwork(data) {
  const linkMap = new Map();
  const nodeMap = new Map();
  const bump = (id, type, value) => nodeMap.set(id, { id, type, value: (nodeMap.get(id)?.value || 0) + value });
  const add = (source, target, value) => linkMap.set(`${source}|${target}`, { source, target, value: (linkMap.get(`${source}|${target}`)?.value || 0) + value });
  d3.rollups(data, (v) => v.length, (d) => d.platform, (d) => d.feedbackSignal, (d) => `Refund: ${d.refund}`).forEach(([platform, feedbacks]) => {
    feedbacks.forEach(([feedback, outcomes]) => {
      const total = d3.sum(outcomes, (d) => d[1]);
      bump(platform, 'platform', total); bump(feedback, 'feedback', total); add(platform, feedback, total);
      outcomes.forEach(([outcome, n]) => { bump(outcome, 'outcome', n); add(feedback, outcome, n); });
    });
  });
  return { nodes: [...nodeMap.values()], links: [...linkMap.values()] };
}

function wrapText() {
  const text = d3.select(this);
  const words = text.text().split(/\s+/);
  text.text(words.slice(0, 2).join(' '));
}

function empty(svg, width, height) {
  svg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle').attr('fill', '#64748b').text('No data for current filters');
}
