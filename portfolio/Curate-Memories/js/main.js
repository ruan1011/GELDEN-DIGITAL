function renderProducts() {

    const productGrid = document.getElementById("productGrid");

    if (!productGrid) return;

    productGrid.innerHTML = "";

    products
        .filter(function (product) {
            return product.featured === true;
        })
        .forEach(function (product) {

            const card = document.createElement("article");

            card.className = "product-card";

            card.dataset.productId = product.id;
                card.addEventListener("click", function (event) {

                  if (event.target.closest(".quick-add")) {
                    return;
                 }

                 window.location.href =
                "product/index.html?id=" +
                  encodeURIComponent(product.id);

                });
            card.innerHTML = `
                <div class="product-image">

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                    >

                    <button
                        class="quick-add"
                        type="button">
                        + Add to cart
                    </button>

                </div>

                <div class="product-details">

                    <div>
                        <h3>${product.name}</h3>
                        <p>${product.category}</p>
                    </div>

                    <strong>
                        R${product.price.toLocaleString("en-ZA")}
                    </strong>

                </div>
            `;

            productGrid.appendChild(card);

        });

}

document.addEventListener("DOMContentLoaded", function () {

    window.productsReady.then(function () {
    renderProducts();
        });
    /* =========================
       WHATSAPP QUOTE FORM
    ========================= */
    
    const quoteForm = document.getElementById("quoteForm");

    if (quoteForm) {
        quoteForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const eventType = document.getElementById("event").value;
            const date = document.getElementById("date").value;
            const items = document.getElementById("items").value;
            const message = document.getElementById("message").value.trim();

            const whatsappNumber = "27739215627";

            const whatsappMessage =
`Hello Curate Memories! 🤍

I'd like to request a free quote.

Name: ${name}
Phone: ${phone}
Occasion: ${eventType}
Event date: ${date || "Not specified"}
Interested in: ${items}

Additional details:
${message || "No additional details provided."}

Thank you!`;

            const whatsappURL =
                "https://wa.me/" +
                whatsappNumber +
                "?text=" +
                encodeURIComponent(whatsappMessage);

            window.location.href = whatsappURL;
        });
    }


    /* =========================
       SHOPPING BAG
    ========================= */

    let cart = JSON.parse(localStorage.getItem("curateMemoriesCart")) || [];

    const cartBtn = document.getElementById("cartBtn");
    const cartCount = document.querySelector(".cart-count");

    const bagPanel = document.getElementById("bagPanel");
    const bagOverlay = document.getElementById("bagOverlay");
    const bagClose = document.getElementById("bagClose");

    const bagItems = document.getElementById("bagItems");
    const bagTotal = document.getElementById("bagTotal");
    const bagCheckout = document.getElementById("bagCheckout");


    /* UPDATE COUNTER */

    function updateCartCount() {

         if (cartCount) {
             cartCount.textContent = cart.reduce(function (total, product) {
                 return total + product.quantity;
             }, 0);
        }

        localStorage.setItem(
          "curateMemoriesCart",
          JSON.stringify(cart)
        );

    }


    /* RENDER BAG */

   function renderBag() {

    if (!bagItems) return;

            cart = JSON.parse(
            localStorage.getItem("curateMemoriesCart")
         ) || [];

         if (cart.length === 0) {

                bagItems.innerHTML = `
            <div class="bag-empty">
                <p>Your bag is currently empty.</p>
                <span>Add something beautiful to your collection.</span>
            </div>
        `;

        if (bagTotal) {
            bagTotal.textContent = "R0";
        }

        return;
    }

    bagItems.innerHTML = "";

    let total = 0;

    cart.forEach(function (product, index) {

        /* Make sure every product has a quantity */
        if (!product.quantity || product.quantity < 1) {
            product.quantity = 1;
        }

        const productTotal = product.price * product.quantity;

        total += productTotal;

        const item = document.createElement("div");

        item.className = "bag-item";

        item.innerHTML = `
            <div class="bag-item-info">
                <h3>${product.name}</h3>
                <span>${product.category}</span>
            </div>

            <div class="bag-item-right">

                <strong>R${productTotal.toLocaleString("en-ZA")}</strong>

                <div class="bag-quantity">

                    <button
                        class="quantity-btn"
                        data-index="${index}"
                        data-action="decrease">
                        −
                    </button>

                    <span>${product.quantity}</span>

                    <button
                        class="quantity-btn"
                        data-index="${index}"
                        data-action="increase">
                        +
                    </button>

                </div>

                <button
                    class="bag-remove"
                    data-index="${index}">
                    Remove
                </button>

            </div>
        `;

        bagItems.appendChild(item);

    });

    /* FINAL TOTAL */

    if (bagTotal) {
        bagTotal.textContent =
            "R" + total.toLocaleString("en-ZA");
    }


    /* QUANTITY BUTTONS */

    document.querySelectorAll(".quantity-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const index = Number(button.dataset.index);
            const action = button.dataset.action;

if (action === "increase") {

    const product = products.find(function (item) {
        return item.name === cart[index].name;
    });

    const maxStock = product
        ? Number(product.stock)
        : Infinity;

    if (cart[index].quantity < maxStock) {

        cart[index].quantity++;

    } else {

        alert(
            "Sorry, only " +
            maxStock +
            " of this product is available."
        );

    }
}

            if (action === "decrease") {

                cart[index].quantity--;

                if (cart[index].quantity <= 0) {
                    cart.splice(index, 1);
                }

            }

            updateCartCount();
            renderBag();

        });

    });


    /* REMOVE BUTTONS */

    document.querySelectorAll(".bag-remove").forEach(function (button) {

        button.addEventListener("click", function () {

            const index = Number(button.dataset.index);

            cart.splice(index, 1);

            updateCartCount();
            renderBag();

        });

    });

}


    /* OPEN BAG */

    function openBag() {

        if (!bagPanel || !bagOverlay) return;

        renderBag();

        bagPanel.classList.add("open");
        bagOverlay.classList.add("open");

        document.body.style.overflow = "hidden";

    }


    /* CLOSE BAG */

    function closeBag() {

        if (!bagPanel || !bagOverlay) return;

        bagPanel.classList.remove("open");
        bagOverlay.classList.remove("open");

        document.body.style.overflow = "";

    }


    /* BAG BUTTON */

    if (cartBtn) {

        cartBtn.addEventListener("click", function () {

            openBag();

        });

    }


    /* CLOSE BUTTON */

    if (bagClose) {

        bagClose.addEventListener("click", function () {

            closeBag();

        });

    }


    /* CLICK OUTSIDE */

    if (bagOverlay) {

        bagOverlay.addEventListener("click", function () {

            closeBag();

        });

    }


    /* ESCAPE KEY */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeBag();

        }

    });


    /* =========================
       ADD PRODUCTS
    ========================= */

    document.addEventListener("click", function (event) {

        const button = event.target.closest(".quick-add");

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();


        const productCard = button.closest(".product-card");

        if (!productCard) return;


        const nameElement = productCard.querySelector("h3");
        const priceElement = productCard.querySelector("strong");

        if (!nameElement || !priceElement) return;


        const productName = nameElement.textContent.trim();

        const price = parseFloat(
            priceElement.textContent
                .replace("R", "")
                .replace(",", "")
                .trim()
        );


        const categoryElement = productCard.querySelector("p");

        const category = categoryElement
            ? categoryElement.textContent.trim()
            : "Collection";


  const existingProduct = cart.find(function (product) {
    return product.name === productName;
});

if (existingProduct) {

    existingProduct.quantity++;

} else {

cart.push({
    product_id: Number(productCard.dataset.productId),
    name: productName,
    price: price,
    category: category,
    quantity: 1
});

}


        updateCartCount();
        renderBag();


        button.textContent = "ADDED ✓";


        setTimeout(function () {

            button.textContent = "+ Add to cart";

        }, 1200);

    });


   /* =========================
   SUPABASE CHECKOUT
========================= */

