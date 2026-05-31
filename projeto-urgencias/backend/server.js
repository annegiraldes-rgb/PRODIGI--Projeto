const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hospital_urgencias',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
});

async function waitForDb(maxTries = 60) {
  for (let i = 0; i < maxTries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Não foi possível ligar à base de dados.');
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hospitais (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      localizacao VARCHAR(150) NOT NULL,
      data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(20) DEFAULT 'ativo'
    );

    CREATE TABLE IF NOT EXISTS utilizadores (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      username VARCHAR(80) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      perfil VARCHAR(50) NOT NULL,
      hospital_id INT REFERENCES hospitais(id),
      estado VARCHAR(20) DEFAULT 'ativo',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profissionais (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      especialidade VARCHAR(120),
      cedula VARCHAR(50),
      hospital_id INT NOT NULL REFERENCES hospitais(id),
      estado VARCHAR(20) DEFAULT 'ativo'
    );

    CREATE TABLE IF NOT EXISTS utentes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      data_nascimento DATE NOT NULL,
      nif VARCHAR(20) UNIQUE NOT NULL,
      nss VARCHAR(30) UNIQUE,
      sexo VARCHAR(20),
      telefone VARCHAR(30),
      morada TEXT,
      grupo_sanguineo VARCHAR(5),
      alergias TEXT,
      patologias TEXT,
      data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS episodios (
      id SERIAL PRIMARY KEY,
      utente_id INT NOT NULL REFERENCES utentes(id),
      hospital_id INT NOT NULL REFERENCES hospitais(id),
      data_entrada TIMESTAMP NOT NULL,
      data_hora_alta TIMESTAMP,
      estado VARCHAR(50) DEFAULT 'aguardar_triagem',
      tipo_entrada VARCHAR(30) DEFAULT 'normal',
      motivo TEXT
    );

    CREATE TABLE IF NOT EXISTS triagens (
      id SERIAL PRIMARY KEY,
      episodio_urgencia_id INT NOT NULL REFERENCES episodios(id),
      profissional_id INT REFERENCES profissionais(id),
      data_hora TIMESTAMP NOT NULL,
      prioridade VARCHAR(80) NOT NULL,
      motivo_admissao TEXT,
      sintomas TEXT,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS consultas (
      id SERIAL PRIMARY KEY,
      episodio_urgencia_id INT NOT NULL REFERENCES episodios(id),
      profissional_id INT REFERENCES profissionais(id),
      tipo VARCHAR(80),
      data_hora TIMESTAMP NOT NULL,
      queixa TEXT,
      historia TEXT,
      exame TEXT,
      sinais TEXT,
      observacoes TEXT,
      diagnostico TEXT,
      plano TEXT
    );

    CREATE TABLE IF NOT EXISTS atos (
      id SERIAL PRIMARY KEY,
      episodio_urgencia_id INT NOT NULL REFERENCES episodios(id),
      consulta_id INT REFERENCES consultas(id),
      profissional_id INT REFERENCES profissionais(id),
      tipo VARCHAR(80),
      descricao TEXT,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(30) DEFAULT 'pendente'
    );

    CREATE TABLE IF NOT EXISTS prescricoes (
      id SERIAL PRIMARY KEY,
      episodio_urgencia_id INT NOT NULL REFERENCES episodios(id),
      consulta_id INT REFERENCES consultas(id),
      profissional_id INT REFERENCES profissionais(id),
      descricao TEXT NOT NULL,
      dose VARCHAR(100),
      frequencia VARCHAR(100),
      via VARCHAR(50),
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(30) DEFAULT 'pendente',
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS internamentos (
      id SERIAL PRIMARY KEY,
      episodio_urgencia_id INT NOT NULL REFERENCES episodios(id),
      utente_id INT NOT NULL REFERENCES utentes(id),
      hospital_id INT NOT NULL REFERENCES hospitais(id),
      medico_responsavel INT REFERENCES profissionais(id),
      servico VARCHAR(120),
      cama VARCHAR(50),
      data_hora_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_hora_alta TIMESTAMP,
      estado VARCHAR(30) DEFAULT 'internado',
      diagnostico TEXT,
      observacoes TEXT
    );
  `);

  // Migrações leves para bases de dados já existentes.
  // CREATE TABLE IF NOT EXISTS não acrescenta colunas que faltam em tabelas antigas.
  await pool.query("ALTER TABLE episodios ADD COLUMN IF NOT EXISTS data_hora_alta TIMESTAMP");
  await pool.query("ALTER TABLE utentes ADD COLUMN IF NOT EXISTS telefone VARCHAR(30)");
  await pool.query("ALTER TABLE utentes ADD COLUMN IF NOT EXISTS morada TEXT");
  await pool.query("ALTER TABLE utentes ADD COLUMN IF NOT EXISTS grupo_sanguineo VARCHAR(5)");
  await pool.query("ALTER TABLE utentes ADD COLUMN IF NOT EXISTS alergias TEXT");
  await pool.query("ALTER TABLE utentes ADD COLUMN IF NOT EXISTS patologias TEXT");
  await pool.query("ALTER TABLE internamentos ADD COLUMN IF NOT EXISTS cama VARCHAR(50)");
  await pool.query("ALTER TABLE internamentos ADD COLUMN IF NOT EXISTS data_hora_alta TIMESTAMP");
  await pool.query("ALTER TABLE internamentos ADD COLUMN IF NOT EXISTS diagnostico TEXT");
  await pool.query("ALTER TABLE internamentos ADD COLUMN IF NOT EXISTS observacoes TEXT");
  await pool.query("UPDATE internamentos SET estado = 'internado' WHERE LOWER(COALESCE(estado,'')) IN ('aguarda_cama','aguardar cama','aguarda cama')");
  await pool.query("UPDATE internamentos SET cama = 'Cama ' || LPAD(id::text, 3, '0') WHERE cama IS NULL OR TRIM(cama) = ''");

  await pool.query(`
    INSERT INTO hospitais (id, nome, localizacao)
    VALUES (1, 'Hospital Central', 'Lisboa')
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO profissionais (id, nome, tipo, especialidade, cedula, hospital_id)
    VALUES
      (1, 'Dr. João Silva', 'medico', 'Medicina Interna', 'MED123', 1),
      (2, 'Enf. Maria Santos', 'enfermeiro', 'Urgência / Triagem', 'ENF456', 1)
    ON CONFLICT (id) DO NOTHING
  `);

  const passwordHash = await bcrypt.hash('1234', 10);
  const seedUsers = [
    ['Admin Hospital', 'admin', 'admin', 1],
    ['Receção Administrativa', 'administrativo', 'administrativo', 1],
    ['Dr. João Silva', 'medico', 'medico', 1],
    ['Enf. Maria Santos', 'enfermeiro', 'enfermeiro', 1],
  ];

  for (const [nome, username, perfil, hospitalId] of seedUsers) {
    await pool.query(`
      INSERT INTO utilizadores (nome, username, password, perfil, hospital_id, estado)
      VALUES ($1, $2, $3, $4, $5, 'ativo')
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        perfil = EXCLUDED.perfil,
        hospital_id = EXCLUDED.hospital_id,
        estado = 'ativo'
    `, [nome, username, passwordHash, perfil, hospitalId]);
  }

  await pool.query(`
    INSERT INTO utentes (id, nome, data_nascimento, nif, nss, sexo, grupo_sanguineo)
    VALUES (1, 'Ana Silva', '1985-04-12', '123456789', '12345678901', 'feminino', 'A+')
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO episodios (id, utente_id, hospital_id, data_entrada, estado, tipo_entrada, motivo)
    VALUES (1, 1, 1, CURRENT_TIMESTAMP, 'aguardar_triagem', 'normal', 'Dor abdominal')
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query("SELECT setval('hospitais_id_seq', COALESCE((SELECT MAX(id) FROM hospitais), 1));");
  await pool.query("SELECT setval('profissionais_id_seq', COALESCE((SELECT MAX(id) FROM profissionais), 1));");
  await pool.query("SELECT setval('utilizadores_id_seq', COALESCE((SELECT MAX(id) FROM utilizadores), 1));");
  await pool.query("SELECT setval('utentes_id_seq', COALESCE((SELECT MAX(id) FROM utentes), 1));");
  await pool.query("SELECT setval('episodios_id_seq', COALESCE((SELECT MAX(id) FROM episodios), 1));");
}

async function queryAll(res, sql, params = []) {
  const result = await pool.query(sql, params);
  res.json(result.rows);
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

function handleAsync(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
    }
  };
}

function passwordValida(passwordDigitada, passwordGuardada) {
  if (!passwordGuardada) return false;
  const stored = String(passwordGuardada);
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compareSync(passwordDigitada, stored);
  }
  return passwordDigitada === stored;
}

app.get('/health', (req, res) => res.json({ status: 'ok', mensagem: 'Backend Node.js a funcionar' }));

app.post('/login', handleAsync(async (req, res) => {
  const dados = req.body || {};
  const username = String(dados.username || '').trim();
  const password = dados.password || '';

  if (!username || !password) {
    return res.status(400).json({ erro: 'Preenche o utilizador e a palavra-passe.' });
  }

  const result = await pool.query(`
    SELECT id, nome, username, password, perfil, hospital_id
    FROM utilizadores
    WHERE username = $1 AND estado = 'ativo'
  `, [username]);

  const user = result.rows[0];
  if (!user || !passwordValida(password, user.password)) {
    return res.status(401).json({ erro: 'Utilizador ou palavra-passe inválidos.' });
  }

  res.json({
    id: user.id,
    nome: user.nome,
    username: user.username,
    perfil: user.perfil,
    hospital_id: user.hospital_id,
    token: 'sessao-local',
  });
}));

app.get('/hospitais', handleAsync((req, res) => queryAll(res, 'SELECT * FROM hospitais ORDER BY id')));
app.post('/hospitais', handleAsync(async (req, res) => {
  const row = await queryOne('INSERT INTO hospitais (nome, localizacao) VALUES ($1, $2) RETURNING *', [req.body.nome, req.body.localizacao]);
  res.json({ mensagem: 'Hospital criado com sucesso', ...row });
}));

app.get('/profissionais', handleAsync((req, res) => queryAll(res, `
  SELECT p.*, h.nome AS hospital
  FROM profissionais p
  LEFT JOIN hospitais h ON h.id = p.hospital_id
  ORDER BY p.id
`)));
app.post('/profissionais', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO profissionais (nome, tipo, especialidade, cedula, hospital_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [d.nome, d.tipo, d.especialidade, d.cedula, d.hospital_id || 1]);
  res.json({ mensagem: 'Profissional criado com sucesso', ...row });
}));

