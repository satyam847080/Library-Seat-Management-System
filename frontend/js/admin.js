
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("ownerLoginForm");
    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            loginMessage.textContent = "Please enter email and password.";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Please wait...";
        loginMessage.textContent = "";

        try {

            const response = await fetch(
                "http://localhost:5000/api/admin/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed!");
            }

            sessionStorage.setItem("libraryToken", data.token);

            window.location.href = "admin-dashboard.html";

        } catch (error) {

            loginMessage.textContent =
                error.message || "Unable to connect to server.";

        } finally {

            loginBtn.disabled = false;
            loginBtn.textContent = "Login to Dashboard →";

        }

    });

});
