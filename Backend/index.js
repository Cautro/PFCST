const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getOrderProgress(order) {
  const total = order.items.length || 1;
  const done = order.items.filter((item) => item.status === 'done').length;
  const paintDone = order.items.filter((item) => item.paintStatus === 'done').length;
  return {
    manufacturingPct: Math.round((done / total) * 100),
    paintPct: Math.round((paintDone / total) * 100),
  };
}

function addWorkLog(user, log) {
  if (!user.workLogs) {
    user.workLogs = [];
  }
  user.workLogs.push(log);
}

function summarizeWorkLogs(user) {
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear().toString();
  const monthMap = {};
  let todaySeconds = 0;
  let yearSeconds = 0;

  (user.workLogs || []).forEach((log) => {
    const logMonth = log.date.slice(0, 7);
    monthMap[logMonth] = (monthMap[logMonth] || 0) + log.seconds;
    if (log.date === today) {
      todaySeconds += log.seconds;
    }
    if (log.date.startsWith(year)) {
      yearSeconds += log.seconds;
    }
  });

  const months = Object.entries(monthMap)
    .map(([month, seconds]) => ({ month, seconds }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return {
    todaySeconds,
    months,
    yearSeconds,
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/auth/login', (req, res) => {
  const { login, password } = req.body;
  const db = readDb();
  const user = db.users.find((entry) => entry.login === login && entry.password === password);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    department: user.department,
  });
});

app.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users);
});

app.get('/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const summary = summarizeWorkLogs(user);
  const today = new Date().toISOString().slice(0, 10);
  const itemsMadeToday = db.orders
    .flatMap((order) => order.items)
    .filter((item) => item.completedBy === user.id && item.completedDate === today).length;
  res.json({ ...user, summary, itemsMadeToday });
});

app.post('/users', (req, res) => {
  const { name, login, password, role, department } = req.body;
  if (!name || !login || !password || !role || !department) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const db = readDb();
  const user = {
    id: makeId('user'),
    name,
    login,
    password,
    role,
    department,
    workLogs: [],
  };
  db.users.push(user);
  writeDb(db);
  res.status(201).json(user);
});

app.put('/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { name, login, password, role, department } = req.body;
  if (name) user.name = name;
  if (login) user.login = login;
  if (password) user.password = password;
  if (role) user.role = role;
  if (department) user.department = department;
  writeDb(db);
  res.json(user);
});

app.delete('/users', (req, res) => {
  const { ids } = req.body;
  const db = readDb();
  db.users = db.users.filter((entry) => !ids.includes(entry.id));
  writeDb(db);
  res.json({ ok: true });
});

app.get('/assortment', (req, res) => {
  const db = readDb();
  res.json(db.assortment);
});

app.get('/assortment/:id', (req, res) => {
  const db = readDb();
  const item = db.assortment.find((entry) => entry.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item);
});

app.post('/assortment', (req, res) => {
  const { name, wire, tube, misc } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const db = readDb();
  const item = {
    id: makeId('product'),
    name,
    wire: wire || [],
    tube: tube || [],
    misc: misc || [],
  };
  db.assortment.push(item);
  writeDb(db);
  res.status(201).json(item);
});

app.put('/assortment/:id', (req, res) => {
  const db = readDb();
  const item = db.assortment.find((entry) => entry.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const { name, wire, tube, misc } = req.body;
  if (name) item.name = name;
  if (wire) item.wire = wire;
  if (tube) item.tube = tube;
  if (misc) item.misc = misc;
  writeDb(db);
  res.json(item);
});

app.delete('/assortment', (req, res) => {
  const { ids } = req.body;
  const db = readDb();
  db.assortment = db.assortment.filter((entry) => !ids.includes(entry.id));
  writeDb(db);
  res.json({ ok: true });
});

app.get('/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders.map((order) => ({ ...order, progress: getOrderProgress(order) })));
});

app.get('/orders/in-progress', (req, res) => {
  const db = readDb();
  const orders = db.orders.filter((order) => getOrderProgress(order).manufacturingPct < 100);
  res.json(orders.map((order) => ({ ...order, progress: getOrderProgress(order) })));
});

