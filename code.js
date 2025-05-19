import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const InteractiveScatterChart = () => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    // Generate random data
    const generateRandomData = () => {
      const dataPoints = [];
      const clusters = 5;
      const pointsPerCluster = 30;
      
      for (let c = 0; c < clusters; c++) {
        const centerX = Math.random() * 800;
        const centerY = Math.random() * 500;
        const color = d3.interpolateRainbow(c / clusters);
        
        for (let i = 0; i < pointsPerCluster; i++) {
          dataPoints.push({
            id: `c${c}-p${i}`,
            x: centerX + (Math.random() - 0.5) * 50,
            y: centerY + (Math.random() - 0.5) * 50,
            size: Math.random() * 5 + 3,
            color: color,
            cluster: c,
            value: Math.round(Math.random() * 100)
          });
        }
      }
      
      return dataPoints;
    };
    
    const data = generateRandomData();
    
    // Set up chart dimensions
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Add background
    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('fill', '#f8f9fa');
      
    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x) * 1.1])
      .range([0, width]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) * 1.1])
      .range([height, 0]);
    
    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));
      
    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale));
    
    // Add title
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('Interactive Scatter Chart');
    
    // Create a clip path
    const clipPath = svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-area')
      .append('rect')
      .attr('width', width)
      .attr('height', height);
    
    // Create points group with clip path
    const pointsGroup = g.append('g')
      .attr('clip-path', 'url(#chart-area)');
    
    // Add points
    const points = pointsGroup.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8)
      .attr('cursor', 'pointer');
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10);
    
    // Add tooltip behavior
    points.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('opacity', 1);
        
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
        
      tooltip.html(`
        <strong>Cluster:</strong> ${d.cluster}<br>
        <strong>Value:</strong> ${d.value}<br>
        <strong>Position:</strong> (${d.x.toFixed(2)}, ${d.y.toFixed(2)})
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(500)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8);
        
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
    
    // Create a variable to track the current transform state
    let currentTransform = d3.zoomIdentity;
    
    // Define zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .on('zoom', handleZoom)
      .filter(event => {
        // Disable mouse wheel zooming and dragging (panning)
        // Only allow programmatic zooming from our functions
        return false; 
      });
    
    // Define the brush
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', brushed);
    
    // Add brush to chart
    g.append('g')
      .attr('class', 'brush')
      .call(brush);
    
    // Add reset button
    const buttonGroup = svg.append('g')
      .attr('transform', `translate(${width + margin.left - 90}, ${margin.top})`);
    
    buttonGroup.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 80)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#aaa')
      .attr('cursor', 'pointer')
      .on('click', resetZoom);
    
    buttonGroup.append('text')
      .attr('x', 40)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .text('Reset View');
    
    // Point click zoom function
    points.on('click', function(event, d) {
      event.stopPropagation();
      
      // Get point position in scaled coordinates
      const x = xScale(d.x);
      const y = yScale(d.y);
      
      // Calculate new scale
      const newScale = currentTransform.k * 3; // Multiply current scale by zoom factor
      
      // Create new transform relative to current transform
      const newTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(newScale)
        .translate(
          -(currentTransform.invertX(x)), 
          -(currentTransform.invertY(y))
        );
      
      // Apply the zoom
      svg.transition()
        .duration(750)
        .call(zoom.transform, newTransform);
    });
    
    // Handle zoom events
    function handleZoom(event) {
      // Update the current transform
      currentTransform = event.transform;
      
      // Get the rescaled axes
      const newXScale = currentTransform.rescaleX(xScale);
      const newYScale = currentTransform.rescaleY(yScale);
      
      // Update the axes
      xAxis.call(d3.axisBottom(newXScale));
      yAxis.call(d3.axisLeft(newYScale));
      
      // Update the points
      points
        .attr('cx', d => currentTransform.applyX(xScale(d.x)))
        .attr('cy', d => currentTransform.applyY(yScale(d.y)))
        .attr('r', d => {
          // Limit how small dots can get when zooming
          const minSize = d.size * 0.6;
          const scaleFactor = Math.sqrt(1 / currentTransform.k);
          return Math.max(d.size * scaleFactor, minSize);
        });
    }
    
    // Brush end event handler
    function brushed(event) {
      // Only react to brush selection (not just a click)
      if (!event.selection) return;
      
      // Get the selection bounds
      const [[x0, y0], [x1, y1]] = event.selection;
      
      // Clear the brush
      d3.select(this).call(brush.move, null);
      
      // If we're already zoomed in, need to account for the current transform
      const zoomedX0 = currentTransform.invertX(x0);
      const zoomedY0 = currentTransform.invertY(y0);
      const zoomedX1 = currentTransform.invertX(x1);
      const zoomedY1 = currentTransform.invertY(y1);
      
      // Calculate the scale and center point
      const dx = x1 - x0;
      const dy = y1 - y0;
      const scale = 0.9 / Math.max(dx / width, dy / height);
      const centerX = (x0 + x1) / 2;
      const centerY = (y0 + y1) / 2;
      
      // Create a new transform that combines the current transform with the new zoom
      const newTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(currentTransform.k * scale)
        .translate(
          -(currentTransform.invertX(centerX)), 
          -(currentTransform.invertY(centerY))
        );
      
      // Apply the zoom transform
      svg.transition()
        .duration(750)
        .call(zoom.transform, newTransform);
    }
    
    // Reset zoom function
    function resetZoom() {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    }
    
    // Apply zoom behavior to the SVG
    svg.call(zoom).on('dblclick.zoom', null);
    
    // Clean up tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} className="border border-gray-300 rounded-lg shadow-md mb-4"></svg>
      <div className="w-full max-w-2xl bg-gray-100 rounded-lg p-4 shadow-sm">
        <h3 className="font-bold text-lg mb-2">Interactive Features</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><span className="font-semibold">Area Selection:</span> Drag to select an area to zoom into</li>
          <li><span className="font-semibold">Point Click:</span> Click on any point to zoom in centered on that point</li>
          <li><span className="font-semibold">Reset View:</span> Click the Reset View button to return to the original view</li>
        </ul>
      </div>
    </div>
  );
};

export default InteractiveScatterChart;