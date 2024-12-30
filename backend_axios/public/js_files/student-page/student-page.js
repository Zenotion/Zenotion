let path = window.location.pathname
path = path.split("/")
console.log(path);

let path_3 = path[3].split("%20")
path_3 = path_3.join(" ")

document.getElementById(path_3).classList.add("selected-grp")
console.log(path_3);


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

console.log(blur)

open.addEventListener("click",()=>{

    main.classList.add("on");
    blurs.style.filter = "blur(5px)";
    
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