/**
 * main.js — Portfolio Nathan Oliveira
 * Vanilla JS ES6+ | Modular | Performático
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Debounce: adia a execução até que o usuário pare de acionar.
 * @param {Function} fn
 * @param {number} delay ms
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle: garante que fn execute no máximo uma vez por `limit` ms.
 * @param {Function} fn
 * @param {number} limit ms
 */
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/** Verifica preferência de redução de movimento */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Verifica se é mobile (< 768px) */
const isMobile = () => window.innerWidth < 768;

/* ============================================================
   1. NAVIGATION
   ============================================================ */

function initNavigation() {
  const header      = document.querySelector('.header');
  const navToggle   = document.getElementById('nav-toggle');
  const navMenu     = document.getElementById('nav-menu');
  const navLinks    = document.querySelectorAll('.nav__link');
  const sections    = document.querySelectorAll('section[id]');

  if (!navToggle || !navMenu) return;

  /* ---------- Toggle mobile ---------- */
  function openMenu() {
    navMenu.classList.add('nav__menu--open');
    navToggle.classList.add('nav__toggle--open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navMenu.classList.remove('nav__menu--open');
    navToggle.classList.remove('nav__toggle--open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  navToggle.setAttribute('aria-expanded', 'false');

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('nav__menu--open');
    isOpen ? closeMenu() : openMenu();
  });

  /* Fecha ao clicar num link */
  navLinks.forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  /* Fecha ao clicar fora do menu */
  document.addEventListener('click', (e) => {
    if (
      navMenu.classList.contains('nav__menu--open') &&
      !navMenu.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* ---------- Active link via Intersection Observer ---------- */
  const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const target = link.getAttribute('data-scroll-to');
          link.classList.toggle('nav__link--active', target === id);
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => sectionObserver.observe(section));
}

/* ============================================================
   2. SMOOTH SCROLL
   ============================================================ */

function initSmoothScroll() {
  const scrollTargets = document.querySelectorAll('[data-scroll-to]');
  const header = document.querySelector('.header');

  scrollTargets.forEach(el => {
    el.addEventListener('click', (e) => {
      const targetId = el.getAttribute('data-scroll-to');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      e.preventDefault();

      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const targetTop =
        targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  });
}

/* ============================================================
   3. HEADER SCROLL EFFECT
   ============================================================ */

function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let isScrolled = false;

  const handleScroll = throttle(() => {
    const shouldBeScrolled = window.scrollY > 50;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      header.classList.toggle('header--scrolled', isScrolled);
    }
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ============================================================
   4. PORTFOLIO FILTERS
   ============================================================ */

function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.portfolio__filter');
  const cards      = document.querySelectorAll('.portfolio__card');

  if (!filterBtns.length || !cards.length) return;

  function filterCards(category) {
    cards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const shouldShow   = category === 'todos' || cardCategory === category;

      if (!shouldShow) {
        /* Esconder: adicionar hidden (opacity 0 + scale) */
        card.classList.add('portfolio__card--hidden');
        /* Após transição, retirar do fluxo visual */
        card.addEventListener('transitionend', function onEnd() {
          if (card.classList.contains('portfolio__card--hidden')) {
            card.style.display = 'none';
          }
          card.removeEventListener('transitionend', onEnd);
        });
      } else {
        /* Mostrar: restaurar display primeiro, depois remove hidden */
        card.style.display = '';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.classList.remove('portfolio__card--hidden');
          });
        });
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');

      /* Atualiza botão ativo */
      filterBtns.forEach(b => b.classList.remove('portfolio__filter--active'));
      btn.classList.add('portfolio__filter--active');

      filterCards(category);
    });
  });
}

/* ============================================================
   5. LIGHTBOX GALLERY
   ============================================================ */

