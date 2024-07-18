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


let delTopic = document.getElementById("delete-topic-js");
let topicCard = document.querySelectorAll(".common-topic-card");
let delButton = document.querySelectorAll(".delete-button-on");

delTopic.addEventListener("click",()=>{
  var length_topic_card = topicCard.length;
  for(let i=0;i<length_topic_card;i++){
    topicCard[i].classList.toggle("topic-card-del");
    delButton[i].classList.toggle("delete-button-trans");
  }

})