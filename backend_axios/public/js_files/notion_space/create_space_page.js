let chosenImage = document.getElementById("chosen-image");
let fileName = document.getElementById("file-name");
let uploadButton = document.getElementById("upload-button");

uploadButton.onchange = () => {
  let reader = new FileReader();
  reader.readAsDataURL(uploadButton.files[0]);
  reader.onload = () => {
      chosenImage.setAttribute("src",reader.result);
  }
  fileName.textContent = uploadButton.files[0].name;
}