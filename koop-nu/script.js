(function () {
    const carousel = document.getElementById("carousel");
    const slides = Array.from(carousel.querySelectorAll(".slide"));
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const autoplayToggle = document.getElementById("autoplayToggle");
    const dotsContainer = carousel.querySelector("div.absolute.left-1\\/2"); // indicator container
    const AUTO_DELAY = 4000;

    let current = 0;
    let autoplay = true;
    let autoplayTimer = null;
    let isTransitioning = false;

    // Initialize slides positions and create dots
    function init() {
        slides.forEach((s, i) => {
            s.style.transform = i === current ? "translateX(0%)" : "translateX(100%)";
            s.style.opacity = i === current ? "1" : "0";
            s.setAttribute("aria-hidden", i === current ? "false" : "true");
        });

        // Create dots
        slides.forEach((_, i) => {
            const btn = document.createElement("button");
            btn.className = "w-3 h-3 rounded-full focus:outline-none ring-0";
            btn.dataset.index = i;
            btn.setAttribute("aria-label", `Ga naar slide ${i + 1}`);
            btn.setAttribute("title", `Slide ${i + 1}`);
            btn.innerHTML = '<span class="sr-only">Slide</span>';
            styleDot(btn, i === current);
            btn.addEventListener("click", () => goTo(i));
            dotsContainer.appendChild(btn);
        });

        // Lazy load visible image immediately
        lazyLoadSlides();

        // Event listeners
        prevBtn.addEventListener("click", prev);
        nextBtn.addEventListener("click", next);
        autoplayToggle.addEventListener("click", toggleAutoplay);

        // Pause on hover / focus
        carousel.addEventListener("mouseenter", pauseAutoplay);
        carousel.addEventListener("mouseleave", resumeAutoplayIfEnabled);
        carousel.addEventListener("focusin", pauseAutoplay);
        carousel.addEventListener("focusout", resumeAutoplayIfEnabled);

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        });

        // Touch / Swipe support
        addSwipeSupport(carousel);

        // Start autoplay
        startAutoplay();
    }

    function styleDot(btn, active) {
        btn.style.background = active ? "rgba(59,130,246,1)" : "rgba(0,0,0,0.25)";
        btn.style.width = active ? "12px" : "8px";
        btn.style.height = active ? "12px" : "8px";
        btn.style.transition = "all 200ms";
    }

    function lazyLoadSlides() {
        // load current and next slide images (improves perceived performance)
        [current, (current + 1) % slides.length].forEach((i) => {
            const img = slides[i].querySelector("img.lazy");
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
                img.classList.remove("lazy");
            }
        });
    }

    function updateDots() {
        const dots = Array.from(dotsContainer.children);
        dots.forEach((d, i) => styleDot(d, i === current));
    }

    function goTo(index) {
        if (isTransitioning || index === current) return;
        isTransitioning = true;

        const from = current;
        const to = (index + slides.length) % slides.length;
        const direction = to > from || (from === slides.length - 1 && to === 0) ? 1 : -1;

        // position the target off-screen in correct direction then animate
        slides[to].style.transition = "none";
        slides[to].style.transform = `translateX(${100 * direction * -1}%)`; // place left or right
        slides[to].style.opacity = "1";
        slides[to].setAttribute("aria-hidden", "false");

        // force reflow so the above style takes effect before animating
        void slides[to].offsetWidth;

        // animate
        slides[from].style.transition = "";
        slides[to].style.transition = "";
        slides[from].style.transform = `translateX(${100 * direction}%)`;
        slides[from].style.opacity = "0";
        slides[from].setAttribute("aria-hidden", "true");

        slides[to].style.transform = "translateX(0%)";
        slides[to].style.opacity = "1";

        // after animation, clean up
        setTimeout(() => {
            // hide non-active slides off-screen to avoid them being focusable
            slides.forEach((s, i) => {
                if (i !== to) {
                    s.style.transform = `translateX(100%)`;
                    s.style.opacity = "0";
                    s.setAttribute("aria-hidden", "true");
                }
            });
            current = to;
            updateDots();
            lazyLoadSlides();
            isTransitioning = false;
        }, 520); // slightly > transition duration
    }

    function prev() {
        goTo((current - 1 + slides.length) % slides.length);
    }

    function next() {
        goTo((current + 1) % slides.length);
    }

    function startAutoplay() {
        if (!autoplay) return;
        clearInterval(autoplayTimer);
        autoplayTimer = setInterval(() => next(), AUTO_DELAY);
        autoplayToggle.textContent = "Pauze";
        autoplayToggle.setAttribute("aria-pressed", "true");
    }

    function pauseAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
        autoplayToggle.textContent = "Play";
        autoplayToggle.setAttribute("aria-pressed", "false");
    }

    function resumeAutoplayIfEnabled() {
        if (autoplay) startAutoplay();
    }

    function toggleAutoplay() {
        autoplay = !autoplay;
        if (autoplay) startAutoplay();
        else pauseAutoplay();
    }

    // Simple swipe detection (pointer events)
    function addSwipeSupport(el) {
        let startX = 0;
        let dx = 0;
        let isPointer = false;

        el.classList.add("touch-action-none");

        el.addEventListener("pointerdown", (e) => {
            isPointer = true;
            startX = e.clientX;
            dx = 0;
            pauseAutoplay();
        });

        el.addEventListener("pointermove", (e) => {
            if (!isPointer) return;
            dx = e.clientX - startX;
            // optional: preview slide movement (not implemented to keep logic simple)
        });

        el.addEventListener("pointerup", (e) => {
            if (!isPointer) return;
            isPointer = false;
            if (Math.abs(dx) > 50) {
                if (dx > 0) prev();
                else next();
            }
            resumeAutoplayIfEnabled();
        });

        el.addEventListener("pointercancel", () => {
            isPointer = false;
            resumeAutoplayIfEnabled();
        });
    }

    // start everything
    init();
})();
