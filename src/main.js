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
    instagram: `<img src="data:image/png;base64,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" style="width:24px;height:24px;object-fit:contain;border-radius:6px;" />`,
    youtube: `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAET0lEQVR42tWaz2tUVxTHP/e+l8yYcbSTlpKkXTRQaAulUMhKSgVpVl250K60/voPdJmdG0G37hRFV2bTipuCIKaUWWmR7iqI0NY0to2jpmpm8t67XZxzZ55DRlLnvnHmwGEyMy93vt97z6977zHkxIEx4Lo+2wFMAzOqU8A7wNvATqAKbAPKQAkYAyJVHQIHpEACbADrwAvVp8Aa0AAeAX8DD1VXgL8MZB4fQB6j6QavD+0FvgI+Az5QsGUGKynwBFgGfgEWDVzddKIdWH2ddrDkhEi3Zg5SB0mXpj0069LNnkl6jJf1wPCdg4oD61cDB0Y/mHDwsz7YcrChA2avGLBozU9aSz+76jF7ApG+ntIHmm8I7FbUY/tWMcdG/3gXuAdMqF8YhlNSZObvAp8CqdUvvga2a7QYVvBoZHPAR8CcAecJfJkLd8MumeL8ArwjwIdDbjrdYoBPQKLPuCYqRoSAxzjrV2BSddQITDuIPIHtYYY2gyQwCey0WiaMBVkB5yCKBrUSVWDS5swn63vIUgnStGgSfpLLQM0Ctf6jswI+fRoOHeqQKM6kfL56y2pJTF85wAOt1eDCBTh+XEgAWFsUATyBarBhm03xgzNn4Nw5iGPIsiJNaocNFoH8bBsD6+tw9Chcvw5TU7IacVzEClStFnBhJY4hSWD3bqjXYW5O3oclAbDNFrbTimOZ+dlZuHkT9u8XEmGde8IipURBtWMkPlCpwJUrsLAgpJwL5dxjxRLwfuGcAD95Ei5dknwRxrnHbe70oMDUYwRsksCBA3DjBszMCKn+zCmyuZK6ePHOvWsX3L4tTt5frjCDA1/UnASpgbYqPpTW67BvHywviwllrw0htQMh4J04juHyZdizR8BHkXzXxybf6lFfgTvYrOPECwtw8KCUHNZ26qXXl1ZcKAFflT57BkeOwOJiJzdkQRa+GesBa3H2fv++ZOFbtzpRKJw8t4UQ8OCXliRkFgO+TeDfoPbuHJTLcP48zM/DykoniYXfla1Z5Gw+jJRK4rAnTsCxYwI6jLP2krUYeNz3ht6HwkYDDh+GixdDO2uvFXiMg7164pv2fXpcKslrFA3ipDp18LkFVn3dGGRLGUVFmkx+N/YCaFjgn1wu6O9w15iiwb9k/8ATi1yshYlEbiCH2/5HGsBTb0KrQVZgMOIxPjSQWiPm82AECfyed9y7jM4Fhyfxa57Aj4zOBYdVnD+1E4KTm/d7esg1zER8VvwN+BhoWQeRkVB6VtltDPHsJ4rxlIEmEOUvuisO7nRddKdDctG9kbvo/kHx2rxH+FaD9xzU/2erQbKFNoNXtRxsNl6vCbvmoKqTbl4q4BxYI/8YAd8A88hl8vvIJcj4G7D3R2rvd4BrBr5XrO1mD9MVmzZrt6khLTbTyI3+FHItNUmn3aaCtNyUVGO11Uh/I8vZcAK0kJab56oNpDNlFWmz+RP4A3hg5H0bn4JuY/wP4QY46Zd/xIUAAAAASUVORK5CYII=" style="width:28px;height:20px;object-fit:contain;" />`,
    vimeo: `<img src="data:image/png;base64,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" style="width:24px;height:24px;object-fit:contain;border-radius:6px;" />`,
    transfermarkt: `<img src="data:image/png;base64,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" style="height:28px;width:auto;object-fit:contain;" />`,
    zerozero: `<img src="data:image/png;base64,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" style="width:24px;height:24px;object-fit:contain;border-radius:50%;" />`,
  }
  return icons[name] || ''
}


