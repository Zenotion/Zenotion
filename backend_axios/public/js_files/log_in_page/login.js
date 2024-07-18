const eye = document.getElementById("eyeicon");
const pass = document.getElementById("inputpassword");

function pass1(){
    console.log()

    if(pass.type == "password"){
        pass.type = "text";
        eye.setAttribute("name","eye-off")
    }else{
        pass.type = "password";
        eye.setAttribute("name","eye"); 
    }
}

