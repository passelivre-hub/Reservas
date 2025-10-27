from flask import Flask, render_template, request, jsonify, g
try:
chale = int(data.get('chale'))
nome = data.get('nome')
telefone = data.get('telefone')
valor = data.get('valor') or 0
observacao = data.get('observacao') or ''
entrada = data.get('entrada')
saida = data.get('saida')
# validation
if not nome or not entrada or not saida:
return jsonify({'success': False, 'error': 'Campos obrigatórios em falta.'}), 400


# conflito?
if has_conflict(chale, entrada, saida):
return jsonify({'success': False, 'error': 'Conflito: o chalé já está reservado nesse período.'}), 400


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


# conflito excluindo a própria reserva
if has_conflict(chale, entrada, saida, exclude_id=rid):
return jsonify({'success': False, 'error': 'Conflito: o chalé já está reservado nesse período.'}), 400


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
