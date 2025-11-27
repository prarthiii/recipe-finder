var retrievedError = JSON.parse(localStorage.getItem("errorStatus"));
var errorCode = document.getElementById("errorCode");
errorCode.textContent = "Error: " + retrievedError;