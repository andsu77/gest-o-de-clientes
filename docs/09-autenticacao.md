# 09 — Autenticação e segurança

## Fluxo do login
```
1. POST /api/auth/login { email, password }
2. AuthController.login      valida com loginSchema (Zod)
3. AuthService.login         busca o usuário pelo e-mail
                             compara a senha com o hash (bcrypt)
                             se ok, gera um JWT com { userId, email }
4. Resposta: { token, user }  (user SEM passwordHash)
5. O front guarda o token (localStorage) e manda em todo pedido:
   Authorization: Bearer eyJhbGciOi...
6. authenticate.ts (middleware) verifica o token em toda rota protegida
   e coloca req.user = { id, email }
```

## Hash de senha (bcrypt)
`src/providers/BcryptPasswordHasher.ts`. Um **hash** é uma transformação de mão única: dá para verificar se uma senha bate, mas não dá para "desfazer" e descobrir a senha. O bcrypt ainda:
- adiciona um **salt** aleatório (duas pessoas com a mesma senha têm hashes diferentes);
- é **lento de propósito** (custo 10), para que testar milhões de senhas seja inviável.

Usamos o pacote `bcryptjs` (bcrypt escrito em JavaScript puro): mesmo algoritmo, mas instala sem compilar código C++ — evita erros de instalação no Windows. Por estar atrás da interface `PasswordHasher`, trocar para o pacote `bcrypt` é mudar um arquivo.

**Mensagem genérica:** se o e-mail não existe ou a senha está errada, a resposta é a mesma ("E-mail ou senha inválidos"). Dizer "e-mail não cadastrado" ajudaria um atacante a descobrir quais e-mails existem.

## JWT (JSON Web Token)
`src/providers/JwtTokenProvider.ts`. O token é um texto assinado com `JWT_SECRET`. Qualquer um consegue **ler** o conteúdo (não coloque dados sensíveis nele), mas ninguém consegue **alterar** sem invalidar a assinatura. Expira em `JWT_EXPIRES_IN` (8h).

### Por que JWT e não sessão?
- **Sessão:** o servidor guarda "quem está logado" (memória/banco) e o navegador guarda um cookie com o ID. Logout é imediato.
- **JWT:** o servidor não guarda nada ("stateless"); o token se prova sozinho. Mais simples de escalar e ótimo para aprender APIs.
- **Custo:** logout = o navegador descartar o token. Um token roubado vale até expirar. Guardar em `localStorage` é vulnerável a XSS — por isso o front escapa todo HTML (`html\`\`` em `public/js/ui.js`) e o Helmet bloqueia scripts inline. Uma evolução comum é usar cookie `httpOnly` (exercício da Fase 10).

## Autenticação × autorização
- **Autenticação:** "quem é você?" → o middleware `authenticate`.
- **Autorização:** "você pode fazer isso?" → aqui só existe um papel (admin), então estar logado = poder tudo. Multiusuário com papéis está nas evoluções futuras.

## Checklist de segurança do projeto
| Item | Onde |
|---|---|
| Senha com hash bcrypt | `BcryptPasswordHasher.ts`, `seed.ts` |
| Nunca devolver `passwordHash` | `AuthService.toPublicUser()`, tipo `PublicUser` |
| Rotas protegidas | `router.use(authenticate)` em `routes/index.ts` |
| Segredos no `.env` (fora do Git) | `.env.example`, `.gitignore`, `config/env.ts` |
| Validação de entrada | `src/validators/` |
| Helmet (cabeçalhos seguros, CSP) | `app.ts` |
| CORS restrito | `app.ts` + `CORS_ORIGIN` |
| Limite de tentativas de login | `auth.routes.ts` |
| Limite de tamanho do JSON (100kb) | `app.ts` |
| Erro 500 sem detalhes internos para o cliente | `errorHandler.ts` (detalhes só no console) |
| Escape de HTML no front (XSS) | `public/js/ui.js` |

**Antes de usar com dados reais:** gere um `JWT_SECRET` longo (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) e troque a senha do admin em Configurações.
