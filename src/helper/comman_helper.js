
const strtoarry= function strtoarry1(str) {
    if(!Array.isArray(str))
    {
      var temp = str;
      str = [];
      str.push(temp);
    } 
    return str;
}


module.exports = {strtoarry}