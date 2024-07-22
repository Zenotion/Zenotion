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

async function checkEmailAvailablity(email){
  try {
    const response = await fetch('http://localhost:3000/check_email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({  
        email : email
       })
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

emailAddButton.addEventListener("click",()=>{
  let newElementValue = document.getElementById("new_eamil_form").value;
  let result = validateEmailFormat(newElementValue);
  let errorDisplay = document.getElementById("error-display");
  checkEmailAvailablity(newElementValue);
  if(result){
    errorDisplay.textContent = "";
    addElement(newElementValue);
    addRemove(newElementValue);
    document.getElementById("new_eamil_form").value = "";
  }else{
    errorDisplay.textContent = "email is invalid";
  }

})

let createSpaceButton = document.getElementById("create-space-button-js");

createSpaceButton.addEventListener("click",()=>{
  let spaceName = new_title_form.value;
  let spaceDesc = new_decs_form.value;
  let email = [];
  let emailItem = document.querySelectorAll(".email-item");
  for(let i =0; i<emailItem.length;i++){
    email.push(emailItem[i].textContent)
  }
  postData(spaceName,spaceDesc,email);
})


// Example POST request using async/await
async function postData(spaceName,spaceDesc,email) {
  try {
    const response = await fetch('http://localhost:5000/notionspace/create/space', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ spaceName: `${spaceName}`,
        description : `${spaceDesc}`,
        email :email
       })
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



