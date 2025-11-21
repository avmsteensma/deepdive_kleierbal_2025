(function () {
    const carousel = document.getElementById("carousel");
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll(".slide"));
    if (slides.length === 0) return;

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const autoplayToggle = document.getElementById("autoplayToggle");
    let dotsContainer = carousel.querySelector("div.absolute.left-1\\/2"); // indicator container
    if (!dotsContainer) {
        // Fallback: maak de container als die niet bestaat
        dotsContainer = document.createElement("div");
        dotsContainer.className = "absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex items-center gap-2";
        carousel.appendChild(dotsContainer);
    }

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

        // Create dots (reset om dubbele dots te voorkomen)
        dotsContainer.innerHTML = "";
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
        if (prevBtn) prevBtn.addEventListener("click", prev);
        if (nextBtn) nextBtn.addEventListener("click", next);
        if (autoplayToggle) autoplayToggle.addEventListener("click", toggleAutoplay);

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
        btn.style.background = active ? "var(--color-background)" : "var(--color-background)";
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
        if (autoplayToggle) {
            autoplayToggle.textContent = "Pauze";
            autoplayToggle.setAttribute("aria-pressed", "true");
        }
    }

    function pauseAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
        if (autoplayToggle) {
            autoplayToggle.textContent = "Play";
            autoplayToggle.setAttribute("aria-pressed", "false");
        }
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

        el.addEventListener("pointerup", () => {
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


// Koop Nu + Checkout functionaliteit
(function () {
    // Elementen
    const koopBtn = document.getElementById("koopNuBtn");
    const backdrop = document.getElementById("checkoutBackdrop");
    const form = document.getElementById("checkoutForm");
    const modalClose = document.getElementById("modalClose");
    const cancelBtn = document.getElementById("cancelBtn");

    const qtyMinus = document.getElementById("qtyMinus");
    const qtyPlus = document.getElementById("qtyPlus");
    const qtyInput = document.getElementById("qtyInput");
    const qtyValue = document.getElementById("qtyValue");
    const donation = document.getElementById("donation");
    const summaryText = document.getElementById("summaryText");

    // Prijs per stuk (EUR)
    const PRICE = 12.5;

    // Helpers
    function openModal() {
        if (!backdrop) return;
        backdrop.classList.remove("hidden");
    }

    function closeModal() {
        if (!backdrop) return;
        backdrop.classList.add("hidden");
    }

    function parseNumber(value) {
        if (!value) return 0;
        // Ondersteun zowel komma als punt als decimaalteken
        const n = parseFloat(String(value).replace(",", "."));
        return isNaN(n) ? 0 : n;
    }

    function updateSummary() {
        if (!summaryText || !qtyInput || !qtyValue) return;
        const qty = Math.max(1, parseInt(qtyInput.value || "1", 10) || 1);
        qtyInput.value = String(qty);
        qtyValue.textContent = String(qty);

        const extra = donation ? parseNumber(donation.value) : 0;
        const total = qty * PRICE + extra;

        const priceStr = PRICE.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
        const totalStr = total.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
        summaryText.textContent = `Totaal: ${priceStr} × ${qty} = ${totalStr}`;
    }

    // Event listeners
    if (koopBtn) koopBtn.addEventListener("click", openModal);
    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (backdrop)
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeModal();
        });

    if (qtyPlus)
        qtyPlus.addEventListener("click", () => {
            if (!qtyInput) return;
            const current = parseInt(qtyInput.value || "1", 10) || 1;
            qtyInput.value = String(current + 1);
            updateSummary();
        });

    if (qtyMinus)
        qtyMinus.addEventListener("click", () => {
            if (!qtyInput) return;
            const current = parseInt(qtyInput.value || "1", 10) || 1;
            qtyInput.value = String(Math.max(1, current - 1));
            updateSummary();
        });

    if (qtyInput) qtyInput.addEventListener("input", updateSummary);
    if (donation) donation.addEventListener("input", updateSummary);

    if (form)
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            // Hier zou je een echte betaalflow kunnen integreren (Mollie/Stripe e.d.)
            // Voor nu: eenvoudige bevestiging en reset
            closeModal();
            alert("Bedankt voor je bestelling! We sturen je een bevestiging per e‑mail.");
            form.reset();
            if (qtyInput) qtyInput.value = "1";
            updateSummary();
        });

    // Initialiseer samenvatting bij laden
    updateSummary();
})();

