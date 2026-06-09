import * as d3 from 'd3';

const parseDate = d3.timeParse('%M:%S.%L');

export async function loadData(url) {
  const raw = await d3.csv(url);
  return raw.map((d, index) => {
    const deliveryMinutes = +d['Delivery Time (Minutes)'] || 0;
    const orderValue = +d['Order Value (INR)'] || 0;
    const rating = +d['Service Rating'] || 0;
    const delay = cleanFlag(d['Delivery Delay']);
    const refund = cleanFlag(d['Refund Requested']);
    const feedback = String(d['Customer Feedback'] || '').trim();
    const parsed = parseDate(d['Order Date & Time']);

    return {
      id: d['Order ID'] || `ROW${index}`,
      customerId: d['Customer ID'],
      platform: d.Platform || 'Unknown',
      orderDateRaw: d['Order Date & Time'],
      orderDate: parsed || new Date(2026, 0, 1, 0, index % 60, 0),
      timeBucket: parsed ? d3.timeFormat('%H:%M')(parsed) : d['Order Date & Time'],
      deliveryMinutes,
      category: d['Product Category'] || 'Unknown',
      orderValue,
      feedback,
      feedbackSignal: classifyFeedback(feedback),
      rating,
      delay,
      refund,
      revenuePerMinute: deliveryMinutes ? orderValue / deliveryMinutes : 0,
      satisfactionIndex: rating * 20,
      platformEfficiency: deliveryMinutes ? (orderValue * Math.max(rating, 1)) / deliveryMinutes : 0,
      refundRisk: (delay === 'Yes' ? 0.55 : 0.1) + (refund === 'Yes' ? 0.35 : 0) + (rating <= 2 ? 0.25 : 0)
    };
  });
}

function cleanFlag(value) {
  return String(value || '').trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
}

function classifyFeedback(text) {
  const value = text.toLowerCase();
  if (value.includes('missing')) return 'Missing Items';
  if (value.includes('late') || value.includes('delay')) return 'Late Delivery';
  if (value.includes('damaged') || value.includes('bad')) return 'Quality Issue';
  if (value.includes('fast') || value.includes('quick') || value.includes('great') || value.includes('reliable')) return 'Positive';
  return 'Neutral';
}
