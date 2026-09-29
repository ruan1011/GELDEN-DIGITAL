/* =========================================================
   VOLK & VUUR
   ADMIN DASHBOARD
   ========================================================= */


/* =========================================================
   AUTHENTICATION
   ========================================================= */

const ADMIN_EMAIL =
    "ruan.geldenhuis7@gmail.com";


async function checkAdminAccess() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        window.location.href =
            "admin.html";

        return false;
    }

    const loggedInEmail =
        session.user?.email
            ?.trim()
            .toLowerCase();

    if (
        loggedInEmail !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "admin.html";

        return false;
    }

    return true;
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

async function loadDashboardStats() {

    const productsResult =
        await supabaseClient
            .from("products")
            .select("id, stock_quantity", { count: "exact" });

    const categoriesResult =
        await supabaseClient
            .from("categories")
            .select("id", { count: "exact" });

    const ordersResult =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                total,
                payment_status,
                order_status,
                created_at
            `);

    const products =
        productsResult.data || [];

    const orders =
        ordersResult.data || [];

    /*
     * PRODUCTS
     */

    document.getElementById("statProducts").textContent =
        productsResult.count || 0;


    /*
     * CATEGORIES
     */

    document.getElementById("statCategories").textContent =
        categoriesResult.count || 0;


    /*
     * TOTAL ORDERS
     */

    document.getElementById("statOrders").textContent =
        ordersResult.data?.length || 0;


    /*
     * LOW STOCK
     * 5 or less
     */

    document.getElementById("statLowStock").textContent =
        products.filter(
            product =>
                Number(product.stock_quantity) <= 5
        ).length;


    /*
     * TOTAL SALES
     *
     * Only PAID orders count as sales.
     */

    const totalSales =
        orders
            .filter(
                order =>
                    String(order.payment_status).toLowerCase() === "paid"
            )
            .reduce(
                (total, order) =>
                    total + Number(order.total || 0),
                0
            );

    document.getElementById("statTotalSales").textContent =
        `R${totalSales.toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;


    /*
     * TODAY
     */

    const now = new Date();

    const startOfToday =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const startOfTomorrow =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

    const ordersToday =
        orders.filter(order => {

            const orderDate =
                new Date(order.created_at);

            return (
                orderDate >= startOfToday &&
                orderDate < startOfTomorrow
            );

        }).length;

    document.getElementById("statOrdersToday").textContent =
        ordersToday;


    /*
     * THIS MONTH
     */

    const startOfMonth =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

    const startOfNextMonth =
        new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

    const ordersThisMonth =
        orders.filter(order => {

            const orderDate =
                new Date(order.created_at);

            return (
                orderDate >= startOfMonth &&
                orderDate < startOfNextMonth
            );

        }).length;

    document.getElementById("statOrdersMonth").textContent =
        ordersThisMonth;


    /*
     * PENDING ORDERS
     */

    const pendingOrders =
        orders.filter(
            order =>
                String(order.order_status).toLowerCase() === "pending"
        ).length;

    document.getElementById("statPendingOrders").textContent =
        pendingOrders;
}
async function uploadProductImage(file) {

    if (!file) {
        return null;
    }

    const fileExtension =
        file.name.split(".").pop().toLowerCase();

    const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;

    const filePath =
        `products/${fileName}`;


    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("product-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });


    if (uploadError) {

        console.error(
            "Product image upload error:",
            uploadError
        );

        throw uploadError;
    }


    const { data } =
        supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(filePath);


    return data.publicUrl;
}

async function uploadCategoryImage(file) {

    if (!file) {
        return null;
    }

    const fileExtension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;

    const filePath =
        `categories/${fileName}`;

    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("product-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });

    if (uploadError) {

        console.error(
            "Category image upload error:",
            uploadError
        );

        throw uploadError;
    }

    const { data } =
        supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(filePath);

    return data.publicUrl;
}


async function deleteProductImage(imageUrl) {

    if (!imageUrl) {
        return;
    }

    if (!imageUrl.includes("/storage/v1/object/public/product-images/")) {
        return;
    }

    const marker =
        "/storage/v1/object/public/product-images/";

    const filePath =
        imageUrl.split(marker)[1];

    if (!filePath) {
        return;
    }

    const { error } =
        await supabaseClient
            .storage
            .from("product-images")
            .remove([filePath]);

    if (error) {

        console.error(
            "Old product image delete error:",
            error
        );

    }
}

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadAdminProducts() {

    const container =
        document.getElementById("adminProducts");

    if (!container) return;

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
            active,
            featured,
            sku,
            image_url,
            category_id,
            categories (
                name
            )
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Products loading error:",
            error
        );

        container.innerHTML =
            `<div class="admin-empty-state">
                Kon nie produkte laai nie.
            </div>`;

        return;
    }

    if (!products || products.length === 0) {

        container.innerHTML =
            `<div class="admin-empty-state">
                Geen produkte gevind nie.
            </div>`;

        return;
    }

    container.innerHTML = `
        <div class="admin-product-list">

            ${products.map(product => `

                <div class="admin-product-row">
                    <div class="admin-product-image">
    ${
        product.image_url
            ? `<img
                src="${product.image_url}"
                alt="${escapeHtml(product.name)}"
            >`
            : `<div class="admin-product-image-placeholder">
                Geen beeld
              </div>`
    }
</div>
                    <div class="admin-product-info">

                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                product.categories?.name ||
                                "No category"
                            )}
                        </span>

                    </div>

                    <div class="admin-product-sku">
                        ${escapeHtml(product.sku || "No SKU")}
                    </div>

                    <div class="admin-product-price">
                        R${Number(product.price).toLocaleString("en-ZA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </div>

                    <div class="admin-product-stock">

                        <span class="${
                            Number(product.stock_quantity) <= 5
                                ? "low-stock"
                                : ""
                        }">

                            ${product.stock_quantity}

                        </span>

                    </div>

                    <div class="admin-product-status">

                        ${product.active
                            ? "Active"
                            : "Inactive"}

                    </div>

                    <div class="admin-product-actions">

    <button
        type="button"
        class="admin-edit-button"
        data-product-id="${product.id}"
    >
        EDIT
    </button>

    <button
        type="button"
        class="admin-delete-button"
        data-product-id="${product.id}"
    >
        Remove
    </button>

</div>    

                </div>

            `).join("")}

        </div>
    `;


/* PRODUCT ACTION BUTTONS */

document.addEventListener("click", async function (event) {

    const editButton = event.target.closest(".admin-edit-button");

    if (editButton) {

        const productId = editButton.dataset.productId;

        if (!productId) return;

        openEditProductModal(productId);

        return;
    }


    const deleteButton = event.target.closest(".admin-delete-button");

    if (!deleteButton) return;

    const productId = deleteButton.dataset.productId;

    if (!productId) return;


    const productRow =
        deleteButton.closest(".admin-product-row");

    const productName =
        productRow
            ?.querySelector(".admin-product-info strong")
            ?.textContent
            .trim() || "this product";


    const confirmed = confirm(
        `Are you sure you want to remove "${productName}"?`
    );

    if (!confirmed) return;


    deleteButton.disabled = true;
    deleteButton.textContent = "Removing...";


    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", productId);


    if (error) {

        console.error("Product delete error:", error);

        alert(
            "The product could not be removed."
        );

        deleteButton.disabled = false;
        deleteButton.textContent = "Remove";

        return;
    }


    await loadAdminProducts();

    await loadDashboardStats();

});
}


