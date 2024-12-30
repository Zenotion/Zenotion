paths = window.location.href
paths = paths.split("/")
path_7 = paths[7].split("%20").join(" ")
console.log(path_7);
path_8 = paths[8]
document.getElementById(path_7).classList.add("selected-grp")

document.getElementById(path_8).classList.add("selected-grp")
document.getElementById(path_8).style.backgroundColor = "#5131f3ef"


const open = document.getElementById("open");
const main = document.getElementById("main"); 
const close = document.getElementById("close");
const blurs = document.getElementById("blurs")

console.log(blurs)
open.addEventListener("click",()=>{

    main.classList.add("on");
    blurs.style.filter = "blur(3px)";
    
});

close.addEventListener("click",()=>{

    main.classList.remove("on");
    blurs.style.filter = "none";
})


main.addEventListener('click', (event) => {
    console.log(event.target);
    console.log(main);
    if (event.target === main) {
        main.classList.remove("on")
        blurs.style.filter = "none";

}
});

const topic_input = document.getElementById("topic");
const counter = document.getElementById("count1");
const description_input = document.getElementById("des");
const count = document.getElementById("count2");


topic_input.addEventListener("focus", function() {
  topic_input.disabled = false; // Enable the input on focus
});

topic_input.addEventListener("input", (event) => {
  const maxLength = 25;
  let val = topic_input.value;

  if (val.length <= maxLength) {
      counter.innerHTML = `${val.length}/${maxLength}`;
  } else {
    topic_input.value = val.slice(0, maxLength); // Trim the value to maxLength
      counter.innerHTML = `${maxLength}/${maxLength}`;
  }
});

description_input.addEventListener("focus", function() {
  description_input.disabled = false; // Enable the input on focus
});

description_input.addEventListener("input", (event) => {
  const maxLength = 75;
  let val = description_input.value;

  if (val.length <= maxLength) {
    count.innerHTML = `${val.length}/${maxLength}`;
  } else {
    description_input.value = val.slice(0, maxLength); // Trim the value to maxLength
      count.innerHTML = `${maxLength}/${maxLength}`;
  }
});






let nav1 = document.querySelector(".navbar-container");
let nav2 = document.querySelector(".logo")
let nav3 = document.querySelector(".link-tag-main-logo")
window.addEventListener("scroll",()=>{
let s = window.scrollY;
if(s>0){
  nav1.classList.add("move-navbar");
  nav2.classList.add("move-navbar");
  nav3.classList.add("move-navbar");
}else{
  nav1.classList.remove("move-navbar");
  nav2.classList.remove("move-navbar");
  nav3.classList.remove("move-navbar");
}
});

// document.querySelector('.title').addEventListener('mousemove', function (e) {
//   var x = e.clientX / (window.innerWidth);
//   var y = e.clientY / (window.innerHeight);
//   var imgFilter = document.querySelector('.img-filter');
//   imgFilter.style.transform = 'translate(' + x * 20 + 'px, ' + y * 20 + 'px)';
// });

let pro_button = document.getElementById("profile-option");
let dis_pro_option = document.getElementById("js_display-pro")

pro_button.addEventListener("click",()=>{
  dis_pro_option.classList.toggle("dis_profile");
})

let revealbut = document.querySelector(".chat-trigger1");
let revealbut1 = document.querySelector(".chat-trigger");
let icon = document.querySelector(".chat-trigger i");

let chat_section = document.querySelector(".main-chat-section");
let blur_section = document.querySelectorAll(".adding-blur");

revealbut.addEventListener('click',()=>{
  chat_section.classList.toggle('open-up');
  revealbut.classList.toggle('open-up-menu');
  revealbut1.classList.toggle('open-up-menu');
  icon.classList.toggle("ri-arrow-left-double-line");
  icon.classList.toggle("ri-arrow-right-double-line");
  blur_section.forEach(element => {
    element.classList.toggle("adding-blur");
    element.classList.toggle("blurred-background");
  });
})

let cur_path = window.location.pathname;
document.getElementById(cur_path).classList.add("selected-grp");

//selecting edit group

let edit_but = document.getElementById("edit-space-button")
let main_edit_section = document.getElementById("space-editing-main-section")

edit_but.addEventListener("click",()=>{
  main_edit_section.style.display = "block";
  blur_section.forEach(element => {
    element.classList.toggle("adding-blur");
    element.classList.toggle("blurred-background");
  });
})

// closing editing section

let close_button = document.getElementById("worng-exit-editing-section")

let uploadButton = document.getElementById("upload-button");
let chosenImage = document.getElementById("chosen-image");
let fileName = document.getElementById("file-name");
let editing_form = document.getElementById("editing-form");
close_button.addEventListener("click",()=>{
  main_edit_section.style.display = "none";
  blur_section.forEach(element => {
    element.classList.toggle("adding-blur");
    element.classList.toggle("blurred-background");
  });
  chosenImage.setAttribute("src","/images/notion_space/group_page/img.png");
  fileName.textContent ="";
  editing_form.reset();
})


uploadButton.onchange = () => {
    let reader = new FileReader();
    reader.readAsDataURL(uploadButton.files[0]);
    reader.onload = () => {
        chosenImage.setAttribute("src",reader.result);
    }
    fileName.textContent = uploadButton.files[0].name;
}



function checkCharCount_desc() {
  const input = document.getElementById('new_decs_form');
  const charCount = document.getElementById('charCount_desc');
  const maxLength = 75;

  charCount.textContent = `${input.value.length}/${maxLength}`;

  if (input.value.length >= maxLength) {
      input.disabled = true;
      charCount.textContent += ' (Character limit reached)';
  } else {
      input.disabled = false;
  }
}

function checkCharCount_title() {
  const input = document.getElementById('new_title_form');
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


window.onload = function() {
  let chat_container = document.querySelector(".main-chat-container");
  chat_container.scrollTop = chat_container.scrollHeight;
};



// selecting member info

let member_but = document.getElementById("member-info-button")
let member_main_section = document.getElementById("message-group-section")

member_but.addEventListener("click",()=>{
  member_main_section.style.display = "block";
  blur_section.forEach(element => {
    element.classList.toggle("adding-blur");
    element.classList.toggle("blurred-background");
  });
})

// closing member section

let close_button_member = document.getElementById("worng-exit-member-section");

close_button_member.addEventListener("click",()=>{
  member_main_section.style.display = "none";
  blur_section.forEach(element => {
    element.classList.toggle("adding-blur");
    element.classList.toggle("blurred-background");
  });
})

