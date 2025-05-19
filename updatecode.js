import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const InteractiveScatterChart = () => {
  const svgRef = useRef(null);
  const [areaSelectionEnabled, setAreaSelectionEnabled] = useState(false);
  const chartRef = useRef({
    brush: null,
    zoom: null,
    brushGroup: null,
    toggleButton: null,
    currentTransform: d3.zoomIdentity
  });
  
  // Setup chart only once
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
    
    // Create a defs element for filters
    const defs = svg.append("defs");
    
    // Add glow filter for hover effect
    const glowFilter = defs.append("filter")
      .attr("id", "glow-effect")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
      
    const feFlood = glowFilter.append("feFlood")
      .attr("flood-color", "#fff")
      .attr("flood-opacity", "0.7")
      .attr("result", "flood");
      
    const feComposite = glowFilter.append("feComposite")
      .attr("in", "flood")
      .attr("in2", "coloredBlur")
      .attr("operator", "in")
      .attr("result", "coloredBlurAlpha");
      
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlurAlpha");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
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
      .style('cursor', 'pointer');
    
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
      .style('z-index', 9999);
    
    // Add tooltip behavior
    points.on('mouseover', function(event, d) {
      // Apply enhanced highlight effect
      d3.select(this)
        .classed('highlighted', true) // Add class for zoom handler to check
        .transition()
        .duration(200)
        .attr('r', d => d.size * 1.8) // Increase size
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 3)
        .attr('opacity', 1)
        .style('filter', 'url(#glow-effect)'); // Apply glow filter
        
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
        .classed('highlighted', false) // Remove class on mouseout
        .transition()
        .duration(500)
        .attr('r', d => d.size) // Restore original size
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .style('filter', 'none'); // Remove glow filter
        
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
    
    // Define zoom behavior with filter function that can be updated later
    function zoomFilter(event) {
      // This will be updated by setAreaSelectionState
      return !chartRef.current.areaSelectionEnabled;
    }
    
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .on('zoom', handleZoom)
      .filter(zoomFilter);
    
    // Save zoom in ref
    chartRef.current.zoom = zoom;
    
    // Define the brush
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', brushed);
      
    // Save brush in ref
    chartRef.current.brush = brush;
    
    // Add brush to chart (hidden initially if area selection is disabled)
    const brushGroup = g.append('g')
      .attr('class', 'brush')
      .style('display', areaSelectionEnabled ? null : 'none')
      .call(brush);
      
    // Save brushGroup in ref
    chartRef.current.brushGroup = brushGroup;
    
    // Add buttons
    const buttonGroup = svg.append('g')
      .attr('transform', `translate(${width + margin.left - 170}, ${margin.top})`);
    
    // Toggle area selection button
    const toggleButton = buttonGroup.append('g')
      .attr('cursor', 'pointer');
    
    toggleButton.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 160)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', areaSelectionEnabled ? '#d0d0d0' : '#f0f0f0')
      .attr('stroke', '#aaa');
    
    toggleButton.append('text')
      .attr('x', 80)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .text('Toggle Area Selection');
      
    // Save toggle button in ref
    chartRef.current.toggleButton = toggleButton;
    
    // Reset view button
    const resetButton = buttonGroup.append('g')
      .attr('transform', 'translate(0, 40)')
      .attr('cursor', 'pointer')
      .on('click', resetZoom);
    
    resetButton.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 160)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#aaa');
    
    resetButton.append('text')
      .attr('x', 80)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .text('Reset View');
    
    // Point click zoom function
    points.on('click', function(event, d) {
      event.stopPropagation();
      
      // Get point coordinates
      const x = xScale(d.x);
      const y = yScale(d.y);
      
      // Create zoom transform
      const transform = d3.zoomIdentity
        .translate(width/2 - x*5, height/2 - y*5)
        .scale(5);
      
      // Apply zoom with transition
      svg.transition()
        .duration(750)
        .call(zoom.transform, transform);
    });
    
    // Handle zoom events
    function handleZoom(event) {
      // Update current transform in ref
      chartRef.current.currentTransform = event.transform;
      
      // Update axes with new scales
      xAxis.call(d3.axisBottom(event.transform.rescaleX(xScale)));
      yAxis.call(d3.axisLeft(event.transform.rescaleY(yScale)));
      
      // Update points position
      points
        .attr('cx', d => event.transform.applyX(xScale(d.x)))
        .attr('cy', d => event.transform.applyY(yScale(d.y)))
        .attr('r', function(d) {
          // Only scale down non-highlighted points
          if (!d3.select(this).classed('highlighted')) {
            const scaleFactor = Math.max(0.7, 1 / Math.sqrt(event.transform.k));
            return d.size * scaleFactor;
          } else {
            // Keep highlighted points at their larger size
            return d3.select(this).attr('r');
          }
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
      
      // Skip if selection is too small (likely a click)
      if (x1 - x0 < 10 || y1 - y0 < 10) return;
      
      // Calculate zoom parameters
      const dx = x1 - x0;
      const dy = y1 - y0;
      const scale = 0.9 / Math.max(dx / width, dy / height);
      const centerX = (x0 + x1) / 2;
      const centerY = (y0 + y1) / 2;
      
      // Create transform
      const transform = d3.zoomIdentity
        .translate(width/2 - centerX*scale, height/2 - centerY*scale)
        .scale(scale);
      
      // Apply zoom with transition
      svg.transition()
        .duration(750)
        .call(zoom.transform, transform);
    }
    
    // Reset zoom function
    function resetZoom() {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    }
    
    // Function to toggle area selection mode
    function toggleAreaSelection() {
      setAreaSelectionEnabled(!areaSelectionEnabled);
    }
    
    // Apply zoom behavior to SVG
    svg.call(zoom).on('dblclick.zoom', null);
    
    // Save the initial state
    chartRef.current.areaSelectionEnabled = areaSelectionEnabled;
    
    // Clean up tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, []); // Only run once on mount
  
  // Update area selection state without recreating the chart
  useEffect(() => {
    if (!chartRef.current.brushGroup) return;
    
    // Update the state in the ref
    chartRef.current.areaSelectionEnabled = areaSelectionEnabled;
    
    // Update brush visibility
    chartRef.current.brushGroup.style('display', areaSelectionEnabled ? null : 'none');
    
    // Update toggle button appearance
    chartRef.current.toggleButton.select('rect')
      .attr('fill', areaSelectionEnabled ? '#d0d0d0' : '#f0f0f0');
    
    // Set up toggle button click handler
    chartRef.current.toggleButton.on('click', () => setAreaSelectionEnabled(!areaSelectionEnabled));
    
    // Most important: Update the zoom behavior to enable/disable panning
    // This is done by recreating the zoom behavior with the updated filter
    const svg = d3.select(svgRef.current);
    
    // First remove existing zoom
    svg.on('.zoom', null);
    
    // Then reapply zoom with updated filter
    const updatedZoom = chartRef.current.zoom.filter(() => !areaSelectionEnabled);
    svg.call(updatedZoom).on('dblclick.zoom', null);
    
    // Update the zoom reference
    chartRef.current.zoom = updatedZoom;
  }, [areaSelectionEnabled]);
  
  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} className="border border-gray-300 rounded-lg shadow-md mb-4"></svg>
      <div className="w-full max-w-2xl bg-gray-100 rounded-lg p-4 shadow-sm">
        <h3 className="font-bold text-lg mb-2">Interactive Features</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><span className="font-semibold">Normal Mode:</span> Pan by dragging, zoom with mouse wheel</li>
          <li><span className="font-semibold">Area Selection Mode:</span> Enable with button, then drag to select an area to zoom into</li>
          <li><span className="font-semibold">Point Click:</span> Click on any point to zoom in centered on that point</li>
          <li><span className="font-semibold">Tooltips:</span> Hover over points to see detailed information</li>
          <li><span className="font-semibold">Reset View:</span> Click the Reset View button to return to the original view</li>
        </ul>
      </div>
    </div>
  );
};

export default InteractiveScatterChart;