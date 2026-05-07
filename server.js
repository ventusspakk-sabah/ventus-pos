const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');

const app = express();
app.use(cors());
app.use(express.json());

let db;
const dbPath = path.join(__dirname, 'ventus.db');

async function initDatabase() {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
        db = new SQL.Database(fs.readFileSync(dbPath));
    } else {
        db = new SQL.Database();
    }
    db.run("CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT, phone TEXT UNIQUE, pin_code TEXT, role TEXT DEFAULT 'cashier')");
    db.run("CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT, price REAL, duration_minutes INTEGER DEFAULT 60, is_active INTEGER DEFAULT 1)");
    db.run("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, customer_name TEXT, total REAL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now','localtime')))");
    db.run("CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, item_name TEXT, quantity INTEGER, price REAL, line_total REAL)");
    db.run("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, points INTEGER DEFAULT 0)");
    db.run("CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, name TEXT, status TEXT DEFAULT 'available')");

    const admin = db.exec("SELECT id FROM employees WHERE phone = 'admin'");
    if (!admin.length || !admin[0].values.length) {
        const hash = bcrypt.hashSync('8888', 10);
        db.run("INSERT INTO employees (id, name, phone, pin_code, role) VALUES (?,?,?,?,?)", [crypto.randomUUID(), 'Admin', 'admin', hash, 'admin']);
    }

    const svc = db.exec("SELECT id FROM items LIMIT 1");
    if (!svc.length || !svc[0].values.length) {
        [{n:'泰式按摩',p:120,d:60},{n:'精油推背',p:150,d:90},{n:'足底按摩',p:60,d:45},{n:'头部理疗',p:80,d:30}].forEach(s => {
            db.run("INSERT INTO items (id, name, price, duration_minutes) VALUES (?,?,?,?)", [crypto.randomUUID(), s.n, s.p, s.d]);
        });
        ['VIP1','VIP2','标准1','标准2'].forEach(name => {
            db.run("INSERT INTO rooms (id, name) VALUES (?,?)", [crypto.randomUUID(), name]);
        });
    }
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function getRows(stmt) { const rows = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows; }

const JWT_SECRET = process.env.JWT_SECRET || 'ventus-secret';

app.post('/api/auth/login', (req, res) => {
    const { phone, pin } = req.body;
    const rows = getRows(db.prepare("SELECT * FROM employees WHERE phone = ? AND is_active = 1").bind([phone]));
    if (!rows.length || !bcrypt.compareSync(pin, rows[0].pin_code)) return res.status(401).json({ error: 'Invalid' });
    res.json({ token: jwt.sign({ id: rows[0].id, role: rows[0].role }, JWT_SECRET, { expiresIn: '7d' }), user: rows[0] });
});

app.get('/api/items', (_, res) => res.json(getRows(db.prepare("SELECT * FROM items WHERE is_active = 1"))));

app.post('/api/orders', (req, res) => {
    const { items, customer_name, total_amount } = req.body;
    const orderId = crypto.randomUUID(), orderNo = 'ORD-' + Date.now();
    db.run("INSERT INTO orders (id, order_number, customer_name, total) VALUES (?,?,?,?)", [orderId, orderNo, customer_name, total_amount]);
    if (items) items.forEach(i => db.run("INSERT INTO order_items (id, order_id, item_name, quantity, price, line_total) VALUES (?,?,?,?,?,?)", [crypto.randomUUID(), orderId, i.name, i.quantity||1, i.price, i.line_total||i.price]));
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
    res.json({ success: true, orderId, orderNo });
});

app.get('/api/orders', (_, res) => res.json(getRows(db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50"))));
app.get('/api/rooms', (_, res) => res.json(getRows(db.prepare("SELECT * FROM rooms"))));
app.get('/api/customers', (_, res) => res.json(getRows(db.prepare("SELECT * FROM customers"))));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('✅ Ventus POS 已启动: http://localhost:' + PORT);
        console.log('默认账号: admin / 8888');
    });
}).catch(e => { console.error(e); process.exit(1); });
