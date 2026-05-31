--
-- PostgreSQL database dump
--

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 17.4

-- Started on 2026-05-31 12:56:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 16499)
-- Name: atos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.atos (
    id integer NOT NULL,
    episodio_urgencia_id integer NOT NULL,
    consulta_id integer,
    profissional_id integer,
    tipo character varying(80),
    descricao text,
    data timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(30) DEFAULT 'pendente'::character varying
);


ALTER TABLE public.atos OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16498)
-- Name: atos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.atos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.atos_id_seq OWNER TO postgres;

--
-- TOC entry 3548 (class 0 OID 0)
-- Dependencies: 229
-- Name: atos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.atos_id_seq OWNED BY public.atos.id;


--
-- TOC entry 228 (class 1259 OID 16480)
-- Name: consultas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultas (
    id integer NOT NULL,
    episodio_urgencia_id integer NOT NULL,
    profissional_id integer,
    tipo character varying(80),
    data_hora timestamp without time zone NOT NULL,
    queixa text,
    historia text,
    exame text,
    sinais text,
    observacoes text,
    diagnostico text,
    plano text
);


ALTER TABLE public.consultas OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16479)
-- Name: consultas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultas_id_seq OWNER TO postgres;

--
-- TOC entry 3549 (class 0 OID 0)
-- Dependencies: 227
-- Name: consultas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultas_id_seq OWNED BY public.consultas.id;


--
-- TOC entry 224 (class 1259 OID 16440)
-- Name: episodios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.episodios (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    hospital_id integer NOT NULL,
    data_entrada timestamp without time zone NOT NULL,
    data_saida timestamp without time zone,
    estado character varying(50) DEFAULT 'aguardar_triagem'::character varying,
    tipo_entrada character varying(30) DEFAULT 'normal'::character varying,
    motivo text,
    data_hora_alta timestamp without time zone
);


ALTER TABLE public.episodios OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16439)
-- Name: episodios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.episodios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.episodios_id_seq OWNER TO postgres;

--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 223
-- Name: episodios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.episodios_id_seq OWNED BY public.episodios.id;


--
-- TOC entry 216 (class 1259 OID 16386)
-- Name: hospitais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitais (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    localizacao character varying(150) NOT NULL,
    data_registo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'ativo'::character varying
);


ALTER TABLE public.hospitais OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16385)
-- Name: hospitais_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitais_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitais_id_seq OWNER TO postgres;

--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 215
-- Name: hospitais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitais_id_seq OWNED BY public.hospitais.id;


--
-- TOC entry 234 (class 1259 OID 16551)
-- Name: internamentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internamentos (
    id integer NOT NULL,
    episodio_urgencia_id integer NOT NULL,
    utente_id integer NOT NULL,
    hospital_id integer NOT NULL,
    medico_responsavel integer,
    servico character varying(120),
    cama character varying(50),
    data_hora_entrada timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(30) DEFAULT 'internado'::character varying,
    diagnostico text,
    observacoes text,
    data_hora_alta timestamp without time zone
);


ALTER TABLE public.internamentos OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16550)
-- Name: internamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.internamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.internamentos_id_seq OWNER TO postgres;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 233
-- Name: internamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.internamentos_id_seq OWNED BY public.internamentos.id;


--
-- TOC entry 232 (class 1259 OID 16525)
-- Name: prescricoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescricoes (
    id integer NOT NULL,
    episodio_urgencia_id integer NOT NULL,
    consulta_id integer,
    profissional_id integer,
    descricao text NOT NULL,
    dose character varying(100),
    frequencia character varying(100),
    via character varying(50),
    data timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(30) DEFAULT 'pendente'::character varying,
    observacoes text
);


ALTER TABLE public.prescricoes OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16524)
-- Name: prescricoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescricoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescricoes_id_seq OWNER TO postgres;

--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 231
-- Name: prescricoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescricoes_id_seq OWNED BY public.prescricoes.id;