// ── WEBAUTHN ──
const WA_KEY = 'wa_credential_id'

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64ToBuffer(base64) {
  const b64 = base64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer
}

function isWebAuthnSupported() {
  return window.PublicKeyCredential !== undefined
}

async function isBiometricAvailable() {
  if (!isWebAuthnSupported()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

async function registerBiometric(userEmail) {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userId = new TextEncoder().encode(userEmail)
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Base de Dados — All In Sports', id: location.hostname },
        user: { id: userId, name: userEmail, displayName: userEmail },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      }
    })
    if (credential) {
      localStorage.setItem(WA_KEY, bufferToBase64(credential.rawId))
      localStorage.setItem('wa_email', userEmail)
      return true
    }
  } catch (e) { console.log('WebAuthn register error:', e) }
  return false
}

async function authenticateBiometric() {
  const credId = localStorage.getItem(WA_KEY)
  if (!credId) return null
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: base64ToBuffer(credId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      }
    })
    return credential ? localStorage.getItem('wa_email') : null
  } catch (e) { console.log('WebAuthn auth error:', e); return null }
}

// ── AUTH ──
function renderAuth() {
  const hasBiometric = localStorage.getItem(WA_KEY)
  const bioEmail = localStorage.getItem('wa_email')

  document.getElementById('app').innerHTML = `
    <div class="auth-screen">
      <div class="auth-card">
        <div class="auth-logo">
          <img src="${LOGO}" class="auth-logo-img" />
          <div class="auth-title">Base de Dados</div>
          <div class="auth-sub">All In Sports Group</div>
        </div>
        ${hasBiometric ? `
        <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px;">
          <button class="btn-primary" id="btn-biometric" style="display:flex;align-items:center;justify-content:center;gap:10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 8 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>
            Entrar com impressão digital
          </button>
          <div style="text-align:center;font-size:12px;color:var(--text-3);">ou</div>
        </div>` : ''}
        <form class="auth-form" id="auth-form" style="${hasBiometric ? 'margin-top:0' : ''}">
          <div>
            <label class="field-label">Email</label>
            <input class="field-input" type="email" id="auth-email" placeholder="email@allinsportsgroup.com" autocomplete="email" value="${bioEmail || ''}" required />
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

  // Biometric button handler
  const bioBtn = document.getElementById('btn-biometric')
  if (bioBtn) {
    bioBtn.addEventListener('click', async () => {
      bioBtn.disabled = true
      bioBtn.textContent = 'A verificar...'
      const email = await authenticateBiometric()
      if (email) {
        // Re-authenticate with stored session or prompt password once
        const errEl = document.getElementById('auth-error')
        errEl.textContent = 'Biometria confirmada! Introduz a password uma última vez para reativar a sessão.'
        errEl.style.display = 'block'
        errEl.style.background = 'var(--green-bg)'
        errEl.style.borderColor = 'var(--green)'
        errEl.style.color = 'var(--green)'
        document.getElementById('auth-email').value = email
        document.getElementById('auth-password').focus()
      } else {
        bioBtn.disabled = false
        bioBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 8 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg> Entrar com impressão digital`
      }
    })
  }
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
    if (state.filterAno && parseInt(p.ano) !== parseInt(state.filterAno)) return false
    return true
  })
  const NIVEL_ORDER = ['A +','A','A/B','B +','B','B -','B/C']
  state.filtered.sort((a, b) => {
    let av = a[state.sortCol] ?? '', bv = b[state.sortCol] ?? ''
    if (state.sortCol === 'nivel') {
      const ai = NIVEL_ORDER.indexOf(av), bi = NIVEL_ORDER.indexOf(bv)
      const an = ai === -1 ? 99 : ai, bn = bi === -1 ? 99 : bi
      return an < bn ? -state.sortDir : an > bn ? state.sortDir : 0
    }
    if (state.sortCol === 'posicao') {
      const POSICAO_ORDER = ['Guarda-Redes','Defesa Central','Lateral Dir.','Lateral Esq.','Médio Defensivo','Médio-Centro','Médio Ofensivo','Extremo Dir.','Extremo Esq.','Ponta de Lança']
      const ai = POSICAO_ORDER.indexOf(av), bi = POSICAO_ORDER.indexOf(bv)
      const an = ai === -1 ? 99 : ai, bn = bi === -1 ? 99 : bi
      return an < bn ? -state.sortDir : an > bn ? state.sortDir : 0
    }
    if (!isNaN(av) && !isNaN(bv) && av !== '' && bv !== '') { av = +av; bv = +bv }
    return av < bv ? -state.sortDir : av > bv ? state.sortDir : 0
  })
}

