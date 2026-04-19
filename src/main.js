import { supabase } from './supabase.js'

const POSICOES = ['Guarda-Redes','Defesa Central','Lateral Dir.','Lateral Esq.','Médio Defensivo','Médio-Centro','Médio Ofensivo','Extremo Dir.','Extremo Esq.','Ponta de Lança']
const NIVEIS = ['A +','A','A/B','B +','B','B -','B/C']

let state = {
  user: null,
  role: null,
  players: [],
  filtered: [],
  loading: true,
  search: '',
  filterPos: '',
  filterNivel: '',
  filterAno: '',
  sortCol: 'nome',
  sortDir: 1,
  selectedPlayer: null,
  editingPlayer: null,
}

function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

function nivelClass(n) {
  if (!n) return 'nivel-default'
  const m = n.trim()
  if (m === 'A +') return 'nivel-A-plus'
  if (m === 'A') return 'nivel-A'
  if (m === 'A/B') return 'nivel-AB'
  if (m === 'B +') return 'nivel-B-plus'
  if (m === 'B -') return 'nivel-B-minus'
  if (m === 'B/C') return 'nivel-BC'
  if (m === 'B') return 'nivel-B'
  return 'nivel-default'
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className = 'toast' + (type ? ' ' + type : '')
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

const LOGO = 'data:image/png;base64,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'

function icon(name) {
  const icons = {
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
    players: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="#FF0000" width="22" height="22"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
    vimeo: `<svg viewBox="0 0 24 24" fill="#1AB7EA" width="22" height="22"><path d="M22 7.42c-.09 2.01-1.49 4.76-4.21 8.26C14.97 19.3 12.61 21 10.61 21c-1.31 0-2.41-1.21-3.31-3.62L5.96 12.9C5.34 10.49 4.68 9.28 3.97 9.28c-.15 0-.68.32-1.59.95L1 8.93c1-.88 1.99-1.76 2.96-2.64 1.34-1.15 2.34-1.76 3.01-1.82 1.58-.15 2.55.93 2.92 3.24.39 2.47.67 4.01.82 4.61.46 2.08.96 3.12 1.51 3.12.43 0 1.07-.68 1.93-2.03.86-1.35 1.32-2.38 1.38-3.09.12-1.17-.34-1.75-1.38-1.75-.49 0-1 .11-1.51.34.99-3.26 2.9-4.85 5.7-4.77 2.08.06 3.06 1.41 2.96 4.04"/></svg>`,
    transfermarkt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  }
  return icons[name] || ''
}

// ── AUTH ──
function renderAuth() {
  document.getElementById('app').innerHTML = `
    <div class="auth-screen">
      <div class="auth-card">
        <div class="auth-logo">
          <img src="${LOGO}" class="auth-logo-img" />
          <div class="auth-title">Database</div>
          <div class="auth-sub">All In Sports Group</div>
        </div>
        <form class="auth-form" id="auth-form">
          <div>
            <label class="field-label">Email</label>
            <input class="field-input" type="email" id="auth-email" placeholder="email@allinsportsgroup.com" autocomplete="email" required />
          </div>
          <div>
            <label class="field-label">Password</label>
            <input class="field-input" type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <div id="auth-error" style="display:none" class="auth-error"></div>
          <button type="submit" class="btn-primary" id="auth-btn">Entrar</button>
        </form>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('auth-email').value.trim()
    const password = document.getElementById('auth-password').value
    const btn = document.getElementById('auth-btn')
    const errEl = document.getElementById('auth-error')
    btn.disabled = true
    btn.textContent = 'A entrar...'
    errEl.style.display = 'none'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      errEl.textContent = 'Email ou password incorretos.'
      errEl.style.display = 'block'
      btn.disabled = false
      btn.textContent = 'Entrar'
    }
  })
}

// ── FILTERS ──
function applyFilters() {
  const q = state.search.toLowerCase().trim()
  state.filtered = state.players.filter(p => {
    if (q) {
      const hay = [p.nome, p.clube, p.representante, p.instagram, p.referenciador, p.posicao].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (state.filterPos && p.posicao !== state.filterPos) return false
    if (state.filterNivel && p.nivel !== state.filterNivel) return false
    if (state.filterAno && String(p.ano) !== state.filterAno) return false
    return true
  })
  state.filtered.sort((a, b) => {
    let av = a[state.sortCol] ?? '', bv = b[state.sortCol] ?? ''
    if (!isNaN(av) && !isNaN(bv) && av !== '' && bv !== '') { av = +av; bv = +bv }
    return av < bv ? -state.sortDir : av > bv ? state.sortDir : 0
  })
}

// ── RENDER APP ──
function renderApp() {
  const anos = [...new Set(state.players.map(p => p.ano).filter(a => a && a > 0))].sort()
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-logo"><img src="${LOGO}" style="width:30px;height:30px;object-fit:cover;" /></div>
          <span class="topbar-title">Database</span>
        </div>
        <div class="topbar-right">
          ${(state.role === 'admin' || state.role === 'moderator') ? `<button class="btn-add" id="btn-add">${icon('plus')}<span>Novo Jogador</span></button>` : ''}
          <button class="btn-icon" id="btn-logout" title="Sair">${icon('logout')}</button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-wrap">
          ${icon('search')}
          <input class="search-input" id="search" type="search" placeholder="Pesquisar jogador, clube, representante..." value="${state.search}" />
        </div>
        <select class="filter-select" id="f-pos">
          <option value="">Posição</option>
          ${POSICOES.map(p => `<option value="${p}" ${state.filterPos===p?'selected':''}>${p}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-nivel">
          <option value="">Nível</option>
          ${NIVEIS.map(n => `<option value="${n}" ${state.filterNivel===n?'selected':''}>${n}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-ano">
          <option value="">Ano</option>
          ${anos.map(a => `<option value="${a}" ${state.filterAno===String(a)?'selected':''}>${a}</option>`).join('')}
        </select>
        <button class="btn-clear-filters" id="btn-clear">Limpar</button>
      </div>

      <div class="stats-bar">
        <div class="stats-count" id="stats-count"><strong>${state.filtered.length}</strong> de ${state.players.length} jogadores</div>
        <div class="sort-controls">
          <select class="sort-select" id="sort-col">
            <option value="nome">Nome</option>
            <option value="posicao">Posição</option>
            <option value="nivel">Nível</option>
            <option value="ano">Ano</option>
          </select>
          <button class="sort-dir-btn" id="sort-dir">↑↓</button>
        </div>
      </div>

      <div class="player-list" id="player-list">
        ${state.loading ? '<div class="loading"><div class="spinner"></div> A carregar...</div>' : renderPlayerList()}
      </div>
    </div>

    <div class="overlay" id="overlay"></div>
    <div class="side-panel" id="side-panel"><div id="panel-content"></div></div>
    <div class="form-panel" id="form-panel"><div id="form-content"></div></div>
    <div class="toast" id="toast"></div>
  `
  bindAppEvents()
}

function renderPlayerList() {
  if (!state.filtered.length) {
    return `<div class="empty-state">${icon('players')}<p>Nenhum jogador encontrado</p><span>Tenta ajustar os filtros</span></div>`
  }
  return state.filtered.map(p => `
    <div class="player-row" data-id="${p.id}">
      <div class="player-avatar">${initials(p.nome)}</div>
      <div class="player-info">
        <div class="player-name">${p.nome}</div>
        <div class="player-ano-inline">${p.ano || '—'}</div>
        <div class="player-meta">${p.clube || '—'}</div>
      </div>
      <div class="player-right">
        <span class="nivel-badge ${nivelClass(p.nivel)}">${p.nivel || '—'}</span>
        <span class="pos-tag">${p.posicao || '—'}</span>
      </div>
      <div class="chevron">${icon('chevron')}</div>
    </div>
  `).join('')
}

function updateList() {
  applyFilters()
  const list = document.getElementById('player-list')
  if (list) list.innerHTML = renderPlayerList()
  const stats = document.getElementById('stats-count')
  if (stats) stats.innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  bindRowEvents()
}

function bindAppEvents() {
  document.getElementById('search').addEventListener('input', e => { state.search = e.target.value; updateList() })
  document.getElementById('f-pos').addEventListener('change', e => { state.filterPos = e.target.value; updateList() })
  document.getElementById('f-nivel').addEventListener('change', e => { state.filterNivel = e.target.value; updateList() })
  document.getElementById('f-ano').addEventListener('change', e => { state.filterAno = e.target.value; updateList() })
  document.getElementById('btn-clear').addEventListener('click', () => {
    state.search = ''; state.filterPos = ''; state.filterNivel = ''; state.filterAno = ''
    document.getElementById('search').value = ''
    document.getElementById('f-pos').value = ''
    document.getElementById('f-nivel').value = ''
    document.getElementById('f-ano').value = ''
    updateList()
  })
  document.getElementById('sort-col').addEventListener('change', e => { state.sortCol = e.target.value; updateList() })
  document.getElementById('sort-dir').addEventListener('click', () => {
    state.sortDir *= -1
    document.getElementById('sort-dir').textContent = state.sortDir === 1 ? '↑↓' : '↓↑'
    updateList()
  })
  const btnAdd = document.getElementById('btn-add'); if (btnAdd) btnAdd.addEventListener('click', () => openForm(null))
  document.getElementById('btn-logout').addEventListener('click', async () => { await supabase.auth.signOut() })
  document.getElementById('overlay').addEventListener('click', closeAll)
  bindRowEvents()
}

function bindRowEvents() {
  document.querySelectorAll('.player-row').forEach(row => {
    row.addEventListener('click', () => {
      const player = state.players.find(p => p.id === row.dataset.id)
      if (player) openPanel(player)
    })
  })
}

// ── PANEL ──
function openPanel(player) {
  state.selectedPlayer = player
  const ig = (player.instagram || '').trim()
  const igLink = player.instagram_link || (ig ? `https://www.instagram.com/${ig}/` : null)
  const lk = player.link
  const vid = player.video

  function isYoutube(url) { return url && url.includes('youtube') }
  function isVimeo(url) { return url && url.includes('vimeo') }

  let videoIcon = icon('youtube')
  if (isVimeo(vid)) videoIcon = icon('vimeo')

  let linkIcon = icon('transfermarkt')
  let linkLabel = 'Ver perfil'

  document.getElementById('panel-content').innerHTML = `
    <div class="panel-header">
      <div>
        <div class="panel-header-title">${player.nome}</div>
        <div class="panel-header-sub">${[player.posicao, player.clube].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="panel-actions">
        ${state.role === 'admin' ? `<button class="btn-edit" id="panel-edit">Editar</button>` : ''}
        <button class="btn-icon" id="panel-close">${icon('close')}</button>
      </div>
    </div>
    <div class="panel-body">
      <div>
        <div class="panel-section-title">Identificação</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Nº Processo</span><span class="info-val">${player.processo || '—'}</span></div>
          <div class="info-row"><span class="info-label">Ano Nascimento</span><span class="info-val">${player.ano || '—'}</span></div>
          <div class="info-row"><span class="info-label">Posição</span><span class="info-val"><span class="nivel-badge nivel-default">${player.posicao || '—'}</span></span></div>
          <div class="info-row"><span class="info-label">Nível</span><span class="info-val"><span class="nivel-badge ${nivelClass(player.nivel)}">${player.nivel || '—'}</span></span></div>
          <div class="info-row"><span class="info-label">Clube Actual</span><span class="info-val">${player.clube || '—'}</span></div>
        </div>
      </div>
      <div>
        <div class="panel-section-title">Representação</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Representante</span><span class="info-val">${player.representante || '<span style="color:var(--text-3)">—</span>'}</span></div>
          <div class="info-row"><span class="info-label">Recrutador</span><span class="info-val">${player.referenciador || '<span style="color:var(--text-3)">—</span>'}</span></div>
        </div>
      </div>
      <div>
        <div class="panel-section-title">Contactos & Links</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Telemóvel</span><span class="info-val">${player.telefone || '<span style="color:var(--text-3)">—</span>'}</span></div>
          <div class="info-row">
            <span class="info-label">Instagram</span>
            <span class="info-val">
              ${igLink ? `<a href="${igLink}" target="_blank" style="display:inline-flex;align-items:center;color:#E1306C;">${icon('instagram')}</a>` : '<span style="color:var(--text-3)">—</span>'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Perfil</span>
            <span class="info-val">
              ${lk ? `<a href="${lk}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;color:var(--accent);">${icon('transfermarkt')} Ver perfil</a>` : '<span style="color:var(--text-3)">—</span>'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Vídeo</span>
            <span class="info-val">
              ${vid ? `<a href="${vid}" target="_blank" style="display:inline-flex;align-items:center;">${videoIcon}</a>` : '<span style="color:var(--text-3)">—</span>'}
            </span>
          </div>
        </div>
      </div>
      ${player.notas ? `<div><div class="panel-section-title">Notas</div><div class="notas-box">${player.notas}</div></div>` : ''}
      ${state.role === 'admin' ? `<div><button class="btn-delete" id="panel-delete" style="width:100%">Eliminar jogador</button></div>` : ''}
    </div>
  `
  document.getElementById('panel-close').addEventListener('click', closeAll)
  const btnEdit = document.getElementById('panel-edit'); if (btnEdit) btnEdit.addEventListener('click', () => { closePanel(); openForm(player) })
  const btnDel = document.getElementById('panel-delete'); if (btnDel) btnDel.addEventListener('click', () => deletePlayer(player))
  document.getElementById('overlay').classList.add('open')
  document.getElementById('side-panel').classList.add('open')
}

function closePanel() { document.getElementById('side-panel').classList.remove('open') }
function closeAll() {
  document.getElementById('overlay').classList.remove('open')
  document.getElementById('side-panel').classList.remove('open')
  document.getElementById('form-panel').classList.remove('open')
}

// ── FORM ──
function openForm(player) {
  state.editingPlayer = player
  const isEdit = !!player
  const p = player || {}
  document.getElementById('form-content').innerHTML = `
    <div class="form-header">
      <div class="form-title">${isEdit ? 'Editar Jogador' : 'Novo Jogador'}</div>
      <button class="btn-icon" id="form-close">${icon('close')}</button>
    </div>
    <div class="form-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nome *</label>
          <input class="form-input" id="f-nome" type="text" value="${p.nome || ''}" placeholder="Nome completo" />
        </div>
        <div class="form-group" style="max-width:90px">
          <label class="form-label">Nº Proc.</label>
          <input class="form-input" id="f-processo" type="text" value="${p.processo || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Posição</label>
          <select class="form-select" id="f-posicao">
            <option value="">Selecionar</option>
            ${POSICOES.map(pos => `<option value="${pos}" ${p.posicao===pos?'selected':''}>${pos}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nível</label>
          <select class="form-select" id="f-nivel-form">
            <option value="">Selecionar</option>
            ${NIVEIS.map(n => `<option value="${n}" ${p.nivel===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Clube Actual</label>
          <input class="form-input" id="f-clube" type="text" value="${p.clube || ''}" placeholder="Ex: SL Benfica" />
        </div>
        <div class="form-group" style="max-width:90px">
          <label class="form-label">Ano Nasc.</label>
          <input class="form-input" id="f-ano-form" type="number" value="${p.ano || ''}" placeholder="2005" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Representante</label>
        <input class="form-input" id="f-representante" type="text" value="${p.representante || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Recrutador</label>
        <input class="form-input" id="f-referenciador" type="text" value="${p.referenciador || ''}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Telemóvel</label>
          <input class="form-input" id="f-telefone" type="tel" value="${p.telefone || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Instagram (@username)</label>
          <input class="form-input" id="f-instagram" type="text" value="${p.instagram || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Link Perfil (Transfermarkt / ZeroZero)</label>
        <input class="form-input" id="f-link" type="url" value="${p.link || ''}" placeholder="https://transfermarkt.com/..." />
      </div>
      <div class="form-group">
        <label class="form-label">Vídeo (YouTube / Vimeo)</label>
        <input class="form-input" id="f-video" type="url" value="${p.video || ''}" placeholder="https://youtube.com/..." />
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="f-notas">${p.notas || ''}</textarea>
      </div>
    </div>
    <div class="form-footer">
      <button class="btn-cancel" id="form-cancel">Cancelar</button>
      <button class="btn-save" id="form-save">${isEdit ? 'Guardar' : 'Adicionar jogador'}</button>
    </div>
  `
  document.getElementById('form-close').addEventListener('click', closeAll)
  document.getElementById('form-cancel').addEventListener('click', closeAll)
  document.getElementById('form-save').addEventListener('click', savePlayer)
  document.getElementById('overlay').classList.add('open')
  document.getElementById('form-panel').classList.add('open')
  document.getElementById('f-nome').focus()
}

// ── CRUD ──
async function savePlayer() {
  const nome = document.getElementById('f-nome').value.trim()
  if (!nome) { showToast('O nome é obrigatório', 'error'); return }
  const btn = document.getElementById('form-save')
  btn.disabled = true
  btn.textContent = 'A guardar...'
  const ig = document.getElementById('f-instagram').value.trim().replace(/^@/, '')
  const igLink = ig ? `https://www.instagram.com/${ig}/` : null
  const data = {
    nome,
    processo: document.getElementById('f-processo').value.trim() || null,
    posicao: document.getElementById('f-posicao').value || null,
    nivel: document.getElementById('f-nivel-form').value || null,
    clube: document.getElementById('f-clube').value.trim() || null,
    ano: parseInt(document.getElementById('f-ano-form').value) || null,
    representante: document.getElementById('f-representante').value.trim() || null,
    referenciador: document.getElementById('f-referenciador').value.trim() || null,
    telefone: document.getElementById('f-telefone').value.trim() || null,
    instagram: ig || null,
    instagram_link: igLink,
    link: document.getElementById('f-link').value.trim() || null,
    video: document.getElementById('f-video').value.trim() || null,
    notas: document.getElementById('f-notas').value.trim() || null,
  }
  let error
  if (state.editingPlayer) {
    ;({ error } = await supabase.from('players').update(data).eq('id', state.editingPlayer.id))
  } else {
    data.data_insercao = new Date().toISOString().split('T')[0]
    ;({ error } = await supabase.from('players').insert(data))
  }
  if (error) {
    showToast('Erro ao guardar.', 'error')
    btn.disabled = false
    btn.textContent = state.editingPlayer ? 'Guardar' : 'Adicionar jogador'
    return
  }
  showToast(state.editingPlayer ? 'Jogador atualizado!' : 'Jogador adicionado!', 'success')
  closeAll()
  await loadPlayers()
}

async function deletePlayer(player) {
  if (!confirm(`Tens a certeza que queres eliminar "${player.nome}"?`)) return
  const { error } = await supabase.from('players').delete().eq('id', player.id)
  if (error) { showToast('Erro ao eliminar.', 'error'); return }
  showToast('Jogador eliminado.', 'success')
  closeAll()
  await loadPlayers()
}

async function loadPlayers() {
  const { data, error } = await supabase.from('players').select('*').order('nome')
  if (error) { showToast('Erro ao carregar dados.', 'error'); return }
  state.players = data || []
  state.loading = false
  updateList()
}

async function fetchRole() {
  const { data } = await supabase.from('user_roles').select('role').eq('id', state.user.id).single()
  state.role = data?.role || 'viewer'
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  state.user = session?.user || null
  if (!state.user) { renderAuth(); return }
  await fetchRole()
  renderApp()
  await loadPlayers()
  supabase.auth.onAuthStateChange(async (event, session) => {
    state.user = session?.user || null
    if (!state.user) { renderAuth() }
    else if (event === 'SIGNED_IN') { await fetchRole(); renderApp(); loadPlayers() }
  })
}

init()
