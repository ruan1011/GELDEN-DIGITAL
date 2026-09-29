/* =========================================================
   VOLK & VUUR
   CATEGORY PAGE
   ========================================================= */

async function loadCategoryPage() {

    const productsContainer =
        document.getElementById("categoryProducts");

    const loading =
        document.getElementById("categoryLoading");

    const empty =
        document.getElementById("categoryEmpty");

    const errorBox =
        document.getElementById("categoryError");

    const title =
        document.getElementById("categoryTitle");

    const description =
        document.getElementById("categoryDescription");

    if (!productsContainer) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        params.get("slug");

    if (!slug) {

        showCategoryError();
        return;

    }

    try {

        /*
         * Find the selected category.
         */

        const {
            data: category,
            error: categoryError
        } = await supabaseClient
            .from("categories")
            .select(`
                id,
                name,
                slug,
                description,
                image_url,
                active
            `)
            .eq("slug", slug)
            .eq("active", true)
            .single();

        if (categoryError || !category) {

            console.error(
                "Could not load category:",
                categoryError
            );

            showCategoryError();
            return;

        }


        /*
         * Update the page heading.
         */

        document.title =
            `${category.name} | Volk & Vuur`;

        if (title) {

            title.textContent =
                category.name;

        }

        if (description) {

            description.textContent =
                category.description ||
                `Browse all products in ${category.name}.`;

        }


        /*
         * Load all active products belonging
         * to this category.
         */

        const {
            data: products,
            error: productsError
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
                featured
            `)
            .eq("category_id", category.id)
            .eq("active", true)
            .order("featured", {
                ascending: false
            })
            .order("created_at", {
                ascending: false
            });


        if (productsError) {

            console.error(
                "Could not load category products:",
                productsError
            );

            showCategoryError();
            return;

        }


        if (loading) {

            loading.style.display =
                "none";

        }


        if (
            !products ||
            products.length === 0
        ) {

            if (empty) {

                empty.style.display =
                    "block";

            }

            return;

        }


        /*
         * Render products.
         */

        productsContainer.innerHTML =
            products.map(
                renderCategoryProduct
            ).join("");


        /*
         * Product card clicks open the
         * existing product details page.
         */

        productsContainer.addEventListener(
            "click",
            handleCategoryProductClick
        );


        /*
         * Add-to-cart buttons.
         */

        productsContainer
            .querySelectorAll(
                ".database-add-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    handleCategoryAddToCart
                );

            });


    } catch (error) {

        console.error(
            "Category page error:",
            error
        );

        showCategoryError();

    }


    function showCategoryError() {

        if (loading) {

            loading.style.display =
                "none";

        }

        if (errorBox) {

            errorBox.style.display =
                "block";

        }

    }

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function renderCategoryProduct(product) {

    const stock =
        Number(
            product.stock_quantity || 0
        );

    const stockClass =
        stock <= 0
            ? "out"
            : stock <= 5
                ? "low"
                : "good";

    const stockText =
        stock <= 0
            ? "Out of stock"
            : stock <= 5
                ? `Only ${stock} left`
                : "In stock";


    const button =
        stock <= 0
            ? `
                <button
                    class="add-button database-add-button"
                    disabled
                >
                    Out of stock
                </button>
            `
            : `
                <button
                    class="add-button database-add-button"
                    data-name="${escapeCategoryHtml(product.name)}"
                    data-price="${product.price}"
                    data-product-id="${product.id}"
                >
                    Add to Cart
                </button>
            `;


    return `

        <article
            class="product-card"
            data-product-id="${product.id}"
            data-stock="${stock}"
        >

            <div class="product-image">

                <img
                    src="${escapeCategoryHtml(product.image_url || "")}"
                    alt="${escapeCategoryHtml(product.name)}"
                    loading="lazy"
                >

            </div>


            <div class="product-content">

                <span class="product-category">
                    VOLK & VUUR
                </span>


                <h3>
                    ${escapeCategoryHtml(product.name)}
                </h3>


                <p>
                    ${escapeCategoryHtml(product.description || "")}
                </p>


                <div class="product-stock-status ${stockClass}">
                    ${stockText}
                </div>


                <div class="product-bottom">

                    <strong>
                        R${Number(product.price).toLocaleString("en-ZA")}
                    </strong>

                    ${button}

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   PRODUCT CARD CLICK
   ========================================================= */

function handleCategoryProductClick(event) {

    if (
        event.target.closest(
            ".database-add-button"
        )
    ) {

        return;

    }

    const card =
        event.target.closest(
            ".product-card"
        );

    if (!card) {
        return;
    }

    const productId =
        card.dataset.productId;

    if (!productId) {
        return;
    }

    window.location.href =
        `product.html?id=${encodeURIComponent(productId)}`;

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function handleCategoryAddToCart(event) {

    event.stopPropagation();

    const button =
        event.currentTarget;

    const productId =
        button.dataset.productId;

    const name =
        button.dataset.name;

    const price =
        Number(button.dataset.price);

    const card =
        button.closest(".product-card");

    const availableStock =
        Number(
            card?.dataset.stock || 0
        );


    if (
        !productId ||
        !name
    ) {

        return;

    }


    if (availableStock <= 0) {

        alert(
            "This product is out of stock."
        );

        return;

    }


    const cart =
        getCart();

    const existingProduct =
        cart.find(
            item =>
                item.productId ===
                productId
        );


    if (existingProduct) {

        if (
            existingProduct.quantity >=
            availableStock
        ) {

            alert(
                `Only ${availableStock} of this product are available.`
            );

            return;

        }

        existingProduct.quantity += 1;

    } else {

        const image =
            card
                ?.querySelector("img")
                ?.src || "";

        cart.push({

            productId:
                productId,

            name:
                name,

            price:
                price,

            image:
                image,

            quantity:
                1

        });

    }


    saveCart(cart);

    updateCartCount();


    button.textContent =
        "Added ✓";


    setTimeout(() => {

        button.textContent =
            "Add to Cart";

    }, 1200);

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeCategoryHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIALISE
   ========================================================= */

loadCategoryPage();
