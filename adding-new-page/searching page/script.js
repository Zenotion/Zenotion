let searchInput = document.getElementById("search-prompt-input");
let suggestionBox = document.getElementById("suggestion-holder_js");

searchInput.addEventListener("focus", () => {
  suggestionBox.classList.remove("suggestion-section_pi")
});

searchInput.addEventListener("blur", () => {
  suggestionBox.classList.add("suggestion-section_pi")
});


