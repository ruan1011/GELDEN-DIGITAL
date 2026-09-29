/* =========================================================
   VOLK & VUUR
   ADMIN AUTHENTICATION
   ========================================================= */
const ADMIN_EMAIL =
    "ruan.geldenhuis7@gmail.com";

/* =========================================================
   CHECK CURRENT SESSION
   ========================================================= */
async function checkAdminSession() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        return;
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

        return;
    }

    window.location.href =
        "admin-dashboard.html";
}


checkAdminSession();


/* =========================================================
   LOGIN
   ========================================================= */

const adminLoginForm =
    document.getElementById("adminLoginForm");

const adminLoginError =
    document.getElementById("adminLoginError");


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("adminEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("adminPassword")
                    .value;


            adminLoginError.textContent =
                "";

if (
    email.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
) {

    adminLoginError.textContent =
        "This account does not have administrator access.";

    return;
}
            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );


                adminLoginError.textContent =
                    "Email address or password incorrect.";

                return;

            }


            if (data.session) {

                window.location.href =
                    "admin-dashboard.html";

            }

        }
    );

}