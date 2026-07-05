// Maritime Minimalism - Sailing Turkey Interactive Features
(function() {
    'use strict';

    let _content = null;
    let _routeMap = null;

    function getLang() { return localStorage.getItem('lang') || 'ru'; }
    function setLang(lang) { localStorage.setItem('lang', lang); document.documentElement.lang = lang; }
    function updateLangToggle(lang) {
        const btn = document.getElementById('langToggle');
        if (btn) btn.textContent = lang === 'ru' ? 'EN' : 'RU';
    }
    function renderLang(lang) {
        if (!_content) return;
        const data = _content[lang] || _content['ru'];
        renderMeta(data.meta);
        renderNav(data.tabs.nav);
        renderHeadings(data.tabs);
        renderBoat(data.tabs.boat);
        renderPrice(data.price);
        renderUI(data.ui);
        renderRoute(data.route, data.ui);
        renderFaq(data.faq);
        renderGallery(data.gallery);
        updateLangToggle(lang);
    }

    function renderNav(nav) {
        if (!nav) return;
        ['gallery', 'boat', 'route', 'info'].forEach(tab => {
            if (!nav[tab]) return;
            const desktop = document.getElementById(`nav-label-${tab}`);
            if (desktop) desktop.textContent = nav[tab];
            const mobile = document.getElementById(`mob-label-${tab}`);
            if (mobile) mobile.textContent = nav[tab];
            document.querySelectorAll(`.mobile-tab-button[data-tab="${tab}"]`).forEach(btn => {
                btn.setAttribute('aria-label', nav[tab]);
            });
        });
    }

    function initApp() {
        // 1. Tab Switching
        const tabButtons = document.querySelectorAll('.tab-button');
        const mobileTabButtons = document.querySelectorAll('.mobile-tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        function switchTab(tabId) {
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(tabId)?.classList.add('active');
            tabButtons.forEach(btn => {
                btn.style.color = btn.dataset.tab === tabId ? '#0a4d54' : '#3d4a48';
                btn.style.fontWeight = btn.dataset.tab === tabId ? '600' : '500';
            });
            mobileTabButtons.forEach(btn => {
                if (btn.dataset.tab === tabId) btn.classList.add('bg-teal-50','text-teal-800','scale-110');
                else btn.classList.remove('bg-teal-50','text-teal-800','scale-110');
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (tabId === 'route') {
                // double-rAF ensures display:none→block reflow is done before Leaflet reads container size
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (!_routeMap) initRouteMap();
                    else _routeMap.invalidateSize();
                }));
                // fallback: rAF is throttled when the tab is backgrounded or on some
                // mobile browsers, so the double-rAF above may never fire. Create the
                // map here if it still doesn't exist, otherwise just fix its size.
                setTimeout(() => {
                    if (!_routeMap) initRouteMap();
                    else _routeMap.invalidateSize();
                }, 400);
            }
        }
        tabButtons.forEach(b => b.addEventListener('click', function() { switchTab(this.dataset.tab); }));
        mobileTabButtons.forEach(b => b.addEventListener('click', function() { switchTab(this.dataset.tab); }));
        switchTab('gallery');

        // 2. Lightbox — reads card.dataset dynamically so lang switch updates text
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDescription = document.getElementById('lightboxDescription');
        const closeLightboxBtn = document.getElementById('closeLightbox');
        const prevImageBtn = document.getElementById('prevImage');
        const nextImageBtn = document.getElementById('nextImage');
        let currentImageIndex = 0;

        document.querySelectorAll('.gallery-card').forEach((card, index) => {
            card.addEventListener('click', function() { currentImageIndex = index; openLightbox(); });
        });

        function openLightbox() {
            const card = document.querySelectorAll('.gallery-card')[currentImageIndex];
            lightboxImage.src = card.dataset.image;
            lightboxImage.alt = card.dataset.title;
            lightboxTitle.textContent = card.dataset.title;
            lightboxDescription.textContent = card.dataset.description;
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
        function closeLightbox() {
            lightbox.classList.remove('active');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        function showNextImage() {
            currentImageIndex = (currentImageIndex + 1) % document.querySelectorAll('.gallery-card').length;
            openLightbox();
        }
        function showPrevImage() {
            const cards = document.querySelectorAll('.gallery-card');
            currentImageIndex = (currentImageIndex - 1 + cards.length) % cards.length;
            openLightbox();
        }
        closeLightboxBtn.addEventListener('click', closeLightbox);
        nextImageBtn.addEventListener('click', showNextImage);
        prevImageBtn.addEventListener('click', showPrevImage);
        lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });

        // 3. Keyboard Nav
        document.addEventListener('keydown', function(e) {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') closeLightbox();
                else if (e.key === 'ArrowRight') showNextImage();
                else if (e.key === 'ArrowLeft') showPrevImage();
            }
        });

        // 4. FAQ
        bindFaq();

        // 5. Share Button — reads meta dynamically so it reflects current lang
        const shareButton = document.getElementById('shareButton');
        if (shareButton) {
            shareButton.addEventListener('click', async function() {
                const shareData = {
                    title: document.title,
                    text: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                    url: window.location.href
                };
                try {
                    if (navigator.share) {
                        await navigator.share(shareData);
                    } else {
                        await navigator.clipboard.writeText(window.location.href);
                        const orig = shareButton.innerHTML;
                        shareButton.innerHTML = '<span class="material-symbols-outlined text-xl">check</span><span class="hidden md:inline text-sm font-label font-medium">Copied!</span>';
                        setTimeout(() => { shareButton.innerHTML = orig; }, 2000);
                    }
                } catch (err) { console.error('Share failed:', err); }
            });
        }

        // 6. Smooth Scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const t = document.querySelector(this.getAttribute('href'));
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // 7. Lazy Load
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(e => {
                    if (e.isIntersecting && e.target.dataset.src) {
                        e.target.src = e.target.dataset.src;
                        e.target.removeAttribute('data-src');
                        obs.unobserve(e.target);
                    }
                });
            });
            document.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
        }

        // 8. Fade-in animation
        const fadeObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.gallery-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            fadeObs.observe(card);
        });

        // 9. Language Toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', function() {
                const newLang = getLang() === 'ru' ? 'en' : 'ru';
                setLang(newLang);
                renderLang(newLang);
                bindFaq();
            });
        }

        // 10. Focus Trap (Lightbox)
        if (lightbox) {
            lightbox.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    const els = lightbox.querySelectorAll('button:not([disabled]),[tabindex]:not([tabindex="-1"])');
                    const first = els[0], last = els[els.length - 1];
                    if (e.shiftKey) { if (document.activeElement===first) { e.preventDefault(); last.focus(); } }
                    else { if (document.activeElement===last) { e.preventDefault(); first.focus(); } }
                }
            });
        }

        // 11. Boat photo carousel
        initBoatCarousel();

        console.log('Maritime Minimalism - Sailing Turkey initialized');
    }

    function initBoatCarousel() {
        const carousel = document.getElementById('boat-carousel');
        const track = document.getElementById('boat-track');
        const dotsWrap = document.getElementById('boat-dots');
        if (!carousel || !track || !dotsWrap) return;
        const slides = Array.from(track.children);
        const count = slides.length;
        if (count <= 1) return;

        let index = 0;
        let timer = null;

        dotsWrap.innerHTML = slides.map((_, i) =>
            `<button type="button" class="boat-dot h-2.5 rounded-full bg-white/50 transition-all" aria-label="Go to photo ${i + 1}"></button>`
        ).join('');
        const dots = Array.from(dotsWrap.children);

        function go(i) {
            index = (i + count) % count;
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d, di) => {
                const active = di === index;
                d.classList.toggle('bg-white', active);
                d.classList.toggle('w-6', active);
                d.classList.toggle('bg-white/50', !active);
                d.classList.toggle('w-2.5', !active);
            });
        }
        const next = () => go(index + 1);
        const prev = () => go(index - 1);
        const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
        const start = () => { stop(); timer = setInterval(next, 5000); };

        carousel.querySelector('.boat-next').addEventListener('click', () => { next(); start(); });
        carousel.querySelector('.boat-prev').addEventListener('click', () => { prev(); start(); });
        dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        let startX = 0;
        carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
        carousel.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
            start();
        }, { passive: true });

        go(0);
        start();
    }

    function initRouteMap() {
        if (!window.L || _routeMap) return;
        _routeMap = L.map('route-map', {
            scrollWheelZoom: false,
            attributionControl: true,
            zoomControl: true
        }).setView([36.66, 28.99], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 16,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(_routeMap);

        // Outbound: Göcek → Twelve Islands → Wall Bay → Fethiye → Gemiler
        const outbound = [
            [36.755, 28.945],
            [36.712, 28.885],
            [36.680, 28.862],
            [36.626, 29.107],
            [36.556, 29.061]
        ];
        // Return: Gemiler → Sarsala → Domuz → Göcek
        const returnLeg = [
            [36.556, 29.061],
            [36.720, 28.975],
            [36.708, 28.918],
            [36.755, 28.945]
        ];

        L.polyline(outbound, { color: '#0a4d54', weight: 3, opacity: 0.85 }).addTo(_routeMap);
        L.polyline(returnLeg, { color: '#0a4d54', weight: 2, opacity: 0.55, dashArray: '8 6' }).addTo(_routeMap);

        const stops = [
            { coord: [36.755, 28.945], label: 'Гёчек', en: 'Göcek', sub: 'Старт / Финиш' },
            { coord: [36.712, 28.885], label: 'Двенадцать островов', en: 'Twelve Islands', sub: 'Купание' },
            { coord: [36.680, 28.862], label: 'Бухта Бедри Рахми', en: 'Bedri Rahmi Bay', sub: 'Wall Bay, сосны' },
            { coord: [36.626, 29.107], label: 'Фетхие', en: 'Fethiye', sub: 'Город 🇹🇷' },
            { coord: [36.556, 29.061], label: 'О. Гемилер', en: 'Gemiler', sub: 'Св. Николая' },
            { coord: [36.720, 28.975], label: 'Сарсала', en: 'Sarsala', sub: 'Сосновая бухта' },
            { coord: [36.708, 28.918], label: 'О. Домуз / Клеопатра', en: 'Domuz / Cleopatra', sub: 'Античные руины' },
        ];

        stops.forEach((s, i) => {
            const isMain = i === 0 || i === 3;
            const size = isMain ? 36 : 28;
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${isMain ? '#0a4d54' : '#12766f'};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isMain ? 11 : 9}px;font-weight:700;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(10,77,84,0.4);border:2px solid white;">${i + 1}</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });
            L.marker(s.coord, { icon })
                .addTo(_routeMap)
                .bindPopup(`<strong style="font-size:13px">${s.label}</strong><br><span style="color:#666;font-size:11px">${s.sub}</span>`);
        });
    }

    // bindFaq is separate so it can be re-called after renderFaq replaces DOM on lang switch
    function bindFaq() {
        const faqButtons = document.querySelectorAll('.faq-button');
        faqButtons.forEach(button => {
            button.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                const icon = this.querySelector('.material-symbols-outlined');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                faqButtons.forEach(btn => {
                    if (btn !== this) {
                        btn.nextElementSibling.classList.remove('active');
                        btn.querySelector('.material-symbols-outlined').classList.remove('rotate-180');
                        btn.setAttribute('aria-expanded', 'false');
                    }
                });
                if (isExpanded) {
                    answer.classList.remove('active'); icon.classList.remove('rotate-180');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    answer.classList.add('active'); icon.classList.add('rotate-180');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    async function loadContentAndRender() {
        try {
            const response = await fetch('content.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            _content = await response.json();
            renderLang(getLang());
        } catch (error) {
            console.warn('content.json not loaded, using static fallback content:', error);
        }
    }

    function renderMeta(meta) {
        if (!meta) return;
        if (meta.pageTitle) document.title = meta.pageTitle;
        if (meta.description) document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
        if (meta.ogTitle) {
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.ogTitle);
            document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.ogTitle);
        }
        if (meta.ogDescription) {
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.ogDescription);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', meta.ogDescription);
        }
        if (meta.ogUrl) document.querySelector('meta[property="og:url"]')?.setAttribute('content', meta.ogUrl);
        if (meta.appleTitle) document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', meta.appleTitle);
    }

    function renderHeadings(tabs) {
        if (!tabs) return;
        ['gallery', 'route', 'info'].forEach(tab => {
            if (!tabs[tab]) return;
            const h1 = document.getElementById(`hero-${tab}-heading`);
            if (h1 && tabs[tab].heading) h1.innerHTML = tabs[tab].heading;
            const p = document.getElementById(`hero-${tab}-subheading`);
            if (p && tabs[tab].subheading) p.textContent = tabs[tab].subheading;
        });
    }

    function renderBoat(boat) {
        if (!boat) return;
        const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.textContent = val; };
        set('hero-boat-name', boat.name);
        set('boat-year', boat.year);
        set('hero-boat-subheading', boat.subheading);
        set('boat-specs-heading', boat.specsHeading);
        const specsGrid = document.getElementById('boat-specs-grid');
        if (specsGrid && boat.specs) {
            specsGrid.innerHTML = boat.specs.map(s => `
                <div class="glass-card rounded-xl p-6 editorial-shadow border border-outline-variant/20">
                    <span class="material-symbols-outlined text-4xl text-secondary mb-3 block">${s.icon}</span>
                    <div class="text-3xl font-bold text-primary mb-1 font-headline">${s.value}</div>
                    <div class="text-sm text-on-surface-variant font-label">${s.label}</div>
                </div>`).join('');
        }
        set('boat-equipment-heading', boat.equipmentHeading);
        const eqGrid = document.getElementById('boat-equipment-grid');
        if (eqGrid && boat.equipment) {
            eqGrid.innerHTML = boat.equipment.map(e => `
                <div class="bg-surface-container-low rounded-xl p-6 editorial-shadow border border-outline-variant/20">
                    <span class="material-symbols-outlined text-5xl text-primary mb-4 block">${e.icon}</span>
                    <h3 class="text-xl font-bold text-primary mb-2 font-headline">${e.heading}</h3>
                    <p class="text-sm text-on-surface-variant leading-relaxed">${e.description}</p>
                </div>`).join('');
        }
    }

    function renderPrice(price) {
        const el = document.getElementById('price-per-person');
        if (el) el.textContent = `${price.currency}${price.perPerson}`;
    }

    function renderUI(ui) {
        if (!ui) return;
        const set = (id, text) => { const el = document.getElementById(id); if (el && text) el.textContent = text; };
        set('ui-price-label', ui.priceLabel);
        set('ui-price-duration', ui.priceDuration);
        set('ui-dates-text', ui.dates);
        set('ui-faq-heading', ui.faqHeading);
        set('ui-route-distance-label', ui.routeDistanceLabel);
        set('life-heading', ui.lifeHeading);
        set('life-subheading', ui.lifeSubheading);
        set('cta-book-label', ui.bookLabel);
        const bookBtn = document.getElementById('cta-book');
        if (bookBtn && ui.bookLabel) bookBtn.setAttribute('aria-label', `${ui.bookLabel} on Telegram`);
        if (ui.included) {
            const iconEl = document.getElementById('ui-included-icon');
            if (iconEl) iconEl.textContent = ui.included.icon;
            set('ui-included-heading', ui.included.heading);
            const list = document.getElementById('ui-included-list');
            if (list && ui.included.items) {
                list.innerHTML = ui.included.items.map(item => `
                    <li class="flex items-start gap-3">
                        <span class="material-symbols-outlined ${item.iconColor} mt-0.5">${item.icon}</span>
                        <div>
                            <div class="font-medium text-on-surface">${item.title}</div>
                            <div class="text-sm text-on-surface-variant">${item.subtitle}</div>
                        </div>
                    </li>`).join('');
            }
        }
        if (ui.additional) {
            const iconEl = document.getElementById('ui-additional-icon');
            if (iconEl) iconEl.textContent = ui.additional.icon;
            set('ui-additional-heading', ui.additional.heading);
            const list = document.getElementById('ui-additional-list');
            if (list && ui.additional.items) {
                list.innerHTML = ui.additional.items.map(item => `
                    <li class="flex items-start gap-3">
                        <span class="material-symbols-outlined ${item.iconColor} mt-0.5">${item.icon}</span>
                        <div>
                            <div class="font-medium text-on-surface">${item.title}</div>
                            <div class="text-sm text-on-surface-variant">${item.subtitle}</div>
                        </div>
                    </li>`).join('');
            }
        }
    }

    function renderRoute(route, ui) {
        const totalEl = document.getElementById('route-total-distance');
        if (totalEl) {
            const unit = ui && ui.distanceUnit ? ui.distanceUnit : '';
            totalEl.textContent = unit ? `${route.totalDistance} ${unit}` : `${route.totalDistance}`;
        }
        const timeline = document.getElementById('route-timeline');
        if (!timeline) return;
        timeline.innerHTML = route.days.map((day, index) => {
            const isLast = index === route.days.length - 1;
            const connector = isLast ? '' : '<div class="w-0.5 h-full bg-outline-variant/30 mt-4"></div>';
            const wrapperClass = isLast ? '' : 'pb-8';
            return `
                <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                        <div class="w-16 h-16 rounded-full bg-${day.color} text-on-${day.color} flex items-center justify-center font-bold text-lg font-label flex-shrink-0">
                            ${day.number}
                        </div>
                        ${connector}
                    </div>
                    <div class="${wrapperClass}">
                        <div class="inline-block bg-${day.color} text-on-${day.color} px-3 py-1 rounded-full text-xs font-medium mb-3 font-label uppercase tracking-wider">
                            ${day.distance}
                        </div>
                        <h3 class="text-2xl font-bold text-primary mb-2 font-headline">${day.title}</h3>
                        <p class="text-on-surface-variant leading-relaxed mb-4">${day.description}</p>
                        <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                            <span class="material-symbols-outlined text-lg">schedule</span>
                            <span>${day.duration}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function renderFaq(faq) {
        const list = document.getElementById('faq-list');
        if (!list) return;
        list.innerHTML = faq.map(item => `
            <div class="bg-surface-container-low rounded-xl overflow-hidden editorial-shadow border border-outline-variant/20">
                <button class="faq-button w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-high transition-colors" aria-expanded="false">
                    <span class="font-bold text-lg text-primary font-headline">${item.question}</span>
                    <span class="material-symbols-outlined text-2xl text-on-surface-variant transition-transform">expand_more</span>
                </button>
                <div class="faq-answer px-6 pb-0">
                    <div class="pb-6 text-on-surface-variant leading-relaxed border-t border-outline-variant/20 pt-4">
                        ${item.answer}
                    </div>
                </div>
            </div>`).join('');
    }

    function renderGallery(gallery) {
        gallery.forEach(item => {
            const card = document.querySelector(`.gallery-card[data-gallery-id="${item.id}"]`);
            if (!card) return;
            card.dataset.title = item.title;
            card.dataset.description = item.description;
            card.dataset.image = item.image;
            const img = card.querySelector('img');
            if (img) { img.src = item.image; img.alt = item.title; }
            const titleEl = card.querySelector('h3');
            if (titleEl) titleEl.textContent = item.title;
            const descEl = card.querySelector('p');
            if (descEl) descEl.textContent = item.description;
        });
    }

    loadContentAndRender().then(initApp);

})();