function initLightbox() {
  const galleryItems   = document.querySelectorAll('.galeria__item');
  const lightbox       = document.getElementById('galeria-lightbox');
  const lightboxImg    = lightbox && lightbox.querySelector('.galeria__lightbox-image');
  const closeBtn       = lightbox && lightbox.querySelector('.galeria__lightbox-close');
  const prevBtn        = lightbox && lightbox.querySelector('.galeria__lightbox-prev');
  const nextBtn        = lightbox && lightbox.querySelector('.galeria__lightbox-next');

  if (!lightbox || !galleryItems.length) return;

  /* Coleta dados de todas as imagens da galeria */
  const images = Array.from(galleryItems).map(item => {
    const img = item.querySelector('.galeria__image');
    return {
      src: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : '',
    };
  });

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    setLightboxImage(currentIndex);
    lightbox.classList.add('galeria__lightbox--open');
    document.body.style.overflow = 'hidden';
    preloadAdjacentImages(currentIndex);
  }

  function closeLightbox() {
    lightbox.classList.remove('galeria__lightbox--open');
    document.body.style.overflow = '';
  }

  function setLightboxImage(index) {
    if (!lightboxImg) return;
    lightboxImg.setAttribute('src', images[index].src);
    lightboxImg.setAttribute('alt', images[index].alt);
  }

  function navigateTo(index) {
    /* Loop circular */
    currentIndex = (index + images.length) % images.length;
    setLightboxImage(currentIndex);
    preloadAdjacentImages(currentIndex);
  }

  function preloadAdjacentImages(index) {
    const prevIndex = (index - 1 + images.length) % images.length;
    const nextIndex = (index + 1) % images.length;

    [prevIndex, nextIndex].forEach(i => {
      const img = new Image();
      img.src = images[i].src;
    });
  }

  /* Clique nas imagens da galeria */
  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Ampliar imagem ${i + 1}`);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  /* Botões de navegação */
  if (prevBtn) prevBtn.addEventListener('click', () => navigateTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateTo(currentIndex + 1));

  /* Fechar */
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  /* Clique no overlay (fora da imagem) */
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* Teclado */
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('galeria__lightbox--open')) return;
    switch (e.key) {
      case 'Escape':    closeLightbox(); break;
      case 'ArrowLeft': navigateTo(currentIndex - 1); break;
      case 'ArrowRight':navigateTo(currentIndex + 1); break;
    }
  });
}

/* ============================================================
   6. TESTIMONIALS CAROUSEL
   ============================================================ */

function initCarousel() {
  const carousel = document.querySelector('.depoimentos__carousel');
  const track    = document.querySelector('.depoimentos__track');
  const slides   = document.querySelectorAll('.depoimentos__slide');
  const dots     = document.querySelectorAll('.depoimentos__dot');
  const prevBtn  = document.querySelector('.depoimentos__arrow--prev');
  const nextBtn  = document.querySelector('.depoimentos__arrow--next');

  if (!track || !slides.length) return;

  let current     = 0;
  let autoPlayId  = null;
  const total     = slides.length;
  const AUTO_DELAY = 6000;

  function goTo(index) {
    /* Loop infinito */
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('depoimentos__dot--active', i === current);
    });
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayId = setInterval(() => goTo(current + 1), AUTO_DELAY);
  }

  function stopAutoPlay() {
    if (autoPlayId) {
      clearInterval(autoPlayId);
      autoPlayId = null;
    }
  }

  /* Setas */
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startAutoPlay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startAutoPlay(); });

  /* Dots */
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.getAttribute('data-slide'), 10);
      goTo(index);
      startAutoPlay();
    });
  });

  /* Pause no hover */
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
  }

  /* Touch swipe */
  let touchStartX = 0;
  let touchEndX   = 0;
  const SWIPE_THRESHOLD = 50;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    touchEndX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) >= SWIPE_THRESHOLD) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
      startAutoPlay();
    }
  });

  /* Inicializa */
  goTo(0);
  startAutoPlay();
}

/* ============================================================
   7. SCROLL ANIMATIONS — INTERSECTION OBSERVER
   ============================================================ */

function initScrollAnimations() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  /* Respeitar prefers-reduced-motion */
  if (prefersReducedMotion()) {
    revealEls.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el    = entry.target;
          const delay = el.getAttribute('data-delay') || 0;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('reveal--visible');
          observer.unobserve(el); /* Anima apenas uma vez */
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach(el => observer.observe(el));
}

/* ============================================================
   8. CONTACT FORM
   ============================================================ */

function initContactForm() {
  const form   = document.querySelector('.contato__form');
  const inputs = document.querySelectorAll('.contato__input');

  if (!form) return;

  /* ---------- Floating labels (focus / blur / filled) ---------- */
  inputs.forEach(input => {
    const field = input.closest('.contato__field');
    if (!field) return;

    function updateState() {
      const hasValue =
        input.tagName === 'SELECT'
          ? input.value !== ''
          : input.value.trim() !== '';
      field.classList.toggle('contato__field--filled', hasValue);
    }

    input.addEventListener('focus', () => {
      field.classList.add('contato__field--focused');
    });

    input.addEventListener('blur', () => {
      field.classList.remove('contato__field--focused');
      updateState();
    });

    /* Estado inicial (ex: auto-fill do browser) */
    updateState();
    input.addEventListener('input', updateState);
    input.addEventListener('change', updateState);
  });

  /* ---------- Validação e envio ---------- */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function markInvalid(input, msg) {
    const field = input.closest('.contato__field');
    if (field) field.classList.add('contato__field--error');
    input.setAttribute('aria-invalid', 'true');
    /* Remove mensagem de erro anterior se existir */
    const prev = field && field.querySelector('.contato__error-msg');
    if (prev) prev.remove();
    /* Cria mensagem */
    if (field && msg) {
      const span = document.createElement('span');
      span.className = 'contato__error-msg';
      span.textContent = msg;
      field.appendChild(span);
    }
  }

  function clearInvalid(input) {
    const field = input.closest('.contato__field');
    if (field) {
      field.classList.remove('contato__field--error');
      const msg = field.querySelector('.contato__error-msg');
      if (msg) msg.remove();
    }
    input.removeAttribute('aria-invalid');
  }

  function validate() {
    let valid = true;
    inputs.forEach(input => clearInvalid(input));

    const nome     = form.querySelector('#nome');
    const email    = form.querySelector('#email');
    const mensagem = form.querySelector('#mensagem');

    if (nome && nome.value.trim().length < 2) {
      markInvalid(nome, 'O nome deve ter pelo menos 2 caracteres.');
      valid = false;
    }
    if (email && !EMAIL_REGEX.test(email.value.trim())) {
      markInvalid(email, 'Insira um e-mail válido.');
      valid = false;
    }
    if (mensagem && mensagem.value.trim().length < 10) {
      markInvalid(mensagem, 'A mensagem deve ter pelo menos 10 caracteres.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    /* Sucesso: exibe mensagem e reseta */
    const submitBtn = form.querySelector('.contato__submit');
    const originalText = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      submitBtn.textContent = 'Mensagem enviada!';
      submitBtn.disabled = true;
      submitBtn.classList.add('contato__submit--success');
    }

    /* Mensagem de sucesso acima do formulário */
    let successMsg = form.querySelector('.contato__success-msg');
    if (!successMsg) {
      successMsg = document.createElement('p');
      successMsg.className = 'contato__success-msg';
      form.prepend(successMsg);
    }
    successMsg.textContent =
      'Obrigado! Sua mensagem foi enviada. Retornarei em breve.';
    successMsg.style.display = 'block';

    form.reset();
    inputs.forEach(input => {
      const field = input.closest('.contato__field');
      if (field) {
        field.classList.remove('contato__field--filled', 'contato__field--focused');
      }
    });

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('contato__submit--success');
      }
      if (successMsg) successMsg.style.display = 'none';
    }, 5000);
  });
}

/* ============================================================
   9. HERO PARALLAX (sutil)
   ============================================================ */

function initHeroParallax() {
  const heroBg = document.querySelector('.hero__background');
  if (!heroBg) return;

  /* Desativado em mobile e reduced-motion */
  if (prefersReducedMotion()) return;

  const FACTOR = 0.3;
  let ticking  = false;

  const handleScroll = () => {
    if (isMobile()) return;
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroBg.style.transform = `translateY(${scrollY * FACTOR}px)`;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ============================================================
   10. SHOWREEL PLAY BUTTON
   ============================================================ */

function initShowreel() {
  const playBtn = document.querySelector('.showreel__play-btn');
  const iframe  = document.querySelector('.showreel__video');

  if (!playBtn || !iframe) return;

  playBtn.addEventListener('click', () => {
    /* Adiciona autoplay à src do iframe */
    const src = iframe.getAttribute('src');
    if (src && !src.includes('autoplay=1')) {
      iframe.setAttribute(
        'src',
        src + (src.includes('?') ? '&' : '?') + 'autoplay=1'
      );
    }
    playBtn.style.display = 'none';
  });
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSmoothScroll();
  initHeaderScroll();
  initPortfolioFilters();
  initLightbox();
  initCarousel();
  initScrollAnimations();
  initContactForm();
  initHeroParallax();
  initShowreel();
});
