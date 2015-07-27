requirejs.config({
  paths: {
    jquery: 'http://code.jquery.com/jquery-2.1.4.min',
    d3: 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min',
    nmap: '../nmap',
  baseUrl: 'js',
    treecolors: 'TreeColors.js/TreeColors'
  }
});

requirejs(['nmap', 'treecolors', 'util', 'jquery', 'd3'], function(Nmap, TreeColors, util){
  function getLeaves(node){
    if(!node.children) return [node];
    
    return node.children.reduce(function(leaves, child) {
      return leaves.concat(getLeaves(child));
    }, []);
  }

  function getMapXY(node){
    if(!node.children) return [node.mapX, node.mapY, 1];
    var sumX = 0, sumY = 0, count = 0;
    node.children.forEach(function(child){
      var ret = getMapXY(child);
      sumX += ret[0];
      sumY += ret[1];
      count += ret[2];
    });

    node.mapX = sumX / count;
    node.mapY = sumY / count;
    return [sumX, sumY, count];
  }

  function assignParent(node, parent){
    node.parent = parent;
    if(node.children)
      node.children.forEach(function(child){
        assignParent(child, node);
      });
  }

  function getDescendants(node) {
    if(!node.children) return [node];

    var desc = node.children.reduce(function(leaves, child) {
      return leaves.concat(getDescendants(child));
    }, []);

    desc.push(node);

    return desc;
  }

  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  var id = 0;
  function assignId(root){
    root.id = id++;
    if(root.children)
      root.children.forEach(function(child) {
        assignId(child);
      });
  }

  d3.json('data.json', function(root){
    var width = $(window).width() - $('#left').width(),
        height = $(window).height(),
        leaves = getLeaves(root),
        map = d3.select('#map').append('g').attr('transform', 'scale(0.7)'),
        svg = d3.select('#nmap').attr('width', width).attr('height', height),
        regions = root.children.slice(0), // visible regions 
        treecolor = TreeColors()
          .chromaStart(55)
          .chromaDelta(-5)
          .luminanceStart(65)
          .luminanceDelta(8)
          .fraction(0.75),
        nmap = Nmap()
          .ix(function(node){return node.mapX;})
          .iy(function(node){return node.mapY;})
          .value(function(node){return node.population;})
          .width(width)
          .height(height)
    
    treecolor(root);
    assignId(root);
    assignParent(root, null);

    var leaveG = map
      .selectAll('g')
      .data(leaves)
      .enter()
        .append('g')
    ;
    
    leaveG
      .selectAll('path')
      .data(function(leaf){
        return leaf.d.map(function(d){return [d, leaf.color];})
      })
      .enter()
        .append('path')
          .attr('d', function(d){return d[0];})
          .attr('fill', function(d){return d3.hcl(d[1].h, d[1].c, d[1].l);})
          .attr('stroke', '#aaa')
          .attr('stroke-width', 1)

    leaveG
      .each(function(leaf){
        var bbox = this.getBBox();
        
        leaf.mapX = bbox.x + bbox.width / 2;
        leaf.mapY = bbox.y + bbox.height / 2;
        leaf.mapG = d3.select(this);
      });

    getMapXY(root);

    function drilldown(region){
      if(!region.children) return;

      regions = util.removeA(regions, region)
      region.children.forEach(function(child){
        regions.push(child);
      });

      update();
    }
    
    function rollup(region){
      if(!region.parent) return;

      var targets = getDescendants(region.parent);

      regions = regions.filter(function(r){
        return targets.indexOf(r) < 0;
      });

      regions.push(region.parent);
      update();
    }

    function update(){
      width = $(window).width() - $('#left').width();
      height = $(window).height();
     
      svg.attr('width', width).attr('height', height);
      nmap.width(width).height(height);
 
      nmap(regions);

      var rects = svg
        .selectAll('rect')
        .data(regions, function(r){return r.id;})

      rects
        .enter()
          .append('rect')
          .attr('fill', function(r){return d3.hcl(r.color.h, r.color.c, r.color.l);})
          .attr('stroke', '#aaa')
          .attr('stroke-width', '1px')
          .attr('width', 0)
          .attr('height', 0)
          .attr('transform', function(r){return translate(r.x + r.width / 2, r.y + r.height / 2);})
          .attr('opacity', 0)
          .on('click', function(r){
            drilldown(r);
          })
          .on('contextmenu', function(r){
            rollup(r);
            d3.event.preventDefault();
          })
          .on('mouseenter', function(r){
            $('#city-name').html(r.name);
            $('#population').html(util.addCommas(r.population));
            var ele = d3.select(this);
            ele.attr('opacity', 1);
            getLeaves(r).forEach(function(r){
              r.mapG.selectAll('path')
                .attr('stroke', function(r){
                  return d3.hcl(r[1].h, r[1].c, r[1].l).darker(2.5);
                })
                .attr('fill', function(r){
                  return d3.hcl(r[1].h, r[1].c, r[1].l).darker(0.5);
                })
                .attr('stroke-width', 3);
            });
          })
          .on('mouseleave', function(r){
            $('#city-name').html('&nbsp;');
            $('#population').html(' ');
            var ele = d3.select(this);
            ele.attr('opacity', .8);
            getLeaves(r).forEach(function(r){
              r.mapG.selectAll('path')
                .attr('stroke', '#aaa')
                .attr('fill', function(r){
                  return d3.hcl(r[1].h, r[1].c, r[1].l);
                })
                .attr('stroke-width', 1);
            });
          });

      rects
        .transition()
          .attr('opacity', 0.8)
          .attr('width', function(r){return r.width;})
          .attr('height', function(r){return r.height;})
          .attr('transform', function(r){return translate(r.x, r.y);})
        
      rects
        .exit()
        .remove()

      var texts = svg 
        .selectAll('text')
        .data(regions, function(r){return r.id;})

      texts
        .enter()
          .append('text')
            .attr('fill', '#333')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'central')
            .attr('opacity', 0)
            .attr('transform', function(r){return translate(r.x + r.width / 2, r.y + r.height / 2);})
            .text(function(r){return r.name;})

      texts
        .transition()
          .attr('opacity', 1)
          .attr('transform', function(r){return translate(r.x, r.y);})
          .attr('font-size', function(r){
            return util.getPrettyFontSize(r.name, r.width, r.height) + 'em';
          })
          .attr('transform', function(r){return translate(r.x + r.width / 2, r.y + r.height / 2);})

      texts
        .exit()
        .remove();
    }

    update();
    $(window).resize(function(){
      update();
    });
  });
})