app.get('/utentes', handleAsync((req, res) => queryAll(res, 'SELECT *, nss AS n_sns FROM utentes ORDER BY id')));
app.post('/utentes', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO utentes (nome, data_nascimento, nif, nss, sexo, telefone, morada, grupo_sanguineo, alergias, patologias)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (nif) DO UPDATE SET
      nome = EXCLUDED.nome,
      data_nascimento = EXCLUDED.data_nascimento,
      nss = EXCLUDED.nss,
      sexo = EXCLUDED.sexo,
      telefone = EXCLUDED.telefone,
      morada = EXCLUDED.morada,
      grupo_sanguineo = EXCLUDED.grupo_sanguineo,
      alergias = EXCLUDED.alergias,
      patologias = EXCLUDED.patologias
    RETURNING *, nss AS n_sns
  `, [d.nome, d.data_nascimento, d.nif, d.nss || d.n_sns, d.sexo, d.telefone, d.morada, d.grupo_sanguineo, d.alergias, d.patologias]);
  res.json({ mensagem: 'Utente criado com sucesso', ...row });
}));

app.get('/episodios', handleAsync((req, res) => queryAll(res, `
  SELECT e.*, u.nome AS utente, h.nome AS hospital
  FROM episodios e
  LEFT JOIN utentes u ON u.id = e.utente_id
  LEFT JOIN hospitais h ON h.id = e.hospital_id
  ORDER BY e.id
`)));
app.post('/episodios', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO episodios (utente_id, hospital_id, data_entrada, estado, tipo_entrada, motivo)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `, [d.utente_id, d.hospital_id || 1, d.data_entrada, d.estado || 'aguardar_triagem', d.tipo_entrada || 'normal', d.motivo || d.motivo_entrada]);
  res.json({ mensagem: 'Episódio criado com sucesso', ...row });
}));
app.put('/episodios/:id/encerrar', handleAsync(async (req, res) => {
  const d = req.body || {};
  await pool.query("UPDATE episodios SET data_hora_alta = COALESCE($1, CURRENT_TIMESTAMP), estado = 'encerrado' WHERE id = $2", [d.data_hora_alta, req.params.id]);
  await pool.query("UPDATE atos SET estado = 'fechado' WHERE episodio_urgencia_id = $1 AND estado <> 'realizado'", [req.params.id]);
  await pool.query("UPDATE prescricoes SET estado = 'fechado' WHERE episodio_urgencia_id = $1 AND estado NOT IN ('realizada','administrada')", [req.params.id]);
  await pool.query("UPDATE internamentos SET estado = 'fechado' WHERE episodio_urgencia_id = $1 AND estado <> 'alta'", [req.params.id]);
  if (d.observacoes || d.motivo_alta) {
    await pool.query("INSERT INTO atos (episodio_urgencia_id, profissional_id, tipo, descricao, estado) VALUES ($1,$2,$3,$4,$5)", [req.params.id, d.profissional_id || 1, 'encerramento', `Motivo de alta: ${d.motivo_alta || ''}. Observações: ${d.observacoes || ''}`, 'fechado']);
  }
  res.json({ mensagem: 'Episódio encerrado com sucesso' });
}));
app.put('/episodios/:id/estado', handleAsync(async (req, res) => {
  await pool.query('UPDATE episodios SET estado = $1 WHERE id = $2', [req.body.estado, req.params.id]);
  res.json({ mensagem: 'Estado do episódio atualizado com sucesso' });
}));

