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



function addRemove(con){
  let allWorngButton = document.getElementById(`${con}1`);
  allWorngButton.addEventListener("click",()=>{
    let parentContainer = document.getElementById(`${con}`).remove();
  })
}

let emailAddButton = document.getElementById("add-email-button-js");

function addElement(content){
  let newElementDiv = document.createElement("div");
  newElementDiv.setAttribute("class",`email-item email_arrangement`);
  newElementDiv.setAttribute("id",`${content}`);
  let newElementP = document.createElement("p");
  newElementP.textContent = content;
  let newElementI = document.createElement("i");
  newElementI.setAttribute("class",`ri-close-fill worng_button`);
  newElementI.setAttribute("id",`${content}1`);
  document.getElementById("entered-email-section-js").appendChild(newElementDiv);
  document.getElementById(content).appendChild(newElementP);
  document.getElementById(content).appendChild(newElementI);

}

function validateEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function checkCharCount_title() {
  const input = document.getElementById('new_title_form');
  document.getElementById("require-alert-mgs").textContent = "";

  const charCount = document.getElementById('charCount_title');
  const maxLength = 15;

  charCount.textContent = `${input.value.length}/${maxLength}`;

  if (input.value.length >= maxLength) {
      input.disabled = true;
      charCount.textContent += ' (Character limit reached)';
  } else {
      input.disabled = false;
  }
}

function checkCharCount_desc() {
  const input = document.getElementById('new_decs_form');
  const charCount = document.getElementById('charCount_desc');
  document.getElementById("require-alert-mgs-desc").textContent = "";
  const maxLength = 75;

  charCount.textContent = `${input.value.length}/${maxLength}`;

  if (input.value.length >= maxLength) {
      input.disabled = true;
      charCount.textContent += ' (Character limit reached)';
  } else {
      input.disabled = false;
  }
}

async function checkEmailAvailablity(email){
  try {
    const response = await fetch('http://localhost:5000/email_api_redirect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({  
        email : email
       })
    });
    const datas = await response.json();
    return datas
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}
;



emailAddButton.addEventListener("click",async()=>{
  let newElementValue = document.getElementById("new_eamil_form").value;
  let result = validateEmailFormat(newElementValue);
  let errorDisplay = document.getElementById("error-display");
  let availableCHeck = await checkEmailAvailablity(newElementValue);
  console.log(checkEmailAvailablity(newElementValue))
  if(result){
    if(availableCHeck){
      errorDisplay.textContent = "";
      addElement(newElementValue);
      addRemove(newElementValue);
      document.getElementById("new_eamil_form").value = "";
    }else{
      errorDisplay.textContent = "email does not exit";
    }

  }else{
    errorDisplay.textContent = "email is invalid";
  }
})

function imgaleart(){
  document.getElementById("require-alert-mgs-img").textContent = "";
}
function checkCharCount_email(){
  document.getElementById("require-alert-mgs-email").textContent = "";

}

let public_space_button = document.getElementById("public");
let private_space_button = document.getElementById("private");
let createSpaceButton = document.getElementById("create-space-button-js");

createSpaceButton.addEventListener("click", async()=>{
  const imageFile = document.getElementById('upload-button').files[0];
  let spaceName = document.getElementById("new_title_form").value;
  let spaceDesc = document.getElementById("new_decs_form").value;
  let public_type = "public";
  let private_type = "private";
  let email;
  if(private_space_button.checked){
    let email_Container = []
    let emailItem = document.querySelectorAll(".email-item");
    for(let i =0; i<emailItem.length;i++){
      email_Container.push(emailItem[i].textContent)
      console.log(email_Container);
    }
    email = email_Container;
  }

  console.log(email);
  if(public_space_button.checked){
    if(spaceName.trim() == "" || !imageFile || spaceDesc.trim() == ""){
      if(spaceName.trim() == ""){
        document.getElementById("require-alert-mgs").textContent = "space name cant be empty";
      }
      if(spaceDesc.trim() == ""){
        document.getElementById("require-alert-mgs-desc").textContent = "space description cant be empty";
      }
      if(!imageFile ){
        document.getElementById("require-alert-mgs-img").textContent = "space image cant be empty";
      }
    }else{

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('spaceName', spaceName);
      formData.append('description', spaceDesc);
      formData.append('groupType',public_type)
      postData(formData);
    }
  }

  if(private_space_button.checked){
    if(spaceName.trim() == "" || !imageFile || email.length == 0){
      if(spaceName.trim() == ""){
        document.getElementById("require-alert-mgs").textContent = "space name cant be empty";
      }
      if(!imageFile ){
        document.getElementById("require-alert-mgs-img").textContent = "space image cant be empty";
      }
      if(email.length == 0){
        document.getElementById("require-alert-mgs-email").textContent = "eamil cant be empty";
      }
    }else{

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('spaceName', spaceName);
      formData.append('description', spaceDesc);
      formData.append('groupType',private_type);
        formData.append('email', JSON.stringify(email));
      postData(formData);
    }
  }

  
})


// Example POST request using async/await
async function postData(formData) {
  try {
    const response = await fetch('http://localhost:5000/notionspace/create/space', {
      method: 'POST',
      body:formData
    });
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}

let public_radio = document.getElementById("public");
let private_radio = document.getElementById("private");
let add_email_section = document.getElementById("add-member-to-grp-js")
let radio_buttons = document.querySelectorAll("input[type = radio]");

for(let i = 0;i < radio_buttons.length;i++){
  radio_buttons[i].addEventListener("click",()=>{
  if(radio_buttons[i].id == "public"){
    add_email_section.classList.remove("add-member-to-grp");
    add_email_section.classList.add("remove_add_email_section");

  }else{
    add_email_section.classList.add("add-member-to-grp");
    add_email_section.classList.remove("remove_add_email_section");

  }
  })
}

