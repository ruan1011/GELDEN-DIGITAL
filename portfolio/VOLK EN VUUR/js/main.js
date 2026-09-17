/* =========================================================
   VOLK & VUUR
   SHOPPING CART
   ========================================================= */

const CART_KEY = "volkEnVuurCart";


/* =========================================================
   STORY BUTTON
   ========================================================= */

document.querySelectorAll(".story-button").forEach(button => {

    button.addEventListener("click", function (event) {

        event.preventDefault();

        const shop = document.getElementById("shop");

        if (shop) {
            shop.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    });

});


/* =========================================================
   CART HELPERS
   ========================================================= */

function getCart() {

    return JSON.parse(
        localStorage.getItem(CART_KEY)
    ) || [];

}


function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) return;

    const cart = getCart();

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    cartCount.textContent = totalItems;

}

updateCartCount();


/* =========================================================
   ADD PRODUCT
   ========================================================= */

document.querySelectorAll(".add-button").forEach(button => {

    button.addEventListener("click", function () {

        const name = this.dataset.name;
        const price = Number(this.dataset.price);

        const cart = getCart();

        const existingProduct = cart.find(
            item => item.name === name
        );

        if (existingProduct) {

            existingProduct.quantity += 1;

        } else {

            cart.push({
                name: name,
                price: price,
                quantity: 1
            });

        }

        saveCart(cart);

        updateCartCount();

        this.textContent = "Bygevoeg ✓";

        setTimeout(() => {

            this.textContent = "Voeg by";

        }, 1200);

    });

});


/* =========================================================
   DISPLAY CART
   ========================================================= */

function renderCart() {

    const cartItems =
        document.getElementById("cartItems");

    if (!cartItems) return;

    const cart = getCart();

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="cart-empty">

                <h2>
                    Jou mandjie is leeg.
                </h2>

                <p>
                    Voeg iets lekker by vir jou volgende braai.
                </p>

                <a
                    href="index.html#shop"
                    class="cart-continue"
                >
                    Begin inkopies doen
                </a>

            </div>
        `;

        updateCartTotals();

        return;
    }


    cartItems.innerHTML = cart.map((item, index) => {

        const itemTotal =
            item.price * item.quantity;

        return `

            <div class="cart-item">

                <div class="cart-product">

                    <div class="cart-product-image">
                        ${item.name}
                    </div>

                    <div>

                        <span class="cart-product-category">
                            VOLK & VUUR
                        </span>

                        <h3>
                            ${item.name}
                        </h3>

                        <p>
                            R${item.price.toLocaleString("en-ZA")}
                        </p>

                    </div>

                </div>


                <div class="quantity-controls">

                    <button
                        class="quantity-button"
                        onclick="changeQuantity(${index}, -1)"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        class="quantity-button"
                        onclick="changeQuantity(${index}, 1)"
                    >
                        +
                    </button>

                </div>


                <div class="cart-item-total">

                    <strong>
                        R${itemTotal.toLocaleString("en-ZA")}
                    </strong>

                    <button
                        class="remove-button"
                        onclick="removeFromCart(${index})"
                    >
                        Verwyder
                    </button>

                </div>

            </div>

        `;

    }).join("");

    updateCartTotals();

}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeQuantity(index, amount) {

    const cart = getCart();

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    saveCart(cart);

    renderCart();

    updateCartCount();

}


/* =========================================================
   REMOVE PRODUCT
   ========================================================= */

function removeFromCart(index) {

    const cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);

    renderCart();

    updateCartCount();

}


/* =========================================================
   CART TOTALS
   ========================================================= */

function updateCartTotals() {

    const cart = getCart();

    const subtotal = cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );

    const subtotalElement =
        document.getElementById("cartSubtotal");

    const totalElement =
        document.getElementById("cartTotal");

    if (subtotalElement) {

        subtotalElement.textContent =
            `R${subtotal.toLocaleString("en-ZA")}`;

    }

    if (totalElement) {

        totalElement.textContent =
            `R${subtotal.toLocaleString("en-ZA")}`;

    }

}


/* =========================================================
   CHECKOUT PAGE
   ========================================================= */

function renderCheckout() {

    const checkoutItems =
        document.getElementById("checkoutItems");

    if (!checkoutItems) return;

    const cart = getCart();

    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <p class="checkout-empty-message">
                Jou mandjie is leeg.
            </p>
        `;

        updateCheckoutTotals();

        return;
    }


    checkoutItems.innerHTML = cart.map(item => {

        const itemTotal =
            item.price * item.quantity;

        return `

            <div class="checkout-summary-item">

                <div class="checkout-summary-item-info">

                    <strong>
                        ${item.name}
                    </strong>

                    <span>
                        ${item.quantity} ×
                        R${item.price.toLocaleString("en-ZA")}
                    </span>

                </div>

                <strong>
                    R${itemTotal.toLocaleString("en-ZA")}
                </strong>

            </div>

        `;

    }).join("");

    updateCheckoutTotals();

}


