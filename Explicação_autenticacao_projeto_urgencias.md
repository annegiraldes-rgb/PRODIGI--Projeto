Autenticação utilizada no projeto

O projeto utiliza uma autenticação local baseada em utilizador e
palavra-passe.

1.  Login Existe um endpoint POST /login que recebe:

-   username
-   password

O sistema procura o utilizador na tabela ‘utilizadores’.

2.  Validação da password A função passwordValida() verifica a
    palavra-passe.

Se a password guardada estiver encriptada com bcrypt (prefixos 2a, 2b ou
2y), utiliza bcrypt.compareSync().

Caso contrário, compara a password em texto simples.

3.  Resposta do login Quando o login é válido, o servidor devolve:

{ “id”: 1, “nome”: “Admin”, “username”: “admin”, “perfil”: “admin”,
“hospital_id”: 1, “token”: “sessao-local” }

4.  Sessão O token devolvido é apenas uma string fixa (“sessao-local”).

O sistema não utiliza: - JWT - Refresh Tokens - Sessões persistentes -
Expiração automática

5.  Controlo de acesso O projeto implementa controlo de acesso baseado
    em perfis (RBAC):

-   admin
-   administrativo
-   medico
-   enfermeiro

6.  Avaliação técnica O sistema possui:

-   Autenticação por utilizador e palavra-passe
-   Hash de passwords com bcrypt
-   Controlo de acesso por perfil

Não possui: - JWT - OAuth2/OpenID Connect - MFA (autenticação
multifator) - Sessões seguras no servidor

Conclusão

A autenticação é adequada e funcional.

Para um ambiente hospitalar real seria recomendado utilizar: - JWT
assinado - Expiração de sessão - Refresh Tokens - MFA - Auditoria de
acessos.
