const menu = document.getElementById("menu");
const nav = document.querySelector("nav");

if (menu) {
    menu.onclick = () => {
        nav.style.display =
            nav.style.display === "flex" ? "none" : "flex";

        nav.style.position = "absolute";
        nav.style.top = "82px";
        nav.style.left = "0";
        nav.style.right = "0";
        nav.style.padding = "20px";
        nav.style.background = "#0b1118";
        nav.style.flexDirection = "column";
    };
}