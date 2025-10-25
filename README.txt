Sistema de Reservas - 3 Chalés
----------------------------------

Como usar (resumo):
1) Criar e ativar virtualenv (opcional):
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # mac/linux
   source venv/bin/activate

2) Instalar dependências:
   pip install -r requirements.txt

3) Executar servidor:
   python app.py

4) Acessar no navegador:
   http://localhost:5000
   ou http://SEU_IP:5000 (para acessar pelo celular na mesma rede)

Observações:
- O servidor cria o banco 'reservas.db' automaticamente.
- O backend faz verificação de conflito de reservas (mesmo chalé, datas sobrepostas).
- Na interface é possível criar, editar e remover reservas clicando no calendário.