/* =========================================================
   LOAD CATEGORIES
   ========================================================= */

async function loadAdminCategories() {

    const container =
        document.getElementById("adminCategories");

    if (!container) return;

    const {
        data: categories,
        error
    } = await supabaseClient
        .from("categories")
        .select(`
            id,
            name,
            slug,
            active,
            sort_order,
            image_url
        `)
        .order("sort_order", {
            ascending: true
        });

    if (error) {

        console.error(
            "Categories loading error:",
            error
        );

        container.innerHTML =
            `<div class="admin-empty-state">
                Kon nie kategorie laai nie.
            </div>`;

        return;
    }

    if (!categories || categories.length === 0) {

        container.innerHTML =
            `<div class="admin-empty-state">
                No categoryë gevind nie.
            </div>`;

        return;
    }

    container.innerHTML = `
        <div class="admin-category-list">

            ${categories.map(category => `

                <div class="admin-category-row">

<div class="admin-category-info">

    <div class="admin-category-image">
        ${
            category.image_url
                ? `<img
                    src="${category.image_url}"
                    alt="${escapeHtml(category.name)}"
                >`
                : `<div class="admin-category-image-placeholder">
                    Geen beeld
                </div>`
        }
    </div>

    <div class="admin-category-details">

        <strong>
            ${escapeHtml(category.name)}
        </strong>

        <span>
            /${escapeHtml(category.slug)}
        </span>

    </div>

</div>

                    <div>
                        ${category.active
                            ? "Active"
                            : "Inactive"}
                    </div>

<button
    type="button"
    class="admin-edit-category-button"
    data-category-id="${category.id}"
>
    EDIT
</button>

                </div>

            `).join("")}

        </div>
    `;


    /* Also populate product category dropdown */

    populateProductCategories(categories);
}

/* =========================================================
   LOAD ORDERS
   ========================================================= */

