const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const base = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3001';
  const j = async (res) => ({ status: res.status, json: await res.json().catch(()=>({})) });

  console.log('Testing against', base);

  // 1) Create marketplace item
  let res = await fetch(`${base}/api/marketplace/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Demo Integration', type: 'integration', developerId: 'demo-user', price: 0 }),
  });
  let created = await j(res);
  console.log('Create item ->', created);

  // 2) List items
  res = await fetch(`${base}/api/marketplace/items`);
  let list = await j(res);
  console.log('List items ->', list);

  // 3) Purchase first item if exists
  const first = Array.isArray(list.json) && list.json[0];
  if (first) {
    res = await fetch(`${base}/api/marketplace/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user', itemId: first.id }),
    });
    let purchase = await j(res);
    console.log('Purchase ->', purchase);
  } else {
    console.log('No items to purchase');
  }

  // 4) AI learn
  res = await fetch(`${base}/api/ai/learn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'user_clicked_button', data: { buttonId: 'start' } }),
  });
  let learn = await j(res);
  console.log('AI learn ->', learn);

  // 5) AI insights
  res = await fetch(`${base}/api/ai/insights`);
  let insights = await j(res);
  console.log('AI insights ->', insights);
}

main().catch((e) => { console.error('Test failed:', e); process.exitCode = 1; });
