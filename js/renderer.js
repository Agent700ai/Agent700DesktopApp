class Login {
  constructor() {
    this.main = document.querySelector("body");
    this.form = this.main.querySelector(".login-form");
    this.email = this.main.querySelector(".input-email");
    this.password = this.main.querySelector(".input-password");
    this.rememberCheckbox = this.main.querySelector("#remember-me");
    this.errorElement = this.main.querySelector(".login-error");
    this.forgetCredentialsSection = this.main.querySelector(".forget-credentials");
    this.forgetCredentialsLink = this.main.querySelector("#forget-stored-credentials");

    this.init();
  }

  async init() {
    // Check if stored credentials exist and show forget option if they do
    await this.checkStoredCredentials();
    this.setupEventListeners();
  }

  async checkStoredCredentials() {
    try {
      const storedToken = await window.electronAPI.retrieveToken();
      if (storedToken) {
        this.forgetCredentialsSection.style.display = 'block';
      }
    } catch (error) {
      console.error('Error checking stored credentials:', error);
    }
  }

  setupEventListeners() {
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
					if (data && data.accessToken) {
              sessionStorage.setItem('accessToken', data.accessToken);

              // Send login success with token and remember preference
							window.electronAPI.sendLoginSuccess({
                token: data.accessToken,
                remember: this.rememberCheckbox.checked
              });
					} else {
							this.errorElement.textContent = "Incorrect credentials.";
					}
			})
			.catch((error) => {
					this.errorElement.textContent = "Authentication error.";
					console.error("Error in request:", error);
			});
		});

    // Handle forget credentials click
    this.forgetCredentialsLink.addEventListener('click', async (event) => {
      event.preventDefault();
      await this.forgetStoredCredentials();
    });
  }

  async forgetStoredCredentials() {
    try {
      const success = await window.electronAPI.deleteToken();
      if (success) {
        this.forgetCredentialsSection.style.display = 'none';
        this.errorElement.textContent = "Stored credentials have been cleared.";
        this.errorElement.style.color = '#1890FF'; // Blue color for info message
        
        // Reset to error color after 3 seconds
        setTimeout(() => {
          this.errorElement.textContent = "";
          this.errorElement.style.color = 'red';
        }, 3000);
      }
    } catch (error) {
      console.error('Error forgetting credentials:', error);
      this.errorElement.textContent = "Failed to clear stored credentials.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Login();
});
