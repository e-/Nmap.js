define(['d3'], function(){
  var util = {};

  function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
  }

  util.removeA = removeA;
  
  var svg = d3.select('body').append('svg').attr('opacity', 0).attr('width', 1).attr('height', 1);


  util.getTextSize = function(text, fontSize){
    var len = text.length, i, width = 0;
    for(i = 0; i < len; ++i){
      if(text[i] == '-') width += 4.53125;
      else if(text[i] == ' ') width += 3.59375;
      else if(text.charCodeAt(i) <= 256) width += 7.8125;
      else width += 14;
    }
    return {
      width: width * fontSize,
      height: 19 * fontSize
    };
  };
  
  util.getPrettyFontSize = function(text, width, height) {
    width /= 2;
    height /= 2;
    var heightConstraint = height / 19,
        w = util.getTextSize(text, 1).width,
        widthConstraint = width / w
        ;
   
    var size = Math.floor(Math.min(heightConstraint, widthConstraint) * 5) / 5;

    return size;
  };

  util.addCommas = function(nStr)
  {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };  
  
   
  return util;
});
