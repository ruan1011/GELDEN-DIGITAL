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

        const href = this.getAttribute("href");

        if (href && href.startsWith("#")) {

            event.preventDefault();

            const section =
                document.querySelector(href);

            if (section) {

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

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

const card =
    this.closest(".product-card");

const availableStock =
    Number(
        card?.dataset.stock || 0
    );

if (availableStock <= 0) {
    alert("Hierdie produk is uit voorraad.");
    return;
}

if (existingProduct) {

    if (existingProduct.quantity >= availableStock) {
        alert(
            `Jy kan nie meer as ${availableStock} van hierdie produk bestel nie.`
        );
        return;
    }

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

async function renderCart() {

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

    /*
     * Get the latest stock for everything
     * currently in the cart.
     */
    const productIds =
        cart
            .map(item => item.productId)
            .filter(Boolean);

    let stockProducts = [];

    if (productIds.length > 0) {

        const { data, error } =
            await supabaseClient
                .from("products")
                .select(`
                    id,
                    stock_quantity,
                    active
                `)
                .in("id", productIds);

        if (!error && data) {
            stockProducts = data;
        }
    }

    /*
     * Remove products that no longer exist
     * or are no longer active.
     */
    const validCart = [];

    for (const item of cart) {

        const product =
            stockProducts.find(
                p =>
                    p.id === item.productId
            );

        if (!product || !product.active) {
            continue;
        }

        const availableStock =
            Number(
                product.stock_quantity || 0
            );

        if (availableStock <= 0) {
            continue;
        }

        /*
         * Automatically reduce the cart quantity
         * if available stock has dropped.
         */
        if (
            item.quantity >
            availableStock
        ) {
            item.quantity =
                availableStock;
        }

        validCart.push(item);
    }

    /*
     * Save any stock corrections.
     */
    saveCart(validCart);

    const currentCart =
        getCart();

    if (currentCart.length === 0) {

        cartItems.innerHTML = `
            <div class="cart-empty">

                <h2>
                    Jou mandjie is leeg.
                </h2>

                <p>
                    Een of meer produkte is nie meer beskikbaar nie.
                </p>

                <a
                    href="index.html#shop"
                    class="cart-continue"
                >
                    Gaan terug winkel toe
                </a>

            </div>
        `;

        updateCartTotals();
        updateCartCount();

        return;
    }

    cartItems.innerHTML =
        currentCart.map((item, index) => {

            const itemTotal =
                item.price *
                item.quantity;

            const product =
                stockProducts.find(
                    p =>
                        p.id ===
                        item.productId
                );

            const availableStock =
                Number(
                    product?.stock_quantity || 0
                );

            const atMaxStock =
                item.quantity >=
                availableStock;

            return `

                <div class="cart-item">

                    <div class="cart-product">

                        <div class="cart-product-image">

                            ${
                                item.image
                                    ? `
                                        <img
                                            src="${item.image}"
                                            alt="${item.name}"
                                        >
                                      `
                                    : `
                                        <span>
                                            ${item.name}
                                        </span>
                                      `
                            }

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
                            ${atMaxStock ? "disabled" : ""}
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
    updateCartCount();
}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

async function changeQuantity(index, amount) {

    const cart = getCart();

    if (!cart[index]) return;

    /*
     * Always allow reducing quantity.
     */
    if (amount < 0) {

        cart[index].quantity += amount;

        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }

        saveCart(cart);
        renderCart();
        updateCartCount();

        return;
    }

    /*
     * For increasing quantity,
     * check the latest stock from Supabase.
     */
    const productId =
        cart[index].productId;

    if (!productId) {
        return;
    }

    const { data: product, error } =
        await supabaseClient
            .from("products")
            .select("stock_quantity, active")
            .eq("id", productId)
            .single();

    if (error || !product) {

        console.error(
            "Could not check stock:",
            error
        );

        alert(
            "Kon nie die voorraad nagaan nie. Probeer asseblief weer."
        );

        return;
    }

    const availableStock =
        Number(
            product.stock_quantity || 0
        );

    if (!product.active || availableStock <= 0) {

        alert(
            "Hierdie produk is tans uit voorraad."
        );

        cart.splice(index, 1);

        saveCart(cart);
        renderCart();
        updateCartCount();

        return;
    }

    if (
        cart[index].quantity >=
        availableStock
    ) {

        alert(
            `Slegs ${availableStock} van hierdie produk is beskikbaar.`
        );

        return;
    }

    cart[index].quantity += amount;

    saveCart(cart);

    renderCart();

    updateCartCount();
}
const YOCO_PUBLIC_KEY =
    "pk_test_749bf45c2r64XGR0bd24";

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

    const deliveryMethod =
        document.querySelector(
            'input[name="deliveryMethod"]:checked'
        )?.value || "delivery";

    const deliveryFee =
        deliveryMethod === "collection"
            ? 0
            : 120;

    const total =
        subtotal + deliveryFee;

    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const deliveryElement =
        document.getElementById(
            "checkoutDeliveryFee"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );

    if (subtotalElement) {

        subtotalElement.textContent =
            `R${subtotal.toLocaleString("en-ZA")}`;

    }

    if (deliveryElement) {

        deliveryElement.textContent =
            deliveryFee === 0
                ? "GRATIS"
                : `R${deliveryFee.toLocaleString("en-ZA")}`;

    }

    if (totalElement) {

        totalElement.textContent =
            `R${total.toLocaleString("en-ZA")}`;

    }

}

const deliveryOptions =
    document.querySelectorAll(
        'input[name="deliveryMethod"]'
    );

deliveryOptions.forEach(option => {

    option.addEventListener(
        "change",
        function () {

            updateCheckoutTotals();

        }
    );

});


/* =========================================================
   INITIALISE
   ========================================================= */





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

    const subtotal = cart.reduce(
        (sum, item) =>
            sum + (item.price * item.quantity),
        0
    );

    const customer =
        JSON.parse(
            localStorage.getItem(
                "volkEnVuurCustomer"
            )
        );

    const deliveryMethod =
        customer?.deliveryMethod ||
        "delivery";

    const deliveryFee =
        deliveryMethod === "collection"
            ? 0
            : 120;

    const total =
        subtotal + deliveryFee;

    const paymentTotal =
        document.getElementById(
            "paymentTotal"
        );

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
function showPaymentCancelledMessage() {

    const cancelledMessage =
        document.getElementById(
            "paymentCancelledMessage"
        );

    if (!cancelledMessage) {
        return;
    }

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const cancelled =
        urlParams.get("cancelled");

    if (cancelled !== "true") {
        return;
    }

    cancelledMessage.style.display =
        "block";

}
displayPaymentCustomer();
showPaymentCancelledMessage();

const completePaymentButton =
    document.getElementById("completePaymentButton");

if (completePaymentButton) {

    completePaymentButton.addEventListener(
        "click",
        async function () {

            const cart = getCart();

            if (cart.length === 0) {

                alert("Jou mandjie is leeg.");

                window.location.href =
                    "index.html#shop";

                return;
            }

            const customer =
                JSON.parse(
                    localStorage.getItem(
                        "volkEnVuurCustomer"
                    )
                );

            if (!customer) {

                alert(
                    "Jou klantbesonderhede kon nie gevind word nie."
                );

                window.location.href =
                    "checkout.html";

                return;
            }

            /* Disable button */

            completePaymentButton.disabled = true;

            completePaymentButton.textContent =
                "Laai betaling...";

            try {

                /*
                 * Ask our Supabase Edge Function
                 * to validate the cart and create
                 * a Yoco checkout.
                 */

const siteBaseUrl =
    window.location.href.substring(
        0,
        window.location.href.lastIndexOf("/") + 1
    );

const { data, error } =
    await supabaseClient.functions.invoke(
        "create-yoco-checkout",
        {
            body: {
                customer: customer,
                items: cart,
                successUrl:
                    `${siteBaseUrl}confirmation.html`,
                cancelUrl:
                    `${siteBaseUrl}payment.html?cancelled=true`
            }
        }
    );

                if (error) {
                    throw error;
                }

                if (
                    !data ||
                    !data.success ||
                    !data.redirectUrl
                ) {

                    throw new Error(
                        data?.error ||
                        "Kon nie die Yoco betaling begin nie."
                    );
                }

                /*
                 * Save the pending order information.
                 *
                 * DO NOT clear the cart yet.
                 * Payment has not been confirmed.
                 */

                const pendingOrder = {

                    orderId:
                        data.orderId,

                    orderNumber:
                        data.orderNumber,

                    customer:
                        customer,

                    items:
                        cart,

                    total:
                        Number(data.total),

                    paymentMethod:
                        "yoco",

                    date:
                        new Date().toISOString()

                };

                localStorage.setItem(
                    "volkEnVuurPendingOrder",
                    JSON.stringify(
                        pendingOrder
                    )
                );

                /*
                 * Redirect customer to Yoco.
                 */

                window.location.href =
                    data.redirectUrl;

            } catch (error) {

                console.error(
                    "Yoco payment error:",
                    error
                );

                alert(
                    error?.message ||
                    "Daar was 'n probleem met die betaling. Probeer asseblief weer."
                );

                completePaymentButton.disabled =
                    false;

                completePaymentButton.textContent =
                    "Betaal met Yoco";
            }

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

        /* Check cart */

        if (cart.length === 0) {

            alert("Jou mandjie is leeg.");

            window.location.href = "index.html#shop";

            return;

        }


        /* Required checkout fields */

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


        /* Validate fields */

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
        const deliveryMethod =
    document.querySelector(
        'input[name="deliveryMethod"]:checked'
    )?.value;

if (!deliveryMethod) {

    alert(
        "Kies asseblief 'n afleweringsmetode."
    );

    return;
}

        /* Save customer details */

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
                document.getElementById("notes")?.value.trim() || "",
            deliveryMethod:
    document.querySelector(
        'input[name="deliveryMethod"]:checked'
    )?.value || "delivery"  



        };


        localStorage.setItem(
            "volkEnVuurCustomer",
            JSON.stringify(customer)
        );


        /* Continue to payment */

        window.location.href = "payment.html";

    });

}

/* =========================================================
   CONFIRMATION PAGE
   ========================================================= */
async function renderConfirmation() {

    const orderNumberElement =
        document.getElementById("orderNumber");

    const totalElement =
        document.getElementById("confirmationTotal");

    const messageElement =
        document.getElementById("confirmationMessage");

    if (
        !orderNumberElement &&
        !totalElement &&
        !messageElement
    ) {
        return;
    }

    const pendingOrder =
        JSON.parse(
            localStorage.getItem(
                "volkEnVuurPendingOrder"
            )
        );

    if (!pendingOrder) {
        return;
    }

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const orderFromUrl =
        urlParams.get("order");

    /*
     * Make sure the order returned by Yoco
     * matches the order stored in this browser.
     */

    if (
        orderFromUrl &&
        pendingOrder.orderNumber !== orderFromUrl
    ) {
        console.error(
            "Confirmation order mismatch."
        );

        return;
    }

    /*
     * Show the order information immediately.
     */

    if (orderNumberElement) {

        orderNumberElement.textContent =
            `#${pendingOrder.orderNumber}`;

    }

    if (totalElement) {

        totalElement.textContent =
            `R${Number(
                pendingOrder.total
            ).toLocaleString("en-ZA")}`;

    }

    if (
        messageElement &&
        pendingOrder.customer
    ) {

        messageElement.textContent =
            `Dankie ${pendingOrder.customer.firstName}, ons bevestig tans jou betaling...`;

    }

    /*
     * Check the database for payment confirmation.
     *
     * The Yoco webhook may take a moment to arrive,
     * so we check several times.
     */

    let paymentConfirmed = false;

    for (let attempt = 1; attempt <= 10; attempt++) {

        try {

            const {
                data,
                error,
            } =
                await supabaseClient.functions.invoke(
                    "check-order-status",
                    {
                        body: {
                            orderId:
                                pendingOrder.orderId,
                        },
                    }
                );

            if (error) {
                console.error(
                    "Order status check error:",
                    error
                );
            }

            if (
                data?.success &&
                data?.order?.paymentStatus ===
                    "paid"
            ) {

                paymentConfirmed = true;

                /*
                 * Save as completed order.
                 */

                const completedOrder = {
                    ...pendingOrder,

                    paymentStatus:
                        data.order.paymentStatus,

                    orderStatus:
                        data.order.orderStatus,

                    total:
                        data.order.total,

                    orderNumber:
                        data.order.orderNumber,
                };

                localStorage.setItem(
                    "volkEnVuurLastOrder",
                    JSON.stringify(
                        completedOrder
                    )
                );

                /*
                 * Update confirmation message.
                 */

                if (messageElement) {

                    messageElement.textContent =
                        `Dankie ${pendingOrder.customer.firstName}, jou betaling is suksesvol ontvang.`;

                }

                /*
                 * NOW we can safely clear the cart.
                 */

                localStorage.removeItem(
                    CART_KEY
                );

                localStorage.removeItem(
                    "volkEnVuurPendingOrder"
                );

                updateCartCount();

                break;
            }

        } catch (error) {

            console.error(
                "Could not verify order:",
                error
            );

        }

        /*
         * Wait 1.5 seconds before checking again.
         */

        await new Promise(
            resolve =>
                setTimeout(resolve, 1500)
        );

    }

    /*
     * Payment has not been confirmed yet.
     *
     * Do NOT clear the cart.
     */

    if (!paymentConfirmed) {

        if (messageElement) {

            messageElement.textContent =
                `Dankie ${pendingOrder.customer.firstName}. Jou bestelling is ontvang en ons bevestig tans jou betaling.`;

        }

        console.warn(
            "Payment not yet confirmed for order:",
            pendingOrder.orderNumber
        );

    }

}

renderConfirmation();
/* =========================================================
   LOAD PRODUCTS FROM SUPABASE
   ========================================================= */

async function loadProductsFromDatabase() {

    const databaseProducts =
        document.getElementById("databaseProducts");

    const fallbackProducts =
        document.getElementById("fallbackProducts");

    if (!databaseProducts) return;


    const {
        data: products,
        error
    } = await supabaseClient
        .from("products")
        .select(`
            id,
            name,
            slug,
            description,
            price,
            stock_quantity,
            image_url,
            active,
            featured,
            categories (
                name
            )
        `)
        .eq("active", true)
        .order("featured", {
            ascending: false
        })
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Could not load products:",
            error
        );

        return;

    }


    if (!products || products.length === 0) {

        return;

    }


    databaseProducts.innerHTML =
        products.map(product => {

            return `

       <article
    class="product-card"
    data-product-id="${product.id}"
    data-stock="${Number(product.stock_quantity || 0)}"
>

                    <div class="product-image">

                        <img
                            src="${product.image_url}"
                            alt="${product.name}"
                            loading="lazy"
                        >

                    </div>


<div class="product-content">

    <span class="product-category">
        ${
            product.categories?.name
            || "VOLK & VUUR"
        }
    </span>

    <h3>
        ${product.name}
    </h3>

    <p>
        ${product.description || ""}
    </p>

    <div class="product-stock-status ${
        Number(product.stock_quantity || 0) <= 0
            ? "out"
            : Number(product.stock_quantity || 0) <= 5
                ? "low"
                : "good"
    }">
        ${
            Number(product.stock_quantity || 0) <= 0
                ? "Uitverkoop"
                : Number(product.stock_quantity || 0) <= 5
                    ? `Slegs ${product.stock_quantity} oor`
                    : "In voorraad"
        }
    </div>

    <div class="product-bottom">

                            <strong>
                                R${Number(product.price).toLocaleString("en-ZA")}
                            </strong>

${
    Number(product.stock_quantity || 0) <= 0
        ? `
            <button
                class="add-button database-add-button"
                data-name="${product.name}"
                data-price="${product.price}"
                data-product-id="${product.id}"
                disabled
            >
                Uitverkoop
            </button>
        `
        : `
 ${
    Number(product.stock_quantity || 0) <= 0
        ? `
            <button
                class="add-button database-add-button"
                data-name="${product.name}"
                data-price="${product.price}"
                data-product-id="${product.id}"
                disabled
            >
                Uitverkoop
            </button>
        `
        : `
            <button
                class="add-button database-add-button"
                data-name="${product.name}"
                data-price="${product.price}"
                data-product-id="${product.id}"
            >
                Voeg by
            </button>
        `
}
        `
}

                        </div>

                    </div>

                </article>

            `;

        }).join("");
        /* =========================================================
   PRODUCT CARD CLICK
   ========================================================= */

databaseProducts.addEventListener("click", function (event) {

    // Don't open product page when clicking "Voeg by"
    if (event.target.closest(".database-add-button")) {
        return;
    }

    // Find the product card that was clicked
    const card = event.target.closest(".product-card");

    if (!card) {
        return;
    }

    const productId = card.dataset.productId;

    if (!productId) {
        console.error("Product ID missing from product card");
        return;
    }

    console.log("Opening product:", productId);

    window.location.href =
        `product.html?id=${encodeURIComponent(productId)}`;

});

    /*
     * Hide the temporary hard-coded products
     * once the database products have loaded.
     */

    if (fallbackProducts) {

        fallbackProducts.style.display = "none";

    }


    /*
     * Activate the new database product buttons.
     */

    document
        .querySelectorAll(".database-add-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const name =
                        this.dataset.name;

                    const price =
                        Number(this.dataset.price);

                    const productId =
                        this.dataset.productId;

                    const cart =
                        getCart();


                    const existingProduct =
                        cart.find(
                            item =>
                                item.productId === productId
                        );

const card =
    this.closest(".product-card");

const availableStock =
    Number(
        card?.dataset.stock || 0
    );

if (existingProduct) {

    if (
        existingProduct.quantity >=
        availableStock
    ) {
        alert(
            `Jy kan nie meer as ${availableStock} van hierdie produk bestel nie.`
        );
        return;
    }

    existingProduct.quantity += 1;

} else {

    if (availableStock <= 0) {
        alert("Hierdie produk is uit voorraad.");
        return;
    }

    cart.push({


                            productId:
                                productId,

                            name:
                                name,

                            price:
                                price,
                                image: this.closest(".product-card")
        ?.querySelector("img")?.src || "",
                            quantity:
                                1

                        });

                    }


                    saveCart(cart);

                    updateCartCount();


                    this.textContent =
                        "Bygevoeg ✓";


                    setTimeout(() => {

                        this.textContent =
                            "Voeg by";

                    }, 1200);

                }
            );

        });

}


