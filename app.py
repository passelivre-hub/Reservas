from flask import Flask, render_template, request, jsonify, g
import sqlite3
from datetime import datetime

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
    return datetime.strptime(s, '%Y-%m-%d').date()

def has_conflict(chale, nova_entrada, nova_saida, exclude_id=None):
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
        if not (new_end <= exist_start or new_start >= exist_end):
            return True
    return False

# --- rotas ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/reservas')
def reservas():
    db = get_db()
    cur = db.execute('SELECT * FROM reservas')
    rows = cur.fetchall()
    result = []
    for r in rows:
        # Usa exatamente a data de saída do banco
        result.append({
            'id': r['id'],
            'title': f"Chalé {r['chale']} — {r['nome']}",
            'start': r['entrada'],
            'end': r['saida'],
            'extendedProps': {
                'chale': r['chale'],
                'telefone': r['telefone'],
                'valor': r['valor'],
                'observacao': r['observacao']
            }
        })
    return jsonify(result)

@app.route('/criar', methods=['POST'])
def criar():
    db = get_db()
    nome = request.form['nome']
    telefone = request.form.get('telefone', '')
    valor = request.form.get('valor', 0)
    observacao = request.form.get('observacao', '')
    chale = int(request.form['chale'])
    entrada = request.form['entrada']
    saida = request.form['saida']

    if has_conflict(chale, entrada, saida):
        return jsonify({'success': False, 'error': 'Conflito de datas'})

    db.execute(
        'INSERT INTO reservas (chale, nome, telefone, valor, observacao, entrada, saida) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (chale, nome, telefone, valor, observacao, entrada, saida)
    )
    db.commit()
    return jsonify({'success': True})

@app.route('/atualizar', methods=['POST'])
def atualizar():
    db = get_db()
    id_ = int(request.form['id'])
    nome = request.form['nome']
    telefone = request.form.get('telefone', '')
    valor = request.form.get('valor', 0)
    observacao = request.form.get('observacao', '')
    chale = int(request.form['chale'])
    entrada = request.form['entrada']
    saida = request.form['saida']

    if has_conflict(chale, entrada, saida, exclude_id=id_):
        return jsonify({'success': False, 'error': 'Conflito de datas'})

    db.execute(
        'UPDATE reservas SET nome=?, telefone=?, valor=?, observacao=?, chale=?, entrada=?, saida=? WHERE id=?',
        (nome, telefone, valor, observacao, chale, entrada, saida, id_)
    )
    db.commit()
    return jsonify({'success': True})

@app.route('/remover', methods=['POST'])
def remover():
    db = get_db()
    id_ = int(request.form['id'])
    db.execute('DELETE FROM reservas WHERE id=?', (id_,))
    db.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
