import { supabase } from './supabase.js'

const POSICOES = ['Guarda-Redes','Defesa Central','Lateral Dir.','Lateral Esq.','Médio Defensivo','Médio-Centro','Médio Ofensivo','Extremo Dir.','Extremo Esq.','Ponta de Lança']
const NIVEIS = ['A +','A','A/B','B +','B','B -','B/C']

let state = {
  user: null,
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
  panelOpen: false,
  formOpen: false,
}

// ── UTILS ──
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

function icon(name) {
  const icons = {
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
    players: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    empty: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>`,
  }
  return icons[name] || ''
}

// ── AUTH ──
function renderAuth() {
  document.getElementById('app').innerHTML = `
    <div class="auth-screen">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-mark">${icon('players')}</div>
          <div class="auth-title">Scout Department</div>
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

// ── MAIN APP ──
function applyFilters() {
  const q = state.search.toLowerCase().trim()
  const pos = state.filterPos
  const niv = state.filterNivel
  const ano = state.filterAno

  state.filtered = state.players.filter(p => {
    if (q) {
      const hay = [p.nome, p.clube, p.representante, p.instagram, p.referenciador, p.posicao].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (pos && p.posicao !== pos) return false
    if (niv && p.nivel !== niv) return false
    if (ano && String(p.ano) !== ano) return false
    return true
  })

  state.filtered.sort((a, b) => {
    let av = a[state.sortCol] ?? '', bv = b[state.sortCol] ?? ''
    if (!isNaN(av) && !isNaN(bv) && av !== '' && bv !== '') { av = +av; bv = +bv }
    return av < bv ? -state.sortDir : av > bv ? state.sortDir : 0
  })
}

function renderApp() {
  const anos = [...new Set(state.players.map(p => p.ano).filter(a => a && a > 0))].sort()

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-logo">${icon('players')}</div>
          <span class="topbar-title">Scout Department</span>
        </div>
        <div class="topbar-right">
          <button class="btn-add" id="btn-add">
            ${icon('plus')}
            <span>Novo Jogador</span>
          </button>
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
        <div class="stats-count">
          <strong>${state.filtered.length}</strong> de ${state.players.length} jogadores
        </div>
      </div>

      <div class="player-list" id="player-list">
        ${state.loading ? `<div class="loading"><div class="spinner"></div> A carregar...</div>` : renderPlayerList()}
      </div>
    </div>

    <div class="overlay" id="overlay"></div>

    <div class="side-panel" id="side-panel">
      <div id="panel-content"></div>
    </div>

    <div class="form-panel" id="form-panel">
      <div id="form-content"></div>
    </div>

    <div class="toast" id="toast"></div>
  `

  bindAppEvents()
}

function renderPlayerList() {
  if (!state.filtered.length) {
    return `
      <div class="empty-state">
        ${icon('empty')}
        <p>Nenhum jogador encontrado</p>
        <span>Tenta ajustar os filtros de pesquisa</span>
      </div>
    `
  }

  return state.filtered.map(p => `
    <div class="player-row" data-id="${p.id}">
      <div class="player-avatar">${initials(p.nome)}</div>
      <div class="player-info">
        <div class="player-name">${p.nome}</div>
        <div class="player-meta">${[p.posicao, p.clube].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="player-right">
        <span class="nivel-badge ${nivelClass(p.nivel)}">${p.nivel || '—'}</span>
        <span class="player-ano">${p.ano || '—'}</span>
      </div>
      <div class="chevron">${icon('chevron')}</div>
    </div>
  `).join('')
}

function bindAppEvents() {
  document.getElementById('search').addEventListener('input', e => {
    state.search = e.target.value
    applyFilters()
    document.getElementById('player-list').innerHTML = renderPlayerList()
    document.querySelector('.stats-count').innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  })

  document.getElementById('f-pos').addEventListener('change', e => {
    state.filterPos = e.target.value
    applyFilters()
    document.getElementById('player-list').innerHTML = renderPlayerList()
    bindRowEvents()
    document.querySelector('.stats-count').innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  })

  document.getElementById('f-nivel').addEventListener('change', e => {
    state.filterNivel = e.target.value
    applyFilters()
    document.getElementById('player-list').innerHTML = renderPlayerList()
    bindRowEvents()
    document.querySelector('.stats-count').innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  })

  document.getElementById('f-ano').addEventListener('change', e => {
    state.filterAno = e.target.value
    applyFilters()
    document.getElementById('player-list').innerHTML = renderPlayerList()
    bindRowEvents()
    document.querySelector('.stats-count').innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  })

  document.getElementById('btn-clear').addEventListener('click', () => {
    state.search = ''; state.filterPos = ''; state.filterNivel = ''; state.filterAno = ''
    document.getElementById('search').value = ''
    document.getElementById('f-pos').value = ''
    document.getElementById('f-nivel').value = ''
    document.getElementById('f-ano').value = ''
    applyFilters()
    document.getElementById('player-list').innerHTML = renderPlayerList()
    bindRowEvents()
    document.querySelector('.stats-count').innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  })

  document.getElementById('btn-add').addEventListener('click', () => openForm(null))

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut()
  })

  document.getElementById('overlay').addEventListener('click', closeAll)

  bindRowEvents()
}

function bindRowEvents() {
  document.querySelectorAll('.player-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id
      const player = state.players.find(p => p.id === id)
      if (player) openPanel(player)
    })
  })
}

// ── PANEL ──
function openPanel(player) {
  state.selectedPlayer = player
  const ig = (player.instagram || '').trim()
  const lk = player.link
  const vid = player.video

  document.getElementById('panel-content').innerHTML = `
    <div class="panel-header">
      <div>
        <div class="panel-header-title">${player.nome}</div>
        <div class="panel-header-sub">${[player.posicao, player.clube].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="panel-actions">
        <button class="btn-edit" id="panel-edit">Editar</button>
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
          <div class="info-row"><span class="info-label">Representante</span><span class="info-val">${player.representante || '<span class="muted">—</span>'}</span></div>
          <div class="info-row"><span class="info-label">Referenciador</span><span class="info-val">${player.referenciador || '<span class="muted">—</span>'}</span></div>
        </div>
      </div>
      <div>
        <div class="panel-section-title">Contactos & Links</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Telemóvel</span><span class="info-val">${player.telefone || '<span class="muted">—</span>'}</span></div>
          <div class="info-row"><span class="info-label">Instagram</span><span class="info-val">${ig ? `<a href="https://instagram.com/${ig}" target="_blank">@${ig}</a>` : '<span class="muted">—</span>'}</span></div>
          <div class="info-row"><span class="info-label">Link</span><span class="info-val">${lk ? `<a href="${lk}" target="_blank">Ver perfil</a>` : '<span class="muted">—</span>'}</span></div>
          <div class="info-row"><span class="info-label">Vídeo</span><span class="info-val">${vid ? `<a href="${vid}" target="_blank">Ver vídeo</a>` : '<span class="muted">—</span>'}</span></div>
        </div>
      </div>
      ${player.notas ? `
      <div>
        <div class="panel-section-title">Notas</div>
        <div class="notas-box">${player.notas}</div>
      </div>` : ''}
      <div>
        <button class="btn-delete" id="panel-delete" style="width:100%">Eliminar jogador</button>
      </div>
    </div>
  `

  document.getElementById('panel-close').addEventListener('click', closeAll)
  document.getElementById('panel-edit').addEventListener('click', () => { closePanel(); openForm(player) })
  document.getElementById('panel-delete').addEventListener('click', () => deletePlayer(player))

  document.getElementById('overlay').classList.add('open')
  document.getElementById('side-panel').classList.add('open')
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open')
}

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
          <input class="form-input" id="f-nome" type="text" value="${p.nome || ''}" placeholder="Nome completo" required />
        </div>
        <div class="form-group" style="max-width:100px">
          <label class="form-label">Nº Proc.</label>
          <input class="form-input" id="f-processo" type="text" value="${p.processo || ''}" placeholder="Ex: 7" />
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
        <div class="form-group" style="max-width:100px">
          <label class="form-label">Ano Nasc.</label>
          <input class="form-input" id="f-ano-form" type="number" value="${p.ano || ''}" placeholder="2005" min="1990" max="2015" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Representante</label>
        <input class="form-input" id="f-representante" type="text" value="${p.representante || ''}" placeholder="Nome do representante / agência" />
      </div>
      <div class="form-group">
        <label class="form-label">Referenciador</label>
        <input class="form-input" id="f-referenciador" type="text" value="${p.referenciador || ''}" placeholder="Quem referenciou" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Telemóvel</label>
          <input class="form-input" id="f-telefone" type="tel" value="${p.telefone || ''}" placeholder="+351 900 000 000" />
        </div>
        <div class="form-group">
          <label class="form-label">Instagram</label>
          <input class="form-input" id="f-instagram" type="text" value="${p.instagram || ''}" placeholder="@username" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Link (perfil / agente)</label>
        <input class="form-input" id="f-link" type="url" value="${p.link || ''}" placeholder="https://" />
      </div>
      <div class="form-group">
        <label class="form-label">Vídeo</label>
        <input class="form-input" id="f-video" type="url" value="${p.video || ''}" placeholder="https://youtube.com/..." />
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="f-notas" placeholder="Observações sobre o jogador...">${p.notas || ''}</textarea>
      </div>
    </div>
    <div class="form-footer">
      <button class="btn-cancel" id="form-cancel">Cancelar</button>
      <button class="btn-save" id="form-save">${isEdit ? 'Guardar alterações' : 'Adicionar jogador'}</button>
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
    showToast('Erro ao guardar. Tenta novamente.', 'error')
    btn.disabled = false
    btn.textContent = state.editingPlayer ? 'Guardar alterações' : 'Adicionar jogador'
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

// ── DATA ──
async function loadPlayers() {
  const { data, error } = await supabase.from('players').select('*').order('nome')
  if (error) { showToast('Erro ao carregar dados.', 'error'); return }
  state.players = data || []
  state.loading = false
  applyFilters()

  const list = document.getElementById('player-list')
  if (list) {
    list.innerHTML = renderPlayerList()
    bindRowEvents()
  }

  const statsEl = document.querySelector('.stats-count')
  if (statsEl) {
    statsEl.innerHTML = `<strong>${state.filtered.length}</strong> de ${state.players.length} jogadores`
  }
}

// ── INIT ──
async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  state.user = session?.user || null

  if (!state.user) {
    renderAuth()
    return
  }

  renderApp()
  await loadPlayers()

  supabase.auth.onAuthStateChange((event, session) => {
    state.user = session?.user || null
    if (!state.user) {
      renderAuth()
    } else if (event === 'SIGNED_IN') {
      renderApp()
      loadPlayers()
    }
  })
}

init()
