let products = [];

window.productsReady = (async function () {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("active", true);

    if (error) {
        console.error("Supabase products error:", error);
        return;
    }

    products = data || [];

    document.dispatchEvent(new Event("productsLoaded"));

})();