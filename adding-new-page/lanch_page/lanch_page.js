let doc_but = document.getElementById("department-hover-section");
let department_display = document.getElementById("dept-drop");
let arr = document.getElementById("document-arrow");

doc_but.addEventListener("click",()=>{
    let x =department_display.classList.toggle("display")
    if(!x){
        department_display.classList.add("nodisplay");
        department_display.classList.remove("display");
        arr.classList.add("ri-arrow-down-wide-line")
        arr.classList.remove("ri-arrow-up-wide-line");

    }else{
        department_display.classList.remove("nodisplay");
        arr.classList.remove("ri-arrow-down-wide-line")
        arr.classList.add("ri-arrow-up-wide-line");
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


let titleIncome1 = document.getElementById("pro-heading-1");
let titleIncome2 = document.getElementById("pro-heading-2");
let titleIncome3 = document.getElementById("pro-heading-3");
let titleIncome4 = document.getElementById("pro-heading-4");
let titleIncome5 = document.getElementById("pro-heading-5");

let title_continer1 = document.getElementById("pro-title11");
let title_continer2 = document.getElementById("pro-title22");
let title_continer3 = document.getElementById("pro-title33");
let title_continer4 = document.getElementById("pro-title44");
let title_continer5 = document.getElementById("pro-title55");

window.addEventListener("scroll",(e)=>{
    let x = window.scrollY;
    titleIncome1.style.transform = `translateX(${(-69+(x*0.0294))}%)`;
    titleIncome2.style.transform = `translateX(${(-31.7+(x*-0.0299))}%)`;
    titleIncome3.style.transform = `translateX(${(-61+(x*0.0308)-20)}%)`;
    titleIncome4.style.transform = `translateX(${(-33+(x*-0.0313))}%)`;
    titleIncome5.style.transform = `translateX(${(-51.5+(x*0.0322)-24)}%)`;
    title_continer1.style.transform = `translateX(${0}%)`;
    title_continer2.style.transform = `translateX(${(0)}%)`;
    title_continer3.style.transform = `translateX(${(0)}%)`;
    title_continer4.style.transform = `translateX(${(0)}%)`;
    title_continer5.style.transform = `translateX(${(0)}%)`;
    if(x>=1150){
        title_continer1.style.transform = `translateX(${((x-1150)*0.2)}%)`;
        title_continer2.style.transform = `translateX(${-(x-1150)*0.2}%)`;
        title_continer4.style.transform = `translateX(${(x-1150)*0.2}%)`;
        title_continer5.style.transform = `translateX(${(-(x-1150)*0.2)}%)`;
        title_continer3.style.transform = `translateX(${(0)}%)`;
    }


})


let horizontalMove = document.getElementById("horizontal-move");

window.addEventListener("scroll",()=>{
    let y = window.scrollY;
    console.log(y)
    horizontalMove.scrollTo({
        left: (y-2598) *0.3
      });

})


let rotate_div = document.getElementById("totale-container");

window.addEventListener("scroll",()=>{
    let z = window.scrollY;
    if(z>7229){
        rotate_div.style.transform = `rotate(${(z - 7229)*0.0399}deg)`;
    }else{
        rotate_div.style.transform = `rotate(0deg)`;
    }
})