// ── RENDER APP ──
function renderApp() {
  const anos = [...new Set(state.players.map(p => parseInt(p.ano)).filter(a => a && a > 0))].sort((a,b) => a - b)
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-logo"><img src="${LOGO}" style="width:30px;height:30px;object-fit:cover;" /></div>
          <span class="topbar-title">Base de Dados</span>
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
          ${anos.map(a => `<option value="${String(a)}" ${String(state.filterAno)===String(a)?'selected':''}>${a}</option>`).join('')}
        </select>
        <button class="btn-clear-filters" id="btn-clear">Limpar</button>
      </div>

      <div class="stats-bar">
        <div class="stats-count" id="stats-count"><strong>${state.filtered.length}</strong> de ${state.players.length} jogadores</div>
        <div class="sort-controls">
          <select class="sort-select" id="sort-col">
            <option value="nome">Nome</option>
            <option value="ano">Ano</option>
            <option value="clube">Clube</option>
            <option value="nivel">Nível</option>
            <option value="posicao">Posição</option>
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
      <div class="player-avatar">${p.foto ? `<img src="${p.foto}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;" onerror="this.parentElement.textContent='${initials(p.nome)}'" />` : initials(p.nome)}</div>
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
  document.getElementById('f-ano').addEventListener('change', e => { state.filterAno = e.target.value ? parseInt(e.target.value) : ''; updateList() })
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
  document.getElementById('btn-logout').addEventListener('click', async () => {
    resetState()
    await supabase.auth.signOut()
  })
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
  if (lk && (lk.includes('zerozero') || lk.includes('ogol'))) linkIcon = icon('zerozero')
  let linkLabel = 'Ver perfil'

  document.getElementById('panel-content').innerHTML = `
    <div class="panel-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="panel-avatar-large">${player.foto ? `<img src="${player.foto}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'" />` : initials(player.nome)}</div>
        <div>
          <div class="panel-header-title">${player.nome}</div>
          <div class="panel-header-sub">${[player.posicao, player.clube].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div class="panel-actions">
        ${state.role === 'admin' ? `<button class="btn-edit" id="panel-edit">Editar</button>` : ''}
        <button class="btn-back" id="panel-back" title="Voltar à lista">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
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
              ${lk ? `<a href="${lk}" target="_blank" style="display:inline-flex;align-items:center;">${linkIcon}</a>` : '<span style="color:var(--text-3)">—</span>'}
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
  document.getElementById('panel-back').addEventListener('click', closeAll)
  const btnEdit = document.getElementById('panel-edit'); if (btnEdit) btnEdit.addEventListener('click', () => { closePanel(); openForm(player) })
  const btnDel = document.getElementById('panel-delete'); if (btnDel) btnDel.addEventListener('click', () => deletePlayer(player))
  document.getElementById('overlay').classList.add('open')
  document.getElementById('side-panel').classList.add('open')
  history.pushState(null, '', location.href)
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
        <label class="form-label">Foto</label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${p.foto ? `<img id="foto-preview" src="${p.foto}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" />` : `<div id="foto-preview" style="width:64px;height:64px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-2);">Sem foto</div>`}
          <input class="form-input" id="f-foto" type="url" value="${p.foto || ''}" placeholder="URL da imagem (https://...)" />
          <label style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px dashed var(--border-2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;color:var(--text-2);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Escolher ficheiro local
            <input type="file" id="f-foto-file" accept="image/*" style="display:none;" />
          </label>
        </div>
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
  const fileInput = document.getElementById('f-foto-file')
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        const preview = document.getElementById('foto-preview')
        if (preview) {
          preview.outerHTML = `<img id="foto-preview" src="${ev.target.result}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" />`
        }
        document.getElementById('f-foto').value = ''
      }
      reader.readAsDataURL(file)
    })
  }
}

// ── CRUD ──
async function savePlayer() {
  const nome = document.getElementById('f-nome').value.trim()
  if (!nome) { showToast('O nome é obrigatório', 'error'); return }
  const btn = document.getElementById('form-save')
  btn.disabled = true
  btn.textContent = 'A guardar...'

  // Handle local file upload
  const fileInput = document.getElementById('f-foto-file')
  let fotoUrl = document.getElementById('f-foto').value.trim() || null
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0]
    fotoUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }

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
    foto: fotoUrl,
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

function resetState() {
  state.search = ''
  state.filterPos = ''
  state.filterNivel = ''
  state.filterAno = ''
  state.sortCol = 'nome'
  state.sortDir = 1
  state.selectedPlayer = null
  state.editingPlayer = null
  state.players = []
  state.filtered = []
  state.loading = true
}

// Intercept Android back button
window.addEventListener('popstate', () => {
  const panel = document.getElementById('side-panel')
  const form = document.getElementById('form-panel')
  const overlay = document.getElementById('overlay')
  if (form && form.classList.contains('open')) {
    form.classList.remove('open')
    if (panel && !panel.classList.contains('open')) overlay && overlay.classList.remove('open')
    history.pushState(null, '', location.href)
  } else if (panel && panel.classList.contains('open')) {
    closeAll()
    history.pushState(null, '', location.href)
  }
})

async function offerBiometricSetup(email) {
  if (!localStorage.getItem(WA_KEY) && await isBiometricAvailable()) {
    setTimeout(async () => {
      const toast = document.getElementById('toast')
      if (!toast) return
      toast.innerHTML = `
        <span>Ativar impressão digital?</span>
        <button onclick="setupBiometric('${email}')" style="margin-left:12px;padding:4px 10px;background:white;color:#16a34a;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Ativar</button>
        <button onclick="document.getElementById('toast').classList.remove('show')" style="margin-left:6px;padding:4px 10px;background:transparent;color:white;border:1px solid rgba(255,255,255,0.4);border-radius:4px;cursor:pointer;font-size:13px;">Agora não</button>
      `
      toast.className = 'toast success show'
      toast.style.whiteSpace = 'normal'
      toast.style.textAlign = 'center'
    }, 1500)
  }
}

window.setupBiometric = async function(email) {
  const toast = document.getElementById('toast')
  toast.classList.remove('show')
  const ok = await registerBiometric(email)
  setTimeout(() => {
    showToast(ok ? 'Impressão digital ativada! ✓' : 'Não foi possível ativar.', ok ? 'success' : 'error')
  }, 300)
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
    if (!state.user) { resetState(); renderAuth() }
    else if (event === 'SIGNED_IN') {
      await fetchRole()
      renderApp()
      loadPlayers()
      if (session?.user?.email) offerBiometricSetup(session.user.email)
    }
  })
}

init()
