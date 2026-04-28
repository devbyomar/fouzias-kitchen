/* =========================================================
   Fouzia's Kitchen — Site Interactions
   - Mobile nav toggle
   - Sticky header on scroll
   - Reveal-on-scroll animations
   - Cart (add / update / remove / persist)
   - Cart drawer (focus trap, ESC, body lock)
   - Order summary on checkout page
   - Toast notifications
   - Custom-platter quote prefill
   - Inquiry form validation + success state
   - Footer year
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Graceful image fallback ---------- */
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function handle() {
      img.removeEventListener('error', handle);
      if (!img.src.endsWith('_placeholder.svg') && !img.src.endsWith('logo.svg')) {
        img.src = 'assets/_placeholder.svg';
      }
    });
  });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    '.section-head, .product-card, .menu-cat, .simyan-card, ' +
    '.occasion-grid li, .t-card, .steps li, .faq-list details, ' +
    '.story-copy, .story-image, .hero-copy, .hero-image, .cta-band, ' +
    '.checkout-grid, .order-summary'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* =========================================================
     CART SYSTEM
     ========================================================= */

  /* ---------- Product catalog ---------- */
  var PRODUCTS = {
    'kulcha-shor':  { name: "Kulcha-e-Shor",        subtitle: 'Tea Biscuits',         price: 8, unit: 'per dozen' },
    'simyan-mild':  { name: 'Simyan — Mild',        subtitle: 'Savoury vermicelli',   price: 6, unit: 'per 200g'  },
    'simyan-spicy': { name: 'Simyan — Spicy',       subtitle: 'Savoury vermicelli',   price: 6, unit: 'per 200g'  },
    'khitai':       { name: 'Kulcha-e-Khitai',      subtitle: 'Cardamom shortbread',  price: 9, unit: 'per dozen' },
    'panjerei':     { name: 'Rosette Cookies',      subtitle: 'Kulcha-e-Panjerei',    price: 6, unit: 'per dozen' },
    'meringue':     { name: 'Meringue Cookies',     subtitle: 'Crisp & cloud-light',  price: 6, unit: 'per dozen' }
  };

  /* ---------- Helpers ---------- */
  function formatMoney(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }
  function clampQty(n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return 1;
    if (n > 99) return 99;
    return n;
  }

  /* ---------- Cart store (localStorage-backed) ---------- */
  var STORAGE_KEY = 'fouziasCart.v1';
  var Cart = (function () {
    var items = {}; // { id: qty }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.keys(parsed).forEach(function (id) {
          if (PRODUCTS[id]) items[id] = clampQty(parsed[id]);
        });
      }
    } catch (e) { /* ignore */ }

    function persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
    }

    return {
      add: function (id, qty) {
        if (!PRODUCTS[id]) return;
        qty = clampQty(qty || 1);
        items[id] = clampQty((items[id] || 0) + qty);
        persist();
      },
      set: function (id, qty) {
        if (!PRODUCTS[id]) return;
        qty = parseInt(qty, 10);
        if (!qty || qty < 1) { delete items[id]; }
        else { items[id] = clampQty(qty); }
        persist();
      },
      remove: function (id) { delete items[id]; persist(); },
      clear:  function ()   { items = {}; persist(); },
      getItems: function () {
        return Object.keys(items).map(function (id) {
          var p = PRODUCTS[id];
          var qty = items[id];
          return {
            id: id, name: p.name, subtitle: p.subtitle,
            unit: p.unit, price: p.price,
            qty: qty, lineTotal: p.price * qty
          };
        });
      },
      getCount:    function () { var c = 0; Object.keys(items).forEach(function (id) { c += items[id]; }); return c; },
      getSubtotal: function () { var s = 0; Object.keys(items).forEach(function (id) { s += PRODUCTS[id].price * items[id]; }); return s; }
    };
  })();

  /* ---------- DOM refs ---------- */
  var cartBtn       = document.getElementById('cartBtn');
  var cartCount     = document.getElementById('cartCount');
  var cartDrawer    = document.getElementById('cartDrawer');
  var cartBackdrop  = document.getElementById('cartBackdrop');
  var cartClose     = document.getElementById('cartClose');
  var cartEmpty     = document.getElementById('cartEmpty');
  var cartItemsEl   = document.getElementById('cartItems');
  var cartFoot      = document.getElementById('cartFoot');
  var cartSubtotal  = document.getElementById('cartSubtotal');
  var cartCheckout  = document.getElementById('cartCheckout');
  var cartContinue  = document.getElementById('cartContinue');

  var summaryEmpty   = document.getElementById('summaryEmpty');
  var summaryItemsEl = document.getElementById('summaryItems');
  var summaryTotals  = document.getElementById('summaryTotals');
  var summarySub     = document.getElementById('summarySubtotal');
  var summaryTotal   = document.getElementById('summaryTotal');
  var summaryCount   = document.getElementById('summaryCount');

  var btnTotal       = document.getElementById('btnTotal');
  var stickyCta      = document.getElementById('stickyCta');

  var toastEl        = document.getElementById('toast');
  var toastMsgEl     = document.getElementById('toastMsg');

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl || !toastMsgEl) return;
    toastMsgEl.textContent = msg;
    toastEl.classList.add('show');
    toastEl.removeAttribute('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2200);
  }

  /* ---------- Render: cart count badge ---------- */
  function renderBadge() {
    if (!cartCount) return;
    var c = Cart.getCount();
    cartCount.textContent = String(c);
    cartCount.classList.toggle('has-items', c > 0);
    // Bump animation
    cartCount.classList.remove('bump');
    // force reflow to restart animation
    void cartCount.offsetWidth;
    if (c > 0) cartCount.classList.add('bump');
  }

  /* ---------- Render: cart drawer ---------- */
  function renderDrawer() {
    if (!cartItemsEl || !cartEmpty || !cartFoot) return;
    var items = Cart.getItems();
    if (items.length === 0) {
      cartEmpty.hidden = false;
      cartItemsEl.hidden = true;
      cartFoot.hidden = true;
      cartItemsEl.innerHTML = '';
      return;
    }
    cartEmpty.hidden = true;
    cartItemsEl.hidden = false;
    cartFoot.hidden = false;

    cartItemsEl.innerHTML = items.map(function (it) {
      return '' +
        '<li class="cart-item" data-cart-item="' + it.id + '">' +
          '<div class="cart-item-info">' +
            '<p class="cart-item-name">' + it.name + '</p>' +
            '<p class="cart-item-meta">' + (it.subtitle ? it.subtitle + ' · ' : '') + formatMoney(it.price) + ' ' + it.unit + '</p>' +
            '<div class="cart-item-controls">' +
              '<div class="qty-stepper qty-stepper-sm" data-stepper data-cart-stepper="' + it.id + '">' +
                '<button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>' +
                '<input type="text" inputmode="numeric" class="qty-input" value="' + it.qty + '" aria-label="Quantity" />' +
                '<button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button type="button" class="cart-item-remove" data-cart-remove="' + it.id + '" aria-label="Remove ' + it.name + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-item-price">' + formatMoney(it.lineTotal) + '</div>' +
        '</li>';
    }).join('');

    if (cartSubtotal) cartSubtotal.textContent = formatMoney(Cart.getSubtotal());
  }

  /* ---------- Render: order summary on checkout page ---------- */
  function renderSummary() {
    if (!summaryItemsEl) return;
    var items = Cart.getItems();
    var sub = Cart.getSubtotal();
    var count = Cart.getCount();

    if (summaryCount) {
      summaryCount.textContent = count === 1 ? '1 item' : count + ' items';
    }

    if (items.length === 0) {
      if (summaryEmpty)  summaryEmpty.hidden  = false;
      if (summaryTotals) summaryTotals.hidden = true;
      summaryItemsEl.hidden = true;
      summaryItemsEl.innerHTML = '';
    } else {
      if (summaryEmpty)  summaryEmpty.hidden  = true;
      if (summaryTotals) summaryTotals.hidden = false;
      summaryItemsEl.hidden = false;
      summaryItemsEl.innerHTML = items.map(function (it) {
        return '' +
          '<li class="summary-item">' +
            '<span class="summary-qty">' + it.qty + '×</span>' +
            '<span class="summary-name">' +
              it.name +
              '<span class="summary-meta">' + formatMoney(it.price) + ' ' + it.unit + '</span>' +
            '</span>' +
            '<span class="summary-line">' + formatMoney(it.lineTotal) + '</span>' +
          '</li>';
      }).join('');
      if (summarySub)   summarySub.textContent   = formatMoney(sub);
      if (summaryTotal) summaryTotal.textContent = formatMoney(sub);
    }

    // Update Place Order button inline total
    if (btnTotal) {
      if (sub > 0) {
        btnTotal.hidden = false;
        btnTotal.textContent = formatMoney(sub);
      } else {
        btnTotal.hidden = true;
      }
    }
  }

  /* ---------- Render: sticky CTA (mobile) ---------- */
  function renderStickyCta() {
    if (!stickyCta) return;
    var count = Cart.getCount();
    var sub = Cart.getSubtotal();
    if (count > 0) {
      stickyCta.classList.add('has-items');
      stickyCta.textContent = 'View Cart · ' + count + (count === 1 ? ' item · ' : ' items · ') + formatMoney(sub);
      stickyCta.setAttribute('href', '#');
      stickyCta.dataset.action = 'open-cart';
    } else {
      stickyCta.classList.remove('has-items');
      stickyCta.textContent = 'Browse the Menu';
      stickyCta.setAttribute('href', '#menu');
      stickyCta.dataset.action = '';
    }
  }

  /* ---------- Render: live in-cart controls on product cards & menu rows ---------- */
  function renderProductCards() {
    var nodes = document.querySelectorAll('[data-product-id]');
    nodes.forEach(function (node) {
      // Skip elements inside the cart drawer or order summary
      if (node.closest('#cartDrawer') || node.closest('#orderSummary')) return;

      var id = node.getAttribute('data-product-id');
      if (!PRODUCTS[id]) return;
      var qty = 0;
      Cart.getItems().forEach(function (it) { if (it.id === id) qty = it.qty; });

      // PRODUCT CARDS / SIMYAN CARDS — they use .product-actions (excluding the .single variant on Simyan link card)
      var actions = node.querySelector('.product-actions:not(.single)');
      if (actions) {
        if (qty > 0) {
          if (!actions.classList.contains('in-cart')) {
            actions.classList.add('in-cart');
            actions.innerHTML =
              '<div class="in-cart-control">' +
                '<span class="in-cart-label">In your cart</span>' +
                '<div class="qty-stepper" data-stepper data-cart-stepper="' + id + '">' +
                  '<button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>' +
                  '<input type="text" inputmode="numeric" class="qty-input" value="' + qty + '" aria-label="Quantity" />' +
                  '<button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>' +
                '</div>' +
                '<button type="button" class="in-cart-remove" data-cart-remove="' + id + '" aria-label="Remove from cart">Remove</button>' +
              '</div>';
          } else {
            // already in in-cart mode — just sync qty value
            var input = actions.querySelector('.qty-input');
            if (input && parseInt(input.value, 10) !== qty) input.value = qty;
          }
        } else if (actions.classList.contains('in-cart')) {
          // Was in cart, now removed — restore the original add-to-cart UI
          actions.classList.remove('in-cart');
          actions.innerHTML =
            '<div class="qty-stepper" data-stepper>' +
              '<button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>' +
              '<input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />' +
              '<button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-add" data-add-to-cart>Add to Cart</button>';
        }
      }

      // MENU ROWS — they use .menu-right (only when this is an <li>)
      if (node.tagName === 'LI') {
        var right = node.querySelector('.menu-right');
        if (!right) return;
        var price = right.querySelector('.price');
        var priceHTML = price ? price.outerHTML : '';
        if (qty > 0) {
          if (!right.classList.contains('in-cart')) {
            right.classList.add('in-cart');
            right.innerHTML =
              priceHTML +
              '<div class="menu-cart-control">' +
                '<div class="qty-stepper qty-stepper-sm" data-stepper data-cart-stepper="' + id + '">' +
                  '<button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>' +
                  '<input type="text" inputmode="numeric" class="qty-input" value="' + qty + '" aria-label="Quantity" />' +
                  '<button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>' +
                '</div>' +
                '<button type="button" class="menu-remove" data-cart-remove="' + id + '" aria-label="Remove from cart" title="Remove">×</button>' +
              '</div>';
          } else {
            var mInput = right.querySelector('.qty-input');
            if (mInput && parseInt(mInput.value, 10) !== qty) mInput.value = qty;
          }
        } else if (right.classList.contains('in-cart')) {
          right.classList.remove('in-cart');
          right.innerHTML =
            priceHTML +
            '<button type="button" class="menu-add" data-add-to-cart aria-label="Add to cart">+ Add</button>';
        }
      }
    });
  }

  function renderAll() {
    renderBadge();
    renderDrawer();
    renderSummary();
    renderStickyCta();
    renderProductCards();
  }

  /* ---------- Cart drawer open/close (with focus trap) ---------- */
  var lastFocus = null;

  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  function openDrawer() {
    if (!cartDrawer || !cartBackdrop) return;
    lastFocus = document.activeElement;
    cartBackdrop.hidden = false;
    cartDrawer.hidden = false;
    // next frame so transition triggers
    requestAnimationFrame(function () {
      cartBackdrop.classList.add('open');
      cartDrawer.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      var focusables = getFocusable(cartDrawer);
      if (focusables.length) focusables[0].focus();
    }, 60);
  }

  function closeDrawer() {
    if (!cartDrawer || !cartBackdrop) return;
    cartBackdrop.classList.remove('open');
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () {
      cartBackdrop.hidden = true;
      cartDrawer.hidden = true;
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  if (cartBtn)      cartBtn.addEventListener('click', openDrawer);
  if (cartClose)    cartClose.addEventListener('click', closeDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeDrawer);
  if (cartContinue) cartContinue.addEventListener('click', function (e) { e.preventDefault(); closeDrawer(); });
  if (cartCheckout) cartCheckout.addEventListener('click', function (e) {
    e.preventDefault();
    closeDrawer();
    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('keydown', function (e) {
    if (!cartDrawer || cartDrawer.hidden) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key === 'Tab') {
      var focusables = getFocusable(cartDrawer);
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Sticky CTA action ---------- */
  if (stickyCta) {
    stickyCta.addEventListener('click', function (e) {
      if (stickyCta.dataset.action === 'open-cart') {
        e.preventDefault();
        openDrawer();
      }
    });
  }

  /* ---------- Delegated: qty steppers (product cards & cart) ---------- */
  document.addEventListener('click', function (e) {
    var stepBtn = e.target.closest('[data-step]');
    if (!stepBtn) return;
    var stepper = stepBtn.closest('[data-stepper]');
    if (!stepper) return;
    var input = stepper.querySelector('.qty-input');
    if (!input) return;
    var delta = parseInt(stepBtn.getAttribute('data-step'), 10) || 0;
    var next = clampQty((parseInt(input.value, 10) || 1) + delta);
    input.value = next;

    // If this stepper lives inside the cart drawer, update cart immediately
    var cartId = stepper.getAttribute('data-cart-stepper');
    if (cartId) {
      Cart.set(cartId, next);
      renderAll();
    }
  });

  // Sanitize manual input on qty fields
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.classList || !input.classList.contains('qty-input')) return;
    var stepper = input.closest('[data-stepper]');
    var n = clampQty(input.value);
    input.value = n;
    if (stepper) {
      var cartId = stepper.getAttribute('data-cart-stepper');
      if (cartId) {
        Cart.set(cartId, n);
        renderAll();
      }
    }
  });

  /* ---------- Delegated: Add to cart ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    var card = btn.closest('[data-product-id]');
    if (!card) return;
    var id = card.getAttribute('data-product-id');
    if (!PRODUCTS[id]) return;

    var qtyInput = card.querySelector('.qty-input');
    var qty = qtyInput ? clampQty(qtyInput.value) : 1;

    Cart.add(id, qty);
    renderAll();

    showToast(qty + '× ' + PRODUCTS[id].name + ' added to cart');
  });

  /* ---------- Delegated: Remove from cart ---------- */
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-cart-remove]');
    if (!rm) return;
    e.preventDefault();
    var id = rm.getAttribute('data-cart-remove');
    Cart.remove(id);
    renderAll();
    showToast('Removed from cart');
  });

  /* ---------- Delegated: Request a quote (custom platters) ---------- */
  document.addEventListener('click', function (e) {
    var rq = e.target.closest('[data-request-quote]');
    if (!rq) return;
    e.preventDefault();
    var item = rq.getAttribute('data-request-quote') || 'a custom order';
    var contact = document.getElementById('contact');
    var msg = document.getElementById('f-message');
    if (msg) {
      var prefill = "I'd like a quote for: " + item + ".\nPlease contact me with details on pricing, lead time and serving sizes.";
      // Don't clobber user's existing notes — append if non-empty
      if (msg.value && msg.value.trim() && msg.value.indexOf(prefill) === -1) {
        msg.value = msg.value.trim() + '\n\n' + prefill;
      } else if (!msg.value || !msg.value.trim()) {
        msg.value = prefill;
      }
    }
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { if (msg) msg.focus(); }, 500);
    showToast('Tell us about your ' + item.toLowerCase());
  });

  /* =========================================================
     INQUIRY FORM
     ========================================================= */
  var form = document.getElementById('inquiryForm');
  var success = document.getElementById('formSuccess');

  function setInvalid(field, invalid) {
    if (!field) return;
    field.classList.toggle('invalid', invalid);
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }
  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name  = form.elements['name'];
      var phone = form.elements['phone'];
      var email = form.elements['email'];
      var date  = form.elements['date'];

      var ok = true;
      if (!name.value.trim())            { setInvalid(name, true);  ok = false; } else setInvalid(name, false);
      if (!phone.value.trim())           { setInvalid(phone, true); ok = false; } else setInvalid(phone, false);
      if (!isEmail(email.value.trim()))  { setInvalid(email, true); ok = false; } else setInvalid(email, false);
      if (!date.value)                   { setInvalid(date, true);  ok = false; } else setInvalid(date, false);

      if (!ok) {
        var firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Build a structured order summary appended to the customer's message
      var items = Cart.getItems();
      var sub = Cart.getSubtotal();
      var orderLines = ['', '— Order —'];
      if (items.length === 0) {
        orderLines.push('(No items in cart — quote/custom request only)');
      } else {
        items.forEach(function (it) {
          orderLines.push(
            it.qty + '× ' + it.name + ' (' + formatMoney(it.price) + ' ' + it.unit + ') = ' + formatMoney(it.lineTotal)
          );
        });
        orderLines.push('Subtotal: ' + formatMoney(sub));
      }
      var msgField = form.elements['message'];
      if (msgField) {
        var existing = (msgField.value || '').trim();
        msgField.value = (existing ? existing + '\n' : '') + orderLines.join('\n');
      }

      // ---- Replace this block with your real submission integration ----
      // Formspree / Netlify Forms / Web3Forms / EmailJS — drop in the action.
      // ------------------------------------------------------------------

      // Simulated successful submission:
      form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = true;
      });
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Clear cart on success
      Cart.clear();
      renderAll();
    });

    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('invalid')) {
        if (t.type === 'email') {
          if (isEmail(t.value.trim())) setInvalid(t, false);
        } else if (t.value.trim()) {
          setInvalid(t, false);
        }
      }
    });
  }

  /* ---------- Initial render ---------- */
  renderAll();
})();
