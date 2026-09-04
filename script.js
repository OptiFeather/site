/* ==========================================================================
   OPTIFEATHER — site interactions
   Loader, header scroll state, mobile nav, FAQ accordion.
   All animation-critical effects run in pure CSS, so the page still
   looks and works correctly even if this file fails to load.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Page loader ---------- */
    const loader = document.getElementById('pageLoader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => loader.classList.add('is-hidden'), 300);
        });
        setTimeout(() => loader.classList.add('is-hidden'), 2000);
    }

    /* ---------- Sticky header state on scroll ---------- */
    const header = document.getElementById('siteHeader');
    if (header) {
        const setHeaderState = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
        setHeaderState();
        window.addEventListener('scroll', setHeaderState, { passive: true });
    }

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.getElementById('navToggle');
    const navList = document.getElementById('navList');
    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            const isOpen = navList.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        navList.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navList.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    /* ---------- FAQ accordion ---------- */
    document.querySelectorAll('.faq-item').forEach((item) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!question || !answer) return;
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            document.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
                if (openItem !== item) {
                    openItem.classList.remove('is-open');
                    openItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            if (isOpen) {
                item.classList.remove('is-open');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('is-open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ---------- Animated stat counters ---------- */
    const counters = document.querySelectorAll('.stat-number[data-count]');
    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1300;
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    if (counters.length && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach((c) => counterObserver.observe(c));
    } else {
        counters.forEach(animateCounter);
    }

    /* ---------- Smooth-scroll offset for in-page anchors ---------- */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId.length < 2) return;
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;
            e.preventDefault();
            const headerHeight = header ? header.offsetHeight : 0;
            const top = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Scroll progress bar ---------- */
    if (!reduceMotion) {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
        const updateProgress = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
            progressBar.style.width = pct + '%';
        };
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
    }

    /* ---------- Scroll-triggered reveal for cards/rows without an entrance animation ---------- */
    const revealEls = document.querySelectorAll(
        '.service-card, .case, .value-card, .pillar, .why-item, .process-step, .info-row, .model-stage, .contact-form-card, .contact-info-card'
    );
    if (revealEls.length) {
        revealEls.forEach((el, i) => {
            el.classList.add('reveal');
            el.style.setProperty('--reveal-delay', (i % 4) * 0.09 + 's');
        });
        if ('IntersectionObserver' in window && !reduceMotion) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
            revealEls.forEach((el) => revealObserver.observe(el));
        } else {
            revealEls.forEach((el) => el.classList.add('is-visible'));
        }
    }

    /* ---------- Spotlight glow that tracks the cursor on cards ---------- */
    if (fineHover) {
        const spotlightEls = document.querySelectorAll(
            '.service-card, .case, .value-card, .pillar, .why-item, .pricing-card'
        );
        spotlightEls.forEach((card) => {
            card.classList.add('spotlight-card');
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
                card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
            });
        });
    }

    /* ---------- Magnetic buttons: disabled site-wide (no cursor-follow) ---------- */

    /* ---------- Button click ripple ---------- */
    if (!reduceMotion) {
        document.querySelectorAll('.btn').forEach((btn) => {
            btn.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'btn-ripple';
                ripple.style.left = (e.clientX - rect.left) + 'px';
                ripple.style.top = (e.clientY - rect.top) + 'px';
                this.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    /* ---------- Marquee: pixel-perfect seamless loop ---------- */
    const marqueeTrack = document.getElementById('marqueeTrack');
    if (marqueeTrack) {
        const setupMarquee = () => {
            const originalSet = marqueeTrack.querySelector('.marquee-set');
            if (!originalSet) return;
            marqueeTrack.classList.remove('is-animating');
            marqueeTrack.querySelectorAll('.marquee-set').forEach((el, i) => { if (i > 0) el.remove(); });
            const setWidth = originalSet.getBoundingClientRect().width;
            const viewportWidth = marqueeTrack.parentElement.getBoundingClientRect().width;
            const copiesNeeded = Math.max(2, Math.ceil((viewportWidth * 2) / setWidth) + 1);
            for (let i = 1; i < copiesNeeded; i++) {
                marqueeTrack.appendChild(originalSet.cloneNode(true));
            }
            marqueeTrack.style.setProperty('--marquee-distance', `${setWidth}px`);
            marqueeTrack.style.setProperty('--marquee-duration', `${setWidth / 55}s`);
            void marqueeTrack.offsetWidth;
            marqueeTrack.classList.add('is-animating');
        };
        setupMarquee();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setupMarquee, 200);
        });
    }

    /* ---------- Hero title shine sweep ---------- */
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && !reduceMotion) heroTitle.classList.add('shine-text');

});
