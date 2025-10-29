from flask import Flask, request, jsonify, render_template
import sqlite3
from pathlib import Path

app = Flask(__name__)

DB_PATH = Path("reservas.db")

# === FUNÇÃO PARA INICIALIZAR BANCO DE DADOS ===
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chale TEXT,
        nome TEXT,
        telefone TEXT,
        pessoas INTEGER DEFAULT 2,
        valor REAL,
        entrada TEXT,
        saida TEXT,
        observacao TEXT,
        status TEXT DEFAULT 'pendente',
        checkin INTEGER DEFAULT 0,
        checkout INTEGER DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

# Inicializa o banco
init_db()

# === ROTA PRINCIPAL ===
@app.route("/")
def index():
    return render_template("index.html")  # seu HTML que carrega o FullCalendar

# === LISTAR RESERVAS (para FullCalendar) ===
@app.route("/reservas")
def listar():
    start = request.args.get('start')
    end = request.args.get('end')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT id, chale, nome, telefone, pessoas, valor, entrada, saida, observacao, status, checkin, checkout
        FROM reservas
        WHERE entrada <= ? AND saida >= ?
    """, (end, start))
    rows = cur.fetchall()
    eventos = []
    for r in rows:
        eventos.append({
            "id": r["id"],
            "title": f"{r['chale']} — {r['nome']}",
            "start": r["entrada"],
            "end": r["saida"],
            "extendedProps": {
                "chale": r["chale"],
                "telefone": r["telefone"],
                "pessoas": r["pessoas"],
                "valor": r["valor"],
                "observacao": r["observacao"],
                "checkin": bool(r["checkin"]),
                "checkout": bool(r["checkout"])
            }
        })
    conn.close()
    return jsonify(eventos)

# === CRIAR RESERVA ===
@app.route("/criar", methods=["POST"])
def criar():
    data = request.form
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO reservas (chale, nome, telefone, pessoas, valor, entrada, saida, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("chale"),
        data.get("nome"),
        data.get("telefone"),
        data.get("pessoas") or 2,
        data.get("valor") or 0,
        data.get("entrada"),
        data.get("saida"),
        data.get("observacao")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# === ATUALIZAR RESERVA ===
@app.route("/atualizar", methods=["POST"])
def atualizar():
    data = request.form
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        UPDATE reservas SET chale=?, nome=?, telefone=?, pessoas=?, valor=?, entrada=?, saida=?, observacao=?
        WHERE id=?
    """, (
        data.get("chale"),
        data.get("nome"),
        data.get("telefone"),
        data.get("pessoas") or 2,
        data.get("valor") or 0,
        data.get("entrada"),
        data.get("saida"),
        data.get("observacao"),
        data.get("id")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# === REMOVER RESERVA ===
@app.route("/remover", methods=["POST"])
def remover():
    id_ = request.form.get("id")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM reservas WHERE id=?", (id_,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# === CHECK-IN ===
@app.route("/checkin", methods=["POST"])
def checkin():
    id_ = request.form.get("id")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE reservas SET checkin=1 WHERE id=?", (id_,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# === CHECK-OUT ===
@app.route("/checkout", methods=["POST"])
def checkout():
    id_ = request.form.get("id")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE reservas SET checkout=1 WHERE id=?", (id_,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# === RODAR O APP ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
