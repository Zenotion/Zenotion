const doc = document.getElementsByClassName("main_continer")[0];
const unit_continer=$(".unit_continer")[0];
const units = document.getElementsByClassName("unit_continer")[0];



setInterval(()=>{
    const bar = doc.getElementsByClassName("bar");
    

    const width =window.innerWidth;
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



   // Function to open the modal
   function openLoginModal() {
    document.getElementById("loginModal").style.display = "block";
}

// Function to close the modal
function closeLoginModal() {
    document.getElementById("loginModal").style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById("loginModal")) {
        closeLoginModal();
    }
}
