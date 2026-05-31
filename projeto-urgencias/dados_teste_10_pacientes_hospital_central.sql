-- Dados de teste reduzidos: 10 pacientes no Hospital Central
-- Não cria hospitais nem utilizadores.
-- Assume Hospital Central com id = 1 e profissionais base com id = 1 e 2.
BEGIN;

-- Opcional: descomenta esta linha se quiseres limpar dados clínicos antes de inserir.
-- TRUNCATE TABLE triagens, consultas, atos, prescricoes, internamentos, episodios, utentes RESTART IDENTITY CASCADE;

-- Profissionais extra mínimos para testes
INSERT INTO profissionais (id, nome, tipo, especialidade, cedula, hospital_id, estado) VALUES
  (3, 'Dra. Ana Costa', 'medico', 'Medicina Interna', 'MED301', 1, 'ativo'),
  (4, 'Enf. Carlos Ribeiro', 'enfermeiro', 'Urgência / Triagem', 'ENF801', 1, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 10 utentes
INSERT INTO utentes (id, nome, data_nascimento, nif, nss, sexo, telefone, morada, grupo_sanguineo, alergias, patologias) VALUES
  (1, 'Ana Martins', '1984-03-12', '200000001', '10000000001', 'feminino', '910000001', 'Rua da Saúde, nº 1', 'A+', 'Sem alergias conhecidas', 'Hipertensão arterial'),
  (2, 'João Ferreira', '1976-08-21', '200000002', '10000000002', 'masculino', '910000002', 'Rua da Saúde, nº 2', 'O+', 'Penicilina', 'Sem patologias relevantes'),
  (3, 'Maria Oliveira', '1992-11-05', '200000003', '10000000003', 'feminino', '910000003', 'Rua da Saúde, nº 3', 'B+', 'Pólen', 'Asma'),
  (4, 'Pedro Santos', '1968-01-30', '200000004', '10000000004', 'masculino', '910000004', 'Rua da Saúde, nº 4', 'AB+', 'Sem alergias conhecidas', 'Diabetes tipo 2'),
  (5, 'Sofia Costa', '2001-06-18', '200000005', '10000000005', 'feminino', '910000005', 'Rua da Saúde, nº 5', 'O-', 'Ibuprofeno', 'Enxaqueca crónica'),
  (6, 'Miguel Pereira', '1959-09-14', '200000006', '10000000006', 'masculino', '910000006', 'Rua da Saúde, nº 6', 'A-', 'Marisco', 'DPOC'),
  (7, 'Beatriz Lopes', '1989-12-02', '200000007', '10000000007', 'feminino', '910000007', 'Rua da Saúde, nº 7', 'B-', 'Látex', 'Sem patologias relevantes'),
  (8, 'Ricardo Almeida', '1997-04-25', '200000008', '10000000008', 'masculino', '910000008', 'Rua da Saúde, nº 8', 'A+', 'Sem alergias conhecidas', 'Ansiedade'),
  (9, 'Carolina Ribeiro', '1971-07-09', '200000009', '10000000009', 'feminino', '910000009', 'Rua da Saúde, nº 9', 'O+', 'Ácaros', 'Dislipidemia'),
  (10, 'António Sousa', '1948-10-17', '200000010', '10000000010', 'masculino', '910000010', 'Rua da Saúde, nº 10', 'AB-', 'Sem alergias conhecidas', 'Insuficiência cardíaca')
ON CONFLICT (id) DO NOTHING;

-- 10 episódios ligados ao Hospital Central
INSERT INTO episodios (id, utente_id, hospital_id, data_entrada, estado, tipo_entrada, motivo) VALUES
  (1, 1, 1, '2026-05-30 08:37:00', 'internamento', 'normal', 'Dor torácica'),
  (2, 2, 1, '2026-05-30 09:14:00', 'em_consulta', 'normal', 'Febre alta'),
  (3, 3, 1, '2026-05-30 09:51:00', 'em_consulta', 'normal', 'Dor abdominal'),
  (4, 4, 1, '2026-05-30 10:28:00', 'aguardar_consulta', 'normal', 'Queda com traumatismo'),
  (5, 5, 1, '2026-05-30 11:05:00', 'aguardar_consulta', 'normal', 'Cefaleia intensa'),
  (6, 6, 1, '2026-05-30 11:42:00', 'aguardar_consulta', 'normal', 'Dispneia'),
  (7, 7, 1, '2026-05-30 12:19:00', 'aguardar_consulta', 'normal', 'Reação alérgica'),
  (8, 8, 1, '2026-05-30 12:56:00', 'aguardar_consulta', 'normal', 'Tonturas'),
  (9, 9, 1, '2026-05-30 13:33:00', 'aguardar_consulta', 'normal', 'Crise hipertensiva'),
  (10, 10, 1, '2026-05-30 14:10:00', 'aguardar_consulta', 'normal', 'Dor lombar')
ON CONFLICT (id) DO NOTHING;

-- 10 triagens
INSERT INTO triagens (id, episodio_urgencia_id, profissional_id, data_hora, prioridade, motivo_admissao, sintomas, observacoes) VALUES
  (1, 1, 4, '2026-05-30 08:52:00', 'Vermelho', 'Dor torácica', 'Sintomas associados a dor torácica', 'Triagem de teste'),
  (2, 2, 2, '2026-05-30 09:29:00', 'Laranja', 'Febre alta', 'Sintomas associados a febre alta', 'Triagem de teste'),
  (3, 3, 4, '2026-05-30 10:06:00', 'Amarelo', 'Dor abdominal', 'Sintomas associados a dor abdominal', 'Triagem de teste'),
  (4, 4, 2, '2026-05-30 10:43:00', 'Verde', 'Queda com traumatismo', 'Sintomas associados a queda com traumatismo', 'Triagem de teste'),
  (5, 5, 4, '2026-05-30 11:20:00', 'Amarelo', 'Cefaleia intensa', 'Sintomas associados a cefaleia intensa', 'Triagem de teste'),
  (6, 6, 2, '2026-05-30 11:57:00', 'Laranja', 'Dispneia', 'Sintomas associados a dispneia', 'Triagem de teste'),
  (7, 7, 4, '2026-05-30 12:34:00', 'Verde', 'Reação alérgica', 'Sintomas associados a reação alérgica', 'Triagem de teste'),
  (8, 8, 2, '2026-05-30 13:11:00', 'Azul', 'Tonturas', 'Sintomas associados a tonturas', 'Triagem de teste'),
  (9, 9, 4, '2026-05-30 13:48:00', 'Laranja', 'Crise hipertensiva', 'Sintomas associados a crise hipertensiva', 'Triagem de teste'),
  (10, 10, 2, '2026-05-30 14:25:00', 'Azul', 'Dor lombar', 'Sintomas associados a dor lombar', 'Triagem de teste')
ON CONFLICT (id) DO NOTHING;

-- 7 consultas
INSERT INTO consultas (id, episodio_urgencia_id, profissional_id, tipo, data_hora, queixa, historia, exame, sinais, observacoes, diagnostico, plano) VALUES
  (1, 1, 3, 'Consulta médica', '2026-05-30 09:57:00', 'Dor torácica', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (2, 2, 1, 'Consulta médica', '2026-05-30 10:34:00', 'Febre alta', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (3, 3, 3, 'Consulta médica', '2026-05-30 11:11:00', 'Dor abdominal', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (4, 4, 1, 'Consulta médica', '2026-05-30 11:48:00', 'Queda com traumatismo', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (5, 5, 3, 'Consulta médica', '2026-05-30 12:25:00', 'Cefaleia intensa', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (6, 6, 1, 'Consulta médica', '2026-05-30 13:02:00', 'Dispneia', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância'),
  (7, 7, 3, 'Consulta médica', '2026-05-30 13:39:00', 'Reação alérgica', 'História clínica recolhida.', 'Exame objetivo efetuado.', 'Sinais vitais avaliados.', 'Sem observações adicionais.', 'Diagnóstico provisório', 'Plano terapêutico e vigilância')
ON CONFLICT (id) DO NOTHING;

-- 4 prescrições
INSERT INTO prescricoes (id, episodio_urgencia_id, consulta_id, profissional_id, descricao, dose, frequencia, via, estado, observacoes) VALUES
  (1, 1, 1, 3, 'Paracetamol', '1 g', '8/8h', 'oral', 'pendente', 'Prescrição de teste'),
  (2, 2, 2, 3, 'Ibuprofeno', '400 mg', '12/12h', 'oral', 'pendente', 'Prescrição de teste'),
  (3, 3, 3, 3, 'Amoxicilina', '875 mg', '12/12h', 'oral', 'pendente', 'Prescrição de teste'),
  (4, 5, 5, 3, 'Salbutamol', '2 inalações', 'SOS', 'inalatória', 'pendente', 'Prescrição de teste')
ON CONFLICT (id) DO NOTHING;

-- 3 atos clínicos / exames
INSERT INTO atos (id, episodio_urgencia_id, consulta_id, profissional_id, tipo, descricao, data, estado) VALUES
  (1, 1, 1, 3, 'ECG', 'Pedido de ECG', CURRENT_TIMESTAMP, 'pendente'),
  (2, 2, 2, 3, 'Hemograma', 'Pedido de hemograma', CURRENT_TIMESTAMP, 'pendente'),
  (3, 4, 4, 3, 'Radiografia tórax', 'Pedido de radiografia', CURRENT_TIMESTAMP, 'pendente')
ON CONFLICT (id) DO NOTHING;

-- 1 internamento
INSERT INTO internamentos (id, episodio_urgencia_id, utente_id, hospital_id, medico_responsavel, servico, cama, data_hora_entrada, estado, diagnostico, observacoes) VALUES
  (1, 1, 1, 1, 3, 'Medicina Interna', 'Cama 001', CURRENT_TIMESTAMP, 'internado', 'Dor torácica em estudo', 'Internamento de teste')
ON CONFLICT (id) DO NOTHING;

SELECT setval('profissionais_id_seq', COALESCE((SELECT MAX(id) FROM profissionais), 1));
SELECT setval('utentes_id_seq', COALESCE((SELECT MAX(id) FROM utentes), 1));
SELECT setval('episodios_id_seq', COALESCE((SELECT MAX(id) FROM episodios), 1));
SELECT setval('triagens_id_seq', COALESCE((SELECT MAX(id) FROM triagens), 1));
SELECT setval('consultas_id_seq', COALESCE((SELECT MAX(id) FROM consultas), 1));
SELECT setval('prescricoes_id_seq', COALESCE((SELECT MAX(id) FROM prescricoes), 1));
SELECT setval('atos_id_seq', COALESCE((SELECT MAX(id) FROM atos), 1));
SELECT setval('internamentos_id_seq', COALESCE((SELECT MAX(id) FROM internamentos), 1));

COMMIT;

-- Verificação
SELECT 'utentes' AS tabela, COUNT(*) AS total FROM utentes
UNION ALL SELECT 'episodios', COUNT(*) FROM episodios
UNION ALL SELECT 'triagens', COUNT(*) FROM triagens
UNION ALL SELECT 'consultas', COUNT(*) FROM consultas
UNION ALL SELECT 'prescricoes', COUNT(*) FROM prescricoes
UNION ALL SELECT 'atos', COUNT(*) FROM atos
UNION ALL SELECT 'internamentos', COUNT(*) FROM internamentos;