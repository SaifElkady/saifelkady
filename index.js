
function typeText(el, text, speed = 45) {
    return new Promise((resolve) => {
        el.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            el.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointerFine = window.matchMedia('(pointer: fine)').matches;

    // ---- Intro loader ----
    const introLoader = document.getElementById('introLoader');

    const finishIntro = () => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('intro-done');

        if (introLoader) {
            introLoader.classList.add('is-hidden');
            introLoader.addEventListener('transitionend', () => introLoader.remove(), { once: true });
        }

    };

    if (introLoader && !prefersReducedMotion) {
        setTimeout(finishIntro, 1100);
    } else {
        if (introLoader) introLoader.remove();
        document.body.classList.remove('is-loading');
        document.body.classList.add('intro-done');
    }

    // ---- Hero cursor-follow spotlight ----
    const heroEl = document.querySelector('.hero');
    if (heroEl && pointerFine && !prefersReducedMotion) {
        heroEl.addEventListener('mousemove', (e) => {
            const rect = heroEl.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            heroEl.style.setProperty('--mx', `${x}%`);
            heroEl.style.setProperty('--my', `${y}%`);
        });
    }

    // ---- Contact terminal typing sequence ----
    async function runContactSequence(section) {
        const cmds = section.querySelectorAll('.type-cmd');
        const outs = section.querySelectorAll('.out');
        const finalPrompt = section.querySelector('.final-prompt');

        outs.forEach((out) => out.classList.add('pending'));
        if (finalPrompt) finalPrompt.classList.add('pending');
        cmds.forEach((cmd) => { cmd.textContent = ''; });

        if (cmds[0]) await typeText(cmds[0], cmds[0].dataset.text || 'whoami');
        await wait(150);
        if (outs[0]) outs[0].classList.remove('pending');

        await wait(500);
        if (cmds[1]) await typeText(cmds[1], cmds[1].dataset.text || 'cat contact.md');
        await wait(150);
        if (outs[1]) outs[1].classList.remove('pending');

        await wait(300);
        if (finalPrompt) finalPrompt.classList.remove('pending');
    }

    // ---- Section reveal on scroll ----
    const revealSections = document.querySelectorAll('.reveal-section');

    if (revealSections.length) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);

                    if (entry.target.id === 'contact' && !prefersReducedMotion) {
                        runContactSequence(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -30px 0px'
        });

        revealSections.forEach((section) => revealObserver.observe(section));
    }

    // ---- Nav dot indicator ----
    const tabsEl = document.querySelector('.tabs');
    if (!tabsEl) return;

    const navDot = document.createElement('span');
    navDot.className = 'nav-dot';
    tabsEl.appendChild(navDot);

    const tabs = Array.from(document.querySelectorAll('.tab'));
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let activeTab = tabs.find((tab) => {
        const href = tab.getAttribute('href');
        if (!href) return false;

        if (href.startsWith('#')) {
            return document.querySelector(href) !== null;
        }

        return href === currentPage || (href === 'projects.html' && currentPage.includes('projects'));
    }) || tabs.find((tab) => tab.classList.contains('tab-projects')) || tabs[0] || null;

    const placeDot = (tab) => {
        if (!tab || !navDot) {
            navDot.classList.remove('is-visible');
            return;
        }

        const tabRect = tab.getBoundingClientRect();
        const tabsRect = tabsEl.getBoundingClientRect();
        navDot.style.left = `${tabRect.left - tabsRect.left + tabRect.width / 2 - 2}px`;
        navDot.classList.add('is-visible');
    };

    // ---- Mobile nav toggle ----
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle && mobileMenu) {
        const closeMobileMenu = () => {
            navToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('is-open');
        };

        navToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMobileMenu);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 860) closeMobileMenu();
        });
    }

    const setActiveTab = (tab) => {
        if (!tab) return;

        tabs.forEach((item) => item.classList.toggle('is-active', item === tab));
        document.querySelectorAll('.mobile-link').forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === tab.getAttribute('href'));
        });
        activeTab = tab;
        placeDot(tab);
    };

    tabs.forEach((tab) => {
        tab.addEventListener('mouseenter', () => placeDot(tab));
        tab.addEventListener('focus', () => placeDot(tab));
        tab.addEventListener('click', () => setActiveTab(tab));
    });

    tabsEl.addEventListener('mouseleave', () => placeDot(activeTab));

    if (activeTab) {
        setActiveTab(activeTab);
    }

    const spySections = document.querySelectorAll('#hero, #about, #skills, #contact');
    if (spySections.length) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const match = tabs.find((tab) => tab.getAttribute('href') === '#' + entry.target.id);
                if (match) {
                    setActiveTab(match);
                }
            });
        }, {
            threshold: 0,
            rootMargin: '-45% 0px -45% 0px'
        });

        spySections.forEach((section) => spyObserver.observe(section));
    }

    window.addEventListener('resize', () => placeDot(activeTab));
});