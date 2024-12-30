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



let dept_choosed = window.location.pathname;
console.log(dept_choosed);
const parts = dept_choosed.split('/').filter(part => part !== '');
const department = parts[0]; // 'IOT'
const semester = parts[1];   // '1'
console.log(document.getElementById(department).classList.add("selected-dept"));
console.log(document.getElementById(semester).classList.add("sem_selected"));

// document.getElementById(dept_choosed).classList.add("selected-grp");


let pro_button = document.getElementById("profile-option");
let dis_pro_option = document.getElementById("js_display-pro")

pro_button.addEventListener("click",()=>{
  dis_pro_option.classList.toggle("dis_profile");
})