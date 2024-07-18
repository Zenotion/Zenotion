document.getElementById('otpForm').addEventListener('input', function(event) {
    let input = event.target;
    let inputValue = input.value;
    let nextInput = input.nextElementSibling;
  
    // Limit input to one digit
    if (inputValue.length > 1) {
        input.value = inputValue.slice(0, 1);
    }
  
    // Move to next input when current is filled
    if (inputValue.length === 1 && nextInput && nextInput.tagName === "INPUT") {
        nextInput.focus();
    }
  });
  
  // Handle paste event on the first input
  document.getElementById('otp1').addEventListener('paste', function(e) {
    e.preventDefault();
    // Get pasted data via clipboard API
    var pastedData = e.clipboardData || window.clipboardData;
    if (pastedData) {
        const pastedText = pastedData.getData('Text').slice(0, 6); // Get first 6 characters only
        // Distribute the pasted text into the inputs
        let inputs = document.querySelectorAll('.otp-inputs input');
        let index = 0;
        let remainingText = pastedText;
        inputs.forEach((inputField) => {
            if (remainingText.length > 0) {
                inputField.value = remainingText[0];
                remainingText = remainingText.slice(1);
            }
        });
        // Focus on the last input
        inputs[inputs.length - 1].focus();
    }
  });
  
  // Move focus to next input on input
  document.querySelectorAll('.otp-inputs input').forEach(function(input) {
    input.addEventListener('input', function() {
        let nextInput = input.nextElementSibling;
        if (input.value.length === 1 && nextInput && nextInput.tagName === "INPUT") {
            nextInput.focus();
        }
    });
  });
  
  // Move back to previous input on backspace if current is empty
  document.querySelectorAll('.otp-inputs input').forEach(function(input) {
    input.addEventListener('keydown', function(e) {
        if (e.key === "Backspace" && input.value === '') {
            let previousInput = input.previousElementSibling;
            if (previousInput && previousInput.tagName === "INPUT") {
                previousInput.focus();
            }
        }
    });
  });