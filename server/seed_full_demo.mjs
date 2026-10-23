import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function seed() {
  console.log('Seeding rich demo transactions for alex@spendwise.dev...');

  // 1. Login
  const loginRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'alex@spendwise.dev', password: 'password123' }
  );

  const token = loginRes.body.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Categories
  const catRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/categories',
    method: 'GET',
    headers,
  });

  const cats = catRes.body.categories || [];
  const getCatId = (name) => {
    const found = cats.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found ? found._id : cats[0]._id;
  };

  const sampleTransactions = [
    { title: 'Apartment Monthly Rent', amount: 32000, type: 'expense', categoryId: getCatId('Rent & Housing'), paymentMethod: 'Net Banking', notes: 'Monthly rent transfer to landlord' },
    { title: 'Nature Basket Groceries', amount: 4850, type: 'expense', categoryId: getCatId('Food & Dining'), paymentMethod: 'HDFC Card', notes: 'Weekly organic produce & provisions' },
    { title: 'Uber Rides & Commute', amount: 1420, type: 'expense', categoryId: getCatId('Transportation'), paymentMethod: 'UPI / QR', notes: 'Office airport cab rides' },
    { title: 'Zara Wardrobe Essentials', amount: 5600, type: 'expense', categoryId: getCatId('Shopping'), paymentMethod: 'ICICI Bank', notes: 'Formal shirts and blazers' },
    { title: 'Cult.fit Gym & Fitness', amount: 2500, type: 'expense', categoryId: getCatId('Gym & Fitness'), paymentMethod: 'UPI / QR', notes: 'Monthly studio membership' },
    { title: 'Electricity & Fiber Wifi', amount: 2800, type: 'expense', categoryId: getCatId('Bills & Utilities'), paymentMethod: 'UPI / QR', notes: 'Airtel broadband & BESCOM electricity' },
    { title: 'Freelance UI/UX Consultation', amount: 35000, type: 'income', categoryId: getCatId('Freelance'), paymentMethod: 'Net Banking', notes: 'Design sprint payment from Fintech client' },
    { title: 'Mutual Fund Dividend & Return', amount: 8400, type: 'income', categoryId: getCatId('Investment'), paymentMethod: 'Net Banking', notes: 'Nifty 50 Index fund quarterly dividend' },
  ];

  for (const tx of sampleTransactions) {
    await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/transactions',
        method: 'POST',
        headers,
      },
      tx
    );
  }

  // Budgets
  const sampleBudgets = [
    { categoryId: getCatId('Food & Dining'), limitAmount: 12000 },
    { categoryId: getCatId('Rent & Housing'), limitAmount: 35000 },
    { categoryId: getCatId('Shopping'), limitAmount: 8000 },
    { categoryId: getCatId('Transportation'), limitAmount: 4000 },
    { categoryId: getCatId('Bills & Utilities'), limitAmount: 5000 },
  ];

  const now = new Date();
  for (const b of sampleBudgets) {
    await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/budgets',
        method: 'POST',
        headers,
      },
      {
        ...b,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }
    );
  }

  console.log('Seeded transactions and budget envelopes successfully!');
}

seed().catch(console.error);
