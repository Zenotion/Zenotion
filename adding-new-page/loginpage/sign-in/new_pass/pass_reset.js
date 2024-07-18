document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const submitButton = document.querySelector('.go_back');
  
    // Helper function to update submit button state
    function updateSubmitButtonState() {
      submitButton.disabled =  !passwordInput.checkValidity();
    }

    // Validation for password
    passwordInput.addEventListener('input', function() {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      this.setCustomValidity(passwordRegex.test(this.value) ? '' : 'Password must be at least 6 characters long and include at least one uppercase letter, one number, and one special character.');
      updateSubmitButtonState();
    });
  
  });