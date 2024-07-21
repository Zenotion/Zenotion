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


let pro_button = document.getElementById("profile-option");
let dis_pro_option = document.getElementById("js_display-pro")

pro_button.addEventListener("click",()=>{
  dis_pro_option.classList.toggle("dis_profile");
})

let delTopic = document.getElementById("delete-topic-js");
let topicCard = document.querySelectorAll(".common-topic-card");
let delButton = document.querySelectorAll(".delete-button-on");
let textDelButton = document.getElementById("text-change-delete");
let iconDelButton  = document.getElementById("icon-change-delete");

delTopic.addEventListener("click",()=>{
  if(textDelButton.textContent = "Cancel"){
    textDelButton.textContent = "Delete topic"
    iconDelButton.classList.add("ri-delete-bin-7-fill");
    iconDelButton.classList.remove("ri-close-large-fill");
  }else{
    textDelButton.textContent = "Cancel";
    iconDelButton.classList.add("ri-close-large-fill");
    iconDelButton.classList.remove("ri-delete-bin-7-fill");
  }
  var length_topic_card = topicCard.length;
  for(let i=0;i<length_topic_card;i++){
    topicCard[i].classList.toggle("topic-card-del");
    delButton[i].classList.toggle("delete-button-trans");
  }
})


const open = document.getElementById("open");
const main = document.getElementById("main"); 
const close = document.getElementById("close");
const blurs = document.getElementById("blur")


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
