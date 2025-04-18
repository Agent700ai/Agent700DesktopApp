class Login {
  constructor() {
    this.main = document.querySelector("body");
    this.form = this.main.querySelector(".login-form");
    this.email = this.main.querySelector(".input-email");
    this.password = this.main.querySelector(".input-password");
    this.errorElement = this.main.querySelector(".login-error");

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();

      const requestData = {
        email: this.email.value,
        password: this.password.value,
      };

      fetch(`${window.env.API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(requestData),
        credentials: "include"
			})
			.then((response) => {
					if (!response.ok) {
							throw new Error(`HTTP error! Status: ${response.status}`);
					}
					return response.json();
			})
			.then((data) => {
					if (data) {
              sessionStorage.setItem('accessToken',data.accessToken);

							window.electronAPI.sendLoginSuccess();
					} else {
							this.errorElement.textContent = "Incorrect credentials.";
					}
			})
			.catch((error) => {
					this.errorElement.textContent = "Error en la autenticación.";
					console.error("Error in request:", error);
			});
		})
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Login();
});
