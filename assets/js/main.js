/* =========================================================
   LUMIÈRE — site interactions
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Header ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var menu = $('#mobile-menu');
  var closeMenu = function () {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  };
  var openMenu = function () {
    if (!menu || !toggle) return;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
    });
    $$('a', menu).forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (el, i) {
      if (!el.style.getPropertyValue('--d') && el.parentElement) {
        var siblings = $$('[data-reveal]', el.parentElement);
        if (siblings.length > 1) {
          el.style.setProperty('--d', Math.min(siblings.indexOf(el), 6) * 90 + 'ms');
        }
      }
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Testimonial slider ---------- */
  $$('[data-slider]').forEach(function (slider) {
    var slides = $$('.slider-slide', slider);
    var prev = $('[data-slider-prev]', slider);
    var next = $('[data-slider-next]', slider);
    var count = $('[data-slider-count]', slider);
    var index = 0;
    var timer = null;

    if (slides.length < 2) return;

    var show = function (i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        slide.classList.toggle('is-active', n === index);
        slide.setAttribute('aria-hidden', n === index ? 'false' : 'true');
      });
      if (count) count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    };

    var start = function () {
      stop();
      timer = window.setInterval(function () { show(index + 1); }, 7000);
    };
    var stop = function () {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    if (prev) prev.addEventListener('click', function () { show(index - 1); start(); });
    if (next) next.addEventListener('click', function () { show(index + 1); start(); });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);

    var startX = null;
    slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { show(dx < 0 ? index + 1 : index - 1); start(); }
      startX = null;
    });

    show(0);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });

  /* ---------- FAQ accordion ---------- */
  $$('.faq__item').forEach(function (item) {
    var button = $('.faq__q', item);
    var panel = $('.faq__a', item);
    if (!button || !panel) return;

    button.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      $$('.faq__item.is-open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          var otherBtn = $('.faq__q', other);
          var otherPanel = $('.faq__a', other);
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherPanel) otherPanel.style.height = '0px';
        }
      });

      item.classList.toggle('is-open', !isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));
      panel.style.height = isOpen ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ---------- Treatment filtering ---------- */
  $$('[data-filter-group]').forEach(function (group) {
    var buttons = $$('.filter', group);
    var targetSel = group.getAttribute('data-filter-group');
    var items = $$(targetSel + ' [data-cat]');
    var count = $('[data-filter-count]');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        buttons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });

        var visible = 0;
        items.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-cat') === filter;
          item.style.display = match ? '' : 'none';
          if (match) visible++;
        });

        $$('.menu-section', document).forEach(function (section) {
          var any = $$('[data-cat]', section).some(function (item) { return item.style.display !== 'none'; });
          section.style.display = any ? '' : 'none';
        });

        if (count) count.textContent = visible + ' treatments';
      });
    });
  });

  /* ---------- Gallery filtering + lightbox ---------- */
  var galleryGroup = $('[data-gallery-filter]');
  if (galleryGroup) {
    var galleryButtons = $$('.filter', galleryGroup);
    var galleryItems = $$('[data-gallery] .masonry__item');

    galleryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        galleryButtons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        galleryItems.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-cat') === filter;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  }

  var lightbox = $('#lightbox');
  if (lightbox) {
    var lightboxImg = $('img', lightbox);
    var lightboxCount = $('.lightbox__count', lightbox);
    var lightboxItems = [];
    var lightboxIndex = 0;

    var renderLightbox = function () {
      var item = lightboxItems[lightboxIndex];
      if (!item) return;
      var img = $('img', item);
      if (!img) return;
      lightboxImg.src = item.getAttribute('data-full') || img.src;
      lightboxImg.alt = img.alt || '';
      if (lightboxCount) {
        lightboxCount.textContent = String(lightboxIndex + 1).padStart(2, '0') + ' / ' + String(lightboxItems.length).padStart(2, '0');
      }
    };

    var openLightbox = function (item) {
      lightboxItems = $$('.masonry__item').filter(function (el) { return el.style.display !== 'none'; });
      lightboxIndex = lightboxItems.indexOf(item);
      if (lightboxIndex < 0) lightboxIndex = 0;
      renderLightbox();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      var closeBtn = $('.lightbox__close', lightbox);
      if (closeBtn) closeBtn.focus();
    };

    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    };

    var step = function (dir) {
      if (!lightboxItems.length) return;
      lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
      renderLightbox();
    };

    $$('[data-gallery] .masonry__item').forEach(function (item) {
      item.addEventListener('click', function () { openLightbox(item); });
    });

    var closeBtn = $('.lightbox__close', lightbox);
    var prevBtn = $('.lightbox__nav--prev', lightbox);
    var nextBtn = $('.lightbox__nav--next', lightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- Forms ---------- */
  $$('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var success = form.parentElement.querySelector('[data-form-success]');
      if (success) {
        form.style.display = 'none';
        success.classList.add('is-visible');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* ---------- Newsletter ---------- */
  $$('.newsletter-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input', form);
      var btn = $('button', form);
      if (!input || !input.value.trim()) return;
      input.value = '';
      input.placeholder = 'Welcome to the list.';
      if (btn) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12.5l5 5L20 6.5"/></svg>';
      }
    });
  });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