app.get('/triagens', handleAsync((req, res) => queryAll(res, `
  SELECT t.*, e.hospital_id, u.nome AS utente, p.nome AS profissional, e.estado AS estado_episodio
  FROM triagens t
  LEFT JOIN episodios e ON e.id = t.episodio_urgencia_id
  LEFT JOIN utentes u ON u.id = e.utente_id
  LEFT JOIN profissionais p ON p.id = t.profissional_id
  ORDER BY t.id
`)));
app.post('/triagens', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO triagens (episodio_urgencia_id, profissional_id, data_hora, prioridade, motivo_admissao, sintomas, observacoes)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `, [d.episodio_urgencia_id, d.profissional_id || null, d.data_hora, d.prioridade, d.motivo_admissao, d.sintomas, d.observacoes]);
  await pool.query('UPDATE episodios SET estado = $1 WHERE id = $2', [d.estado_episodio || 'aguardar_consulta', d.episodio_urgencia_id]);
  res.json({ mensagem: 'Triagem criada com sucesso', ...row });
}));

app.get('/consultas', handleAsync((req, res) => queryAll(res, `
  SELECT c.*, e.hospital_id, u.nome AS utente, p.nome AS profissional
  FROM consultas c
  LEFT JOIN episodios e ON e.id = c.episodio_urgencia_id
  LEFT JOIN utentes u ON u.id = e.utente_id
  LEFT JOIN profissionais p ON p.id = c.profissional_id
  ORDER BY c.id
`)));
app.post('/consultas', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO consultas (episodio_urgencia_id, profissional_id, tipo, data_hora, queixa, historia, exame, sinais, observacoes, diagnostico, plano)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `, [d.episodio_urgencia_id, d.profissional_id, d.tipo, d.data_hora || d.data, d.queixa, d.historia, d.exame, d.sinais, d.observacoes || d.obs, d.diagnostico, d.plano]);
  await pool.query("UPDATE episodios SET estado = 'em_consulta' WHERE id = $1", [d.episodio_urgencia_id]);
  res.json({ mensagem: 'Consulta criada com sucesso', ...row });
}));

