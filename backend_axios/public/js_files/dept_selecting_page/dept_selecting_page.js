const doc = document.getElementsByClassName("main_continer")[0];
const unit_continer=$(".unit_continer")[0];
const units = document.getElementsByClassName("unit_continer")[0];



setInterval(()=>{
    const bar = doc.getElementsByClassName("bar");
    

    const width =window.screen.width;
    if (width < 900){
        
        display_bar();
        
    }
    else{
        
        const len= doc.getElementsByClassName("bar").length;
        if(len === 1){
            doc.firstChild.remove();
            unit_continer.firstChild.remove();
            units.style.opacity = "1";
        
            
        }
    }
},1);

// const balls = document.querySelector(".two_ball");
// const balls1 = document.querySelector(".three_ball");
// const sem_container = document.querySelector(".semester_continer");
// sem_container.addEventListener("scroll", (e) => {
//     let scrollY = sem_container.scrollTop;
//     balls.style.top = scrollY +"px";
//     balls1.style.top = scrollY +"px";
//     if(scrollY>700){
//         balls.style.right = scrollY *15 +"px";
//         balls1.style.left = scrollY *15+"px";
//     }else{
//         balls.style.left = scrollY * 0.2 +"px"; 
//         balls1.style.right = scrollY *0.2 +"px";
//     }

// });




function display_bar(){

    const len= doc.getElementsByClassName("bar").length;
    if (len === 0){
     units.style.opacity = "0";
     const div = document.createElement("div");
     div.className ="bar";
     div.innerHTML =`<i class="ri-menu-line"></i>`;
     doc.prepend(div);
     console.dir(div);
 
     const div2 = document.createElement("div");
     div2.className ="close";
     div2.innerHTML =`<i class="ri-close-large-line"></i>`;
     unit_continer.prepend(div2);
 
     
 
    }
 }


 
const menuopen =  doc.getElementsByClassName("bar")[0];

console.log(menuopen);

document.addEventListener("click",(event)=>{

    console.log(event);
    const i = event.srcElement.className;

    if (i === "ri-menu-line" || i === "ri-close-large-line"){
        console.log("yes");
      const units = document.getElementsByClassName("unit_continer")[0];
      console.log(units);
      
     if (i==="ri-menu-line"){

        units.classList.add("unit");
        units.style.opacity = "1";
       
        units.classList.remove("unit1");
     }else{
        if(i === "ri-close-large-line"){
            units.classList.add("unit1");
            units.classList.remove("unit");
            units.animate("opacity","0");

            
        }
     }
    
    }

});


$(document).ready(function() {
    function floatEffect() {
        $('.book').each(function() {
            var moveX = (Math.random() * 20) - 5; // Random X-axis movement
            var moveY = (Math.random() * 20) - 5; // Random Y-axis movement
            $(this).animate({
                'marginTop': '+=' + moveY + 'px',
                'marginLeft': '+=' + moveX + 'px'
            }, 1000, function() {
                $(this).animate({
                    'marginTop': '-=' + moveY + 'px',
                    'marginLeft': '-=' + moveX + 'px'
                }, 1000);
            });
        });
    }
    setInterval(floatEffect, 2000);
});



const dept_choosed = window.location.pathname;
console.log(document.getElementById(dept_choosed).classList.add("select"));
