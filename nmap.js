define(function(){
  function Nmap(){
    var HORIZONTAL = 1, VERTICAL = 2,
        ix = function(node){return node.ix;},
        iy = function(node){return node.iy;},
        value = function(node){return node.value},
        width = 1,
        height = 1;

    function inverse(a){
      if(a > 1) return 1 / a;
      return a;
    }
    
    function extent(array, mapper) {
      return [
        Math.min.apply(this, array.map(mapper)),
        Math.max.apply(this, array.map(mapper))
      ];
    }

    function split(nodes, x1, y1, x2, y2, direction){
      if(nodes.length == 0)
        return;

      if(nodes.length == 1) {
        var node = nodes[0];
        node.x = x1;
        node.y = y1;
        node.width = x2 - x1;
        node.height = y2 - y1;
        return;
      }

      nodes = nodes.slice(0);
      var length = nodes.length;
      
      var pivot = Math.floor(length / 2),
          left = pivot, // 0 ~ pivot - 1
          right = length - pivot,
          sumLeft = 0,
          sumRight = 0,
          i; // pivot ~ length - 1
      
      sumLeft = 0;
      sumRight = 0;

      nodes.sort(function(a, b){
        return a._ix - b._ix;
      });
      
      for(i = 0; i < left; ++i) {
        sumLeft += value(nodes[i]);
      }

      for(i = pivot; i < length; ++i) {
        sumRight += value(nodes[i]);
      }

      var ratioLeft = sumLeft / (sumLeft + sumRight),
          nodesLeft = nodes.filter(function(_, i){return i < pivot;}),
          nodesRight = nodes.filter(function(_, i){return i >= pivot;})
      ;
      
      var verWidth1 = (x2 - x1) * ratioLeft,
          verWidth2 = (x2 - x1) * (1 - ratioLeft),
          verHeight = y2 - y1;

      nodes.sort(function(a, b){
        return a._iy - b._iy;
      });
      
      sumLeft = 0;
      sumRight = 0;

      for(i = 0; i < left; ++i) {
        sumLeft += value(nodes[i]);
      }

      for(i = pivot; i < length; ++i) {
        sumRight += value(nodes[i]);
      }

      var ratioTop = sumLeft / (sumLeft + sumRight),
          nodesTop = nodes.filter(function(_, i){return i < pivot;}),
          nodesBottom = nodes.filter(function(_, i){return i >= pivot;}),
          horWidth = x2 - x1;
          horHeight1 = (y2 - y1) * ratioTop,
          horHeight2 = (y2 - y1) * (1 - ratioTop)

      if(inverse(verWidth1 / verHeight) * inverse(verWidth2 / verHeight) > inverse(horWidth / horHeight1) * inverse(horWidth / horHeight2)) {
        split(nodesLeft, x1, y1, x1 + (x2 - x1) * ratioLeft, y2, VERTICAL);
        split(nodesRight, x1 + (x2 - x1) * ratioLeft, y1, x2, y2, VERTICAL);
      } else {
        split(nodesTop, x1, y1, x2, y1 + (y2 - y1) * ratioTop, HORIZONTAL);
        split(nodesBottom, x1, y1 + (y2 - y1) * ratioTop, x2, y2, HORIZONTAL);
      }
    }

    function nmap(nodes){
      nodes.forEach(function(node){
        node._ix = ix(node);
        node._iy = iy(node);
      });
      
      var xExtent = extent(nodes, function(node){return node._ix;}),
          yExtent = extent(nodes, function(node){return node._iy;})
      ;
      
      // normalized
      nodes.forEach(function(node){
        node._ix = (node._ix - xExtent[0]) / xExtent[1];
        node._iy = (node._iy - yExtent[0]) / yExtent[1];
      });

      split(nodes, 0, 0, 1, 1, HORIZONTAL);
      
      nodes.forEach(function(node){
        node.x *= width;
        node.y *= height;
        node.width *= width;
        node.height *= height;
      });
    }

    nmap.value = function(value2){
      value = value2;
      return nmap;
    };

    nmap.ix = function(value){
      ix = value;
      return nmap;
    };

    nmap.iy = function(value){
      iy = value;
      return nmap;
    };

    nmap.width = function(value){
      width = value;
      return nmap;
    };

    nmap.height = function(value) {
      height = value;
      return nmap;
    };

    return nmap;
  }

  return Nmap;
});