app.get('/atos', handleAsync((req, res) => queryAll(res, `
  SELECT a.*, e.hospital_id, u.nome AS utente, p.nome AS profissionais, e.estado AS estado_episodio
  FROM atos a
  LEFT JOIN episodios e ON e.id = a.episodio_urgencia_id
  LEFT JOIN utentes u ON u.id = e.utente_id
  LEFT JOIN profissionais p ON p.id = a.profissional_id
  ORDER BY a.id
`)));
app.post('/atos', handleAsync(async (req, res) => {
  const d = req.body || {};
  const episodioId = d.episodio_urgencia_id || d.episodio_id;
  const row = await queryOne(`
    INSERT INTO atos (episodio_urgencia_id, consulta_id, profissional_id, tipo, descricao, data, estado)
    VALUES ($1,$2,$3,$4,$5,COALESCE($6, CURRENT_TIMESTAMP),$7)
    RETURNING *
  `, [episodioId, d.consulta_id, d.profissional_id || d.funcionario_id, d.tipo, d.descricao || d.tipo, d.data, d.estado || 'pendente']);
  res.json({ mensagem: 'Ato clínico criado com sucesso', ...row });
}));
app.put('/atos/:id/estado', handleAsync(async (req, res) => {
  await pool.query('UPDATE atos SET estado = $1 WHERE id = $2', [req.body.estado, req.params.id]);
  res.json({ mensagem: 'Estado do exame atualizado com sucesso' });
}));

app.get('/prescricoes', handleAsync((req, res) => queryAll(res, `
  SELECT pr.*, e.hospital_id, u.nome AS utente, COALESCE(c.tipo, 'Consulta') AS ato, p.nome AS profissional, e.estado AS estado_episodio
  FROM prescricoes pr
  LEFT JOIN episodios e ON e.id = pr.episodio_urgencia_id
  LEFT JOIN utentes u ON u.id = e.utente_id
  LEFT JOIN consultas c ON c.id = pr.consulta_id
  LEFT JOIN profissionais p ON p.id = pr.profissional_id
  ORDER BY pr.id
`)));
app.put('/prescricoes/:id/estado', handleAsync(async (req, res) => {
  await pool.query('UPDATE prescricoes SET estado = $1 WHERE id = $2', [req.body.estado, req.params.id]);
  res.json({ mensagem: 'Estado da prescrição atualizado com sucesso' });
}));

