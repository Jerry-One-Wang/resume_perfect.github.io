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

    function setupCertificateDialog() {
        var dialog = document.getElementById("certificate-dialog");
        var openButton = document.querySelector("[data-dialog-open='certificate-dialog']");
        var closeButton = dialog && dialog.querySelector("[data-dialog-close]");
        if (!dialog || !openButton || !closeButton) return;

        openButton.addEventListener("click", function () {
            if (typeof dialog.showModal === "function") {
                dialog.showModal();
                document.body.classList.add("dialog-open");
                closeButton.focus();
            }
        });

        function closeDialog() {
            if (dialog.open) dialog.close();
        }

        closeButton.addEventListener("click", closeDialog);
        dialog.addEventListener("click", function (event) {
            var rect = dialog.getBoundingClientRect();
            var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
            if (!inside) closeDialog();
        });
        dialog.addEventListener("close", function () {
            document.body.classList.remove("dialog-open");
            openButton.focus();
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
        setupCertificateDialog();
        setupSectionState();
    });
})();
