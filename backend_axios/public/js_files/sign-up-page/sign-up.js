const eye = document.getElementById("eyeicon");
const pass = document.getElementById("password");

function pass1(){
    if(pass.type == "password"){
        pass.type = "text";
        eye.setAttribute("name","eye-off")
    }else{
        pass.type = "password";
        eye.setAttribute("name","eye"); 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.querySelector('#reg_button');
  
    // Helper function to update submit button state
    function updateSubmitButtonState() {
      submitButton.disabled = !usernameInput.checkValidity() || !emailInput.checkValidity() || !passwordInput.checkValidity();
    }
  
    // Validation for username
    usernameInput.addEventListener('input', function() {
      this.setCustomValidity(this.value.length >= 4 ? '' : 'Username must be at least 4 characters long.');
      checkUsername();
      updateSubmitButtonState();
      if (this.style.borderColor === 'green') {
        this.style.borderColor = 'red'; // Revert border color to red if modified
      }
    });
  
    // Validation for email using browser's native validation
    emailInput.addEventListener('input', function() {
      checkEmail();
      updateSubmitButtonState();
      if (this.style.borderColor === 'green') {
        this.style.borderColor = 'red'; // Revert border color to red if modified
      }
    });
  
    // Validation for password
    passwordInput.addEventListener('input', function() {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      this.setCustomValidity(passwordRegex.test(this.value) ? '' : 'Password must be at least 6 characters long and include at least one uppercase letter, one number, and one special character.');
      updateSubmitButtonState();
    });
  
    // Set default border color to red
    usernameInput.style.borderColor = 'red';
    emailInput.style.borderColor = 'red';
  });

  function checkUsername() {
    const username = document.getElementById('username').value;
    const statusDiv = document.getElementById('usernameStatus');
    const usernameInput = document.getElementById('username');
    fetch('/user_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.available) {
            statusDiv.textContent = data.message;
            usernameInput.style.borderColor = 'red'; // Set border color to red if username already exists
        } else {
            statusDiv.textContent = '';
            usernameInput.style.borderColor = 'green'; // Set border color to green if username is available
        }
    })
    .catch(error => console.error('Error:', error));
  }
  
  function checkEmail() {
    const email = document.getElementById("email").value;
    const statusDiv = document.getElementById('emailStatus');
    const emailInput = document.getElementById('email');
    fetch('/email_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.available) {
            statusDiv.textContent = data.message;
            emailInput.style.borderColor = 'red'; // Set border color to red if email already exists
        } else {
            statusDiv.textContent = "";
            emailInput.style.borderColor = 'green'; // Set border color to green if email is available
        }
    })
    .catch(error => console.error('Error:', error));
  }
  