app.post('/prescricoes', handleAsync(async (req, res) => {
  const d = req.body || {};
  const row = await queryOne(`
    INSERT INTO prescricoes (episodio_urgencia_id, consulta_id, profissional_id, descricao, dose, frequencia, via, estado, observacoes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [d.episodio_urgencia_id, d.consulta_id, d.profissional_id, d.descricao, d.dose, d.frequencia, d.via, d.estado || 'pendente', d.observacoes]);
  res.json({ mensagem: 'Prescrição criada com sucesso', ...row });
}));

app.get('/internamentos', handleAsync((req, res) => queryAll(res, `
  SELECT i.*, u.nome AS utente, h.nome AS hospital, p.nome AS medico_responsavel, e.estado AS estado_episodio
  FROM internamentos i
  LEFT JOIN utentes u ON u.id = i.utente_id
  LEFT JOIN episodios e ON e.id = i.episodio_urgencia_id
  LEFT JOIN hospitais h ON h.id = i.hospital_id
  LEFT JOIN profissionais p ON p.id = i.medico_responsavel
  ORDER BY i.id
`)));
app.post('/internamentos', handleAsync(async (req, res) => {
  const d = req.body || {};
  const total = await queryOne('SELECT COUNT(*)::int AS total FROM internamentos WHERE hospital_id = $1', [d.hospital_id || 1]);
  const camaAutomatica = d.cama || `Cama ${String((total.total || 0) + 1).padStart(3, '0')}`;
  const row = await queryOne(`
    INSERT INTO internamentos (episodio_urgencia_id, utente_id, hospital_id, medico_responsavel, servico, cama, data_hora_entrada, data_hora_alta, estado, diagnostico, observacoes)
    VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, CURRENT_TIMESTAMP),$8,$9,$10,$11)
    RETURNING *
  `, [d.episodio_urgencia_id, d.utente_id, d.hospital_id || 1, d.medico_responsavel || d.medico_responsavel_id, d.servico, camaAutomatica, d.data_hora_entrada, d.data_hora_alta, 'internado', d.diagnostico, d.observacoes]);
  await pool.query("UPDATE episodios SET estado = 'internamento' WHERE id = $1", [d.episodio_urgencia_id]);
  res.json({ mensagem: 'Internamento criado com cama atribuída automaticamente', ...row });
}));
app.put('/internamentos/:id/estado', handleAsync(async (req, res) => {
  const estadoPedido = String((req.body || {}).estado || '').trim().toLowerCase();
  const estado = ['aguarda_cama', 'aguardar cama', 'aguarda cama'].includes(estadoPedido) ? 'internado' : estadoPedido;

  if (!estado) {
    return res.status(400).json({ erro: 'Estado inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Primeiro lê o internamento. Assim evitamos UPDATEs com joins/colunas que possam não existir.
    const atual = await client.query(
      `SELECT id, episodio_urgencia_id
       FROM internamentos
       WHERE id = $1`,
      [req.params.id]
    );

    if (!atual.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Internamento não encontrado' });
    }

    // Alinhado com a BD enviada: internamentos tem data_hora_alta.
    // Não reutilizamos o mesmo parâmetro SQL para estado e comparação,
    // porque isso pode gerar "inconsistent types deduced for parameter $1" no PostgreSQL.
    if (estado === 'alta') {
      await client.query(
        `UPDATE internamentos
         SET estado = 'alta',
             data_hora_alta = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [req.params.id]
      );
    } else {
      await client.query(
        `UPDATE internamentos
         SET estado = $1
         WHERE id = $2`,
        [estado, req.params.id]
      );
    }

    if (estado === 'alta') {
      // O episódio é concluído. A data de alta no episódio só é escrita se a coluna existir.
      const cols = await client.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'episodios'
           AND column_name IN ('data_hora_alta', 'data_saida')`
      );
      const nomes = cols.rows.map(r => r.column_name);
      const setDataAlta = nomes.includes('data_hora_alta')
        ? ', data_hora_alta = CURRENT_TIMESTAMP'
        : (nomes.includes('data_saida') ? ', data_saida = CURRENT_TIMESTAMP' : '');

      await client.query(
        `UPDATE episodios
         SET estado = 'concluido'${setDataAlta}
         WHERE id = $1`,
        [atual.rows[0].episodio_urgencia_id]
      );
    }

    await client.query('COMMIT');
    res.json({ mensagem: estado === 'alta' ? 'Alta registada e episódio concluído' : 'Estado do internamento atualizado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar estado do internamento:', err);
    throw err;
  } finally {
    client.release();
  }
}));

app.get('/utentes_anonimizados', handleAsync((req, res) => queryAll(res, `
  SELECT
    md5('utente-' || id::text) AS codigo_utente,
    CAST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) AS INT) AS idade,
    CASE
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) < 18 THEN '0-17'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 18 AND 35 THEN '18-35'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 36 AND 64 THEN '36-64'
      ELSE '65+'
    END AS faixa_etaria,
    COALESCE(sexo, 'não indicado') AS sexo,
    COALESCE(grupo_sanguineo, 'não indicado') AS grupo_sanguineo,
    DATE(data_registo) AS data_registo
  FROM utentes
  ORDER BY id