--
-- TOC entry 220 (class 1259 OID 16413)
-- Name: profissionais; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profissionais (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    tipo character varying(50) NOT NULL,
    especialidade character varying(120),
    cedula character varying(50),
    hospital_id integer NOT NULL,
    estado character varying(20) DEFAULT 'ativo'::character varying
);


ALTER TABLE public.profissionais OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16412)
-- Name: profissionais_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profissionais_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profissionais_id_seq OWNER TO postgres;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 219
-- Name: profissionais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profissionais_id_seq OWNED BY public.profissionais.id;


--
-- TOC entry 226 (class 1259 OID 16461)
-- Name: triagens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.triagens (
    id integer NOT NULL,
    episodio_urgencia_id integer NOT NULL,
    profissional_id integer,
    data_hora timestamp without time zone NOT NULL,
    prioridade character varying(80) NOT NULL,
    motivo_admissao text,
    sintomas text,
    observacoes text
);


ALTER TABLE public.triagens OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16460)
-- Name: triagens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.triagens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.triagens_id_seq OWNER TO postgres;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 225
-- Name: triagens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.triagens_id_seq OWNED BY public.triagens.id;


--
-- TOC entry 222 (class 1259 OID 16426)
-- Name: utentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utentes (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    data_nascimento date NOT NULL,
    nif character varying(20) NOT NULL,
    nss character varying(30),
    sexo character varying(20),
    telefone character varying(30),
    morada text,
    grupo_sanguineo character varying(5),
    alergias text,
    patologias text,
    data_registo timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utentes OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16425)
-- Name: utentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utentes_id_seq OWNER TO postgres;

--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 221
-- Name: utentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utentes_id_seq OWNED BY public.utentes.id;


--
-- TOC entry 218 (class 1259 OID 16395)
-- Name: utilizadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilizadores (
    id integer NOT NULL,
    nome character varying(120) NOT NULL,
    username character varying(80) NOT NULL,
    password character varying(255) NOT NULL,
    perfil character varying(50) NOT NULL,
    hospital_id integer,
    estado character varying(20) DEFAULT 'ativo'::character varying,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utilizadores OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16394)
-- Name: utilizadores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilizadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilizadores_id_seq OWNER TO postgres;

--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 217
-- Name: utilizadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilizadores_id_seq OWNED BY public.utilizadores.id;


--
-- TOC entry 3327 (class 2604 OID 16502)
-- Name: atos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atos ALTER COLUMN id SET DEFAULT nextval('public.atos_id_seq'::regclass);


--
-- TOC entry 3326 (class 2604 OID 16483)
-- Name: consultas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas ALTER COLUMN id SET DEFAULT nextval('public.consultas_id_seq'::regclass);


--
-- TOC entry 3322 (class 2604 OID 16443)
-- Name: episodios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodios ALTER COLUMN id SET DEFAULT nextval('public.episodios_id_seq'::regclass);


--
-- TOC entry 3312 (class 2604 OID 16389)
-- Name: hospitais id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitais ALTER COLUMN id SET DEFAULT nextval('public.hospitais_id_seq'::regclass);


--
-- TOC entry 3333 (class 2604 OID 16554)
-- Name: internamentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos ALTER COLUMN id SET DEFAULT nextval('public.internamentos_id_seq'::regclass);


--
-- TOC entry 3330 (class 2604 OID 16528)
-- Name: prescricoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescricoes ALTER COLUMN id SET DEFAULT nextval('public.prescricoes_id_seq'::regclass);


--
-- TOC entry 3318 (class 2604 OID 16416)
-- Name: profissionais id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profissionais ALTER COLUMN id SET DEFAULT nextval('public.profissionais_id_seq'::regclass);


--
-- TOC entry 3325 (class 2604 OID 16464)
-- Name: triagens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.triagens ALTER COLUMN id SET DEFAULT nextval('public.triagens_id_seq'::regclass);


