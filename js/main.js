document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       NAVBAR
    ========================= */

    const navbar = document.querySelector(".navbar");

    if (navbar) {
        window.addEventListener("scroll", function () {
            navbar.classList.toggle("scrolled", window.scrollY > 40);
        });
    }


    /* =========================
       SMOOTH SCROLL
    ========================= */

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

    });


    /* =========================
       GELDEN DIGITAL QUOTE FORM
    ========================= */

    const quoteForm = document.getElementById("quote-form");

    if (quoteForm) {

        quoteForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const business = document.getElementById("business").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const service = document.getElementById("service").value;
            const message = document.getElementById("message").value.trim();

            const whatsappNumber = "27836072557";

            const whatsappMessage =
`Hello Gelden Digital! 👋

I'd like to request a quote for a website.

Name: ${name}
Business: ${business}
Email: ${email}
Phone: ${phone}

Service:
${service}

Project details:
${message}

Thank you!`;

            const whatsappURL =
                "https://wa.me/" +
                whatsappNumber +
                "?text=" +
                encodeURIComponent(whatsappMessage);

            window.open(whatsappURL, "_blank");

        });

    }

});