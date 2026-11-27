/* Dados para os PDFs (currículo e portfólio).
   Lê o conteúdo real do site (classico.html) para os PDFs nunca ficarem desatualizados.
   Monta o DOM só com createElement/textContent e valida URLs. */
(function () {
  'use strict';

  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  function urlSegura(u) {
    if (!u) return null;
    try {
      const url = new URL(u, document.baseURI);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  // cria elemento: h('p', {class:'x', text:'...'}, filhos...)
  function h(tag, attrs, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'href' || k === 'src') { const s = urlSegura(v); if (s) el.setAttribute(k, s); }
      else el.setAttribute(k, v);
    }
    for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
    return el;
  }

  const anoMax = (s) => Math.max(0, ...(String(s).match(/\d{2,4}/g) || []).map((n) => (n.length === 2 ? 2000 + +n : +n)));

  async function carregar() {
    const resp = await fetch('classico.html', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('Não consegui ler classico.html');
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // fichas (objeto literal "works" do próprio site)
    let works = {};
    const m = html.match(/const works = (\{[\s\S]*?\n\s*\});/);
    if (m) {
      // seguranca-ok: avalia só o literal do nosso próprio classico.html (mesma origem, versionado)
      works = Function('"use strict"; return (' + m[1] + ');')();
    }

    // histórico ano a ano
    const itens = [];
    doc.querySelectorAll('section.chapter').forEach((cap) => {
      const ano = txt(cap.querySelector('.chapter__year')).replace(/\s*—\s*/g, '–');
      cap.querySelectorAll('li.work').forEach((li) => {
        const tituloEl = li.querySelector('.work__title').cloneNode(true);
        const premiado = !!tituloEl.querySelector('.badge');
        tituloEl.querySelectorAll('.badge').forEach((b) => b.remove());
        itens.push({
          ano, tipo: li.dataset.type || 'teatro', premiado,
          titulo: txt(tituloEl),
          meta: txt(li.querySelector('.work__meta')),
          extra: txt(li.querySelector('.work__extra')),
          fontes: [...li.querySelectorAll('.work__sources a')].map((a) => ({ t: txt(a), u: a.getAttribute('href') })),
        });
      });
    });

    // prêmios (curtas)
    const premios = [...doc.querySelectorAll('.curtas__item')].map((c) => ({
      titulo: txt(c.querySelector('.curtas__title')),
      ano: txt(c.querySelector('.curtas__year')?.firstChild),
      premio: txt(c.querySelector('.curtas__tagline')),
    }));

    // destaques com foto, na ordem do mais recente
    const destaques = [...doc.querySelectorAll('.destaques__card')].map((c) => {
      const slug = c.dataset.work;
      const w = works[slug] || {};
      const bg = c.querySelector('.destaques__photo')?.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      return { slug, w, foto: w.photo || bg || '', ano: w.year || txt(c.querySelector('.destaques__year')) };
    }).filter((d) => d.foto).sort((a, b) => anoMax(b.ano) - anoMax(a.ano));

    return { itens, premios, destaques, works };
  }

  // área de cada item no currículo
  function area(it) {
    if (it.tipo === 'audiovisual') return 'audiovisual';
    if (it.tipo === 'sonoplastia') return 'sonoplastia';
    if (it.tipo === 'dublagem') return 'dublagem';
    if (it.tipo === 'formacao') return 'formacao';
    if (/sonoplastia|proje[çc]/i.test(it.meta) && !/Ator/.test(it.meta)) return 'sonoplastia';
    if (/roteiro|assist[eê]ncia de dire/i.test(it.meta)) return 'roteiro';
    return 'teatro';
  }

  // legenda padrão de edital a partir dos créditos da ficha
  function legenda(w) {
    const cr = w.credits || [];
    const pega = (re) => cr.filter(([k]) => re.test(k));
    let funcao = pega(/^(Função|Personage)/).map(([k, v]) => (/^Personage/.test(k) ? `${k}: ${v}` : v)).join(' · ');
    if (!funcao) funcao = cr.filter(([, v]) => /Nathan Silva/.test(v) && !/,/.test(v)).map(([k]) => k).join(' e ');
    const direcao = pega(/^(Direção|Adaptação e direção)$/).map(([, v]) => v)[0] || '';
    const grupo = pega(/^(Grupo|Projeto|Realização|Produção)$/).map(([, v]) => v)[0] || '';
    const local = pega(/^(Local|Temporada|Temporadas|Exibição)/).map(([, v]) => v)[0] || '';
    const foto = pega(/^Foto/).map(([, v]) => v)[0] || '';
    return { funcao: funcao || 'Ator', direcao, grupo, local, foto };
  }

  // mesma produção em mais de um ano (circulação, nova temporada) conta uma vez só
  const producoes = (itens) => new Set(itens.map((i) => i.titulo.replace(/\s*\((circulação|nova temporada|nova apresentação|leitura dramatizada)\)\s*$/i, ''))).size;
  const anosDeCarreira = () => new Date().getFullYear() - 2012;
  const mesAno = () => new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const MINI = 'Nathan Silva é ator, roteirista, dublador e sonoplasta de Campos dos Goytacazes (RJ), em atividade desde 2012. '
    + 'Formou-se no Curso Livre de Teatro do Teatro de Bolso Procópio Ferreira e atuou em cerca de 20 montagens teatrais, com grupos como '
    + 'Tubo de Ensaio, Núcleo de Artes ORI, Nós Experimento e o Grupo Teatral da Escola de Dança Ronaldo Vasconcelos. '
    + 'No cinema, integra o elenco de dois curtas premiados dirigidos por Fernando Rossi: O homem do cachorro (Melhor Filme pelo Júri Popular, RibaCine 2022) '
    + 'e O menino da pipa avoada (Prêmio do Júri Popular no 1º Festival Territorial de Cinema Itinerante), no qual também foi assistente de direção. '
    + 'Assina sonoplastia e projeções cênicas de espetáculos no Teatro de Bolso e, em 2026, escreveu o roteiro e foi assistente de direção '
    + 'do musical infantil Reino em Cena — A Biblioteca Secreta.';

  const CONTATO = {
    nome: 'Nathan Silva',
    cidade: 'Campos dos Goytacazes / RJ',
    email: 'nathan_nunes92@hotmail.com',
    fone: '(22) 99710-6833',
    insta: '@nsilvan1',
    instaUrl: 'https://www.instagram.com/nsilvan1/',
    site: 'portfolio-artistico.vercel.app',
    siteUrl: 'https://portfolio-artistico.vercel.app/',
    areas: 'Ator · Roteirista · Dublador · Sonoplasta',
    linguagens: 'Teatro, audiovisual, dublagem e sonoplastia / projeções cênicas',
  };

  // espera fontes e imagens, marca a página como pronta e imprime se pedido
  async function finalizar() {
    if (document.fonts) await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    document.body.dataset.pronto = '1';
    if (new URLSearchParams(location.search).has('print')) setTimeout(() => window.print(), 300);
  }

  window.PDF = { carregar, producoes, h, txt, urlSegura, area, legenda, anosDeCarreira, mesAno, MINI, CONTATO, finalizar, anoMax };
})();