loadProductsFromDatabase();


/* =========================================================
   INITIALISE
   ========================================================= */

renderCart();

renderCheckout();

renderPayment();
/* =========================================================
   LOAD CATEGORIES FROM SUPABASE
   ========================================================= */

async function loadHomepageCategories() {

    const categoryGrid =
        document.getElementById("categoryGrid");

    if (!categoryGrid) return;

    const {
        data: categories,
        error
    } = await supabaseClient
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order", {
            ascending: true
        });

    if (error) {

        console.error(
            "Category loading error:",
            error
        );

        return;
    }

    categoryGrid.innerHTML = "";

    if (!categories || categories.length === 0) {
        return;
    }

    categories.forEach(function (category) {

        const card =
            document.createElement("a");

        card.href =
            `category.html?slug=${encodeURIComponent(category.slug)}`;

        card.className =
            "category-card";

        const image =
            category.image_url ||
            "images/braai.png";

        card.innerHTML = `

            <img
                src="${image}"
                alt="${escapeHtml(category.name)}"
            >

            <div class="category-overlay"></div>

            <div class="category-content">

                <h3>
                    ${escapeHtml(category.name)}
                </h3>

                <p>
                    ${escapeHtml(category.name)}
                </p>

            </div>

        `;

        categoryGrid.appendChild(card);

    });

}


