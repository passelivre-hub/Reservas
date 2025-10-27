from flask import Flask, render_template, request, jsonify, g
import sqlite3
from datetime import datetime, date


DATABASE = 'reservas.db'


app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False


# --- DB helpers ---


def get_db():
db = getattr(g, '_database', None)
if db is None:
db = g._database = sqlite3.connect(DATABASE)
db.row_factory = sqlite3.Row
return db


@app.teardown_appcontext
def close_connection(exception):
db = getattr(g, '_database', None)
if db is not None:
db.close()


def init_db():
db = get_db()
db.execute('''
CREATE TABLE IF NOT EXISTS reservas (
id INTEGER PRIMARY KEY AUTOINCREMENT,
chale INTEGER NOT NULL,
nome TEXT NOT NULL,
telefone TEXT,
valor REAL,
observacao TEXT,
entrada TEXT NOT NULL,
saida TEXT NOT NULL
)
''')
db.commit()


# --- util: verifica conflito ---


def parse_date(s):
# espera 'YYYY-MM-DD'
return datetime.strptime(s, '%Y-%m-%d').date()


def has_conflict(chale, nova_entrada, nova_saida, exclude_id=None):
"""Retorna True se existe conflito para o chalé entre [nova_entrada, nova_saida)"""
db = get_db()
params = [chale]
query = 'SELECT * FROM reservas WHERE chale = ?'
if exclude_id:
query += ' AND id != ?'
params.append(exclude_id)
cur = db.execute(query, params)
rows = cur.fetchall()


new_start = parse_date(nova_entrada)
new_end = parse_date(nova_saida)
for r in rows:
exist_start = parse_date(r['entrada'])
exist_end = parse_date(r['saida'])
# conflito se os intervalos se interceptam: not (new_end <= exist_start or new_start >= exist_end)
app.run(host='0.0.0.0', port=5000, debug=True)