async function loadAdminOrders() {

    const container =
        document.getElementById("adminOrders");

    if (!container) return;

    const {
        data: orders,
        error
    } = await supabaseClient
        .from("orders")
    .select(`
    id,
    order_number,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    province,
    postal_code,
    notes,
    subtotal,
    delivery_fee,
    total,
    payment_method,
    payment_status,
    order_status,
    created_at
`)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Orders loading error:",
            error
        );

        container.innerHTML = `
            <div class="admin-empty-state">
                Kon nie bestellings laai nie.
            </div>
        `;

        return;
    }

    if (!orders || orders.length === 0) {

        container.innerHTML = `
            <div class="admin-empty-state">
                No orders to display.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="admin-order-list">
         <div class="admin-order-header">
            <div>BESTELLING</div>
            <div>KLIËNT</div>
            <div>TOTAAL</div>
            <div>BETALING</div>
            <div>STATUS</div>
            <div>AKSIES</div>
        </div>
            ${orders.map(order => `

                <div class="admin-order-row">

                    <div class="admin-order-number">
                        <strong>
                            ${escapeHtml(
                                order.order_number || "No number"
                            )}
                        </strong>

                        <span>
                            ${new Date(
                                order.created_at
                            ).toLocaleDateString("en-ZA")}
                        </span>
                    </div>

                    <div class="admin-order-customer">

                        <strong>
                            ${escapeHtml(
                                `${order.first_name || ""} ${order.last_name || ""}`
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                order.email || ""
                            )}
                        </span>

                    </div>

                    <div class="admin-order-total">
                        R${Number(
                            order.total || 0
                        ).toLocaleString("en-ZA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </div>

                    <div class="admin-order-payment">
                        ${escapeHtml(
                            order.payment_method || "—"
                        )}
                    </div>

                    <div class="admin-order-status">
                        ${escapeHtml(
                            order.order_status || "pending"
                        )}
                    </div>

                    <div class="admin-order-actions">

                        <button
                            type="button"
                            class="admin-view-order-button"
                            data-order-id="${order.id}"
                        >
                            VIEW
                        </button>

                    </div>

                </div>

            `).join("")}

        </div>
    `;
}


async function loadAdminCustomers() {
    const container =
        document.getElementById("adminCustomers");

    if (!container) return;

    container.innerHTML = `
        <div class="admin-loading">
            Laai kliënte...
        </div>
    `;

    const { data: customers, error } =
        await supabaseClient
            .from("customers")
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Customers loading error:",
            error
        );

        container.innerHTML = `
            <div class="admin-error">
                Kon nie kliënte laai nie.
            </div>
        `;

        return;
    }

    if (!customers || customers.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                Geen kliënte gevind nie.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="admin-customer-list">

            <div class="admin-customer-header">
                <div>KLIËNT</div>
                <div>E-POS</div>
                <div>TELEFOON</div>
                <div>GEREGISTREER</div>
            </div>

            ${customers.map(customer => {

                const fullName =
                    `${customer.first_name || ""} ${customer.last_name || ""}`
                        .trim();

                const date =
                    customer.created_at
                        ? new Date(
                            customer.created_at
                        ).toLocaleDateString(
                            "en-ZA",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        )
                        : "-";

                return `
                    <div class="admin-customer-row admin-clickable-customer"
                    data-customer-id="${customer.id}">

                        <div class="admin-customer-name">
                            ${escapeHtml(fullName || "No name")}
                        </div>

                        <div class="admin-customer-email">
                            ${escapeHtml(customer.email || "-")}
                        </div>

                        <div class="admin-customer-phone">
                            ${escapeHtml(customer.phone || "-")}
                        </div>

                        <div class="admin-customer-date">
                            ${date}
                        </div>

                    </div>
                `;

            }).join("")}

        </div>
    `;
}

document.addEventListener("click", function (event) {
    const customerRow =
        event.target.closest(".admin-clickable-customer");

    if (!customerRow) return;

    const customerId =
        customerRow.dataset.customerId;

    if (!customerId) return;

    openCustomerDetails(customerId);
});

async function openCustomerDetails(customerId) {
    if (!customerId) return;

    const { data: customer, error: customerError } =
        await supabaseClient
            .from("customers")
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone,
                created_at
            `)
            .eq("id", customerId)
            .single();

    if (customerError || !customer) {
        console.error(
            "Customer details error:",
            customerError
        );

        alert("Could not load the customer.");
        return;
    }

    const { data: orders, error: ordersError } =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                order_number,
                total,
                payment_status,
                order_status,
                created_at
            `)
            .eq("customer_id", customerId)
            .order("created_at", {
                ascending: false
            });

    if (ordersError) {
        console.error(
            "Customer orders error:",
            ordersError
        );

        alert(
            "The customer was loaded, but the orders could not be loaded."
        );

        return;
    }

    const customerOrders = orders || [];

    const totalSpent =
        customerOrders.reduce(
            (total, order) =>
                total + Number(order.total || 0),
            0
        );

    const fullName =
        `${customer.first_name || ""} ${customer.last_name || ""}`
            .trim();

    const registeredDate =
        customer.created_at
            ? new Date(
                customer.created_at
            ).toLocaleDateString(
                "en-ZA",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            )
            : "-";

    const modal =
        document.createElement("div");

    modal.id =
        "adminCustomerDetailsModal";

    modal.className =
        "admin-order-modal-overlay";

    modal.innerHTML = `
        <div class="admin-order-modal">

            <div class="admin-order-modal-header">

                <div>
                    <div class="admin-modal-eyebrow">
                        CUSTOMER PROFILE
                    </div>

                    <h2>
                        ${escapeHtml(
                            fullName || "No name"
                        )}
                    </h2>
                </div>

                <button
                    type="button"
                    class="admin-close-modal-button"
                    id="closeCustomerDetailsButton"
                >
                    ×
                </button>

            </div>

            <div class="admin-order-modal-body">

                <div class="admin-order-detail-grid">

                    <div class="admin-order-detail-card">
                        <span>EMAIL</span>
                        <strong>
                            ${escapeHtml(
                                customer.email || "-"
                            )}
                        </strong>
                    </div>

                    <div class="admin-order-detail-card">
                        <span>TELEFOON</span>
                        <strong>
                            ${escapeHtml(
                                customer.phone || "-"
                            )}
                        </strong>
                    </div>

                    <div class="admin-order-detail-card">
                        <span>BESTELLINGS</span>
                        <strong>
                            ${customerOrders.length}
                        </strong>
                    </div>

                    <div class="admin-order-detail-card">
                        <span>TOTAAL BESTEE</span>
                        <strong>
                            R${totalSpent.toFixed(2)}
                        </strong>
                    </div>

                </div>

                <div class="admin-customer-registration">
                    <strong>
                        CUSTOMER SINCE
                    </strong>

                    <span>
                        ${registeredDate}
                    </span>
                </div>

                <div class="admin-order-products">

                    <h3>
                        ORDER HISTORY
                    </h3>

                    ${
                        customerOrders.length === 0
                            ? `
                                <div class="admin-empty">
                                    Geen bestellings gevind nie.
                                </div>
                              `
                            : `
                                <div class="admin-customer-order-list">

                                    ${customerOrders.map(order => `
                                        <div class="admin-customer-order-row">

                                            <div>
                                                <strong>
                                                    ${escapeHtml(
                                                        order.order_number || "-"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${
                                                        order.created_at
                                                            ? new Date(
                                                                order.created_at
                                                            ).toLocaleDateString(
                                                                "en-ZA"
                                                            )
                                                            : "-"
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                <strong>
                                                    R${Number(
                                                        order.total || 0
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>

                                            <div>
                                                <span class="admin-customer-order-status">
                                                    ${escapeHtml(
                                                        order.order_status || "pending"
                                                    )}
                                                </span>
                                            </div>

                                            <div>
                                                <span class="admin-customer-payment-status">
                                                    ${escapeHtml(
                                                        order.payment_status || "pending"
                                                    )}
                                                </span>
                                            </div>

                                        </div>
                                    `).join("")}

                                </div>
                              `
                    }

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const closeButton =
        document.getElementById(
            "closeCustomerDetailsButton"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            function () {
                modal.remove();
            }
        );
    }

    modal.addEventListener(
        "click",
        function (event) {
            if (
                event.target === modal
            ) {
                modal.remove();
            }
        }
    );
}


async function loadAdminStock() {
    const container =
        document.getElementById("adminStock");

    if (!container) return;

    container.innerHTML = `
        <div class="admin-loading">
            Laai voorraad...
        </div>
    `;

    const { data: products, error } =
        await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                sku,
                price,
                stock_quantity,
                active,
                categories (
                    name
                )
            `)
            .order("name", {
                ascending: true
            });

    if (error) {
        console.error(
            "Stock loading error:",
            error
        );

        container.innerHTML = `
            <div class="admin-error">
                Kon nie voorraad laai nie.
            </div>
        `;

        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                Geen produkte gevind nie.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="admin-stock-list">

            <div class="admin-stock-header">
                <div>PRODUK</div>
                <div>KATEGORIE</div>
                <div>SKU</div>
                <div>VOORRAAD</div>
                <div>STATUS</div>
                <div>AKSIE</div>
            </div>

            ${products.map(product => {

                const stock =
                    Number(
                        product.stock_quantity || 0
                    );

                let statusText;
                let statusClass;

                if (stock <= 0) {
                    statusText = "OUT OF STOCK";
                    statusClass = "out";
                } else if (stock <= 5) {
                    statusText = "LOW STOCK";
                    statusClass = "low";
                } else {
                    statusText = "IN STOCK";
                    statusClass = "good";
                }

                return `
                    <div class="admin-stock-row">

                        <div class="admin-stock-product">
                            <strong>
                                ${escapeHtml(
                                    product.name
                                )}
                            </strong>
                        </div>

                        <div class="admin-stock-category">
                            ${escapeHtml(
                                product.categories?.name || "-"
                            )}
                        </div>

                        <div class="admin-stock-sku">
                            ${escapeHtml(
                                product.sku || "-"
                            )}
                        </div>

                        <div class="admin-stock-quantity">
                            ${stock}
                        </div>

                        <div>
                            <span
                                class="admin-stock-status ${statusClass}"
                            >
                                ${statusText}
                            </span>
                        </div>

                        <div>
                            <button
                                type="button"
                                class="admin-adjust-stock-button"
                                data-product-id="${product.id}"
                                data-product-name="${escapeHtml(product.name)}"
                                data-stock="${stock}"
                            >
                                ADJUST
                            </button>
                        </div>

                    </div>
                `;

            }).join("")}

        </div>
    `;
}
/* =========================================================
   EDIT CATEGORY
   ========================================================= */

document.addEventListener("click", async function (event) {

    const editButton =
        event.target.closest(
            ".admin-edit-category-button"
        );

    if (!editButton) {
        return;
    }

    const categoryId =
        editButton.dataset.categoryId;

    if (!categoryId) {
        console.error(
            "Category ID missing from edit button."
        );
        return;
    }

    await openEditCategoryModal(categoryId);
});


async function openEditCategoryModal(categoryId) {

    console.log(
        "Loading category for editing:",
        categoryId
    );


    const {
        data: category,
        error
    } = await supabaseClient
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single();


    if (error || !category) {

        console.error(
            "Could not load category:",
            error
        );

        alert(
            "The category could not be loaded."
        );

        return;
    }


    /* CATEGORY ID */

    document.getElementById(
        "categoryId"
    ).value = category.id;


    /* CATEGORY NAME */

    document.getElementById(
        "categoryName"
    ).value =
        category.name || "";


    /* ACTIVE */

    document.getElementById(
        "categoryActive"
    ).checked =
        category.active === true;


    /* CURRENT IMAGE */

    const preview =
        document.getElementById(
            "categoryImagePreview"
        );


    if (preview) {

        if (category.image_url) {

            preview.innerHTML = `
                <div class="current-product-image-label">
                    Huidige kategorie foto
                </div>

                <img
                    src="${category.image_url}"
                    alt="${escapeHtml(category.name)}"
                >
            `;

        } else {

            preview.innerHTML = `
                <div class="current-product-image-empty">
                    No category foto
                </div>
            `;
        }
    }


    /* CLEAR NEW IMAGE INPUT */

    const imageInput =
        document.getElementById(
            "categoryImage"
        );

    if (imageInput) {
        imageInput.value = "";
    }


    /* MODAL TITLE */

    document.getElementById(
        "categoryModalTitle"
    ).textContent =
        "Edit Category";


    /* CLEAR ERROR */

    document.getElementById(
        "categoryFormError"
    ).textContent = "";


/* OPEN MODAL */

const modal =
    document.getElementById(
        "categoryModal"
    );

if (modal) {

    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.right = "0";
    modal.style.bottom = "0";

    modal.style.width = "100vw";
    modal.style.height = "100vh";

    modal.style.background =
        "rgba(0, 0, 0, 0.78)";

    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    modal.style.zIndex = "999999";
}
}
/* =========================================================
   PRODUCT CATEGORY DROPDOWN
   ========================================================= */

function populateProductCategories(categories) {

    const select =
        document.getElementById("productCategory");

    if (!select) return;

    select.innerHTML =
        `<option value="">
            Kies 'n kategorie
        </option>`;

    categories
        .filter(category => category.active)
        .forEach(category => {

            const option =
                document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            select.appendChild(option);
        });
}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

const productModal =
    document.getElementById("productModal");

const productForm =
    document.getElementById("productForm");
const productImageInput =
    document.getElementById("productImage");
    productImageInput?.addEventListener(
    "change",
    function () {

        const file = this.files?.[0];

        const currentProductImage =
            document.getElementById("currentProductImage");

        if (!file || !currentProductImage) {
            return;
        }

        const previewUrl =
            URL.createObjectURL(file);

        currentProductImage.innerHTML = `
            <div class="current-product-image-label">
                New product image
            </div>

            <img
                src="${previewUrl}"
                alt="New product image"
            >
        `;
    }
);
const addProductButton =
    document.getElementById("addProductButton");
const addCategoryButton =
    document.getElementById("addCategoryButton");

const categoryModal =
    document.getElementById("categoryModal");

const closeCategoryModal =
    document.getElementById("closeCategoryModal");

const cancelCategoryButton =
    document.getElementById("cancelCategoryButton");

if (addCategoryButton) {
    addCategoryButton.addEventListener(
        "click",
        function () {

            if (!categoryModal) return;

            categoryModal.style.position = "fixed";
            categoryModal.style.top = "0";
            categoryModal.style.left = "0";
            categoryModal.style.right = "0";
            categoryModal.style.bottom = "0";

            categoryModal.style.width = "100vw";
            categoryModal.style.height = "100vh";

            categoryModal.style.background =
                "rgba(0, 0, 0, 0.78)";

            categoryModal.style.display = "flex";
            categoryModal.style.alignItems = "center";
            categoryModal.style.justifyContent = "center";

            categoryModal.style.zIndex = "999999";
        }
    );
}

if (closeCategoryModal) {
    closeCategoryModal.addEventListener(
        "click",
        function () {
            categoryModal.style.display = "none";
        }
    );
}

if (cancelCategoryButton) {
    cancelCategoryButton.addEventListener(
        "click",
        function () {
            categoryModal.style.display = "none";
        }
    );
}

const categoryForm =
    document.getElementById("categoryForm");

if (categoryForm) {

    categoryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            const categoryId =
    document.getElementById(
        "categoryId"
    ).value;
            const name =
                document.getElementById(
                    "categoryName"
                ).value.trim();

            const active =
                document.getElementById(
                    "categoryActive"
                ).checked;

            const errorBox =
                document.getElementById(
                    "categoryFormError"
                );

            errorBox.textContent = "";

            if (!name) {

                errorBox.textContent =
                    "Please enter a category name.";

                return;
            }

            const slug =
                createSlug(name);
              
                const categoryImageInput =
    document.getElementById("categoryImage");

const categoryImageFile =
    categoryImageInput?.files?.[0];

let categoryImageUrl = null;

if (categoryId) {

    const {
        data: existingCategory
    } = await supabaseClient
        .from("categories")
        .select("image_url")
        .eq("id", categoryId)
        .single();

    categoryImageUrl =
        existingCategory?.image_url || null;
}

if (categoryImageFile) {

    try {

        categoryImageUrl =
            await uploadCategoryImage(
                categoryImageFile
            );

    } catch (uploadError) {

        console.error(
            "Category image upload failed:",
            uploadError
        );

        errorBox.textContent =
            "The category image could not be uploaded.";

        return;
    }
}

            /* Get next sort order automatically */

            const {
                data: lastCategory,
                error: sortError
            } = await supabaseClient
                .from("categories")
                .select("sort_order")
                .order("sort_order", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();

            if (sortError) {

                console.error(
                    "Sort order error:",
                    sortError
                );

                errorBox.textContent =
                    "The category could not be saved.";

                return;
            }

            const sortOrder =
                lastCategory
                    ? Number(lastCategory.sort_order) + 1
                    : 0;

            const submitButton =
                categoryForm.querySelector(
                    "button[type='submit']"
                );

            submitButton.disabled = true;
            submitButton.textContent =
                "STORING...";

let result;


/* EDIT EXISTING CATEGORY */

if (categoryId) {

    result =
        await supabaseClient
            .from("categories")
            .update({
                name: name,
                slug: slug,
                active: active,
                image_url:
                    categoryImageUrl
            })
            .eq("id", categoryId);


/* CREATE NEW CATEGORY */

} else {

    result =
        await supabaseClient
            .from("categories")
            .insert({
                name: name,
                slug: slug,
                sort_order: sortOrder,
                active: active,
                image_url:
                    categoryImageUrl
            });
}

if (result.error) {
    console.error(
        "Category save error:",
        result.error
    );

    errorBox.textContent =
        result.error.message ||
        "The category could not be saved.";

    submitButton.disabled = false;
    submitButton.textContent =
        "SAVE CATEGORY";

    return;
}


            categoryForm.reset();
            document.getElementById(
    "categoryId"
).value = "";
document.getElementById(
    "categoryModalTitle"
).textContent =
    "Add Category";

            document.getElementById(
                "categoryActive"
            ).checked = true;

            categoryModal.style.display =
                "none";

            submitButton.disabled = false;
            submitButton.textContent =
                "SAVE CATEGORY";

            await loadAdminCategories();

            await loadDashboardStats();
        }
    );
    const categoryImageInput =
    document.getElementById("categoryImage");

const categoryImagePreview =
    document.getElementById(
        "categoryImagePreview"
    );

if (
    categoryImageInput &&
    categoryImagePreview
) {

    categoryImageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files?.[0];

            if (!file) {

                categoryImagePreview.innerHTML =
                    "";

                return;
            }

            const imageUrl =
                URL.createObjectURL(file);

            categoryImagePreview.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="Category image preview"
                >
            `;
        }
    );
}
}



const closeProductModal =
    document.getElementById("closeProductModal");

const cancelProductButton =
    document.getElementById("cancelProductButton");


function openProductModal() {

    if (!productModal) return;

    productForm.reset();
    const currentProductImage =
    document.getElementById("currentProductImage");

if (currentProductImage) {
    currentProductImage.innerHTML = "";
}

    document.getElementById("productId").value = "";

    document.getElementById(
        "productModalTitle"
    ).textContent = "Add Product";

    document.getElementById(
        "productFormError"
    ).textContent = "";

    document.getElementById(
        "productActive"
    ).checked = true;

    document.getElementById(
        "productFeatured"
    ).checked = false;

    productModal.classList.add("active");
}


function closeProductModalWindow() {

    if (!productModal) return;

    productModal.classList.remove("active");
}


if (addProductButton) {

    addProductButton.addEventListener(
        "click",
        openProductModal
    );
}


if (closeProductModal) {

    closeProductModal.addEventListener(
        "click",
        closeProductModalWindow
    );
}


if (cancelProductButton) {

    cancelProductButton.addEventListener(
        "click",
        closeProductModalWindow
    );
}


/* Close when clicking outside modal */

if (productModal) {

    productModal.addEventListener(
        "click",
        function(event) {

            if (event.target === productModal) {
                closeProductModalWindow();
            }

        }
    );
}
const categoryNameInput =
    document.getElementById("categoryName");

const categorySlugInput =
    document.getElementById("categorySlug");

if (categoryNameInput && categorySlugInput) {

    categoryNameInput.addEventListener(
        "input",
        function () {

            categorySlugInput.value =
                createSlug(
                    categoryNameInput.value
                );

        }
    );
}

/* =========================================================
   AUTOMATIC SKU GENERATOR
   ========================================================= */

const categorySkuPrefixes = {
    "Braais": "BR",
    "Vleis": "VL",
    "Vuur": "VR",
    "Souse & Speserye": "SP",
    "Biltong & Droëwors": "BL",
    "Klere & Merch": "ME"
};


async function generateNextSku(categoryId) {

    if (!categoryId) return "";

    /* Get category name */

    const {
        data: category,
        error: categoryError
    } = await supabaseClient
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .single();

    if (categoryError || !category) {

        console.error(
            "Could not load category:",
            categoryError
        );

        return "";
    }


    const prefix =
        categorySkuPrefixes[category.name];

    if (!prefix) {

        console.error(
            "No SKU prefix configured for:",
            category.name
        );

        return "";
    }


    const skuPrefix = `VV-${prefix}-`;


    /* Find existing SKUs with this prefix */

    const {
        data: products,
        error
    } = await supabaseClient
        .from("products")
        .select("sku")
        .ilike("sku", `${skuPrefix}%`);


    if (error) {

        console.error(
            "SKU lookup error:",
            error
        );

        return "";
    }


    let highestNumber = 0;


    (products || []).forEach(product => {

        if (!product.sku) return;

        const numberPart =
            product.sku
                .replace(skuPrefix, "")
                .trim();

        const number =
            parseInt(numberPart, 10);

        if (
            !Number.isNaN(number) &&
            number > highestNumber
        ) {
            highestNumber = number;
        }

    });


    const nextNumber =
        String(highestNumber + 1)
            .padStart(3, "0");


    return `${skuPrefix}${nextNumber}`;
}


/* Generate SKU when category changes */

const productCategory =
    document.getElementById("productCategory");

if (productCategory) {

    productCategory.addEventListener(
        "change",
        async function () {

            /* Don't regenerate SKU while editing */

            const productId =
                document.getElementById(
                    "productId"
                ).value;



            if (productId) return;


            const sku =
                await generateNextSku(
                    this.value
                );


            document.getElementById(
                "productSku"
            ).value = sku;

        }
    );
}
/* =========================================================
   CREATE PRODUCT
   ========================================================= */

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const errorBox =
                document.getElementById(
                    "productFormError"
                );

            errorBox.textContent = "";

            const productId =
                document.getElementById(
                    "productId"
                ).value;

                let oldProductImageUrl = null;

if (productId) {

    const { data: existingProduct } =
        await supabaseClient
            .from("products")
            .select("image_url")
            .eq("id", productId)
            .single();

    oldProductImageUrl =
        existingProduct?.image_url || null;
}

            const name =
                document.getElementById(
                    "productName"
                ).value.trim();

            const categoryId =
                document.getElementById(
                    "productCategory"
                ).value;

const sku =
    document.getElementById(
        "productSku"
    ).value.trim();

            const price =
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                );

            const stock =
                Number(
                    document.getElementById(
                        "productStock"
                    ).value
                );

            const description =
                document.getElementById(
                    "productDescription"
                ).value.trim();



            const active =
                document.getElementById(
                    "productActive"
                ).checked;

            const featured =
                document.getElementById(
                    "productFeatured"
                ).checked;


            if (!name) {

                errorBox.textContent =
                    "Please enter a product name.";

                return;
            }


            if (!categoryId) {

                errorBox.textContent =
                    "Please select a category.";

                return;
            }


            if (Number.isNaN(price) || price < 0) {

                errorBox.textContent =
                    "Please enter a valid price.";

                return;
            }


            if (Number.isNaN(stock) || stock < 0) {

                errorBox.textContent =
                    "Please enter a valid stock quantity.";

                return;
            }


            const slug =
                createSlug(name);

let productImageUrl = oldProductImageUrl;

const imageFile =
    productImageInput?.files?.[0];

if (imageFile) {
    try {
        productImageUrl =
            await uploadProductImage(imageFile);

    } catch (uploadError) {

        console.error(
            "Image upload failed:",
            uploadError
        );

        errorBox.textContent =
            "The product image could not be uploaded.";

        return;
    }
}


const productData = {

    name: name,

    slug: slug,

    description:
        description || null,

    price: price,

    stock_quantity: stock,

    sku:
        sku || null,

    image_url:
        productImageUrl || null,

    category_id:
        categoryId,

    active:
        active,

    featured:
        featured,

};



const submitButton =
    productForm.querySelector(
        'button[type="submit"]'
    );

if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
}


            let result;


            if (productId) {

                /* EDIT EXISTING PRODUCT */

                result =
                    await supabaseClient
                        .from("products")
                        .update(productData)
                        .eq("id", productId)
                        .select()
                        .single();

            } else {

                /* CREATE NEW PRODUCT */

                result =
                    await supabaseClient
                        .from("products")
                        .insert(productData)
                        .select()
                        .single();
            }

if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Save Product";
}

            if (result.error) {

                console.error(
                    "Product save error:",
                    result.error
                );

                errorBox.textContent =
                    result.error.message ||
                    "The product could not be saved.";

                return;
            }

            if (productId && productImageUrl && oldProductImageUrl) {

    await deleteProductImage(
        oldProductImageUrl
    );
}


            closeProductModalWindow();

            await loadAdminProducts();

            await loadDashboardStats();

        }
    );
}


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

async function openEditProductModal(productId) {

    const {
        data: product,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();


    if (error || !product) {

        console.error(
            "Could not load product:",
            error
        );

        return;
    }


    document.getElementById(
        "productId"
    ).value = product.id;

    document.getElementById(
        "productName"
    ).value = product.name || "";

    document.getElementById(
        "productCategory"
    ).value =
        product.category_id || "";

    document.getElementById(
        "productSku"
    ).value =
        product.sku || "";

    document.getElementById(
        "productPrice"
    ).value =
        product.price ?? "";

    document.getElementById(
        "productStock"
    ).value =
        product.stock_quantity ?? 0;

    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";

const currentProductImage =
    document.getElementById("currentProductImage");

if (currentProductImage) {

    if (product.image_url) {

        currentProductImage.innerHTML = `
            <div class="current-product-image-label">
                Huidige produkbeeld
            </div>

            <img
                src="${product.image_url}"
                alt="${escapeHtml(product.name)}"
            >
        `;

    } else {

        currentProductImage.innerHTML = `
            <div class="current-product-image-empty">
                Geen produkbeeld
            </div>
        `;

    }


    document.getElementById(
        "productActive"
    ).checked =
        product.active;

    document.getElementById(
        "productFeatured"
    ).checked =
        product.featured;


    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Edit Product";

    document.getElementById(
        "productFormError"
    ).textContent = "";


    productModal.classList.add("active");
}
}

/* =========================================================
   SLUG GENERATOR
   ========================================================= */

function createSlug(text) {

    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   LOGOUT
   ========================================================= */

const adminLogout =
    document.getElementById("adminLogout");

if (adminLogout) {

    adminLogout.addEventListener(
        "click",
        async function() {

            await supabaseClient.auth.signOut();

            window.location.href =
                "admin.html";
        }
    );
}



/* =========================================================
   BEKYK BUTTON
   ========================================================= */

document.addEventListener("click", function(event) {

    const button =
        event.target.closest(
            ".admin-view-order-button"
        );

    if (!button) return;

    console.log(
        "VIEW clicked:",
        button.dataset.orderId
    );

    openOrderDetails(
        button.dataset.orderId
    );
});

/* =========================================================
   INITIALISE DASHBOARD
   ========================================================= */

async function initialiseAdminDashboard() {

    const authenticated =
        await checkAdminAccess();

    if (!authenticated) return;

    await loadDashboardStats();

    await loadAdminCategories();

    await loadAdminProducts();
    
    await loadAdminOrders();

    await loadAdminCustomers();

    await loadAdminStock();
}
document.addEventListener("click", function (event) {

    const button =
        event.target.closest(
            ".admin-adjust-stock-button"
        );

    if (!button) return;

    openStockAdjustment(
        button.dataset.productId,
        button.dataset.productName,
        Number(button.dataset.stock)
    );
});
function openStockAdjustment(
    productId,
    productName,
    currentStock
) {
    const modal =
        document.createElement("div");

    modal.className =
        "admin-order-modal-overlay";

    modal.id =
        "adminStockAdjustmentModal";

    modal.innerHTML = `
        <div class="admin-order-modal">

            <div class="admin-order-modal-header">

                <div>
                    <div class="admin-modal-eyebrow">
                        STOCK MANAGEMENT
                    </div>

                    <h2>
                        Adjust Stock
                    </h2>
                </div>

                <button
                    type="button"
                    class="admin-close-modal-button"
                    id="closeStockModalButton"
                >
                    ×
                </button>

            </div>

            <div class="admin-order-modal-body">

                <div class="admin-stock-adjust-product">
                    <span>PRODUCT</span>
                    <strong>
                        ${escapeHtml(productName)}
                    </strong>
                </div>

                <div class="admin-stock-current">
                    <span>CURRENT STOCK</span>
                    <strong>
                        ${currentStock}
                    </strong>
                </div>

                <div class="admin-stock-adjust-form">

                    <label>
                        NEW STOCK QUANTITY
                    </label>

                    <input
                        type="number"
                        id="newStockQuantity"
                        min="0"
                        step="1"
                        value="${currentStock}"
                    >

                    <button
                        type="button"
                        id="saveStockButton"
                        class="admin-save-order-status-button"
                    >
                        SAVE STOCK
                    </button>

                    <div
                        id="stockSaveError"
                        class="admin-form-error"
                    ></div>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const closeButton =
        document.getElementById(
            "closeStockModalButton"
        );

    closeButton.addEventListener(
        "click",
        function () {
            modal.remove();
        }
    );

    modal.addEventListener(
        "click",
        function (event) {
            if (event.target === modal) {
                modal.remove();
            }
        }
    );

    const saveButton =
        document.getElementById(
            "saveStockButton"
        );

    saveButton.addEventListener(
        "click",
        async function () {

            const input =
                document.getElementById(
                    "newStockQuantity"
                );

            const errorBox =
                document.getElementById(
                    "stockSaveError"
                );

            const newQuantity =
                Number(input.value);

            if (
                !Number.isInteger(newQuantity) ||
                newQuantity < 0
            ) {
                errorBox.textContent =
                    "Enter a valid stock quantity.";

                return;
            }

            saveButton.disabled = true;
            saveButton.textContent =
                "SAVING...";

            const { error } =
                await supabaseClient
                    .from("products")
                    .update({
                        stock_quantity:
                            newQuantity
                    })
                    .eq("id", productId);

            if (error) {
                console.error(
                    "Stock update error:",
                    error
                );

                errorBox.textContent =
                    "Could not update stock.";

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "SAVE STOCK";

                return;
            }

            saveButton.textContent =
                "SAVED";

            await loadAdminStock();
            await loadDashboardStats();

            setTimeout(function () {
                modal.remove();
            }, 500);
        }
    );
}

/* =========================================================
   ORDER DETAILS
   ========================================================= */

async function openOrderDetails(orderId) {

    if (!orderId) return;

    const {
        data: order,
        error: orderError
    } = await supabaseClient
        .from("orders")
        .select(`
            id,
            order_number,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            province,
            postal_code,
            notes,
            subtotal,
            delivery_fee,
            total,
            payment_method,
            payment_status,
            order_status,
            created_at
        `)
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        console.error("Order details error:", orderError);
        alert("Could not load the order.");
        return;
    }

    const {
        data: items,
        error: itemsError
    } = await supabaseClient
        .from("order_items")
        .select(`
            id,
            product_name,
            sku,
            quantity,
            unit_price,
            line_total
        `)
        .eq("order_id", orderId)
        .order("created_at", {
            ascending: true
        });

    if (itemsError) {
        console.error(
            "Order items error:",
            itemsError
        );

        alert(
            "The order was found, but the products could not be loaded."
        );

        return;
    }

    const existingModal =
        document.getElementById("adminOrderDetailsModal");

    if (existingModal) {
        existingModal.remove();
    }

    const modal =
        document.createElement("div");

    modal.id = "adminOrderDetailsModal";

    modal.innerHTML = `
        <div class="admin-order-modal-overlay">

            <div class="admin-order-modal">

                <div class="admin-order-modal-header">

                    <div>
                        <span class="admin-modal-eyebrow">
                            BESTELLING
                        </span>

                        <h2>
                            ${escapeHtml(
                                order.order_number || "No number"
                            )}
                        </h2>

                        <p>
                            ${new Date(
                                order.created_at
                            ).toLocaleString("en-ZA")}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="admin-order-modal-close"
                        id="closeOrderDetailsButton"
                    >
                        ×
                    </button>

                </div>

                <div class="admin-order-modal-body">

                    <div class="admin-order-detail-grid">

                        <div class="admin-order-detail-card">

                            <h3>KLIËNT</h3>

                            <p>
                                <strong>
                                    ${escapeHtml(
                                        `${order.first_name || ""} ${order.last_name || ""}`
                                    )}
                                </strong>
                            </p>

                            <p>
                                ${escapeHtml(
                                    order.email || "—"
                                )}
                            </p>

                            <p>
                                ${escapeHtml(
                                    order.phone || "—"
                                )}
                            </p>

                        </div>

                        <div class="admin-order-detail-card">

                            <h3>AFLEWERINGSADRES</h3>

                            <p>
                                ${escapeHtml(
                                    order.address || "—"
                                )}
                            </p>

                            <p>
                                ${escapeHtml(
                                    `${order.city || ""}, ${order.province || ""}`
                                )}
                            </p>

                            <p>
                                ${escapeHtml(
                                    order.postal_code || "—"
                                )}
                            </p>

                        </div>

                        <div class="admin-order-detail-card">

                            <h3>BETALING</h3>

                            <p>
                                Metode:
                                <strong>
                                    ${escapeHtml(
                                        order.payment_method || "—"
                                    )}
                                </strong>
                            </p>

                            <p>
                                Betaling:
                                <strong>
                                    ${escapeHtml(
                                        order.payment_status || "pending"
                                    )}
                                </strong>
                            </p>

                            <p>
                                Bestelling:
                                <strong>
                                    ${escapeHtml(
                                        order.order_status || "pending"
                                    )}
                                </strong>
                            </p>

                        </div>

                    </div>
                   
                    <div class="admin-order-products">

                        <h3>PRODUKTE</h3>

                        ${
                            items && items.length
                                ? `
                                    <div class="admin-order-product-list">

                                        ${items.map(item => `
                                            <div class="admin-order-product-row">

                                                <div>
                                                    <strong>
                                                        ${escapeHtml(
                                                            item.product_name || "Product"
                                                        )}
                                                    </strong>

                                                    <span>
                                                        SKU:
                                                        ${escapeHtml(
                                                            item.sku || "—"
                                                        )}
                                                    </span>
                                                </div>

                                                <div>
                                                    ×${Number(
                                                        item.quantity || 0
                                                    )}
                                                </div>

                                                <div>
                                                    R${Number(
                                                        item.line_total || 0
                                                    ).toLocaleString("en-ZA", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </div>

                                            </div>
                                        `).join("")}

                                    </div>
                                `
                                : `
                                    <p>
                                        Geen produkte gevind nie.
                                    </p>
                                `
                        }

                    </div>

                    ${
                        order.notes
                            ? `
                                <div class="admin-order-notes">

                                    <h3>NOTAS</h3>

                                    <p>
                                        ${escapeHtml(order.notes)}
                                    </p>

                                </div>
                            `
                            : ""
                    }

                    <div class="admin-order-summary">

                        <div>
                            <span>Subtotaal</span>
                            <strong>
                                R${Number(
                                    order.subtotal || 0
                                ).toLocaleString("en-ZA", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div>
                            <span>Aflewering</span>
                            <strong>
                                R${Number(
                                    order.delivery_fee || 0
                                ).toLocaleString("en-ZA", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div class="admin-order-grand-total">
                            <span>TOTAAL</span>
                            <strong>
                                R${Number(
                                    order.total || 0
                                ).toLocaleString("en-ZA", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                    </div>

                </div>

 <div class="admin-order-payment-controls">
    <h3>BETALING STATUS</h3>

    <div class="admin-order-status-control-row">
        <select
            id="orderPaymentStatusSelect"
            class="admin-order-status-select"
        >
            <option value="pending" ${order.payment_status === "pending" ? "selected" : ""}>
                Pending
            </option>

            <option value="paid" ${order.payment_status === "paid" ? "selected" : ""}>
                Paid
            </option>

            <option value="failed" ${order.payment_status === "failed" ? "selected" : ""}>
                Failed
            </option>

            <option value="refunded" ${order.payment_status === "refunded" ? "selected" : ""}>
                Refunded
            </option>
        </select>

        <button
            type="button"
            id="saveOrderPaymentStatusButton"
            class="admin-save-order-status-button"
        >
            SAVE PAYMENT STATUS
        </button>
    </div>
</div>

<div class="admin-order-status-controls">

    <h3>BESTELLING STATUS</h3>

    <div class="admin-order-status-control-row">

        <select
            id="orderStatusSelect"
            class="admin-order-status-select"
        >

            <option
                value="pending"
                ${order.order_status === "pending" ? "selected" : ""}
            >
                Pending
            </option>

            <option
                value="processing"
                ${order.order_status === "processing" ? "selected" : ""}
            >
                Processing
            </option>

            <option
                value="shipped"
                ${order.order_status === "shipped" ? "selected" : ""}
            >
                Shipped
            </option>

            <option
                value="completed"
                ${order.order_status === "completed" ? "selected" : ""}
            >
                Completed
            </option>

            <option
                value="cancelled"
                ${order.order_status === "cancelled" ? "selected" : ""}
            >
                Cancelled
            </option>

        </select>

        <button
            type="button"
            id="saveOrderStatusButton"
            class="admin-save-order-status-button"
        >
            SAVE STATUS
        </button>

    </div>

</div>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
const saveOrderPaymentStatusButton =
    document.getElementById(
        "saveOrderPaymentStatusButton"
    );

if (saveOrderPaymentStatusButton) {
    saveOrderPaymentStatusButton.addEventListener(
        "click",
        async function () {

            const paymentStatusSelect =
                document.getElementById(
                    "orderPaymentStatusSelect"
                );

            const newPaymentStatus =
                paymentStatusSelect.value;

            saveOrderPaymentStatusButton.disabled = true;

            saveOrderPaymentStatusButton.textContent =
                "SAVING...";

            const { error } =
                await supabaseClient
                    .from("orders")
                    .update({
                        payment_status: newPaymentStatus
                    })
                    .eq("id", orderId);

            if (error) {
                console.error(
                    "Payment status update error:",
                    error
                );

                alert(
                    "Could not update the payment status."
                );

                saveOrderPaymentStatusButton.disabled =
                    false;

                saveOrderPaymentStatusButton.textContent =
                    "SAVE PAYMENT STATUS";

                return;
            }

            saveOrderPaymentStatusButton.textContent =
                "SAVED";

            await loadAdminOrders();

            setTimeout(function () {
                saveOrderPaymentStatusButton.textContent =
                    "SAVE PAYMENT STATUS";
            }, 1500);
        }
    );
}
   const saveOrderStatusButton =
    document.getElementById(
        "saveOrderStatusButton"
    );

if (saveOrderStatusButton) {

    saveOrderStatusButton.addEventListener(
        "click",
        async function () {

            const statusSelect =
                document.getElementById(
                    "orderStatusSelect"
                );

            const newStatus =
                statusSelect.value;

            saveOrderStatusButton.disabled = true;

            saveOrderStatusButton.textContent =
                "SAVING...";

            const {
                data,
                error
            } = await supabaseClient.functions.invoke(
                "update-order-status",
                {
                    body: {
                        orderId,
                        newStatus
                    }
                }
            );

            if (error) {

                console.error(
                    "Order status update error:",
                    error
                );

                alert(
                    "Could not update the order status. The status may not have changed."
                );

                saveOrderStatusButton.disabled = false;

                saveOrderStatusButton.textContent =
                    "SAVE STATUS";

                return;
            }

            if (!data?.success) {

                console.error(
                    "Order status function error:",
                    data
                );

                alert(
                    data?.error ||
                    "Could not update the order status."
                );

                saveOrderStatusButton.disabled = false;

                saveOrderStatusButton.textContent =
                    "SAVE STATUS";

                return;
            }

            saveOrderStatusButton.textContent =
                data.emailSent
                    ? "SAVED & EMAILED"
                    : "SAVED";

            await loadAdminOrders();

            setTimeout(function () {

                saveOrderStatusButton.textContent =
                    "SAVE STATUS";

            }, 1800);

        }
    );
}                     
    document
        .getElementById("closeOrderDetailsButton")
        ?.addEventListener("click", () => {
            modal.remove();
        });

    modal
        .querySelector(".admin-order-modal-overlay")
        ?.addEventListener("click", function (event) {

            if (
                event.target ===
                this
            ) {
                modal.remove();
            }

        });
}
initialiseAdminDashboard();
