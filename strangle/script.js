
function calc(){
let a1 = +document.getElementById('a').value || 0;
let b1 = +document.getElementById('b').value || 0;
document.getElementById('res').innerText = "Result: " + (b1 - a1).toFixed(2);
}
