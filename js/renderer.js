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

    debugLogger.info('RENDERER:login', 'Login component initialized');
    this.init();
  }

  async init() {
    debugLogger.info('RENDERER:login', 'Initializing login component...');
    
    // Check if stored credentials exist and show forget option if they do
    await this.checkStoredCredentials();
    this.setupEventListeners();
    
    debugLogger.info('RENDERER:login', 'Login component initialization complete');
  }

  async checkStoredCredentials() {
    try {
      debugLogger.info('RENDERER:login', 'Checking for stored credentials...');
      const storedToken = await window.electronAPI.retrieveToken();
      if (storedToken) {
        debugLogger.info('RENDERER:login', 'Found stored credentials, showing forget option');
        this.forgetCredentialsSection.style.display = 'block';
      } else {
        debugLogger.info('RENDERER:login', 'No stored credentials found');
      }
    } catch (error) {
      debugLogger.error('RENDERER:login', 'Error checking stored credentials:', error.message);
    }
  }

  setupEventListeners() {
    debugLogger.info('RENDERER:login', 'Setting up event listeners...');
    
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      
      debugLogger.info('RENDERER:login', 'Login form submitted');

      const requestData = {
        email: this.email.value,
        password: this.password.value,
      };

      // Don't log sensitive data, just log that login attempt is being made
      debugLogger.info('RENDERER:login', 'Attempting login for email:', this.email.value);

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
        debugLogger.info('RENDERER:login', 'Login API response status:', response.status);
        
					if (!response.ok) {
							throw new Error(`HTTP error! Status: ${response.status}`);
					}
					return response.json();
			})
			.then((data) => {
					if (data && data.accessToken) {
              debugLogger.info('RENDERER:login', 'Login successful, storing token in sessionStorage');
              sessionStorage.setItem('accessToken', data.accessToken);

              // Send login success with token and remember preference
              debugLogger.info('RENDERER:login', 'Sending login success to main process, remember:', this.rememberCheckbox.checked);
							window.electronAPI.sendLoginSuccess({
                token: data.accessToken,
                remember: this.rememberCheckbox.checked
              });
					} else {
              debugLogger.warn('RENDERER:login', 'Login failed: No access token in response');
							this.errorElement.textContent = "Incorrect credentials.";
					}
			})
			.catch((error) => {
        debugLogger.error('RENDERER:login', 'Login error:', error.message);
					this.errorElement.textContent = "Authentication error.";
			});
		});

    // Handle forget credentials click
    this.forgetCredentialsLink.addEventListener('click', async (event) => {
      event.preventDefault();
      debugLogger.info('RENDERER:login', 'Forget credentials clicked');
      await this.forgetStoredCredentials();
    });
    
    debugLogger.info('RENDERER:login', 'Event listeners setup complete');
  }

  async forgetStoredCredentials() {
    try {
      debugLogger.info('RENDERER:login', 'Attempting to delete stored credentials...');
      const success = await window.electronAPI.deleteToken();
      if (success) {
        debugLogger.info('RENDERER:login', 'Stored credentials deleted successfully');
        this.forgetCredentialsSection.style.display = 'none';
        this.errorElement.textContent = "Stored credentials have been cleared.";
        this.errorElement.style.color = '#1890FF'; // Blue color for info message
        
        // Reset to error color after 3 seconds
        setTimeout(() => {
          this.errorElement.textContent = "";
          this.errorElement.style.color = 'red';
        }, 3000);
      } else {
        debugLogger.warn('RENDERER:login', 'Failed to delete stored credentials');
      }
    } catch (error) {
      debugLogger.error('RENDERER:login', 'Error forgetting credentials:', error.message);
      this.errorElement.textContent = "Failed to clear stored credentials.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  debugLogger.info('RENDERER:login', 'DOM loaded, initializing Login...');
  try {
    new Login();
  } catch (error) {
    debugLogger.error('RENDERER:login', 'Error initializing Login:', error.message, error.stack);
    // Show error in UI if possible
    const errorElement = document.querySelector(".login-error");
    if (errorElement) {
      errorElement.textContent = "Application Error: " + error.message;
    }
  }
});
