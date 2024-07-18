const nav = document.getElementsByClassName("nav")[0];
const title_continer = document.getElementsByClassName("title_continer")[0];

setInterval(()=>{

    const window_width = window.outerWidth;

if(window_width < 900){


    display_bar();


}else{
    const len = nav.getElementsByClassName("menu").length;

    if (len === 1){
        const units = document.getElementsByClassName("drop_down")[0];

        nav.lastChild.style.display = "none";
        units.style.display = "none";
        nav.lastChild.lastChild.className = "ri-menu-line";
        

    }
}
},1);

// References to DOM elements
const nav_bar = document.querySelector(".nav");
const firstPart = document.querySelector(".first_part");
const nav_bar_a = document.querySelectorAll(".option a");


// Setup options for the Intersection Observer
const observerOptions = {
    root: null, // observing with respect to the viewport
    threshold: 0, // callback will run when 0% of the target is visible
    rootMargin: "-100px 0px 0px 0px" // negative top margin to trigger before it fully leaves the viewport
};

// Creating the Intersection Observer
const observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            nav_bar.classList.add("nav_color");
            // nav_bar_a[0].classList.add("transistion");
            nav_bar_a[0].classList.add("nav_bar_a");
            nav_bar_a[1].classList.add("nav_bar_a");
            nav_bar_a[2].classList.add("nav_bar_a");
            nav_bar_a[3].classList.add("nav_bar_a");
        } else {
            nav_bar.classList.remove("nav_color");
            nav_bar_a[0].classList.remove("nav_bar_a");
            nav_bar_a[1].classList.remove("nav_bar_a");
            nav_bar_a[2].classList.remove("nav_bar_a");
            nav_bar_a[3].classList.remove("nav_bar_a");

            
        }
    });
}, observerOptions);

// Start observing the target element
observer.observe(firstPart);




function display_bar(){
    const menu_len = nav.getElementsByClassName("menu").length;

    if(menu_len === 0){
        const div = document.createElement("div");
        div.className = "menu";
        div.innerHTML = `<i class="ri-menu-line"></i>`;
        nav.append(div);
    

        const div2 = document.createElement("div");
        div2.className = "drop_down";
        div2.innerHTML =`
        <li><a href="/log_in">log in </a></li>
        <li><a href="/log_in">sign up</a></li>
        <li><a href="#contact">Contact</a></li>
        <li><a href="#about">About</a></li>
        `;
        title_continer.prepend(div2);
        const units = document.getElementsByClassName("drop_down")[0];
        units.style.display = "none";
       

    }else{
        nav.lastChild.style.display = "block";
       
        

    }
}



document.addEventListener("click",(event)=>{

    console.log(event.srcElement.innerHTML);
    const call = event.srcElement.innerHTML;

    const units = document.getElementsByClassName("drop_down")[0];

    const i =event.srcElement.className;
    if(i === "ri-menu-line"){

        nav.getElementsByClassName(i)[0].className = "ri-close-large-line";

        units.style.display = "block";

    }

    if (i === "ri-close-large-line" || call === "About" || call === "Contact" || call ==="sign up" || call === "log in"){

        nav.getElementsByClassName("ri-close-large-line" )[0].className = "ri-menu-line";

        units.style.display = "none";


    }

});


// References to DOM Elements
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const book = document.querySelector("#book");

const paper1 = document.querySelector("#p1");
const paper2 = document.querySelector("#p2");
const paper3 = document.querySelector("#p3");

// Event Listener
prevBtn.addEventListener("click", goPrevPage);
nextBtn.addEventListener("click", goNextPage);

// Business Logic
let currentLocation = 1;
let numOfPapers = 3;
let maxLocation = numOfPapers + 1;

function openBook() {
    book.style.transform = "translateX(50%)";
    prevBtn.style.transform = "translateX(-180px)";
    nextBtn.style.transform = "translateX(180px)";
}

function closeBook(isAtBeginning) {
    if(isAtBeginning) {
        book.style.transform = "translateX(0%)";
    } else {
        book.style.transform = "translateX(100%)";
    }
    
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";
}

function goNextPage() {
    if(currentLocation < maxLocation) {
        switch(currentLocation) {
            case 1:
                openBook();
                paper1.classList.add("flipped");
                paper1.style.zIndex = 1;
                break;
            case 2:
                paper2.classList.add("flipped");
                paper2.style.zIndex = 2;
                break;
            case 3:
                paper3.classList.add("flipped");
                paper3.style.zIndex = 3;
                closeBook(false);
                break;
            default:
                throw new Error("unkown state");
        }
        currentLocation++;
    }
}

function goPrevPage() {
    if(currentLocation > 1) {
        switch(currentLocation) {
            case 2:
                closeBook(true);
                paper1.classList.remove("flipped");
                paper1.style.zIndex = 3;
                break;
            case 3:
                paper2.classList.remove("flipped");
                paper2.style.zIndex = 2;
                break;
            case 4:
                openBook();
                paper3.classList.remove("flipped");
                paper3.style.zIndex = 1;
                break;
            default:
                throw new Error("unkown state");
        }

        currentLocation--;
    }
}

//animation 

// References to DOM elements



