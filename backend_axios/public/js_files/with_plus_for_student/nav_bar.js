

   // Function to open the modal
   function openLoginModal() {
    document.getElementById("loginModal").style.display = "block";
}

// Function to close the modal
function closeLoginModal() {
    document.getElementById("loginModal").style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById("loginModal")) {
        closeLoginModal();
    }
}
