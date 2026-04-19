# Scout Department — All In Sports Group

App de scouting com login, base de dados em tempo real e interface mobile-friendly.

## Como publicar no Vercel

### Opção A — Via GitHub (recomendado)
1. Cria conta em github.com
2. Cria repositório novo chamado `scout-department`
3. Faz upload de todos os ficheiros desta pasta
4. No Vercel: "Add New Project" → liga ao repositório GitHub
5. Clica "Deploy" — fica online em 2 minutos

### Opção B — Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Criar utilizadores
No Supabase → Authentication → Users → "Invite user"
Insere o email da pessoa — recebe email com link para definir password.

## Estrutura
- `src/main.js` — lógica da app
- `src/style.css` — estilos
- `src/supabase.js` — ligação à base de dados
- `index.html` — entrada