`)));

app.get('/episodios_anonimizados', handleAsync((req, res) => queryAll(res, `
  SELECT
    md5('episodio-' || e.id::text) AS codigo_episodio,
    md5('utente-' || e.utente_id::text) AS codigo_utente,
    e.estado,
    COALESCE(e.tipo_entrada, 'normal') AS tipo_entrada,
    DATE(e.data_entrada) AS data_entrada,
    DATE_TRUNC('hour', e.data_entrada) AS hora_entrada,
    h.nome AS hospital,
    COALESCE(t.prioridade, 'Sem triagem') AS prioridade
  FROM episodios e
  LEFT JOIN hospitais h ON h.id = e.hospital_id
  LEFT JOIN LATERAL (
    SELECT prioridade
    FROM triagens t
    WHERE t.episodio_urgencia_id = e.id
    ORDER BY t.data_hora DESC
    LIMIT 1
  ) t ON TRUE
  ORDER BY e.data_entrada DESC
`)));

app.get('/analitica_anonimizada', handleAsync(async (req, res) => {
  const one = async sql => Number((await queryOne(sql)).total || 0);
  const totais = {
    utentes: await one('SELECT COUNT(*) AS total FROM utentes'),
    episodios: await one('SELECT COUNT(*) AS total FROM episodios'),
    consultas: await one('SELECT COUNT(*) AS total FROM consultas'),
    exames: await one("SELECT COUNT(*) AS total FROM atos WHERE COALESCE(tipo, '') <> 'consulta'"),
    prescricoes: await one('SELECT COUNT(*) AS total FROM prescricoes'),
    internamentos: await one('SELECT COUNT(*) AS total FROM internamentos'),
  };
  const porDia = (await pool.query(`
    SELECT DATE(e.data_entrada) AS data, COUNT(DISTINCT e.utente_id) AS utentes, COUNT(*) AS episodios,
           COUNT(DISTINCT c.id) AS consultas,
           COUNT(DISTINCT a.id) FILTER (WHERE COALESCE(a.tipo, '') <> 'consulta') AS exames
    FROM episodios e
    LEFT JOIN consultas c ON c.episodio_urgencia_id = e.id
    LEFT JOIN atos a ON a.episodio_urgencia_id = e.id
    GROUP BY DATE(e.data_entrada)
    ORDER BY data DESC
    LIMIT 7
  `)).rows;
  const porFaixaEtaria = (await pool.query(`
    SELECT CASE
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) < 18 THEN '0-17'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 18 AND 35 THEN '18-35'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 36 AND 64 THEN '36-64'
      ELSE '65+'
    END AS faixa_etaria, COUNT(*) AS total
    FROM utentes GROUP BY faixa_etaria ORDER BY faixa_etaria
  `)).rows;
  const porPrioridade = (await pool.query(`
    SELECT COALESCE(prioridade, 'Sem triagem') AS prioridade, COUNT(*) AS total
    FROM triagens GROUP BY prioridade ORDER BY total DESC
  `)).rows;
  res.json({
    totais,
    por_dia: porDia,
    por_faixa_etaria: porFaixaEtaria,
    por_prioridade: porPrioridade,
    privacidade: {
      metodo: 'pseudonimizacao',
      campos_removidos: ['nome', 'nif', 'nss', 'telefone', 'morada'],
      finalidade: 'relatorios, estatistica e eventual treino de modelos sem identificadores diretos',
    },
  });
}));

const PRIORIDADES_BASE_MINUTOS = {
  vermelho: 5,
  laranja: 15,
  amarelo: 45,
  verde: 95,
  azul: 130,
  'sem triagem': 70,
};

function normalizarPrioridade(valor) {
  const v = String(valor || 'sem triagem').trim().toLowerCase();
  if (v.includes('vermel')) return 'vermelho';
  if (v.includes('laranja')) return 'laranja';
  if (v.includes('amarel')) return 'amarelo';
  if (v.includes('verde')) return 'verde';
  if (v.includes('azul')) return 'azul';
  return 'sem triagem';
}

function formatarMinutos(minutos) {
  const m = Math.max(0, Math.round(Number(minutos || 0)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}h ${String(m % 60).padStart(2, '0')}m`;
}