/* =========================================================
   CHECKOUT TOTALS
   ========================================================= */

function updateCheckoutTotals() {

    const cart = getCart();

    const subtotal = cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );

    const subtotalElement =
        document.getElementById("checkoutSubtotal");

    const totalElement =
        document.getElementById("checkoutTotal");

    if (subtotalElement) {

        subtotalElement.textContent =
            `R${subtotal.toLocaleString("en-ZA")}`;

    }

    if (totalElement) {

        totalElement.textContent =
            `R${subtotal.toLocaleString("en-ZA")}`;

    }

}


/* =========================================================
   INITIALISE
   ========================================================= */

/* =========================================================
   CHECKOUT BUTTON
   ========================================================= */

const placeOrderButton =
    document.getElementById("placeOrderButton");

if (placeOrderButton) {

    placeOrderButton.addEventListener("click", function () {

        const cart = getCart();

        if (cart.length === 0) {

            alert("Jou mandjie is leeg.");

            window.location.href = "index.html#shop";

            return;
        }

        window.location.href = "payment.html";

    });

}



/* =========================================================
   PAYMENT PAGE
   ========================================================= */

function renderPayment() {

    const paymentItems =
        document.getElementById("paymentItems");

    if (!paymentItems) return;

    const cart = getCart();

    if (cart.length === 0) {

        paymentItems.innerHTML = `
            <p class="checkout-empty-message">
                Jou mandjie is leeg.
            </p>
        `;

        updatePaymentTotal();

        return;
    }


    paymentItems.innerHTML = cart.map(item => {

        const itemTotal =
            item.price * item.quantity;

        return `

            <div class="checkout-summary-item">

                <div class="checkout-summary-item-info">

                    <strong>
                        ${item.name}
                    </strong>

                    <span>
                        ${item.quantity} ×
                        R${item.price.toLocaleString("en-ZA")}
                    </span>

                </div>

                <strong>
                    R${itemTotal.toLocaleString("en-ZA")}
                </strong>

            </div>

        `;

    }).join("");

    updatePaymentTotal();

}


/* =========================================================
   PAYMENT TOTAL
   ========================================================= */

function updatePaymentTotal() {

    const cart = getCart();

    const total = cart.reduce(
        (sum, item) =>
            sum + (item.price * item.quantity),
        0
    );

    const paymentTotal =
        document.getElementById("paymentTotal");

    if (paymentTotal) {

        paymentTotal.textContent =
            `R${total.toLocaleString("en-ZA")}`;

    }

}
/* =========================================================
   DISPLAY CUSTOMER
   ========================================================= */

function displayPaymentCustomer() {

    const message =
        document.getElementById("paymentCustomerMessage");

    if (!message) return;

    const customer =
        JSON.parse(
            localStorage.getItem("volkEnVuurCustomer")
        );

    if (!customer) return;

    message.textContent =
        `Hallo ${customer.firstName}, kies hoe jy jou Volk & Vuur bestelling wil betaal.`;

}

displayPaymentCustomer();

/* =========================================================
   COMPLETE PAYMENT
   ========================================================= */

const completePaymentButton =
    document.getElementById("completePaymentButton");

if (completePaymentButton) {

    completePaymentButton.addEventListener(
        "click",
        function () {

            const cart = getCart();

            if (cart.length === 0) {

                alert("Jou mandjie is leeg.");

                window.location.href =
                    "index.html#shop";

                return;

            }

            alert(
                "Bestelling ontvang! Hierdie is tans 'n demo-betaling."
            );

        }
    );

}

/* =========================================================
   SAVE CHECKOUT DETAILS
   ========================================================= */

const checkoutButton =
    document.getElementById("placeOrderButton");

if (checkoutButton) {

    checkoutButton.addEventListener("click", function () {

        const cart = getCart();

        if (cart.length === 0) {

            alert("Jou mandjie is leeg.");

            window.location.href =
                "index.html#shop";

            return;

        }


        const requiredFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "address",
            "city",
            "province",
            "postalCode"
        ];


        for (const fieldId of requiredFields) {

            const field =
                document.getElementById(fieldId);

            if (!field || !field.value.trim()) {

                alert(
                    "Voltooi asseblief al die vereiste besonderhede."
                );

                if (field) {
                    field.focus();
                }

                return;

            }

        }


        const customer = {

            firstName:
                document.getElementById("firstName").value.trim(),

            lastName:
                document.getElementById("lastName").value.trim(),

            email:
                document.getElementById("email").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            address:
                document.getElementById("address").value.trim(),

            city:
                document.getElementById("city").value.trim(),

            province:
                document.getElementById("province").value,

            postalCode:
                document.getElementById("postalCode").value.trim(),

            notes:
                document.getElementById("notes")?.value.trim() || ""

        };


        localStorage.setItem(
            "volkEnVuurCustomer",
            JSON.stringify(customer)
        );


        window.location.href =
            "payment.html";

    });

}
/* =========================================================
   INITIALISE
   ========================================================= */

renderCart();

renderCheckout();

renderPayment();