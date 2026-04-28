// Auto-extracted from the original index.html during the Next.js migration.
// This is the marketing site's static markup. Interactivity (cart, nav,
// forms, modals) is wired up by <MarketingScripts /> in the same route.
// Incrementally replace chunks of this string with proper React components.

export const MARKETING_HTML = `<header class="site-header" id="siteHeader">
    <div class="container nav-wrap">
      <a href="#top" class="brand" aria-label="Fouzia's Kitchen - home">
        <img src="/assets/logo.svg" alt="Fouzia's Kitchen logo" class="brand-mark" />
      </a>

      <nav class="primary-nav" aria-label="Primary">
        <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <ul id="navMenu" class="nav-list">
          <li><a href="#story">Our Story</a></li>
          <li><a href="#featured">Favourites</a></li>
          <li><a href="#menu">Menu</a></li>
          <li><a href="#occasions">Occasions</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <button type="button" class="cart-btn" id="cartBtn" aria-label="Open cart" aria-haspopup="dialog" aria-controls="cartDrawer">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7Z"/>
            <path d="M9 7V5a3 3 0 0 1 6 0v2"/>
          </svg>
          <span class="cart-btn-label">Cart</span>
          <span class="cart-count" id="cartCount" aria-live="polite">0</span>
        </button>
      </nav>
    </div>
  </header>

  <main id="main">

    <!-- =========================================================
         1. HERO
         ========================================================= -->
    <section class="hero" id="top">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow"><span class="diamond"></span> Homemade in the Afghan tradition</p>
          <h1 class="display">Handcrafted Afghan Snacks &amp; Sweets, <em>Made With Heritage</em></h1>
          <p class="lede">
            From savoury Simyan to delicate Kulcha-e-Khitai, Rosette Cookies, and light-as-air Meringues, Fouzia&rsquo;s Kitchen prepares traditional Afghan favourites with warmth, care, and the flavours of home.
          </p>
          <div class="cta-row">
            <a href="#menu" class="btn btn-primary">Browse the Menu</a>
            <a href="#featured" class="btn btn-ghost">Our Favourites</a>
          </div>
          <ul class="trust-points" aria-label="What we offer">
            <li><span aria-hidden="true">✦</span> Homemade Afghan favourites</li>
            <li><span aria-hidden="true">✦</span> Made fresh to order</li>
            <li><span aria-hidden="true">✦</span> Perfect for tea, Eid &amp; gatherings</li>
          </ul>
        </div>

        <figure class="hero-image">
          <!--
            IMAGE PROMPT (replace src with real photo):
            "Editorial overhead photo of an Afghan tea table on cream linen,
            small gold-rimmed tea glasses with amber tea, a brass tray of
            golden Kulcha-e-Shor tea biscuits, a small ceramic bowl of crisp
            Simyan, soft natural window light, warm shadows, subtle embroidered
            textile in the corner, color palette of cream, gold, deep brown
            and terracotta, premium artisan food editorial style."
          -->
          <img src="/assets/hero-tea-table.jpg" alt="Afghan tea glasses and a brass tray of homemade Kulcha-e-Shor tea biscuits on a cream linen table." />
          <figcaption class="hero-badge">
            <span class="badge-dot"></span> Made fresh to order
          </figcaption>
        </figure>
      </div>

      <!-- Decorative Afghan-inspired motif divider -->
      <svg class="motif-divider" viewBox="0 0 1200 24" aria-hidden="true">
        <use href="#motif-line"></use>
      </svg>
    </section>

    <!-- =========================================================
         2. BRAND STORY / ABOUT
         ========================================================= -->
    <section class="section story" id="story">
      <div class="container two-col">
        <figure class="story-image">
          <!-- IMAGE PROMPT: "Warm, candid photo of hands gently arranging
               freshly baked Afghan cookies on a ceramic plate, flour-dusted
               wooden surface, embroidered Afghan textile peeking in the frame,
               natural window light, deep brown and gold tones, intimate and
               homemade feel - not staged or commercial." -->
          <img src="/assets/story-hands.jpg" alt="Hands arranging freshly baked Afghan cookies on a ceramic plate." />
          <span class="frame-corner tl" aria-hidden="true"></span>
          <span class="frame-corner br" aria-hidden="true"></span>
        </figure>

        <div class="story-copy">
          <p class="eyebrow"><span class="diamond"></span> Our Story</p>
          <h2 class="h-display">Made With the Warmth of an Afghan Home</h2>
          <p>
            Before they are snacks or sweets, these are the flavours of gathering - the
            biscuits served with tea, the savoury bites shared with guests, and the cookies
            prepared with care for the people we love.
          </p>
          <p>
            Fouzia&rsquo;s Kitchen brings traditional Afghan favourites to your table with
            homemade warmth, thoughtful preparation, and a deep respect for heritage. Every
            tray is made by hand, in small batches, the way it has always been done.
          </p>
          <blockquote class="founder-quote">
            <p>&ldquo;Every order is prepared with the same care we would bring to our own family table.&rdquo;</p>
            <footer>- Fouzia</footer>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- =========================================================
         3. FEATURED PRODUCTS
         ========================================================= -->
    <section class="section featured" id="featured">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> Our Favourites</p>
          <h2 class="h-display">Five Treasures From Our Kitchen</h2>
          <p class="section-sub">Traditional Afghan snacks and sweets, handcrafted in small batches and made fresh for every order.</p>
        </header>

        <div class="product-grid">

          <!-- Product 1 -->
          <article class="product-card" data-product-id="kulcha-shor">
            <div class="product-media">
              <!-- IMAGE PROMPT: "Close-up of golden Afghan tea biscuits
                   (Kulcha-e-Shor) stacked beside a small clear Afghan tea glass
                   filled with amber tea, cream linen background, soft window
                   light, subtle gold accents, editorial food photography." -->
              <img src="/assets/product-kulcha-shor.jpg" alt="Stacked golden Kulcha-e-Shor tea biscuits beside an Afghan tea glass." />
              <span class="tag">Tea-Time Favourite</span>
            </div>
            <div class="product-body">
              <h3>Kulcha-e-Shor <span class="afghan-name">Tea Biscuits</span></h3>
              <p>Crisp, comforting tea biscuits made for slow conversations, family visits, and everyday Afghan hospitality.</p>
              <p class="best-for"><strong>Best for:</strong> Tea time, hosting guests, gifting.</p>
              <p class="product-price">$8 <small>per dozen</small></p>
              <div class="product-actions">
                <div class="qty-stepper" data-stepper>
                  <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                  <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                  <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="btn btn-primary btn-add" data-add-to-cart>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>

          <!-- Product 2 -->
          <article class="product-card">
            <div class="product-media">
              <!-- IMAGE PROMPT: "A beautiful ceramic bowl filled with crisp
                   golden Simyan, savoury Afghan snack, with a small dish of
                   chili flakes hinting at the spicy variation, warm spices in
                   the background, cream and terracotta tones, natural light,
                   premium editorial styling. Not sweet, not dessert." -->
              <img src="/assets/product-simyan.jpg" alt="A ceramic bowl of crisp savoury Simyan with a small dish of chili flakes alongside." />
              <span class="tag tag-savoury">Savoury</span>
            </div>
            <div class="product-body">
              <h3>Simyan <span class="afghan-name">Mild or Spicy</span></h3>
              <p>A savoury Afghan snack prepared in mild or spicy style - perfect for guests, gatherings, and anyone who enjoys bold, comforting snack flavours.</p>
              <p class="best-for"><strong>Best for:</strong> Tea gatherings, snack trays, family events.</p>
              <p class="product-price">$6 <small>per 200g</small></p>
              <div class="product-actions single">
                <a class="btn btn-ghost btn-add" href="#simyan">Choose Mild or Spicy <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>

          <!-- Product 3 -->
          <article class="product-card" data-product-id="khitai">
            <div class="product-media">
              <!-- IMAGE PROMPT: "Delicate Afghan Kulcha-e-Khitai cookies
                   arranged on a brass plate, soft natural light, cream linen
                   background, gentle shadows, light dusting of flour, warm
                   editorial food photography." -->
              <img src="/assets/product-khitai.jpg" alt="Kulcha-e-Khitai cookies arranged on a brass plate." />
              <span class="tag">Made Fresh</span>
            </div>
            <div class="product-body">
              <h3>Kulcha-e-Khitai <span class="afghan-name">Traditional Cookie</span></h3>
              <p>A delicate Afghan cookie with a buttery, lightly sweet character - made for tea tables, celebrations, and moments of comfort.</p>
              <p class="best-for"><strong>Best for:</strong> Tea, Eid, gift boxes, family visits.</p>
              <p class="product-price">$9 <small>per dozen</small></p>
              <div class="product-actions">
                <div class="qty-stepper" data-stepper>
                  <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                  <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                  <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="btn btn-primary btn-add" data-add-to-cart>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>

          <!-- Product 4 -->
          <article class="product-card" data-product-id="panjerei">
            <div class="product-media">
              <!-- IMAGE PROMPT: "Beautiful Rosette cookies (Kulcha-e-Panjerei)
                   stacked and spread across an elegant ceramic platter,
                   showing intricate flower-like shape and light golden texture,
                   dusted with powdered sugar, warm natural light, cream linen,
                   premium festive editorial styling." -->
              <img src="/assets/product-panjerei.jpg" alt="Rosette cookies (Kulcha-e-Panjerei) on an elegant platter." />
              <span class="tag tag-celebration">Celebration Favourite</span>
            </div>
            <div class="product-body">
              <h3>Kulcha-e-Panjerei <span class="afghan-name">Rosette Cookies</span></h3>
              <p>Beautifully shaped, delicate rosette cookies with a festive feel - perfect for celebrations, hosting, and elegant dessert platters.</p>
              <p class="best-for"><strong>Best for:</strong> Eid, weddings, engagements, gifting.</p>
              <p class="product-price">$6 <small>per dozen</small></p>
              <div class="product-actions">
                <div class="qty-stepper" data-stepper>
                  <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                  <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                  <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="btn btn-primary btn-add" data-add-to-cart>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>

          <!-- Product 5 -->
          <article class="product-card" data-product-id="meringue">
            <div class="product-media">
              <!-- IMAGE PROMPT: "Cloud-like white meringue cookies arranged
                   in a soft pile on a cream ceramic plate, delicate swirled
                   peaks, a gentle dusting of powdered sugar, soft natural
                   window light, cream and gold tones, elegant editorial
                   food photography, airy and light feel." -->
              <img src="/assets/product-meringue.jpg" alt="Light, swirled meringue cookies arranged on a cream ceramic plate." />
              <span class="tag tag-celebration">Light &amp; Airy</span>
            </div>
            <div class="product-body">
              <h3>Meringue Cookies <span class="afghan-name">A Family Favourite</span></h3>
              <p>Light, airy, and delicately sweet - meringue cookies that melt the moment they touch your tongue, beautiful on any tea table or dessert platter.</p>
              <p class="best-for"><strong>Best for:</strong> Tea time, Eid, dessert platters, gifting.</p>
              <p class="product-price">$6 <small>per dozen</small></p>
              <div class="product-actions">
                <div class="qty-stepper" data-stepper>
                  <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                  <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                  <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="btn btn-primary btn-add" data-add-to-cart>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>

        </div>

        <div class="center-cta">
          <a href="#contact" class="btn btn-ghost">Or Request a Custom Platter</a>
        </div>
      </div>
    </section>

    <!-- =========================================================
         4. FULL MENU
         ========================================================= -->
    <section class="section menu" id="menu">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> Our Menu</p>
          <h2 class="h-display">A Table of Afghan Favourites</h2>
          <p class="section-sub">Each item is made fresh to order. Availability may vary depending on order size, date, and seasonal demand.</p>
        </header>

        <div class="menu-grid">

          <article class="menu-cat">
            <h3>Tea-Time Favourites</h3>
            <ul>
              <li data-product-id="kulcha-shor">
                <div><strong>Kulcha-e-Shor</strong><span>Traditional Afghan tea biscuits.</span></div>
                <div class="menu-right">
                  <span class="price">$8 / dozen</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Kulcha-e-Shor to cart">+ Add</button>
                </div>
              </li>
              <li data-product-id="khitai">
                <div><strong>Kulcha-e-Khitai</strong><span>Buttery, lightly sweet Afghan cookies.</span></div>
                <div class="menu-right">
                  <span class="price">$9 / dozen</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Kulcha-e-Khitai to cart">+ Add</button>
                </div>
              </li>
            </ul>
          </article>

          <article class="menu-cat">
            <h3>Savoury Snacks</h3>
            <ul>
              <li data-product-id="simyan-mild">
                <div><strong>Simyan - Mild</strong><span>A gentler, comforting savoury snack.</span></div>
                <div class="menu-right">
                  <span class="price">$6 / 200g</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Mild Simyan to cart">+ Add</button>
                </div>
              </li>
              <li data-product-id="simyan-spicy">
                <div><strong>Simyan - Spicy</strong><span>A bolder savoury snack with extra heat.</span></div>
                <div class="menu-right">
                  <span class="price">$6 / 200g</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Spicy Simyan to cart">+ Add</button>
                </div>
              </li>
            </ul>
          </article>

          <article class="menu-cat">
            <h3>Celebration Sweets</h3>
            <ul>
              <li data-product-id="panjerei">
                <div><strong>Kulcha-e-Panjerei <em>(Rosette Cookies)</em></strong><span>Festive, delicate rosette cookies.</span></div>
                <div class="menu-right">
                  <span class="price">$6 / dozen</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Rosette Cookies to cart">+ Add</button>
                </div>
              </li>
              <li data-product-id="meringue">
                <div><strong>Meringue Cookies</strong><span>Light, airy, melt-in-your-mouth sweets.</span></div>
                <div class="menu-right">
                  <span class="price">$6 / dozen</span>
                  <button type="button" class="menu-add" data-add-to-cart aria-label="Add Meringue Cookies to cart">+ Add</button>
                </div>
              </li>
              <li>
                <div><strong>Seasonal Specials</strong><span>Rotating items for Eid &amp; celebrations.</span></div>
                <div class="menu-right">
                  <span class="price">By request</span>
                  <button type="button" class="menu-add ghost" data-request-quote="Seasonal Specials">Request</button>
                </div>
              </li>
            </ul>
          </article>

          <article class="menu-cat">
            <h3>Custom Orders</h3>
            <ul>
              <li>
                <div><strong>Event Trays</strong><span>Curated platters for gatherings.</span></div>
                <div class="menu-right">
                  <span class="price">Custom</span>
                  <button type="button" class="menu-add ghost" data-request-quote="Event Tray">Request</button>
                </div>
              </li>
              <li>
                <div><strong>Eid Orders</strong><span>Festive selections for Eid mornings.</span></div>
                <div class="menu-right">
                  <span class="price">Custom</span>
                  <button type="button" class="menu-add ghost" data-request-quote="Eid Order">Request</button>
                </div>
              </li>
              <li>
                <div><strong>Gift Boxes</strong><span>Beautifully packaged for giving.</span></div>
                <div class="menu-right">
                  <span class="price">Custom</span>
                  <button type="button" class="menu-add ghost" data-request-quote="Gift Box">Request</button>
                </div>
              </li>
              <li>
                <div><strong>Family Gathering Platters</strong><span>Generous mixed platters.</span></div>
                <div class="menu-right">
                  <span class="price">Custom</span>
                  <button type="button" class="menu-add ghost" data-request-quote="Family Gathering Platter">Request</button>
                </div>
              </li>
            </ul>
          </article>

        </div>

        <p class="menu-note">
          <strong>Allergen note:</strong> Please mention allergies or dietary restrictions when placing your inquiry. Items may be prepared in a kitchen that handles common allergens including wheat, dairy, eggs, and nuts.
        </p>
      </div>
    </section>

    <!-- =========================================================
         5. SIMYAN MILD VS SPICY
         ========================================================= -->
    <section class="section simyan" id="simyan">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> Savoury Snack</p>
          <h2 class="h-display">Choose Your Simyan: Mild or Spicy</h2>
          <p class="section-sub">Our savoury Simyan is available in mild or spicy, making it easy to prepare a snack tray that suits every guest.</p>
        </header>

        <div class="simyan-grid">
          <article class="simyan-card" data-product-id="simyan-mild">
            <div class="heat-row" aria-label="Heat level: mild">
              <span class="flame on"></span><span class="flame"></span><span class="flame"></span>
            </div>
            <h3>Mild Simyan</h3>
            <p>Warm, savoury, and comforting with a gentler flavour profile - the kind of snack everyone at the table can enjoy.</p>
            <ul class="pill-list">
              <li>Family-friendly</li><li>Crisp texture</li><li>Tea-time classic</li>
            </ul>
            <p class="product-price">$6 <small>per 200g</small></p>
            <div class="product-actions">
              <div class="qty-stepper" data-stepper>
                <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-add" data-add-to-cart>Add Mild to Cart</button>
            </div>
          </article>

          <article class="simyan-card spicy" data-product-id="simyan-spicy">
            <div class="heat-row" aria-label="Heat level: spicy">
              <span class="flame on"></span><span class="flame on"></span><span class="flame on"></span>
            </div>
            <h3>Spicy Simyan</h3>
            <p>A bolder version with extra heat and flavour, for guests who enjoy a stronger, more aromatic savoury bite.</p>
            <ul class="pill-list">
              <li>Bold &amp; aromatic</li><li>Crowd favourite</li><li>Pairs with chai</li>
            </ul>
            <p class="product-price">$6 <small>per 200g</small></p>
            <div class="product-actions">
              <div class="qty-stepper" data-stepper>
                <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">−</button>
                <input type="text" inputmode="numeric" class="qty-input" value="1" aria-label="Quantity" />
                <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-add" data-add-to-cart>Add Spicy to Cart</button>
            </div>
          </article>
        </div>

        <p class="simyan-note">Want both? Add each variety to your cart in the quantity you need.</p>
      </div>
    </section>

    <!-- =========================================================
         6. OCCASION-BASED ORDERING
         ========================================================= -->
    <section class="section occasions" id="occasions">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> For Every Gathering</p>
          <h2 class="h-display">Made for the Moments That Bring People Together</h2>
          <p class="section-sub">Whether you are preparing for Eid, hosting family, or putting together a tea table for guests, Fouzia&rsquo;s Kitchen helps you create a platter that feels thoughtful, generous, and memorable.</p>
        </header>

        <ul class="occasion-grid">
          <li><span class="oc-icon">☾</span><h3>Eid Mornings</h3><p>Festive platters for the Eid table.</p></li>
          <li><span class="oc-icon">❀</span><h3>Weddings</h3><p>Elegant sweets for celebration trays.</p></li>
          <li><span class="oc-icon">✦</span><h3>Engagements</h3><p>Refined selections for the family ceremony.</p></li>
          <li><span class="oc-icon">♡</span><h3>Baby Showers</h3><p>Sweet bites for joyful gatherings.</p></li>
          <li><span class="oc-icon">⌂</span><h3>Family Gatherings</h3><p>Generous platters to share at home.</p></li>
          <li><span class="oc-icon">☕</span><h3>Tea Gatherings</h3><p>The classic Afghan tea-table pairing.</p></li>
          <li><span class="oc-icon">✿</span><h3>Dinner Hosting</h3><p>Thoughtful snacks and sweets for guests.</p></li>
          <li><span class="oc-icon">⚜</span><h3>Corporate &amp; Cultural Events</h3><p>Cultural catering done with care.</p></li>
          <li><span class="oc-icon">❖</span><h3>Gift Boxes</h3><p>Beautifully packaged for giving.</p></li>
          <li><span class="oc-icon">✶</span><h3>Weekend Visits</h3><p>The little extra that makes a visit memorable.</p></li>
          <li><span class="oc-icon">❉</span><h3>Community Events</h3><p>Trays sized for larger groups.</p></li>
          <li><span class="oc-icon">✧</span><h3>Just Because</h3><p>Sometimes a beautiful tray is reason enough.</p></li>
        </ul>

        <div class="cta-band">
          <p>Planning a gathering? Build your order from the menu, or request a custom platter and we&rsquo;ll tailor it to your date and guest count.</p>
          <a href="#menu" class="btn btn-primary">Build Your Order</a>
        </div>
      </div>
    </section>

    <!-- =========================================================
         7. AFGHAN TEA & HOSPITALITY
         ========================================================= -->
    <section class="section hospitality" id="hospitality">
      <div class="container two-col reverse">
        <div class="story-copy">
          <p class="eyebrow"><span class="diamond"></span> Heritage</p>
          <h2 class="h-display">Rooted in Afghan Hospitality</h2>
          <p>
            In Afghan homes, tea is more than a drink - it is an invitation to sit, share,
            and feel welcomed. The snacks and sweets served beside it carry memory, care, and
            tradition.
          </p>
          <p>
            Fouzia&rsquo;s Kitchen honours that spirit with handmade favourites prepared for the
            moments that bring people together - the everyday cup of tea, the family table,
            and the celebrations that mark a life well shared.
          </p>
        </div>

        <figure class="story-image">
          <!-- IMAGE PROMPT: "An intimate Afghan tea table scene: small clear
               tea glasses with amber tea, a brass tray of mixed Afghan cookies
               and biscuits, an embroidered burgundy and cream Afghan textile
               draped softly, soft natural window light, warm shadows, deep
               brown wood, editorial photo, no people in frame, restrained
               and elegant - not exoticized." -->
          <img src="/assets/hospitality-tea.jpg" alt="An Afghan tea table with tea glasses, mixed cookies on a brass tray, and an embroidered textile." />
          <span class="frame-corner tl" aria-hidden="true"></span>
          <span class="frame-corner br" aria-hidden="true"></span>
        </figure>
      </div>
    </section>

    <!-- =========================================================
         8. TESTIMONIALS
         ========================================================= -->
    <section class="section testimonials" id="testimonials">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> Loved by Families</p>
          <h2 class="h-display">Kind Words From Our Table to Yours</h2>
        </header>

        <div class="t-grid">
          <figure class="t-card">
            <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>The Kulcha-e-Khitai tasted just like home. My mother said she hadn&rsquo;t had any this good in years.</blockquote>
            <figcaption>- Marwa S.</figcaption>
          </figure>
          <figure class="t-card">
            <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>Perfect for our Eid table - beautifully made and so fresh. The platter was the first thing our guests reached for.</blockquote>
            <figcaption>- Hamid &amp; family</figcaption>
          </figure>
          <figure class="t-card">
            <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>The spicy Simyan was a favourite with our guests. We&rsquo;ll be ordering again for our next gathering.</blockquote>
            <figcaption>- Sahar K.</figcaption>
          </figure>
          <figure class="t-card">
            <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>Everything was packaged with care and tasted homemade. You can tell every tray is made with love.</blockquote>
            <figcaption>- Nadia R.</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- =========================================================
         10. HOW TO ORDER
         ========================================================= -->
    <section class="section how" id="how">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> How to Order</p>
          <h2 class="h-display">Simple, Personal, Made For You</h2>
          <p class="section-sub">We&rsquo;ll respond with availability, recommendations, and next steps.</p>
        </header>

        <ol class="steps">
          <li><span class="step-num">01</span><h3>Add to Cart</h3><p>Browse the menu and add your favourites with the quantity you need.</p></li>
          <li><span class="step-num">02</span><h3>Review &amp; Checkout</h3><p>See your itemized order and total, then share your details and date.</p></li>
          <li><span class="step-num">03</span><h3>We Confirm</h3><p>We&rsquo;ll respond quickly to confirm availability, timing, and any final notes.</p></li>
          <li><span class="step-num">04</span><h3>Pickup or Delivery</h3><p>Collect your order fresh, or arrange local delivery where available.</p></li>
        </ol>

        <div class="center-cta">
          <a href="#menu" class="btn btn-primary">Start Building Your Order</a>
        </div>
      </div>
    </section>

    <!-- =========================================================
         11. FAQ
         ========================================================= -->
    <section class="section faq" id="faq">
      <div class="container narrow">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> FAQ</p>
          <h2 class="h-display">Helpful Things to Know</h2>
        </header>

        <div class="faq-list">
          <details><summary>How far in advance should I place an order?</summary>
            <p>Because every order is prepared fresh, we recommend placing your inquiry as early as possible - especially for Eid, weddings, and larger gatherings. A minimum of [3-5 days] is preferred for standard orders, and [2-3 weeks] for large events.</p>
          </details>
          <details><summary>Are items made fresh to order?</summary>
            <p>Yes. Every tray is baked in small batches and prepared close to your pickup or delivery date so it arrives at its best.</p>
          </details>
          <details><summary>Do you offer Mild and Spicy Simyan?</summary>
            <p>Yes - you can order Simyan in mild, spicy, or both. It&rsquo;s a great way to please every guest at the table.</p>
          </details>
          <details><summary>Do you make platters for Eid or weddings?</summary>
            <p>Absolutely. We regularly prepare custom platters for Eid, weddings, engagements, and other celebrations. Share your details and we&rsquo;ll recommend the right selection.</p>
          </details>
          <details><summary>Can I order for family gatherings or tea parties?</summary>
            <p>Yes. Many of our orders are for family tea tables and weekend hosting. We can suggest mixed selections to match your guest count.</p>
          </details>
          <details><summary>Do you offer gift boxes?</summary>
            <p>Yes. Our gift boxes are beautifully packaged and make a thoughtful gesture for any occasion.</p>
          </details>
          <details><summary>Do you offer pickup or delivery?</summary>
            <p>Pickup is available from [Pickup Location]. Local delivery may be arranged within [Delivery Areas] depending on order size and timing.</p>
          </details>
          <details><summary>Can I request specific quantities?</summary>
            <p>Yes. Quantities are flexible and tailored to your gathering. Share your guest count and we&rsquo;ll recommend a comfortable amount.</p>
          </details>
          <details><summary>Do you accommodate allergies?</summary>
            <p>Please mention any allergies or dietary needs in your inquiry. Items are prepared in a home kitchen that handles common allergens including wheat, dairy, eggs, and nuts.</p>
          </details>
          <details><summary>How should the snacks and sweets be stored?</summary>
            <p>Most items keep best in an airtight container at room temperature for several days. We&rsquo;ll include storage tips with your order.</p>
          </details>
          <details><summary>Where are you located and what areas do you serve?</summary>
            <p>Fouzia&rsquo;s Kitchen serves the Greater Toronto Area for pickup, with delivery available to select nearby areas.</p>
          </details>
          <details><summary>How do I place an order?</summary>
            <p>Simply fill out the inquiry form below or send us a message. We&rsquo;ll respond with availability, pricing, and next steps.</p>
          </details>
        </div>
      </div>
    </section>

    <!-- =========================================================
         12. CHECKOUT - Order Summary + Customer Details
         ========================================================= -->
    <section class="section contact" id="contact">
      <div class="container">
        <header class="section-head">
          <p class="eyebrow"><span class="diamond"></span> Checkout</p>
          <h2 class="h-display">Review &amp; Place Your Order</h2>
          <p class="section-sub">Review your selections, share a few details, and we&rsquo;ll respond quickly to confirm availability and next steps.</p>
        </header>

        <div class="checkout-grid">

          <!-- ===== Left: Customer details form ===== -->
          <form class="inquiry-form" id="inquiryForm" novalidate>
            <h3 class="form-section-title">Your Details</h3>

            <div class="row">
              <div class="field">
                <label for="f-name">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="f-name" name="name" type="text" required autocomplete="name" />
              </div>
              <div class="field">
                <label for="f-phone">Phone number <span class="req" aria-hidden="true">*</span></label>
                <input id="f-phone" name="phone" type="tel" required autocomplete="tel" />
              </div>
            </div>

            <div class="row">
              <div class="field">
                <label for="f-email">Email <span class="req" aria-hidden="true">*</span></label>
                <input id="f-email" name="email" type="email" required autocomplete="email" />
              </div>
              <div class="field">
                <label for="f-date">Preferred order date <span class="req" aria-hidden="true">*</span></label>
                <input id="f-date" name="date" type="date" required />
              </div>
            </div>

            <div class="row">
              <div class="field">
                <label for="f-occasion">Occasion</label>
                <select id="f-occasion" name="occasion">
                  <option value="">Select…</option>
                  <option>Eid</option><option>Wedding</option><option>Engagement</option>
                  <option>Baby shower</option><option>Family gathering</option>
                  <option>Tea gathering</option><option>Dinner hosting</option>
                  <option>Corporate / cultural event</option><option>Gift</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="field">
                <label for="f-guests">Guest count (optional)</label>
                <input id="f-guests" name="guests" type="text" inputmode="numeric" placeholder="e.g. 25 guests" />
              </div>
            </div>

            <fieldset class="field">
              <legend>Pickup or delivery</legend>
              <div class="radio-row">
                <label><input type="radio" name="fulfilment" value="Pickup" checked /> Pickup</label>
                <label><input type="radio" name="fulfilment" value="Delivery" /> Delivery (if available)</label>
                <label><input type="radio" name="fulfilment" value="Unsure" /> Not sure yet</label>
              </div>
            </fieldset>

            <div class="field">
              <label for="f-allergies">Allergies or dietary notes</label>
              <input id="f-allergies" name="allergies" type="text" placeholder="e.g. nut allergy, vegetarian guests" />
              <p class="helper">Items may be prepared in a kitchen that handles wheat, dairy, eggs, and nuts.</p>
            </div>

            <div class="field">
              <label for="f-message">Additional notes / custom request</label>
              <textarea id="f-message" name="message" rows="4" placeholder="Tell us anything else about your gathering, or describe a custom platter you'd like."></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-checkout" id="submitBtn">
              <span class="btn-checkout-label">Place Order Inquiry</span>
              <span class="btn-checkout-total" id="btnTotal" hidden>$0.00</span>
            </button>

            <p class="form-success" id="formSuccess" hidden role="status">
              <strong>Thank you!</strong> Your order inquiry has been received. Fouzia&rsquo;s Kitchen will respond shortly with availability and next steps.
            </p>
          </form>

          <!-- ===== Right: Sticky order summary ===== -->
          <aside class="order-summary" id="orderSummary" aria-label="Order summary">
            <div class="summary-card">
              <div class="summary-head">
                <h3>Your Order</h3>
                <span class="summary-count" id="summaryCount">0 items</span>
              </div>

              <!-- Empty state -->
              <div class="summary-empty" id="summaryEmpty">
                <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 20h36l-3 28a4 4 0 0 1-4 3.6H21a4 4 0 0 1-4-3.6L14 20Z"/>
                  <path d="M24 20v-4a8 8 0 0 1 16 0v4"/>
                </svg>
                <p>Your cart is empty.</p>
                <p class="summary-empty-sub">Browse our menu to add favourites, or describe a custom request below and we&rsquo;ll quote it for you.</p>
                <a href="#menu" class="btn btn-ghost">Browse the Menu</a>
              </div>

              <!-- Cart items + totals (rendered by JS) -->
              <ul class="summary-items" id="summaryItems"></ul>

              <div class="summary-totals" id="summaryTotals" hidden>
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span id="summarySubtotal">$0.00</span>
                </div>
                <div class="summary-row summary-row-total">
                  <span>Estimated Total</span>
                  <span id="summaryTotal">$0.00</span>
                </div>
                <p class="summary-fineprint">
                  Final total confirmed at checkout. Delivery (if applicable) and any custom adjustments quoted separately.
                </p>
              </div>
            </div>

            <div class="custom-quote-card">
              <h4>Need a custom platter?</h4>
              <p>Describe your event in the notes field and we&rsquo;ll send a tailored quote for trays, gift boxes, or seasonal selections.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>

  </main>

  <!-- =========================================================
       FOOTER
       ========================================================= -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="f-brand">
        <img src="/assets/logo.svg" alt="Fouzia's Kitchen logo" class="brand-mark" />
        <p>Traditional Afghan snacks and sweets, handcrafted with warmth, care, and heritage.</p>
      </div>

      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="#story">Our Story</a></li>
          <li><a href="#menu">Menu</a></li>
          <li><a href="#occasions">Occasions</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </div>

      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:+14168945755">(416) 894-5755</a></li>
          <li><a href="mailto:hello@fouziaskitchen.com">[hello@fouziaskitchen.com]</a></li>
          <li>Service area: Greater Toronto Area</li>
          <li>Hours: [Mon-Sat, by inquiry]</li>
        </ul>
      </div>

      <div>
        <h4>Follow</h4>
        <ul class="socials">
          <li><a href="https://www.instagram.com/fouzias.kitchen" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a></li>
          <li><a href="https://wa.me/14168945755" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a></li>
        </ul>
      </div>
    </div>

    <div class="container f-bottom">
      <p>© <span id="year"></span> Fouzia&rsquo;s Kitchen. All rights reserved.</p>
      <p class="disclaimer">Prepared in a home kitchen. Please mention allergies when ordering.</p>
    </div>
  </footer>

  <!-- Sticky mobile CTA - switches to "View Cart ($X)" when cart has items -->
  <a href="#contact" class="sticky-cta" id="stickyCta" aria-label="View cart">View Cart</a>

  <!-- =========================================================
       CART DRAWER + BACKDROP + TOAST
       ========================================================= -->
  <div class="cart-backdrop" id="cartBackdrop" hidden></div>

  <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartTitle" hidden>
    <header class="cart-head">
      <h2 id="cartTitle">Your Cart</h2>
      <button type="button" class="cart-close" id="cartClose" aria-label="Close cart">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
    </header>

    <div class="cart-body" id="cartBody">
      <!-- Empty state -->
      <div class="cart-empty" id="cartEmpty">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 20h36l-3 28a4 4 0 0 1-4 3.6H21a4 4 0 0 1-4-3.6L14 20Z"/>
          <path d="M24 20v-4a8 8 0 0 1 16 0v4"/>
        </svg>
        <p>Your cart is empty.</p>
        <p class="cart-empty-sub">Browse the menu to add Afghan favourites, made fresh to order.</p>
        <a href="#menu" class="btn btn-primary cart-empty-cta">Browse the Menu</a>
      </div>

      <!-- Items rendered by JS -->
      <ul class="cart-items" id="cartItems"></ul>
    </div>

    <footer class="cart-foot" id="cartFoot" hidden>
      <div class="cart-subtotal-row">
        <span>Subtotal</span>
        <span id="cartSubtotal">$0.00</span>
      </div>
      <p class="cart-fineprint">Final total confirmed at checkout. Made fresh to order.</p>
      <a href="#contact" class="btn btn-primary btn-lg cart-checkout" id="cartCheckout">Continue to Checkout</a>
      <button type="button" class="btn btn-link cart-continue" id="cartContinue">Continue Shopping</button>
    </footer>
  </aside>

  <!-- Toast -->
  <div class="toast" id="toast" role="status" aria-live="polite" hidden>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12l4 4L19 7"/>
    </svg>
    <span id="toastMsg">Added to cart</span>
  </div>

  <!-- =========================================================
       SVG SPRITE - Afghan-inspired motif divider
       ========================================================= -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="motif-line" viewBox="0 0 1200 24">
        <line x1="40" y1="12" x2="560" y2="12" stroke="currentColor" stroke-width="1"/>
        <line x1="640" y1="12" x2="1160" y2="12" stroke="currentColor" stroke-width="1"/>
        <g transform="translate(600 12)" fill="currentColor">
          <polygon points="0,-7 7,0 0,7 -7,0" />
          <circle cx="-22" cy="0" r="1.5" />
          <circle cx="22" cy="0" r="1.5" />
        </g>
      </symbol>
    </defs>
  </svg>`;