function preverTempoEsperaMinutos(prioridade, idade = 45, hora = null, emEspera = 0, profissionaisDisponiveis = 1, mediaRecente = null) {
  const prioridadeNorm = normalizarPrioridade(prioridade);
  const base = Number(mediaRecente || PRIORIDADES_BASE_MINUTOS[prioridadeNorm] || 70);
  idade = Number.parseInt(idade || 45, 10) || 45;
  hora = Number.parseInt(hora ?? new Date().getHours(), 10);
  emEspera = Math.max(0, Number.parseInt(emEspera || 0, 10) || 0);
  profissionaisDisponiveis = Math.max(1, Number.parseInt(profissionaisDisponiveis || 1, 10) || 1);
  const fatorIdade = idade >= 75 && ['vermelho', 'laranja', 'amarelo'].includes(prioridadeNorm) ? 0.90 : 1.0;
  const fatorHora = hora >= 10 && hora <= 22 ? 1.25 : 0.90;
  const fatorCarga = 1 + Math.min(emEspera / (profissionaisDisponiveis * 14), 1.4);
  const fatorPrioridade = { vermelho: 0.35, laranja: 0.55, amarelo: 0.85, verde: 1.15, azul: 1.30, 'sem triagem': 1.0 }[prioridadeNorm] || 1.0;
  const previsao = base * fatorIdade * fatorHora * fatorCarga * fatorPrioridade;
  return Math.max(1, Math.min(Math.round(previsao), 480));
}

app.get('/tempo_espera/previsao', handleAsync(async (req, res) => {
  const resumo = await queryOne(`
    WITH base AS (
      SELECT e.id, e.data_entrada, e.estado, COALESCE(t.prioridade, 'Sem triagem') AS prioridade,
             t.data_hora AS data_triagem, c.data_hora AS data_consulta,
             EXTRACT(EPOCH FROM (COALESCE(c.data_hora, t.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0 AS espera_geral_min,
             EXTRACT(EPOCH FROM (t.data_hora - e.data_entrada))/60.0 AS espera_triagem_min,
             EXTRACT(EPOCH FROM (c.data_hora - COALESCE(t.data_hora, e.data_entrada)))/60.0 AS espera_consulta_min
      FROM episodios e
      LEFT JOIN LATERAL (SELECT prioridade, data_hora FROM triagens t WHERE t.episodio_urgencia_id = e.id ORDER BY t.data_hora ASC LIMIT 1) t ON TRUE
      LEFT JOIN LATERAL (SELECT data_hora FROM consultas c WHERE c.episodio_urgencia_id = e.id ORDER BY c.data_hora ASC LIMIT 1) c ON TRUE
      WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    )
    SELECT COUNT(*) AS entradas_24h,
           COUNT(*) FILTER (WHERE estado NOT IN ('encerrado','internado')) AS em_espera,
           COALESCE(AVG(espera_geral_min), 0) AS media_geral_min,
           COALESCE(AVG(espera_triagem_min) FILTER (WHERE espera_triagem_min IS NOT NULL), 0) AS media_triagem_min,
           COALESCE(AVG(espera_consulta_min) FILTER (WHERE espera_consulta_min IS NOT NULL), 0) AS media_consulta_min,
           COALESCE(MAX(espera_geral_min), 0) AS max_espera_min
    FROM base
  `);
  const porPrioridadeRows = (await pool.query(`
    SELECT COALESCE(t.prioridade, 'Sem triagem') AS prioridade, COUNT(*) AS total,
           COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
    FROM episodios e
    LEFT JOIN LATERAL (SELECT prioridade, data_hora FROM triagens t WHERE t.episodio_urgencia_id = e.id ORDER BY t.data_hora ASC LIMIT 1) t ON TRUE
    LEFT JOIN LATERAL (SELECT data_hora FROM consultas c WHERE c.episodio_urgencia_id = e.id ORDER BY c.data_hora ASC LIMIT 1) c ON TRUE
    WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    GROUP BY COALESCE(t.prioridade, 'Sem triagem')
  `)).rows;
  const medias = {};
  porPrioridadeRows.forEach(r => { medias[normalizarPrioridade(r.prioridade)] = Number(r.media_min || 0); });
  const porPrioridade = ['vermelho', 'laranja', 'amarelo', 'verde', 'azul', 'sem triagem'].map(nome => {
    const media = medias[nome] || PRIORIDADES_BASE_MINUTOS[nome];
    return { prioridade: nome[0].toUpperCase() + nome.slice(1), media_min: Math.round(media), media_formatada: formatarMinutos(media) };
  });
  const periodos = (await pool.query(`
    SELECT to_char(date_trunc('hour', e.data_entrada), 'HH24:00') AS periodo,
           COUNT(DISTINCT e.id) AS entradas, COUNT(DISTINCT c.id) AS consultas,
           COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
    FROM episodios e
    LEFT JOIN consultas c ON c.episodio_urgencia_id = e.id
    WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    GROUP BY date_trunc('hour', e.data_entrada)
    ORDER BY date_trunc('hour', e.data_entrada) DESC
    LIMIT 8
  `)).rows.map(r => ({ ...r, media_formatada: formatarMinutos(r.media_min) }));
  const profissionais = Number((await queryOne("SELECT COUNT(*) AS total FROM profissionais WHERE estado = 'ativo'")).total || 1);
  const emEspera = Number(resumo.em_espera || 0);
  const previsoes = ['vermelho', 'laranja', 'amarelo', 'verde', 'azul'].map(nome => {
    const mins = preverTempoEsperaMinutos(nome, 45, null, emEspera, profissionais, medias[nome]);
    return { prioridade: nome[0].toUpperCase() + nome.slice(1), minutos: mins, tempo: formatarMinutos(mins) };
  });
  res.json({
    resumo: {
      entradas_24h: Number(resumo.entradas_24h || 0),
      em_espera: emEspera,
      media_geral_min: Math.round(Number(resumo.media_geral_min || 0)),
      media_geral: formatarMinutos(resumo.media_geral_min),
      media_triagem: formatarMinutos(resumo.media_triagem_min),
      media_consulta: formatarMinutos(resumo.media_consulta_min),
      max_espera: formatarMinutos(resumo.max_espera_min),
      profissionais_ativos: profissionais,
    },
    por_prioridade: porPrioridade,
    periodos,
    previsoes,
    modelo: 'heuristico-com-dados-postgresql',
  });
}));

