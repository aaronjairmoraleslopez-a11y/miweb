/* =========================================================
   MAÍZ — Archivo vivo
   Comportamiento del sitio · JavaScript sin dependencias
   ---------------------------------------------------------
   1. Utilidades
   2. Menú móvil
   3. Apariciones al hacer scroll
   4. Cifras animadas
   5. Acordeón de procesos
   6. Galería, filtros y ficha (razas.html)
   7. Formulario con validación (contacto.html)
   ========================================================= */

(function () {
  'use strict';

  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Utilidades ---------- */
  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  }

  /* ---------- 2. Menú móvil ---------- */
  var menuToggle = $('#menu-toggle');
  var siteNav = $('#site-nav');

  if (menuToggle && siteNav) {
    var navLinks = $$('a', siteNav);

    var setMenu = function (open) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      siteNav.classList.toggle('is-open', open);
      root.classList.toggle('nav-open', open);
      if (open && navLinks.length) {
        navLinks[0].focus();
      }
    };

    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.site-header')) {
        setMenu(false);
      }
    });

    var desktopQuery = window.matchMedia('(min-width: 901px)');
    var onDesktop = function (event) {
      if (event.matches) setMenu(false);
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', onDesktop);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(onDesktop);
    }
  }

  /* ---------- 3. Apariciones al hacer scroll ---------- */
  var revealItems = $$('.reveal');

  if (revealItems.length) {
    root.classList.add('reveal-ready');
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
    }
  }

  /* ---------- 4. Cifras animadas ---------- */
  var counters = $$('[data-count]');

  if (counters.length) {
    var runCounter = function (element) {
      var target = Number(element.getAttribute('data-count')) || 0;

      if (reduceMotion.matches || !window.requestAnimationFrame) {
        element.textContent = formatNumber(target);
        return;
      }

      var duration = 1300;
      var started = null;
      var step = function (now) {
        if (started === null) started = now;
        var progress = Math.min(1, (now - started) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatNumber(Math.round(target * eased));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(function (counter) {
        counterObserver.observe(counter);
      });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- 5. Acordeón de procesos ---------- */
  var accordion = $('#procesos');

  if (accordion) {
    var triggers = $$('.acc__trigger', accordion);

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var willOpen = trigger.getAttribute('aria-expanded') !== 'true';

        triggers.forEach(function (item) {
          var panel = document.getElementById(item.getAttribute('aria-controls'));
          var open = item === trigger && willOpen;
          item.setAttribute('aria-expanded', String(open));
          if (panel) panel.classList.toggle('is-open', open);
        });
      });
    });
  }

  /* ---------- 6. Galería, filtros y ficha (razas.html) ---------- */
  var gallery = $('#races-grid');

  if (gallery) {
    var cards = $$('.race-card', gallery);

    $$('[data-open-race]').forEach(function (button) {
      var card = document.getElementById(button.getAttribute('data-open-race'));
      var title = card ? $('.race-card__title', card) : null;
      if (title) {
        button.setAttribute('aria-label', 'Abrir ficha de ' + title.textContent.trim());
      }
    });

    var selectTipo = $('#filter-tipo');
    var selectRegion = $('#filter-region');
    var resultCount = $('#result-count');
    var clearFilters = $('#clear-filters');
    var emptyState = $('#empty-state');
    var emptyReset = $('#empty-reset');
    var ficha = $('#ficha');
    var fichaTitle = $('#ficha-title');
    var fichaNo = $('#ficha-no');
    var fichaRegion = $('#ficha-region');
    var fichaColor = $('#ficha-color');
    var fichaAlt = $('#ficha-alt');
    var fichaUses = $('#ficha-uses');
    var fichaDesc = $('#ficha-desc');
    var fichaFact = $('#ficha-fact');
    var fichaImg = $('#ficha-img');
    var fichaCount = $('#ficha-count');
    var fichaPrev = $('#ficha-prev');
    var fichaNext = $('#ficha-next');
    var fichaStatus = $('#ficha-status');

    var state = { tipo: 'todos', region: 'todas' };
    var visibleCards = cards.slice();
    var currentIndex = 0;
    var lastFocus = null;

    var matches = function (card, tipo, region) {
      return (tipo === 'todos' || card.getAttribute('data-tipo') === tipo) &&
        (region === 'todas' || card.getAttribute('data-region') === region);
    };

    var render = function (animate) {
      visibleCards = [];

      cards.forEach(function (card) {
        var show = matches(card, state.tipo, state.region);
        var item = card.closest('li');
        if (item) item.hidden = !show;
        card.hidden = !show;

        if (show) {
          visibleCards.push(card);
          if (animate) {
            card.classList.remove('card-in');
            void card.offsetWidth;
            card.classList.add('card-in');
          }
        }
      });

      if (resultCount) {
        resultCount.innerHTML = 'Mostrando <strong>' + visibleCards.length + '</strong> de ' + cards.length + ' variedades';
      }
      if (emptyState) emptyState.hidden = visibleCards.length > 0;
      gallery.hidden = visibleCards.length === 0;
      if (clearFilters) {
        clearFilters.disabled = state.tipo === 'todos' && state.region === 'todas';
      }
    };

    var resetFilters = function (moveFocus) {
      state.tipo = 'todos';
      state.region = 'todas';

      if (selectTipo) selectTipo.value = 'todos';
      if (selectRegion) selectRegion.value = 'todas';

      render(true);

      if (moveFocus !== false && selectTipo) {
        selectTipo.focus();
      }
    };

    if (selectTipo) {
      selectTipo.addEventListener('change', function () {
        state.tipo = selectTipo.value;
        render(true);
      });
    }

    if (selectRegion) {
      selectRegion.addEventListener('change', function () {
        state.region = selectRegion.value;
        render(true);
      });
    }

    if (clearFilters) clearFilters.addEventListener('click', resetFilters);
    if (emptyReset) emptyReset.addEventListener('click', resetFilters);

    var fillFicha = function (card, list) {
      if (fichaImg) {
        var source = $('.race-card__img', card);
        var imgSrc = card.getAttribute('data-img') || (source ? source.getAttribute('src') : '');
        var imgAlt = card.getAttribute('data-img-alt') || (source ? source.getAttribute('alt') : '');
        if (imgSrc) fichaImg.setAttribute('src', imgSrc);
        fichaImg.setAttribute('alt', imgAlt);
      }

      var title = $('.race-card__title', card);
      var number = $('.race-card__no', card);
      var color = $('.race-card__color', card);

      fichaTitle.textContent = title ? title.textContent.trim() : 'Ficha';
      fichaNo.textContent = number ? 'Ficha ' + number.textContent.trim() : 'Ficha del archivo';
      fichaRegion.textContent = card.getAttribute('data-region-label') || '—';
      fichaColor.textContent = card.getAttribute('data-tipo-label') || (color ? color.textContent.trim() : '—');
      fichaAlt.textContent = card.getAttribute('data-alt') || '—';
      fichaUses.textContent = card.getAttribute('data-uses') || '—';
      fichaDesc.textContent = card.getAttribute('data-desc') || '';
      fichaFact.textContent = card.getAttribute('data-fact') || '';
      fichaCount.textContent = (currentIndex + 1) + ' / ' + list.length;
      fichaPrev.disabled = currentIndex === 0;
      fichaNext.disabled = currentIndex === list.length - 1;

      if (fichaStatus) {
        fichaStatus.textContent = 'Ficha ' + (currentIndex + 1) + ' de ' + list.length + ': ' + fichaTitle.textContent;
      }
    };

    var openFicha = function (card, opener) {
      if (!ficha || !ficha.showModal) return;

      var list = visibleCards.length ? visibleCards : cards;
      var index = list.indexOf(card);
      currentIndex = index < 0 ? 0 : index;
      lastFocus = opener || document.activeElement;

      fillFicha(card, list);

      if (!ficha.open) ficha.showModal();
      root.classList.add('ficha-open');

      try {
        history.replaceState(null, '', '#' + card.id);
      } catch (error) {
        /* file:// puede bloquear replaceState en algunos navegadores. */
      }
    };

    var stepFicha = function (direction) {
      var list = visibleCards.length ? visibleCards : cards;
      var next = currentIndex + direction;
      if (next < 0 || next >= list.length) return;
      currentIndex = next;
      fillFicha(list[currentIndex], list);
    };

    gallery.addEventListener('click', function (event) {
      var button = event.target.closest('[data-open-race]');
      if (!button) return;
      var card = document.getElementById(button.getAttribute('data-open-race'));
      if (card) openFicha(card, button);
    });

    if (ficha) {
      if (fichaPrev) fichaPrev.addEventListener('click', function () { stepFicha(-1); });
      if (fichaNext) fichaNext.addEventListener('click', function () { stepFicha(1); });

      ficha.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          stepFicha(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          stepFicha(-1);
        }
      });

      ficha.addEventListener('click', function (event) {
        if (event.target === ficha) ficha.close();
      });

      ficha.addEventListener('close', function () {
        root.classList.remove('ficha-open');
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (error) {
          /* Ignorar. */
        }
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
      });
    }

    render(false);

    /* Enlace directo: razas.html#nal-tel abre la ficha. */
    var openFromHash = function () {
      var hashId = decodeURIComponent(window.location.hash.slice(1));
      if (!hashId) return;

      var deepLink = document.getElementById(hashId);
      if (!deepLink || !deepLink.classList.contains('race-card')) return;

      if (deepLink.hidden) resetFilters(false);
      openFicha(deepLink, null);
    };

    if (window.location.hash) openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  /* ---------- 7. Formulario con validación ---------- */
  var form = $('#archive-form');

  if (form) {
    var summary = $('#form-summary');
    var summaryTitle = $('#summary-title');
    var summaryList = $('#summary-list');
    var formLive = $('#form-live');
    var success = $('#form-success');
    var successCopy = $('#success-copy');
    var formAgain = $('#form-again');
    var submitButton = $('#submit-btn');
    var messageInput = $('#mensaje');
    var messageCounter = $('#mensaje-counter');

    var isLocal = window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    var validations = {
      nombre: function (value) {
        var clean = value.trim();
        if (clean.length < 3) return 'Escribe tu nombre (al menos 3 letras).';
        if (clean.length > 80) return 'Acorta tu nombre a 80 caracteres.';
        return '';
      },
      correo: function (value) {
        var clean = value.trim();
        if (!clean) return 'Escribe tu correo electrónico.';
        if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean)) {
          return 'Revisa el correo: debe verse como nombre@dominio.com.';
        }
        return '';
      },
      region: function (value) {
        return value ? '' : 'Selecciona la región de tu aporte.';
      },
      variedad: function (value) {
        return value.length > 80 ? 'Acorta el nombre a 80 caracteres.' : '';
      },
      mensaje: function (value) {
        var clean = value.trim();
        if (clean.length < 20) {
          return 'Cuéntanos un poco más: faltan ' + (20 - clean.length) + ' caracteres para el mínimo.';
        }
        return '';
      },
      consentimiento: function (value, element) {
        return element.checked ? '' : 'Marca la casilla para que podamos publicar tu aporte.';
      }
    };

    var setFieldState = function (id, message) {
      var element = document.getElementById(id);
      if (!element) return;
      var group = element.closest('[data-field]');
      var error = document.getElementById(id + '-error');

      if (group) group.classList.toggle('has-error', Boolean(message));
      if (error) {
        error.textContent = message || '';
        error.hidden = !message;
      }
      if (message) {
        element.setAttribute('aria-invalid', 'true');
      } else {
        element.removeAttribute('aria-invalid');
      }
    };

    var validateField = function (id) {
      var element = document.getElementById(id);
      if (!element || !validations[id]) return '';
      var message = validations[id](element.value || '', element);
      setFieldState(id, message);
      return message;
    };

    var validateAll = function () {
      var errors = [];
      Object.keys(validations).forEach(function (id) {
        var message = validateField(id);
        if (message) errors.push({ id: id, message: message });
      });
      return errors;
    };

    var hideSummary = function () {
      if (summary) {
        summary.hidden = true;
        summaryList.innerHTML = '';
      }
    };

    var showSummary = function (errors) {
      if (!summary) return;
      summaryList.innerHTML = '';

      errors.forEach(function (item) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + item.id;
        link.textContent = item.message;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          var field = document.getElementById(item.id);
          if (field) field.focus();
        });
        li.appendChild(link);
        summaryList.appendChild(li);
      });

      summaryTitle.textContent = 'Revisa ' + errors.length + ' ' +
        (errors.length === 1 ? 'campo' : 'campos') + ' antes de enviar';
      summary.hidden = false;
      summary.focus();
    };

    var fieldIds = Object.keys(validations);

    fieldIds.forEach(function (id) {
      var element = document.getElementById(id);
      if (!element) return;

      element.addEventListener('blur', function () {
        var isCheckbox = element.type === 'checkbox';
        if (isCheckbox || element.value.trim() !== '') {
          validateField(id);
        }
      });

      element.addEventListener('input', function () {
        var group = element.closest('[data-field]');
        if (group && group.classList.contains('has-error')) {
          validateField(id);
        }
      });

      if (element.tagName === 'SELECT') {
        element.addEventListener('change', function () {
          validateField(id);
        });
      }
    });

    if (messageInput && messageCounter) {
      messageInput.addEventListener('input', function () {
        var length = messageInput.value.length;
        messageCounter.textContent = length + ' / 600';
        messageCounter.classList.toggle('is-near', length > 540);
      });
    }

    var showSuccess = function () {
      var name = ($('#nombre').value || '').trim().split(/\s+/)[0];

      form.hidden = true;
      success.hidden = false;
      successCopy.textContent = (name ? 'Gracias, ' + name + '. ' : 'Gracias. ') +
        'Revisaremos tu mensaje y te responderemos en un plazo de 3 a 5 días hábiles.';
      if (formLive) formLive.textContent = 'Mensaje enviado. Tu aporte quedó registrado.';
      success.focus();
    };

    var showSendError = function () {
      hideSummary();
      if (!summary) {
        window.alert('No pudimos enviar el formulario. Inténtalo de nuevo.');
        return;
      }
      summaryTitle.textContent = 'No pudimos enviar el formulario';
      var li = document.createElement('li');
      li.textContent = 'Revisa tu conexión e inténtalo de nuevo. Tus datos siguen aquí, no se han perdido.';
      summaryList.appendChild(li);
      summary.hidden = false;
      summary.focus();
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideSummary();

      var errors = validateAll();
      if (errors.length) {
        showSummary(errors);
        return;
      }

      var originalMarkup = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Enviando…';
      if (formLive) formLive.textContent = 'Enviando tu aporte…';

      var request;

      if (isLocal) {
        request = new Promise(function (resolve) {
          window.setTimeout(resolve, 700);
        });
      } else {
        var body = new URLSearchParams(new FormData(form)).toString();
        request = fetch(form.getAttribute('action') || '/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        }).then(function (response) {
          if (!response.ok) throw new Error('Respuesta ' + response.status);
          return response;
        });
      }

      request.then(function () {
        showSuccess();
      }).catch(function () {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.innerHTML = originalMarkup;
        showSendError();
      });
    });

    if (formAgain) {
      formAgain.addEventListener('click', function () {
        form.reset();
        fieldIds.forEach(function (id) {
          setFieldState(id, '');
        });
        if (messageCounter) {
          messageCounter.textContent = '0 / 600';
          messageCounter.classList.remove('is-near');
        }
        hideSummary();
        success.hidden = true;
        form.hidden = false;
        var firstField = document.getElementById('nombre');
        if (firstField) firstField.focus();
      });
    }
  }
})();

