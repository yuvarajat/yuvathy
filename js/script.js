/* ==========================================
   YUVATHY TECHNOLOGIES
   MAIN SCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       MOBILE NAVIGATION
    ========================== */

    const menuBtn = document.querySelector(".menu-toggle");
    const navbar = document.querySelector(".navbar");

    if (menuBtn && navbar) {

        menuBtn.addEventListener("click", () => {

            navbar.classList.toggle("active");

            const isOpen = navbar.classList.contains("active");

            menuBtn.setAttribute("aria-expanded", String(isOpen));
            menuBtn.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

            const icon = menuBtn.querySelector("i");

            if (icon) {

                icon.classList.toggle("ri-menu-3-line");
                icon.classList.toggle("ri-close-line");

            }

        });

        document.querySelectorAll(".nav-links a").forEach(link => {

            link.addEventListener("click", () => {

                navbar.classList.remove("active");

                menuBtn.setAttribute("aria-expanded", "false");
                menuBtn.setAttribute("aria-label", "Open navigation");

                const icon = menuBtn.querySelector("i");

                if (icon) {

                    icon.classList.add("ri-menu-3-line");
                    icon.classList.remove("ri-close-line");

                }

            });

        });

    }

    /* ==========================
       STICKY HEADER
    ========================== */

    const header = document.getElementById("header");

    function updateHeader() {

        if (window.scrollY > 60) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }

    updateHeader();

    window.addEventListener("scroll", updateHeader);

    /* ==========================
       SCROLL PROGRESS BAR
    ========================== */

    const progress = document.querySelector(".scroll-progress");

    function updateProgress() {

        const total =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const current = window.scrollY;

        const width = (current / total) * 100;

        if (progress) {

            progress.style.width = width + "%";

        }

    }

    window.addEventListener("scroll", updateProgress);

    updateProgress();

    /* ==========================
       ACTIVE NAVIGATION
    ========================== */

    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-links a");

    window.addEventListener("scroll", () => {

        let current = "";

        sections.forEach(section => {

            const top = section.offsetTop - 140;

            if (window.scrollY >= top) {

                current = section.getAttribute("id");

            }

        });

        navLinks.forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + current) {

                link.classList.add("active");

            }

        });

    });

    /* ==========================
       COUNTER
    ========================== */

    const counters = document.querySelectorAll(".counter");

    const counterObserver = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const counter = entry.target;

            const target = +counter.dataset.target;

            let value = 0;

            const increment = Math.ceil(target / 60);

            const timer = setInterval(() => {

                value += increment;

                if (value >= target) {

                    value = target;

                    clearInterval(timer);

                }

                counter.textContent = value;

            }, 25);

            counterObserver.unobserve(counter);

        });

    }, {

        threshold: 0.5

    });

    counters.forEach(counter => {

        counterObserver.observe(counter);

    });

    /* ==========================
       SCROLL REVEAL
    ========================== */

    const reveals = document.querySelectorAll(
        "section,.about-card,.service-card,.product-card,.why-card,.testimonial-card"
    );

    const revealObserver = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

            }

        });

    }, {

        threshold: 0.15

    });

    reveals.forEach(item => {

        item.classList.add("reveal");

        revealObserver.observe(item);

    });

    /* ==========================
       FAQ
    ========================== */

    document.querySelectorAll(".faq-item").forEach(item => {

        const button = item.querySelector(".faq-question");

        if (!button) return;

        button.addEventListener("click", () => {

            const answer = item.querySelector(".faq-answer");

            const isOpen = item.classList.contains("active");

            document.querySelectorAll(".faq-item").forEach(i => {

                i.classList.remove("active");

                const a = i.querySelector(".faq-answer");

                if (a) a.style.maxHeight = null;

            });

            if (!isOpen) {

                item.classList.add("active");

                answer.style.maxHeight =
                    answer.scrollHeight + "px";

            }

        });

    });

    /* ==========================
       CURSOR GLOW
    ========================== */

    const glow = document.querySelector(".cursor-glow");

    if (glow && window.innerWidth > 768) {

        window.addEventListener("mousemove", e => {

            glow.style.left = e.clientX + "px";
            glow.style.top = e.clientY + "px";

        });

    }

    /* ==========================
       SMOOTH SCROLL
    ========================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const href = this.getAttribute("href");

            if (!href || href === "#") return;

            const target = document.querySelector(
                href
            );

            if (!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior: "smooth"

            });

        });

    });

    /* ==========================
       PARALLAX HERO
    ========================== */

    const heroVisual = document.querySelector(".hero-visual");

    window.addEventListener("mousemove", e => {

        if (!heroVisual || window.innerWidth < 992) return;

        const x =
            (window.innerWidth / 2 - e.clientX) / 45;

        const y =
            (window.innerHeight / 2 - e.clientY) / 45;

        heroVisual.style.transform =
            `translate(${x}px, ${y}px)`;

    });

    /* ==========================
       BACK TO TOP
    ========================== */

    const topBtn = document.createElement("button");

    topBtn.className = "back-to-top";
    topBtn.type = "button";
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.setAttribute("title", "Back to top");

    topBtn.innerHTML = '<i class="ri-arrow-up-line"></i>';

    document.body.appendChild(topBtn);

    window.addEventListener("scroll", () => {

        if (window.scrollY > 500) {

            topBtn.classList.add("show");

        } else {

            topBtn.classList.remove("show");

        }

    });

    topBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

});