--
-- TOC entry 3320 (class 2604 OID 16429)
-- Name: utentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utentes ALTER COLUMN id SET DEFAULT nextval('public.utentes_id_seq'::regclass);


--
-- TOC entry 3315 (class 2604 OID 16398)
-- Name: utilizadores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores ALTER COLUMN id SET DEFAULT nextval('public.utilizadores_id_seq'::regclass);


--
-- TOC entry 3538 (class 0 OID 16499)
-- Dependencies: 230
-- Data for Name: atos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.atos (id, episodio_urgencia_id, consulta_id, profissional_id, tipo, descricao, data, estado) FROM stdin;
\.


--
-- TOC entry 3536 (class 0 OID 16480)
-- Dependencies: 228
-- Data for Name: consultas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultas (id, episodio_urgencia_id, profissional_id, tipo, data_hora, queixa, historia, exame, sinais, observacoes, diagnostico, plano) FROM stdin;
\.


--
-- TOC entry 3532 (class 0 OID 16440)
-- Dependencies: 224
-- Data for Name: episodios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.episodios (id, utente_id, hospital_id, data_entrada, data_saida, estado, tipo_entrada, motivo, data_hora_alta) FROM stdin;
\.


--
-- TOC entry 3524 (class 0 OID 16386)
-- Dependencies: 216
-- Data for Name: hospitais; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitais (id, nome, localizacao, data_registo, estado) FROM stdin;
1	Hospital Central	Lisboa	2026-05-21 18:06:46.281893	ativo
2	hospital norte	porto	2026-05-30 11:13:09.092157	ativo
\.


--
-- TOC entry 3542 (class 0 OID 16551)
-- Dependencies: 234
-- Data for Name: internamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internamentos (id, episodio_urgencia_id, utente_id, hospital_id, medico_responsavel, servico, cama, data_hora_entrada, estado, diagnostico, observacoes, data_hora_alta) FROM stdin;
\.


--
-- TOC entry 3540 (class 0 OID 16525)
-- Dependencies: 232
-- Data for Name: prescricoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescricoes (id, episodio_urgencia_id, consulta_id, profissional_id, descricao, dose, frequencia, via, data, estado, observacoes) FROM stdin;
\.


--
-- TOC entry 3528 (class 0 OID 16413)
-- Dependencies: 220
-- Data for Name: profissionais; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profissionais (id, nome, tipo, especialidade, cedula, hospital_id, estado) FROM stdin;
1	Dr. João Silva	medico	Medicina Interna	MED123	1	ativo
2	Enf. Maria Santos	enfermeiro	Urgência / Triagem	ENF456	1	ativo
3	Dra. Ana Costa	medico	Medicina Interna	MED301	1	ativo
4	Dr. Miguel Pereira	medico	Cirurgia Geral	MED302	1	ativo
5	Dra. Sofia Martins	medico	Pediatria	MED303	1	ativo
6	Dr. Ricardo Almeida	medico	Ortopedia	MED304	1	ativo
7	Dra. Beatriz Lopes	medico	Cardiologia	MED305	1	ativo
8	Enf. Carlos Ribeiro	enfermeiro	Urgência / Triagem	ENF801	1	ativo
9	Enf. Marta Sousa	enfermeiro	Urgência / Triagem	ENF802	1	ativo
10	Enf. Tiago Gomes	enfermeiro	Urgência / Triagem	ENF803	1	ativo
\.


--
-- TOC entry 3534 (class 0 OID 16461)
-- Dependencies: 226
-- Data for Name: triagens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.triagens (id, episodio_urgencia_id, profissional_id, data_hora, prioridade, motivo_admissao, sintomas, observacoes) FROM stdin;
\.


--
-- TOC entry 3530 (class 0 OID 16426)
-- Dependencies: 222
-- Data for Name: utentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utentes (id, nome, data_nascimento, nif, nss, sexo, telefone, morada, grupo_sanguineo, alergias, patologias, data_registo) FROM stdin;
\.


