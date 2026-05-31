# Projeto Integrador - Sistema Integrado de Apoio à Gestão de Urgências Hospitalares


Sistema de gestão de urgências hospitalares desenvolvido com Docker, PostgreSQL, Backend e Frontend Web.

---

# Requisitos

Antes de iniciar o projeto, é necessário ter instalado:

- Docker Desktop
- Navegador Web (Google Chrome, Edge ou Firefox)

Não é necessário instalar:

- Python
- Node.js
- PostgreSQL
- npm

Todas estas dependências são executadas dentro dos contentores Docker.

---

# Estrutura do Projeto

```text
projeto-urgencias/
│
├── docker-compose.yml
├── Base de dados.sql
├── dados_teste_10_pacientes_hospital_central.sql
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── seed.py
│   └── Dockerfile
│
└── frontend/
    ├── index.html
    ├── 1-login.html
    ├── api.js
    ├── js/
    ├── css/
    ├── Dockerfile
    └── nginx.conf
```

---

# Instalação e Execução

## 1. Descompactar o Projeto

Descompactar o ficheiro ZIP recebido.

Confirmar que existe o ficheiro:

```bash
docker-compose.yml
```

## 2. Iniciar os Contentores

Abrir um terminal na pasta do projeto e executar:

```bash
docker compose up --build
```

Em alguns sistemas:

```bash
docker-compose up --build
```

Este comando inicia:

- PostgreSQL
- Backend
- Frontend

---

# Importação da Base de Dados

Após o arranque inicial dos contentores, executar:

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "Base de dados.sql"
```

## Dados de Teste (Opcional)

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "dados_teste_10_pacientes_hospital_central.sql"
```

---

# Acesso à Aplicação

Abrir no navegador:

```text
http://localhost:8080
```

---

# Credenciais de Acesso

Password comum:

```text
1234
```

Utilizadores disponíveis:

```text
admin
administrativo
medico
enfermeiro
```

Exemplo:

```text
Utilizador: admin
Password: 1234
```

---

# Verificação da API

Endpoint de saúde:

```text
http://localhost:8080/api/health
```

Outros endpoints disponíveis:

```text
http://localhost:8080/api/utentes
http://localhost:8080/api/hospitais
http://localhost:8080/api/episodios
```

---

# Ligação à Base de Dados

Configuração para pgAdmin ou DBeaver:

```text
Host: localhost
Porta: 5433
Base de Dados: hospital_urgencias
Utilizador: postgres
Password: postgres
```

---

# Encerrar o Projeto

Pressionar:

```text
CTRL + C
```

Depois executar:

```bash
docker compose down
```

---

# Reinicializar a Base de Dados

Apagar todos os volumes:

```bash
docker compose down -v
docker compose up --build
```

Importar novamente:

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "Base de dados.sql"
```

Opcionalmente:

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "dados_teste_10_pacientes_hospital_central.sql"
```

Atenção: este procedimento elimina todos os dados existentes.

---

# Portas Utilizadas

| Serviço | Endereço |
|----------|----------|
| Frontend | http://localhost:8080 |
| API | http://localhost:8080/api |
| PostgreSQL | localhost:5433 |

---

# Problemas Comuns

## O site não abre

Verificar se o Docker Desktop está ativo e se os contentores estão em execução.

## A porta 8080 está ocupada

Encerrar a aplicação que está a utilizar a porta ou alterar o mapeamento de portas.

## A base de dados está vazia

Executar novamente:

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "Base de dados.sql"
```

e

```bash
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "dados_teste_10_pacientes_hospital_central.sql"
```

## Não é possível iniciar sessão

Utilizar uma das contas de teste com a password:

```text
1234
```

---

# Resumo

```bash
docker compose up --build
docker exec -i urgencias_db psql -U postgres -d hospital_urgencias < "Base de dados.sql"
```

Abrir:

```text
http://localhost:8080
```

Login:

```text
Utilizador: admin
Password: 1234
```

O projeto ficará pronto para utilização.
