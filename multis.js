// Usage: $('input[type="checkbox"]').shiftSelectable();

$.fn.shiftSelectable=function() {
  var lastChecked, boxes=this;
  boxes.click(function(evt) {
    if(!lastChecked) {
      lastChecked=this;
      return;
    }
  if(evt.shiftKey) {
    var last=boxes.index(lastChecked), first=boxes.index(this), st=Math.min(first,last), end=Math.max(first,last), chk=lastChecked.checked;
    for (var i=st; i <= end; i++) boxes[i].checked=chk;
    }
  lastChecked=this;
  });
};