--
-- TOC entry 3526 (class 0 OID 16395)
-- Dependencies: 218
-- Data for Name: utilizadores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilizadores (id, nome, username, password, perfil, hospital_id, estado, criado_em) FROM stdin;
1	Admin Hospital	admin	$2a$10$8fGHNo49DUuGXNPNfkBj2eV6bEQVszNYHUaJaQIGoGTMLqIqD36ZW	admin	1	ativo	2026-05-21 18:06:46.390286
2	Receção Administrativa	administrativo	$2a$10$8fGHNo49DUuGXNPNfkBj2eV6bEQVszNYHUaJaQIGoGTMLqIqD36ZW	administrativo	1	ativo	2026-05-21 18:06:46.395525
3	Dr. João Silva	medico	$2a$10$8fGHNo49DUuGXNPNfkBj2eV6bEQVszNYHUaJaQIGoGTMLqIqD36ZW	medico	1	ativo	2026-05-21 18:06:46.398691
4	Enf. Maria Santos	enfermeiro	$2a$10$8fGHNo49DUuGXNPNfkBj2eV6bEQVszNYHUaJaQIGoGTMLqIqD36ZW	enfermeiro	1	ativo	2026-05-21 18:06:46.402078
\.


--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 229
-- Name: atos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.atos_id_seq', 1, false);


--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 227
-- Name: consultas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultas_id_seq', 1, false);


--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 223
-- Name: episodios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.episodios_id_seq', 1, false);


--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 215
-- Name: hospitais_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitais_id_seq', 2, true);


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 233
-- Name: internamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.internamentos_id_seq', 1, false);


--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 231
-- Name: prescricoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescricoes_id_seq', 1, false);


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 219
-- Name: profissionais_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profissionais_id_seq', 10, true);


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 225
-- Name: triagens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.triagens_id_seq', 1, false);


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 221
-- Name: utentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utentes_id_seq', 1, false);


--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 217
-- Name: utilizadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilizadores_id_seq', 4, true);


--
-- TOC entry 3357 (class 2606 OID 16508)
-- Name: atos atos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atos
    ADD CONSTRAINT atos_pkey PRIMARY KEY (id);


--
-- TOC entry 3355 (class 2606 OID 16487)
-- Name: consultas consultas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 16449)
-- Name: episodios episodios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodios
    ADD CONSTRAINT episodios_pkey PRIMARY KEY (id);


--
-- TOC entry 3337 (class 2606 OID 16393)
-- Name: hospitais hospitais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitais
    ADD CONSTRAINT hospitais_pkey PRIMARY KEY (id);


--
-- TOC entry 3361 (class 2606 OID 16560)
-- Name: internamentos internamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos
    ADD CONSTRAINT internamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3359 (class 2606 OID 16534)
-- Name: prescricoes prescricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescricoes
    ADD CONSTRAINT prescricoes_pkey PRIMARY KEY (id);


--
-- TOC entry 3343 (class 2606 OID 16419)
-- Name: profissionais profissionais_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profissionais
    ADD CONSTRAINT profissionais_pkey PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 16468)
-- Name: triagens triagens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.triagens
    ADD CONSTRAINT triagens_pkey PRIMARY KEY (id);


--
-- TOC entry 3345 (class 2606 OID 16436)
-- Name: utentes utentes_nif_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utentes
    ADD CONSTRAINT utentes_nif_key UNIQUE (nif);


--
-- TOC entry 3347 (class 2606 OID 16438)
-- Name: utentes utentes_nss_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utentes
    ADD CONSTRAINT utentes_nss_key UNIQUE (nss);


--
-- TOC entry 3349 (class 2606 OID 16434)
-- Name: utentes utentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utentes
    ADD CONSTRAINT utentes_pkey PRIMARY KEY (id);


--
-- TOC entry 3339 (class 2606 OID 16404)
-- Name: utilizadores utilizadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_pkey PRIMARY KEY (id);


