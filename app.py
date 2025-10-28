from flask import Flask, render_template, request, jsonify, g
import sqlite3
from datetime import datetime, timedelta

DATABASE = 'reservas.db'

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

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

def parse_date(s):
    return datetime.strptime(s, '%Y-%m-%d').date()

def has_conflict(chale, nova_entrada, nova_saida, exclude_id=None, limite=2):
    """
    Retorna True se já houver o limite de reservas do chalé nesse período.
    limite: número máximo de reservas permitidas para o mesmo chalé em um dia.
    """
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
    dias = (new_end - new_start).days

    for i in range(dias):
        dia = new_start + timedelta(days=i)
        count = 0
        for r in rows:
            exist_start = parse_date(r['entrada'])
            exist_end = parse_date(r['saida'])
            if exist_start <= dia < exist_end:
                count += 1
        if count >= limite:
            return True
    return False

@app.route('/')
def index():
    init_db()
    return render_template('index.html')

@app.route('/reservas')
def listar_reservas():
    db = get_db()
    cur = db.execute('SELECT * FROM reservas')
    rows = cur.fetchall()
    eventos = []
    for r in rows:
        title = f"Chalé {r['chale']} — {r['nome']}"
        # Corrige para que o FullCalendar cubra o dia de saída
        end_date = (parse_date(r['saida']) + timedelta(days=1)).isoformat()
        eventos.append({
            'id': r['id'],
            'title': title,
            'start': r['entrada'],
            'end': end_date,
            'extendedProps': {
                'telefone': r['telefone'],
                'valor': r['valor'],
                'observacao': r['observacao'],
                'chale': r['chale']
            }
        })
    return jsonify(eventos)

@app.route('/criar', methods=['POST'])
def criar_reserva():
    data = request.form or request.json
    try:
        chale = int(data.get('chale'))
        nome = data.get('nome')
        telefone = data.get('telefone')
        valor = data.get('valor') or 0
        observacao = data.get('observacao') or ''
        entrada = data.get('entrada')
        saida = data.get('saida')
        if not nome or not entrada or not saida:
            return jsonify({'success': False, 'error': 'Campos obrigatórios em falta.'}), 400

        if has_conflict(chale, entrada, saida, limite=2):
            return jsonify({'success': False, 'error': 'Conflito: limite de reservas atingido para este chalé nesse dia.'}), 400

        db = get_db()
        db.execute('''INSERT INTO reservas (chale,nome,telefone,valor,observacao,entrada,saida)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (chale, nome, telefone, float(valor), observacao, entrada, saida))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/atualizar', methods=['POST'])
def atualizar_reserva():
    data = request.form or request.json
    try:
        rid = int(data.get('id'))
        chale = int(data.get('chale'))
        nome = data.get('nome')
        telefone = data.get('telefone')
        valor = data.get('valor') or 0
        observacao = data.get('observacao') or ''
        entrada = data.get('entrada')
        saida = data.get('saida')
        if not nome or not entrada or not saida:
            return jsonify({'success': False, 'error': 'Campos obrigatórios em falta.'}), 400

        if has_conflict(chale, entrada, saida, exclude_id=rid, limite=2):
            return jsonify({'success': False, 'error': 'Conflito: limite de reservas atingido para este chalé nesse dia.'}), 400

        db = get_db()
        db.execute('''UPDATE reservas SET chale=?,nome=?,telefone=?,valor=?,observacao=?,entrada=?,saida=? WHERE id=?''',
                   (chale, nome, telefone, float(valor), observacao, entrada, saida, rid))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/remover', methods=['POST'])
def remover_reserva():
    data = request.form or request.json
    try:
        rid = int(data.get('id'))
        db = get_db()
        db.execute('DELETE FROM reservas WHERE id=?', (rid,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