/* Load categories when page opens */

loadHomepageCategories();


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

/* =========================================================
   PRODUCT DETAILS PAGE
   ========================================================= */

async function loadProductDetails() {

    const productDetails =
        document.getElementById("productDetails");

    if (!productDetails) return;


    const loading =
        document.getElementById("productLoading");

    const errorBox =
        document.getElementById("productError");


    const params =
        new URLSearchParams(
            window.location.search
        );


    const productId =
        params.get("id");


    if (!productId) {

        if (loading) {
            loading.style.display = "none";
        }

        if (errorBox) {
            errorBox.style.display = "block";
        }

        return;
    }


    const {
        data: product,
        error
    } = await supabaseClient
        .from("products")
        .select(`
            id,
            name,
            slug,
            description,
            price,
            stock_quantity,
            image_url,
            active,
            categories (
                name
            )
        `)
        .eq("id", productId)
        .eq("active", true)
        .single();


    if (error || !product) {

        console.error(
            "Could not load product:",
            error
        );

        if (loading) {
            loading.style.display = "none";
        }

        if (errorBox) {
            errorBox.style.display = "block";
        }

        return;
    }


    /* PRODUCT IMAGE */

    const image =
        document.getElementById("productImage");

    if (image) {

        image.src =
            product.image_url || "";

        image.alt =
            product.name;

    }


    /* CATEGORY */

    const category =
        document.getElementById("productCategory");

    if (category) {

        category.textContent =
            product.categories?.name ||
            "VOLK & VUUR";

    }


    /* NAME */

    const name =
        document.getElementById("productName");

    if (name) {

        name.textContent =
            product.name;

    }


    /* PRICE */

    const price =
        document.getElementById("productPrice");

    if (price) {

        price.textContent =
            `R${Number(product.price).toLocaleString("en-ZA")}`;

    }


    /* DESCRIPTION */

    const description =
        document.getElementById(
            "productDescription"
        );

    if (description) {

        description.textContent =
            product.description || "";

    }


    /* STOCK */

    const stock =
        Number(product.stock_quantity || 0);

    const stockElement =
        document.getElementById("productStock");


    if (stockElement) {

        if (stock <= 0) {

            stockElement.textContent =
                "Uitverkoop";

            stockElement.classList.add(
                "out-of-stock"
            );

        } else if (stock <= 5) {

            stockElement.textContent =
                `Slegs ${stock} oor`;

            stockElement.classList.add(
                "low-stock"
            );

        } else {

            stockElement.textContent =
                "In voorraad";

            stockElement.classList.add(
                "in-stock"
            );

        }

    }


    /* PAGE */

    if (loading) {

        loading.style.display =
            "none";

    }

    productDetails.style.display =
        "grid";


    /* QUANTITY */

    let quantity = 1;

    const quantityValue =
        document.getElementById(
            "quantityValue"
        );

    const minusButton =
        document.getElementById(
            "quantityMinus"
        );

    const plusButton =
        document.getElementById(
            "quantityPlus"
        );


    function updateQuantity() {

        if (quantityValue) {

            quantityValue.textContent =
                quantity;

        }

    }


    minusButton?.addEventListener(
        "click",
        function () {

            if (quantity > 1) {

                quantity--;

                updateQuantity();

            }

        }
    );


    plusButton?.addEventListener(
        "click",
        function () {

            if (quantity < stock) {

                quantity++;

                updateQuantity();

            }

        }
    );


    /* ADD TO CART */

    const addButton =
        document.getElementById(
            "addToCartButton"
        );


    addButton?.addEventListener(
        "click",
        function () {

            if (stock <= 0) {

                return;

            }


            const cart =
                getCart();


            const existingProduct =
                cart.find(
                    item =>
                        item.productId ===
                        String(product.id)
                );


            if (existingProduct) {

                existingProduct.quantity =
                    Math.min(
                        existingProduct.quantity +
                            quantity,
                        stock
                    );

            } else {

                cart.push({

                    productId:
                        String(product.id),

                    name:
                        product.name,

                    price:
                        Number(product.price),

                    image:
                        product.image_url,

                    quantity:
                        quantity

                });

            }


            saveCart(cart);

            updateCartCount();


            this.textContent =
                "Bygevoeg ✓";


            setTimeout(() => {

                this.textContent =
                    "Voeg by mandjie";

            }, 1200);

        }
    );

}


loadProductDetails();
