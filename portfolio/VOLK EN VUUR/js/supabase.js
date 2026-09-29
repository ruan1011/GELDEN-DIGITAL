const SUPABASE_URL =
    "https://pxlyxjaehkebqpanuhhy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_qbGbclFdPG3uvS9UwbG5xQ_ja1G_GKK";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


async function testSupabaseConnection() {

    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("name")
            .limit(1);

    if (error) {

        console.error(
            "Supabase connection failed:",
            error
        );

        return;

    }

    console.log(
        "Supabase connected successfully:",
        data
    );

}


testSupabaseConnection();