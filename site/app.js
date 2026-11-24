/* Nathan Silva — conceito 3D
   Lê o conteúdo real do site (classico.html) e monta a página.
   DOM criado com createElement/textContent (sem HTML vindo de string). */

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs = {}, ...filhos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat()) if (f != null && f !== false) n.append(f);
    return n;
  }
  function svgEl(d, viewBox = '0 0 24 24') {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', viewBox); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.append(p);
    return s;
  }
  const urlSegura = (u) => {
    if (!u) return null;
    try {
      const url = new URL(u, document.baseURI);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };

  const AREAS = [
    ['teatro', 'Teatro', 'var(--coral)'],
    ['audiovisual', 'Cinema', 'var(--ouro)'],
    ['sonoplastia', 'Sonoplastia', 'var(--ciano)'],
    ['dublagem', 'Dublagem', 'var(--lilas)'],
    ['formacao', 'Formação', 'var(--verde)'],
  ];
  const corDe = (t) => (AREAS.find(([k]) => k === t) || AREAS[0])[2];

  /* ============ Menu lateral ============ */
  const menu = $('#menu'), alternar = $('#menu-alternar'), veu = $('#menu-veu');
  const ehCelular = () => matchMedia('(max-width: 760px)').matches;
  function abrirMenu(abrir) {
    menu.classList.toggle('is-aberto', abrir);
    alternar.setAttribute('aria-expanded', String(abrir));
    veu.hidden = !abrir;
  }
  alternar.addEventListener('click', () => abrirMenu(!menu.classList.contains('is-aberto')));
  veu.addEventListener('click', () => abrirMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-aberto')) { abrirMenu(false); alternar.focus(); } });
  $$('.menu__nav a, .menu__marca').forEach((a) => a.addEventListener('click', () => { if (ehCelular() || menu.classList.contains('is-aberto')) abrirMenu(false); }));

  // seção atual destacada no menu
  const links = $$('.menu__nav a');
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => {
        const atual = a.dataset.secao === e.target.id;
        a.classList.toggle('is-atual', atual);
        if (atual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach((s) => io.observe(s));

  /* ============ Leitura do conteúdo ============ */
  async function carregar() {
    const resp = await fetch('classico.html', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('Não consegui ler classico.html');
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let works = {};
    const m = html.match(/const works = (\{[\s\S]*?\n {4}\});/);
    if (m) {
      // seguranca-ok: avalia só o literal do nosso próprio classico.html (mesma origem, versionado);
      // nenhum dado de usuário. Se o conceito for adotado, mover para works.json + JSON.parse.
      try { works = Function('"use strict"; return (' + m[1] + ');')(); } catch (e) { console.warn(e); }
    }
    return { doc, works };
  }

  /* ============ Curtas (cartões 3D) ============ */
  function montarCurtas(doc) {
    const alvo = $('#curtas-lista');
    $$('.curtas__item', doc).forEach((item) => {
      const frame = $('.curtas__frame', item);
      const id = frame?.dataset.video;
      if (!id || !/^[\w-]{6,20}$/.test(id)) return;
      const inicio = parseInt(frame.dataset.start || '0', 10) || 0;
      const titulo = txt($('.curtas__title', item));
      const ano = txt($('.curtas__year', item)?.firstChild);

      const img = h('img', { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: '', loading: 'lazy', width: 1280, height: 720 });
      const grande = new Image();
      grande.onload = () => { if (grande.naturalWidth >= 1280) img.src = grande.src; };
      grande.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

      const tela = h('button', { type: 'button', class: 'curta__tela', 'aria-label': `Assistir ao curta ${titulo}` },
        img, h('span', { class: 'curta__play', 'aria-hidden': 'true' }, svgEl('M6 4l14 8-14 8z')));
      tela.addEventListener('click', () => {
        const iframe = h('iframe', {
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&start=${inicio}`,
          title: titulo, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true,
        });
        const div = h('div', { class: 'curta__tela' }, iframe);
        tela.replaceWith(div);
      }, { once: true });

      const card = h('article', { class: 'curta' },
        tela,
        h('div', { class: 'curta__info' },
          h('span', { class: 'curta__selo', text: `★ Premiado · ${ano}` }),
          h('h3', { class: 'curta__titulo', text: titulo }),
          h('p', { class: 'curta__premio', text: txt($('.curtas__tagline', item)) }),
          h('p', { class: 'curta__sinopse', text: txt($('.curtas__synopsis', item)) }),
          h('p', { class: 'curta__meta', text: txt($('.curtas__meta', item)) })));
      inclinar(card, 8);
      alvo.append(card);
    });
  }

  // inclinação 3D seguindo o ponteiro
  function inclinar(el, max) {
    if (reduz) return;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('is-mexendo');
      el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-mexendo');
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  }

  /* ============ Carrossel 3D ============ */
  const GRADS = [
    'linear-gradient(140deg, #ff5d4a, #7a1f4f)',
    'linear-gradient(140deg, #6fe3ff, #24307a)',
    'linear-gradient(140deg, #ffc65c, #b0402a)',
    'linear-gradient(140deg, #b69cff, #2c1f6b)',
    'linear-gradient(140deg, #5fe0b0, #134a4f)',
  ];
  const anoMax = (s) => Math.max(0, ...(String(s).match(/\d{2,4}/g) || []).map((n) => (n.length === 2 ? 2000 + +n : +n)));

  const car = { itens: [], i: 0, passo: 0 };
  function montarCarrossel(doc, works) {
    const anel = $('#carrossel-anel');
    car.itens = $$('.destaques__card', doc).map((c) => {
      const slug = c.dataset.work;
      const foto = $('.destaques__photo', c)?.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      return {
        slug, work: works[slug] || {},
        ano: txt($('.destaques__year', c)), titulo: txt($('.destaques__title', c)), meta: txt($('.destaques__meta', c)),
        premiado: !!$('.destaques__badge', c),
        foto: urlSegura(foto || works[slug]?.photo || ''),
      };
    }).sort((a, b) => anoMax(b.ano) - anoMax(a.ano));
    // a foto de cena abre a roda
    car.itens.unshift({
      eu: true, titulo: 'Nathan Silva', ano: 'Em cena desde 2012', meta: 'Ator · Diretor · Dublador · Sonoplasta',
      foto: new URL('site/img/palco.webp', document.baseURI).href,
    });

    const n = car.itens.length;
    car.passo = 360 / n;
    car.itens.forEach((it, k) => {
      const b = h('button', {
        type: 'button', class: 'obra' + (it.eu ? ' obra--eu' : ''), style: `--ang:${k * car.passo}deg;--grad:${GRADS[k % GRADS.length]}`,
        'aria-label': it.eu ? 'Nathan Silva em cena. Ver trajetória' : `${it.titulo}, ${it.ano}${it.premiado ? ', premiado' : ''}. Abrir ficha`,
      },
        it.foto ? h('img', { class: 'obra__img' + (/cartaz/.test(it.foto) ? ' obra__img--contain' : ''), src: it.foto, alt: '', loading: 'lazy', draggable: 'false' })
          : h('span', { class: 'obra__fundo', 'aria-hidden': 'true' }, h('span', { class: 'obra__grande', text: String(anoMax(it.ano)).slice(2) })),
        it.premiado ? h('span', { class: 'obra__premio', text: '★ Premiado' }) : null,
        h('span', { class: 'obra__texto' },
          h('span', { class: 'obra__ano', text: it.ano }),
          h('span', { class: 'obra__titulo', text: it.titulo }),
          h('span', { class: 'obra__meta', text: it.meta })));
      b.addEventListener('click', () => {
        if (car.arrastou) return;
        if (k === indiceReal()) { if (it.eu) $('#trajetoria').scrollIntoView(); else abrirFicha(it); }
        else irPara(k);
      });
      it.el = b;
      anel.append(b);
    });
    medirRaio();
    addEventListener('resize', medirRaio);
    irPara(0, true);
    ligarArraste();
    $('#car-ant').addEventListener('click', () => { car.mexeuEm = Date.now(); girar(-1); });
    $('#car-prox').addEventListener('click', () => { car.mexeuEm = Date.now(); girar(1); });
    $('#carrossel').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); girar(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); girar(1); }
    });
    autoGiro();
  }
  function medirRaio() {
    const w = parseFloat(getComputedStyle($('#carrossel')).getPropertyValue('--card-w')) || 300;
    const n = car.itens.length || 1;
    const raio = Math.round((w / 2) / Math.tan(Math.PI / n)) + 40;
    $('#carrossel').style.setProperty('--raio', raio + 'px');
  }
  const indiceReal = () => ((car.i % car.itens.length) + car.itens.length) % car.itens.length;
  function aplicarGiro(semAnimar) {
    const anel = $('#carrossel-anel');
    anel.classList.toggle('sem-transicao', !!semAnimar);
    anel.style.setProperty('--giro', `${-car.i * car.passo}deg`);
    const k = indiceReal();
    car.itens.forEach((it, j) => {
      it.el.classList.toggle('is-frente', j === k);
      it.el.tabIndex = j === k ? 0 : -1;
    });
    const it = car.itens[k];
    $('#car-atual').textContent = `${String(k + 1).padStart(2, '0')} / ${car.itens.length} · ${it.titulo}`;
  }
  function girar(d) { car.i += d; aplicarGiro(); }
  function irPara(k, semAnimar) {
    // vai pelo caminho mais curto
    const n = car.itens.length, atual = indiceReal();
    let d = k - atual;
    if (d > n / 2) d -= n; if (d < -n / 2) d += n;
    car.i += d; aplicarGiro(semAnimar);
  }
  function ligarArraste() {
    const palco = $('#carrossel-palco');
    let x0 = null, i0 = 0;
    palco.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; i0 = car.i; car.arrastou = false; car.mexeuEm = Date.now();
    });
    addEventListener('pointermove', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) { car.arrastou = true; palco.classList.add('is-arrastando'); }
      if (!car.arrastou) return;
      const fr = -dx / 160;                 // 160px de arraste = 1 cartão
      $('#carrossel-anel').classList.add('sem-transicao');
      $('#carrossel-anel').style.setProperty('--giro', `${-(i0 + fr) * car.passo}deg`);
    });
    addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      palco.classList.remove('is-arrastando');
      if (car.arrastou) { car.i = Math.round(i0 - dx / 160); aplicarGiro(); }
      x0 = null;
      setTimeout(() => { car.arrastou = false; }, 0);
    });
  }
  function autoGiro() {
    const sec = $('#carrossel');
    const pausa = $('#car-pausa');
    pausa.addEventListener('click', () => {
      const p = pausa.getAttribute('aria-pressed') !== 'true';
      pausa.setAttribute('aria-pressed', String(p));
      pausa.setAttribute('aria-label', p ? 'Voltar a girar a roda' : 'Pausar a roda');
    });
    let sobre = false, visivel = false;
    sec.addEventListener('pointerenter', () => { sobre = true; });
    sec.addEventListener('pointerleave', () => { sobre = false; });
    sec.addEventListener('focusin', () => { car.mexeuEm = Date.now(); });
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(sec);
    // troca a cada 2,5 s; pausa com o mouse em cima e por 6 s depois de mexer
    setInterval(() => {
      const mexeuAgora = Date.now() - (car.mexeuEm || 0) < 6000;
      const pausada = pausa.getAttribute('aria-pressed') === 'true';
      if (visivel && !sobre && !mexeuAgora && !pausada && !document.hidden && !$('#ficha').open) girar(1);
    }, 2500);
  }

  /* ============ Ficha (dialog) ============ */
  const ficha = $('#ficha');
  function abrirFicha(it) {
    const w = it.work || {};
    const foto = urlSegura(w.photo || it.foto || '');
    $('#ficha-capa').hidden = !foto;
    if (foto) $('#ficha-img').src = foto;
    $('#ficha-ano').textContent = w.year || it.ano;
    $('#ficha-titulo').textContent = w.title || it.titulo;
    $('#ficha-linha').textContent = w.tagline || it.meta;
    $('#ficha-sinopse').textContent = w.synopsis || '';
    $('#ficha-creditos').replaceChildren(...(w.credits || []).flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]));
    $('#ficha-links').replaceChildren(...(w.links || []).filter((l) => urlSegura(l.url)).map((l) =>
      h('li', {}, h('a', { href: urlSegura(l.url), target: '_blank', rel: 'noopener', text: l.label + ' ↗' }))));
    ficha.showModal();
    ficha.scrollTop = 0;
  }
  $('#ficha-fechar').addEventListener('click', () => ficha.close());
  ficha.addEventListener('click', (e) => { if (e.target === ficha) ficha.close(); });

  /* ============ Trajetória (um ano por vez) ============ */
  function montarTrajetoria(doc) {
    const bio = $('.hero__bio', doc);
    if (bio) $('#trajetoria-bio').textContent = txt(bio);

    const alvo = $('#anos'), linha = $('#linha-anos');
    const anos = [];
    $$('.chapter', doc).forEach((cap, idx) => {
      const ano = txt($('.chapter__year', cap));
      const itens = $$('.work', cap).map((w) => {
        const tEl = $('.work__title', w).cloneNode(true);
        $$('.badge', tEl).forEach((b) => b.remove());
        const tipo = w.dataset.type || 'teatro';
        const fontes = $$('.work__sources a', w).map((a) => ({ t: txt(a), u: urlSegura(a.getAttribute('href')) })).filter((f) => f.u);
        return h('li', { class: 'trab', 'data-tipo': tipo, style: `--cor:${corDe(tipo)}` },
          h('h4', { class: 'trab__titulo' }, txt(tEl), w.classList.contains('work--premiado') ? h('span', { class: 'trab__premio', text: '★ Premiado' }) : null),
          h('p', { class: 'trab__funcao', text: txt($('.work__meta', w)) }),
          $('.work__extra', w) ? h('p', { class: 'trab__extra', text: txt($('.work__extra', w)) }) : null,
          fontes.length ? h('ul', { class: 'trab__fontes' }, fontes.map((f) => h('li', {}, h('a', { href: f.u, target: '_blank', rel: 'noopener', text: f.t })))) : null);
      });
      const id = 'ano-' + idx;
      const painel = h('section', { class: 'ano', id, role: 'tabpanel', 'aria-label': ano, hidden: true },
        h('h3', { class: 'ano__num', text: ano }),
        h('ul', { class: 'ano__lista' }, itens));
      const aba = h('button', { type: 'button', class: 'ano-aba', role: 'tab', 'aria-controls': id, 'aria-selected': 'false', tabindex: '-1' },
        ano.replace(/\s*—\s*/, '–').replace(/–(\d{2})(\d{2})$/, '–$2'), h('small'));
      aba.addEventListener('click', () => escolher(anos.indexOf(reg)));
      const reg = { aba, painel, itens };
      anos.push(reg);
      linha.append(aba);
      alvo.append(painel);
    });

    let atual = -1;
    function escolher(i, semAnimar) {
      if (i < 0 || !anos[i] || anos[i].aba.disabled) return;
      anos.forEach((a, j) => {
        const sel = j === i;
        a.aba.setAttribute('aria-selected', String(sel));
        a.aba.tabIndex = sel ? 0 : -1;
        a.painel.hidden = !sel;
      });
      atual = i;
      // rola só a barra de anos (na horizontal), nunca a página
      const aba = anos[i].aba;
      linha.scrollTo({ left: aba.offsetLeft - linha.clientWidth / 2 + aba.offsetWidth / 2, behavior: reduz ? 'auto' : 'smooth' });
      if (semAnimar || reduz) return;
      // entrada 3D em cascata
      const vis = anos[i].itens.filter((t) => !t.hidden);
      vis.forEach((t) => { t.style.transitionDelay = '0ms'; t.classList.add('vai-entrar'); });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        vis.forEach((t, k) => { t.style.transitionDelay = `${Math.min(k, 8) * 60}ms`; t.classList.remove('vai-entrar'); });
      }));
    }
    linha.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      let j = atual;
      do { j += dir; } while (anos[j] && anos[j].aba.disabled);
      if (anos[j]) { escolher(j); anos[j].aba.focus(); }
    });

    // filtros por área
    const todos = anos.flatMap((a) => a.itens);
    $('[data-contar="30"]').textContent = String(todos.length);
    const ativos = new Set();
    const filtros = $('#filtros');
    const bTodos = h('button', { type: 'button', class: 'filtro', 'aria-pressed': 'true', style: '--cor:var(--texto)' }, 'Tudo ', h('small', { text: String(todos.length) }));
    filtros.append(bTodos);
    const botoes = [];
    AREAS.forEach(([k, nome, cor]) => {
      const q = todos.filter((t) => t.dataset.tipo === k).length;
      if (!q) return;
      const b = h('button', { type: 'button', class: 'filtro', 'aria-pressed': 'false', style: `--cor:${cor}` }, nome + ' ', h('small', { text: String(q) }));
      b.addEventListener('click', () => {
        ativos.has(k) ? ativos.delete(k) : ativos.add(k);
        b.setAttribute('aria-pressed', String(ativos.has(k)));
        aplicar();
      });
      botoes.push(b);
      filtros.append(b);
    });
    bTodos.addEventListener('click', () => { ativos.clear(); botoes.forEach((b) => b.setAttribute('aria-pressed', 'false')); aplicar(); });
    function aplicar() {
      bTodos.setAttribute('aria-pressed', String(!ativos.size));
      todos.forEach((t) => { t.hidden = ativos.size > 0 && !ativos.has(t.dataset.tipo); });
      anos.forEach((a) => {
        const n = a.itens.filter((t) => !t.hidden).length;
        a.aba.disabled = n === 0;
        a.aba.querySelector('small').textContent = n === 1 ? '1 trabalho' : `${n} trabalhos`;
      });
      // se o ano aberto ficou vazio, pula para o primeiro com trabalhos
      if (atual < 0 || anos[atual].aba.disabled) escolher(anos.findIndex((a) => !a.aba.disabled), atual < 0);
      else escolher(atual);
    }
    aplicar();
  }

  /* ============ Contato ============ */
  const cartao = $('#cartao'), virar = $('#cartao-virar');
  virar.addEventListener('click', () => {
    $('#cartao-giro').style.transform = '';
    const v = !cartao.classList.contains('is-virado');
    cartao.classList.toggle('is-virado', v);
    virar.setAttribute('aria-pressed', String(v));
    virar.textContent = v ? 'Ver a frente' : 'Virar o cartão';
  });
  const giro = $('#cartao-giro');
  if (!reduz) {
    cartao.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || cartao.classList.contains('is-virado')) return;
      const r = giro.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      giro.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`;
    });
    cartao.addEventListener('pointerleave', () => { giro.style.transform = ''; });
  }

  /* ============ Início ============ */
  carregar().then(({ doc, works }) => {
    montarCurtas(doc);
    montarCarrossel(doc, works);
    montarTrajetoria(doc);
  }).catch((e) => {
    console.error(e);
    $('#anos').append(h('p', { text: 'Não foi possível carregar os trabalhos. Abra pelo servidor local: http://localhost:5173/conceito-3d/' }));
  });
})();
