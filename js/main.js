// =========================
// GELDEN DIGITAL
// QUOTE FORM
// =========================

const quoteForm = document.getElementById("quote-form");

if (quoteForm) {

    quoteForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value;

        const business =
            document.getElementById("business").value;

        const email =
            document.getElementById("email").value;

        const phone =
            document.getElementById("phone").value;

        const service =
            document.getElementById("service").value;

        const message =
            document.getElementById("message").value;


        const whatsappMessage =
            `Hi Gelden Digital!

` +
            `I'd like to enquire about a website.

` +
            `Name: ${name}
` +
            `Business: ${business}
` +
            `Email: ${email}
` +
            `Phone: ${phone}
` +
            `Service: ${service}

` +
            `Project details:
${message}`;


        const encodedMessage =
            encodeURIComponent(whatsappMessage);


        const whatsappURL =
            `https://wa.me/27836072557?text=${encodedMessage}`;


        window.open(
            whatsappURL,
            "_blank"
        );

    });

}