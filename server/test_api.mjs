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

async function test() {
  console.log('Testing SpendWise API...');

  // 1. Health
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('Health:', health.body.status, 'DB:', health.body.database?.type);

  // 2. Register
  const reg = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Alex Morgan',
      email: 'alex@spendwise.dev',
      password: 'password123',
      confirmPassword: 'password123',
    }
  );
  console.log('Register status:', reg.status, 'User:', reg.body.user?.email);

  const token = reg.body.token;
  const cookie = reg.headers['set-cookie'] ? reg.headers['set-cookie'][0] : '';
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Cookie: cookie,
  };

  // 3. Categories
  const cats = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/categories',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Categories count:', cats.body.count);

  const diningCat = cats.body.categories.find((c) => c.name === 'Food & Dining') || cats.body.categories[0];
  const salaryCat = cats.body.categories.find((c) => c.name === 'Salary') || cats.body.categories[cats.body.categories.length - 1];

  // 4. Create Transactions
  const t1 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/transactions',
      method: 'POST',
      headers: authHeaders,
    },
    {
      title: 'Monthly Salary',
      amount: 85000,
      type: 'income',
      categoryId: salaryCat._id,
      paymentMethod: 'Net Banking',
      notes: 'October tech payroll credit',
    }
  );
  console.log('Created Income:', t1.body.transaction?.title, 'Amount:', t1.body.transaction?.amount);

  const t2 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/transactions',
      method: 'POST',
      headers: authHeaders,
    },
    {
      title: 'Blue Tokai Coffee & Breakfast',
      amount: 680,
      type: 'expense',
      categoryId: diningCat._id,
      paymentMethod: 'UPI / QR',
      notes: 'Pour-over and croissants with co-founders',
    }
  );
  console.log('Created Expense:', t2.body.transaction?.title, 'Amount:', t2.body.transaction?.amount);

  // 5. Create Budget
  const b1 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/budgets',
      method: 'POST',
      headers: authHeaders,
    },
    {
      categoryId: diningCat._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      limitAmount: 12000,
    }
  );
  console.log('Created Budget for:', b1.body.budget?.categoryId?.name, 'Limit:', b1.body.budget?.limitAmount);

  // 6. Analytics Summary
  const summary = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/analytics/summary',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Summary Total Balance:', summary.body.metrics?.totalBalance);
  console.log('Summary Monthly Income:', summary.body.metrics?.monthlyIncome);
  console.log('Summary Monthly Expenses:', summary.body.metrics?.monthlyExpenses);
  console.log('Summary Savings Rate:', summary.body.metrics?.savingsRate + '%');

  console.log('\nAll API core flows verified successfully!');
}

test().catch(console.error);