app.post('/tempo_espera/prever', handleAsync(async (req, res) => {
  const d = req.body || {};
  const prioridade = normalizarPrioridade(d.prioridade);
  const mediaRow = await queryOne(`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
    FROM episodios e
    LEFT JOIN LATERAL (SELECT prioridade FROM triagens t WHERE t.episodio_urgencia_id = e.id ORDER BY t.data_hora ASC LIMIT 1) t ON TRUE
    LEFT JOIN LATERAL (SELECT data_hora FROM consultas c WHERE c.episodio_urgencia_id = e.id ORDER BY c.data_hora ASC LIMIT 1) c ON TRUE
    WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND lower(COALESCE(t.prioridade, 'sem triagem')) LIKE $1
  `, [`%${prioridade.split(' ')[0]}%`]);
  const media = Number(mediaRow.media_min || 0) || null;
  const minutos = preverTempoEsperaMinutos(prioridade, d.idade, d.hora, d.em_espera, d.profissionais_disponiveis, media);
  res.json({
    prioridade: prioridade[0].toUpperCase() + prioridade.slice(1),
    minutos,
    tempo: formatarMinutos(minutos),
    media_historica_usada: formatarMinutos(media || PRIORIDADES_BASE_MINUTOS[prioridade] || 70),
    explicacao: 'Previsão calculada por prioridade, hora do dia, idade, carga atual e profissionais disponíveis, usando médias da base PostgreSQL quando existem.',
  });
}));

app.get('/relatorios', handleAsync(async (req, res) => {
  const counts = {};
  const queries = {
    utentes: 'SELECT COUNT(*) AS total FROM utentes',
    episodios: 'SELECT COUNT(*) AS total FROM episodios',
    consultas: 'SELECT COUNT(*) AS total FROM consultas',
    exames: "SELECT COUNT(*) AS total FROM atos WHERE COALESCE(tipo, '') <> 'consulta'",
    prescricoes: 'SELECT COUNT(*) AS total FROM prescricoes',
    internamentos: 'SELECT COUNT(*) AS total FROM internamentos',
  };
  for (const [key, sql] of Object.entries(queries)) {
    counts[key] = Number((await queryOne(sql)).total || 0);
  }
  res.json(counts);
}));

async function start() {
  await waitForDb();
  await initDb();
  const port = Number(process.env.PORT || 5000);
  app.listen(port, '0.0.0.0', () => console.log(`Backend Node.js a correr na porta ${port}`));
}

start().catch(err => {
  console.error('Erro ao iniciar backend:', err);
  process.exit(1);
});