--
-- TOC entry 3341 (class 2606 OID 16406)
-- Name: utilizadores utilizadores_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_username_key UNIQUE (username);


--
-- TOC entry 3370 (class 2606 OID 16514)
-- Name: atos atos_consulta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atos
    ADD CONSTRAINT atos_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES public.consultas(id);


--
-- TOC entry 3371 (class 2606 OID 16509)
-- Name: atos atos_episodio_urgencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atos
    ADD CONSTRAINT atos_episodio_urgencia_id_fkey FOREIGN KEY (episodio_urgencia_id) REFERENCES public.episodios(id);


--
-- TOC entry 3372 (class 2606 OID 16519)
-- Name: atos atos_profissional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atos
    ADD CONSTRAINT atos_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id);


--
-- TOC entry 3368 (class 2606 OID 16488)
-- Name: consultas consultas_episodio_urgencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_episodio_urgencia_id_fkey FOREIGN KEY (episodio_urgencia_id) REFERENCES public.episodios(id);


--
-- TOC entry 3369 (class 2606 OID 16493)
-- Name: consultas consultas_profissional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id);


--
-- TOC entry 3364 (class 2606 OID 16455)
-- Name: episodios episodios_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodios
    ADD CONSTRAINT episodios_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitais(id);


--
-- TOC entry 3365 (class 2606 OID 16450)
-- Name: episodios episodios_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodios
    ADD CONSTRAINT episodios_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utentes(id);


--
-- TOC entry 3376 (class 2606 OID 16561)
-- Name: internamentos internamentos_episodio_urgencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos
    ADD CONSTRAINT internamentos_episodio_urgencia_id_fkey FOREIGN KEY (episodio_urgencia_id) REFERENCES public.episodios(id);


--
-- TOC entry 3377 (class 2606 OID 16571)
-- Name: internamentos internamentos_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos
    ADD CONSTRAINT internamentos_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitais(id);


--
-- TOC entry 3378 (class 2606 OID 16576)
-- Name: internamentos internamentos_medico_responsavel_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos
    ADD CONSTRAINT internamentos_medico_responsavel_fkey FOREIGN KEY (medico_responsavel) REFERENCES public.profissionais(id);


--
-- TOC entry 3379 (class 2606 OID 16566)
-- Name: internamentos internamentos_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internamentos
    ADD CONSTRAINT internamentos_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utentes(id);


--
-- TOC entry 3373 (class 2606 OID 16540)
-- Name: prescricoes prescricoes_consulta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescricoes
    ADD CONSTRAINT prescricoes_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES public.consultas(id);


--
-- TOC entry 3374 (class 2606 OID 16535)
-- Name: prescricoes prescricoes_episodio_urgencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescricoes
    ADD CONSTRAINT prescricoes_episodio_urgencia_id_fkey FOREIGN KEY (episodio_urgencia_id) REFERENCES public.episodios(id);


--
-- TOC entry 3375 (class 2606 OID 16545)
-- Name: prescricoes prescricoes_profissional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescricoes
    ADD CONSTRAINT prescricoes_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id);


--
-- TOC entry 3363 (class 2606 OID 16420)
-- Name: profissionais profissionais_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profissionais
    ADD CONSTRAINT profissionais_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitais(id);


--
-- TOC entry 3366 (class 2606 OID 16469)
-- Name: triagens triagens_episodio_urgencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.triagens
    ADD CONSTRAINT triagens_episodio_urgencia_id_fkey FOREIGN KEY (episodio_urgencia_id) REFERENCES public.episodios(id);


--
-- TOC entry 3367 (class 2606 OID 16474)
-- Name: triagens triagens_profissional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.triagens
    ADD CONSTRAINT triagens_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id);


--
-- TOC entry 3362 (class 2606 OID 16407)
-- Name: utilizadores utilizadores_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitais(id);


-- Completed on 2026-05-31 12:56:56

--
-- PostgreSQL database dump complete
--