/* =========================
   SUPABASE CHECKOUT
========================= */

const checkoutForm =
    document.getElementById("checkoutForm");

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (cart.length === 0) {
                alert("Your bag is currently empty.");
                return;
            }

            const checkoutButton =
                document.getElementById("bagCheckout");

            const checkoutMessage =
                document.getElementById("checkoutMessage");

            const customerName =
                document
                    .getElementById("checkoutName")
                    .value
                    .trim();

            const customerPhone =
                document
                    .getElementById("checkoutPhone")
                    .value
                    .trim();

            const customerEmail =
                document
                    .getElementById("checkoutEmail")
                    .value
                    .trim();

            const notes =
                document
                    .getElementById("checkoutNotes")
                    .value
                    .trim();


            if (!customerName || !customerPhone) {

                checkoutMessage.textContent =
                    "Please enter your name and phone number.";

                return;
            }


            checkoutButton.disabled = true;

            checkoutButton.innerHTML =
                "PLACING ORDER <span>...</span>";

            checkoutMessage.textContent =
                "Creating your order...";


            try {

                /* WAIT FOR SUPABASE PRODUCTS */

                if (window.productsReady) {
                    await window.productsReady;
                }


                /* BUILD ORDER ITEMS */

                const items = cart.map(function (product) {

                    return {
                        product_id:
                            Number(product.product_id),

                        quantity:
                            Number(product.quantity) || 1
                    };

                });


                /* CHECK FOR MISSING PRODUCT IDS */

                const invalidItem =
                    items.find(function (item) {

                        return !item.product_id ||
                               !Number.isFinite(
                                   item.product_id
                               );

                    });


                if (invalidItem) {

                    throw new Error(
                        "One of the products in your bag is outdated. Please remove it and add it again."
                    );

                }


                /* CREATE ORDER IN SUPABASE */

                const { data, error } =
                    await supabaseClient.rpc(
                        "create_order",
                        {
                            p_customer_name:
                                customerName,

                            p_customer_phone:
                                customerPhone,

                            p_customer_email:
                                customerEmail || null,

                            p_notes:
                                notes || null,

                            p_items:
                                items
                        }
                    );


                if (error) {
                    throw error;
                }


                const orderId = data;


                /* BUILD WHATSAPP MESSAGE */

                let orderText = "";
                let total = 0;

                cart.forEach(function (product) {

                    const quantity =
                        Number(product.quantity) || 1;

                    const productTotal =
                        Number(product.price) * quantity;

                    orderText +=
                        "• " +
                        product.name +
                        " × " +
                        quantity +
                        " — R" +
                        productTotal.toLocaleString("en-ZA") +
                        "\n";

                    total += productTotal;

                });


                const whatsappNumber =
                    "27739215627";


                const whatsappMessage =
`Hello Curate Memories! 🤍

NEW ORDER #${orderId}

Customer:
${customerName}

WhatsApp:
${customerPhone}

${customerEmail
    ? "Email:\n" + customerEmail + "\n"
    : ""}

My collection:
${orderText}

Total:
R${total.toLocaleString("en-ZA")}

${notes
    ? "Notes:\n" + notes + "\n"
    : ""}

The order has been recorded on the website.

Thank you!`;


                /* CLEAR CART */

                localStorage.removeItem(
                    "curateMemoriesCart"
                );

                cart = [];

                updateCartCount();
                renderBag();


                /* SUCCESS MESSAGE */

                checkoutMessage.textContent =
                    "Order #" +
                    orderId +
                    " created successfully. Opening WhatsApp...";


                /* OPEN WHATSAPP */

                const whatsappURL =
                    "https://wa.me/" +
                    whatsappNumber +
                    "?text=" +
                    encodeURIComponent(
                        whatsappMessage
                    );

                window.location.href =
                    whatsappURL;


            } catch (error) {

                console.error(
                    "Order creation error:",
                    error
                );

                checkoutButton.disabled = false;

                checkoutButton.innerHTML =
                    "PLACE ORDER <span>→</span>";

                checkoutMessage.textContent =
                    error.message ||
                    "Something went wrong. Please try again.";

            }

        }
    );

}


    updateCartCount();

});
/* =========================
   MOBILE MENU
========================= */

const mobileMenuButton = document.querySelector(".menu-btn");
const mobileNav = document.querySelector(".nav-links");

if (mobileMenuButton && mobileNav) {

    mobileMenuButton.addEventListener("click", function () {

        mobileMenuButton.classList.toggle("open");
        mobileNav.classList.toggle("open");

    });

    mobileNav.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", function () {

            mobileMenuButton.classList.remove("open");
            mobileNav.classList.remove("open");

        });

    });

}
document.addEventListener("DOMContentLoaded", function () {

    const searchBtn =
        document.getElementById("searchBtn");

    if (searchBtn) {

        searchBtn.addEventListener("click", function () {

            window.location.href =
                "shop/index.html#shopSearch";

        });

    }

});