app.get('/orders/completed', (req, res) => {
  const db = readDb();
  const orders = db.orders.filter((order) => {
    const progress = getOrderProgress(order);
    return progress.manufacturingPct === 100 && progress.paintPct === 100;
  });
  res.json(orders.map((order) => ({ ...order, progress: getOrderProgress(order) })));
});

app.get('/orders/paint', (req, res) => {
  const db = readDb();
  const orders = db.orders.filter((order) =>
    order.items.some((item) => ['ready', 'in_progress'].includes(item.paintStatus))
  );
  res.json(orders.map((order) => ({ ...order, progress: getOrderProgress(order) })));
});

app.get('/orders/:id', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ ...order, progress: getOrderProgress(order) });
});

app.post('/orders', (req, res) => {
  const { date, name, items } = req.body;
  if (!date || !name || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const db = readDb();
  const order = {
    id: makeId('order'),
    date,
    name,
    items: items.map((item) => ({
      id: makeId('item'),
      productId: item.productId,
      productName: item.productName,
      color: item.color,
      quantity: Number(item.quantity || 0),
      status: 'new',
      paintStatus: 'not_ready',
    })),
  };
  db.orders.push(order);
  writeDb(db);
  res.status(201).json({ ...order, progress: getOrderProgress(order) });
});

app.put('/orders/:id', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const { date, name, items } = req.body;
  if (date) order.date = date;
  if (name) order.name = name;
  if (Array.isArray(items)) {
    order.items = items.map((item) => ({
      id: item.id || makeId('item'),
      productId: item.productId,
      productName: item.productName,
      color: item.color,
      quantity: Number(item.quantity || 0),
      status: item.status || 'new',
      paintStatus: item.paintStatus || (item.status === 'done' ? 'ready' : 'not_ready'),
      completedBy: item.completedBy || null,
      completedDate: item.completedDate || null,
    }));
  }
  writeDb(db);
  res.json({ ...order, progress: getOrderProgress(order) });
});

app.delete('/orders', (req, res) => {
  const { ids } = req.body;
  const db = readDb();
  db.orders = db.orders.filter((entry) => !ids.includes(entry.id));
  writeDb(db);
  res.json({ ok: true });
});

app.post('/orders/:orderId/items/:itemId/start', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const item = order.items.find((entry) => entry.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  item.status = 'in_progress';
  writeDb(db);
  res.json({ ...item, progress: getOrderProgress(order) });
});

app.post('/orders/:orderId/items/:itemId/pause', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const item = order.items.find((entry) => entry.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  item.status = 'in_progress';
  writeDb(db);
  res.json({ ...item, progress: getOrderProgress(order) });
});

app.post('/orders/:orderId/items/:itemId/done', (req, res) => {
  const { userId } = req.body;
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const item = order.items.find((entry) => entry.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  item.status = 'done';
  item.paintStatus = 'ready';
  if (userId) {
    item.completedBy = userId;
    item.completedDate = new Date().toISOString().slice(0, 10);
  }
  writeDb(db);
  res.json({ ...item, progress: getOrderProgress(order) });
});

app.post('/orders/:orderId/items/:itemId/paint-start', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const item = order.items.find((entry) => entry.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  item.paintStatus = 'in_progress';
  writeDb(db);
  res.json({ ...item, progress: getOrderProgress(order) });
});

app.post('/orders/:orderId/items/:itemId/paint-done', (req, res) => {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const item = order.items.find((entry) => entry.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  item.paintStatus = 'done';
  writeDb(db);
  res.json({ ...item, progress: getOrderProgress(order) });
});

app.post('/time/log', (req, res) => {
  const { userId, date, seconds } = req.body;
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (!date || typeof seconds !== 'number') {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  addWorkLog(user, { date, seconds });
  writeDb(db);
  res.json(summarizeWorkLogs(user));
});

app.get('/time/:userId/summary', (req, res) => {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === req.params.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(summarizeWorkLogs(user));
});

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});
