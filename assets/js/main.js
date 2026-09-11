(function () {
    "use strict";

    var BING_IMAGE_URL_PATTERN = /^\/th\?id=OHR\.[a-zA-Z0-9_-]+\.jpg(&[a-zA-Z0-9=._-]+)*$/;

    function revealHero() {
        var items = document.querySelectorAll(".iUp");
        items.forEach(function (item, index) {
            window.setTimeout(function () { item.classList.add("up"); }, index * 110);
        });
    }

    function setBingBackground(images) {
        var panel = document.getElementById("panel");
        if (!panel || !Array.isArray(images) || images.length === 0) return;
        var validImages = images.filter(function (url) {
            return typeof url === "string" && BING_IMAGE_URL_PATTERN.test(url);
        });
        if (validImages.length === 0) return;

        var storageKey = "resume-bing-image-index";
        var previous = Number.parseInt(sessionStorage.getItem(storageKey), 10);
        var next = Number.isInteger(previous) ? (previous + 1) % validImages.length : 0;
        var imageUrl = "https://cn.bing.com" + validImages[next];
        var preload = new Image();
        preload.addEventListener("load", function () {
            panel.style.backgroundImage = "url('" + imageUrl.replace(/[\\']/g, "\\$&") + "')";
            sessionStorage.setItem(storageKey, String(next));
        });
        preload.src = imageUrl;
    }

    function loadBingImages() {
        if (window.BING_IMAGES) {
            setBingBackground(window.BING_IMAGES);
            return;
        }
        var script = document.createElement("script");
        script.src = "./assets/json/images.js";
        script.addEventListener("load", function () { setBingBackground(window.BING_IMAGES); });
        document.body.appendChild(script);
    }

    function setupProjectGalleries() {
        var galleries = Array.from(document.querySelectorAll("[data-project-gallery]"));
        var dialog = document.getElementById("project-image-dialog");
        var dialogImage = document.getElementById("project-dialog-image");
        var dialogTitle = document.getElementById("project-image-title");
        var dialogCount = document.getElementById("project-image-count");
        var closeButton = dialog && dialog.querySelector("[data-dialog-close]");
        var dialogPrev = dialog && dialog.querySelector("[data-dialog-prev]");
        var dialogNext = dialog && dialog.querySelector("[data-dialog-next]");
        var dialogState = { gallery: null, index: 0, trigger: null };
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function getSlides(gallery) {
            return Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
        }

        function updateDialog() {
            if (!dialogState.gallery || !dialogImage) return;
            var slides = getSlides(dialogState.gallery);
            var slide = slides[dialogState.index];
            var image = slide && slide.querySelector("img");
            if (!image) return;
            dialogImage.src = image.currentSrc || image.src;
            dialogImage.alt = image.alt;
            dialogTitle.textContent = dialogState.gallery.getAttribute("data-project-title") || "项目图片";
            dialogCount.textContent = (dialogState.index + 1) + " / " + slides.length;
        }

        function moveDialog(step) {
            if (!dialogState.gallery) return;
            var slides = getSlides(dialogState.gallery);
            dialogState.index = (dialogState.index + step + slides.length) % slides.length;
            updateDialog();
        }

        function openDialog(gallery, index, trigger) {
            if (!dialog || typeof dialog.showModal !== "function") return;
            dialogState.gallery = gallery;
            dialogState.index = index;
            dialogState.trigger = trigger;
            updateDialog();
            dialog.showModal();
            document.body.classList.add("dialog-open");
            closeButton.focus();
        }

        galleries.forEach(function (gallery) {
            var viewport = gallery.querySelector("[data-gallery-viewport]");
            var slides = getSlides(gallery);
            var previous = gallery.querySelector("[data-gallery-prev]");
            var next = gallery.querySelector("[data-gallery-next]");
            var dotsWrap = gallery.querySelector("[data-gallery-dots]");
            var currentLabel = gallery.querySelector("[data-gallery-current]");
            var currentIndex = 0;
            var scrollFrame = 0;
            currentLabel.parentElement.setAttribute("aria-live", "polite");
            var dots = slides.map(function (_, index) {
                var dot = document.createElement("button");
                dot.type = "button";
                dot.className = "project-gallery__dot";
                dot.setAttribute("aria-label", "查看第 " + (index + 1) + " 张图片");
                dotsWrap.appendChild(dot);
                return dot;
            });

            function renderState(index) {
                currentIndex = Math.max(0, Math.min(index, slides.length - 1));
                currentLabel.textContent = String(currentIndex + 1);
                previous.disabled = currentIndex === 0;
                next.disabled = currentIndex === slides.length - 1;
                dots.forEach(function (dot, dotIndex) {
                    var active = dotIndex === currentIndex;
                    dot.classList.toggle("is-active", active);
                    if (active) dot.setAttribute("aria-current", "true");
                    else dot.removeAttribute("aria-current");
                });
            }

            function goTo(index) {
                var target = Math.max(0, Math.min(index, slides.length - 1));
                viewport.scrollTo({ left: target * viewport.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
                renderState(target);
            }

            dots.forEach(function (dot, index) {
                dot.addEventListener("click", function () { goTo(index); });
            });
            slides.forEach(function (slide, index) {
                slide.addEventListener("click", function () { openDialog(gallery, index, slide); });
            });
            previous.addEventListener("click", function () { goTo(currentIndex - 1); });
            next.addEventListener("click", function () { goTo(currentIndex + 1); });
            viewport.addEventListener("scroll", function () {
                window.cancelAnimationFrame(scrollFrame);
                scrollFrame = window.requestAnimationFrame(function () {
                    if (!viewport.clientWidth) return;
                    renderState(Math.round(viewport.scrollLeft / viewport.clientWidth));
                });
            }, { passive: true });
            viewport.addEventListener("keydown", function (event) {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    goTo(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
                }
            });
            viewport.addEventListener("wheel", function (event) {
                if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
                event.preventDefault();
                viewport.scrollLeft += event.deltaX || event.deltaY;
            }, { passive: false });
            window.addEventListener("resize", function () {
                viewport.scrollLeft = currentIndex * viewport.clientWidth;
            });
            renderState(0);
        });

        if (!dialog || !closeButton || !dialogPrev || !dialogNext) return;

        function closeDialog() {
            if (dialog.open) dialog.close();
        }

        closeButton.addEventListener("click", closeDialog);
        dialogPrev.addEventListener("click", function () { moveDialog(-1); });
        dialogNext.addEventListener("click", function () { moveDialog(1); });
        dialog.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                moveDialog(event.key === "ArrowRight" ? 1 : -1);
            }
        });
        dialog.addEventListener("click", function (event) {
            var rect = dialog.getBoundingClientRect();
            var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
            if (!inside) closeDialog();
        });
        dialog.addEventListener("close", function () {
            document.body.classList.remove("dialog-open");
            if (dialogState.trigger) dialogState.trigger.focus();
            dialogImage.removeAttribute("src");
        });
    }

    function setupSectionState() {
        if (!("IntersectionObserver" in window)) return;
        var navLinks = Array.from(document.querySelectorAll(".section-nav__links a"));
        var sections = navLinks.map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        }).filter(Boolean);
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    var active = link.getAttribute("href") === "#" + entry.target.id;
                    link.classList.toggle("is-active", active);
                    if (active) link.setAttribute("aria-current", "location");
                    else link.removeAttribute("aria-current");
                });
            });
        }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
        sections.forEach(function (section) { observer.observe(section); });
    }

    document.addEventListener("DOMContentLoaded", function () {
        revealHero();
        loadBingImages();
        setupProjectGalleries();
        setupSectionState();
    });
})();
