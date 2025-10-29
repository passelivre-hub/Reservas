from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)
DATABASE = 'reservas.db'


def init_db():
    with sqlite3.connect(DATABASE) as db:
        db.execute('''
        CREATE TABLE IF NOT EXISTS reservas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chale INTEGER,
            nome TEXT,
            telefone TEXT,
            pessoas INTEGER,
            valor REAL,
            entrada TEXT,
            saida TEXT,
            observacao TEXT,
            status TEXT DEFAULT 'normal'
        )
        ''')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/reservas')
def listar():
    with sqlite3.connect(DATABASE) as db:
        cur = db.execute('SELECT id, chale, nome, telefone, pessoas, valor, entrada, saida, observacao, status FROM reservas')
        data = [
            {
                'id': r[0],
                'title': f"Chalé {r[1]} — {r[2]}",
                'start': r[6],
                'end': r[7],
                'extendedProps': {
                    'chale': r[1],
                    'telefone': r[3],
                    'pessoas': r[4],
                    'valor': r[5],
                    'observacao': r[8],
                    'status': r[9]
                }
            }
            for r in cur.fetchall()
        ]
    return jsonify(data)


@app.route('/criar', methods=['POST'])
def criar():
    data = request.form
    observacao = data.get('observacao', '').strip()
    status = 'observacao' if observacao else 'normal'

    with sqlite3.connect(DATABASE) as db:
        db.execute('''
        INSERT INTO reservas (chale, nome, telefone, pessoas, valor, entrada, saida, observacao, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['chale'], data['nome'], data['telefone'], data['pessoas'],
            data['valor'], data['entrada'], data['saida'], observacao, status
        ))
        db.commit()
    return jsonify({'success': True})


@app.route('/atualizar', methods=['POST'])
def atualizar():
    data = request.form
    observacao = data.get('observacao', '').strip()
    status = 'observacao' if observacao else 'normal'

    with sqlite3.connect(DATABASE) as db:
        db.execute('''
        UPDATE reservas
        SET chale=?, nome=?, telefone=?, pessoas=?, valor=?, entrada=?, saida=?, observacao=?, status=?
        WHERE id=?
        ''', (
            data['chale'], data['nome'], data['telefone'], data['pessoas'],
            data['valor'], data['entrada'], data['saida'], observacao, status, data['id']
        ))
        db.commit()
    return jsonify({'success': True})


@app.route('/remover', methods=['POST'])
def remover():
    id_ = request.form.get('id')
    with sqlite3.connect(DATABASE) as db:
        db.execute('DELETE FROM reservas WHERE id=?', (id_,))
        db.commit()
    return jsonify({'success': True})


@app.route('/atualizar_status', methods=['POST'])
def atualizar_status():
    id_ = request.form.get('id')
    status = request.form.get('status')
    with sqlite3.connect(DATABASE) as db:
        db.execute('UPDATE reservas SET status=? WHERE id=?', (status, id_))
        db.commit()
    return jsonify({'success': True})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
