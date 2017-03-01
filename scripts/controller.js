/*** Linkurious.js optimized default values ***/
// https://github.com/Linkurious/linkurious.js/wiki/Settings-by-Linkurious

/*** Object representing the application itself ***/
var myApp = angular.module('myApp', []);

/*** Controller managing the graph ***/
myApp.controller('controller', ['$scope', function($scope) {	
	/** Graph object **/
	var currentGraph = null;
	var graphName = "";
	
	/** Sigma.js instance **/
	var sig = new sigma({
		graph: {nodes: [], edges: []},
		//container: 'graph',
		//type: 'canvas'
		renderer: {
			container: 'graph',
			type: 'canvas'
		},
		settings: {
			drawLabels: false,
			drawEdgeLabels: false,
			doubleClickEnabled: true,
			enableEdgeHovering: true,
			edgeHoverPrecision: 1,	// default=10
			edgeHoverColor: 'edge',
			defaultEdgeHoverColor: '#000',
			edgeHoverSizeRatio: 1,
			edgeHoverExtremities: true,
			minNodeSize: 1,
			maxNodeSize: 20,
			minEdgeSize: 0.1,
			maxEdgeSize: 10,
		}
	});


	/** 
	 * Function to load features file
	 **/
	$scope.importGraph = function(type)
	{
		// Get calling button
		var file = document.getElementById("import").files[0];

		/* The file selecter should not be empty and the path must be entered */
		if ( file != null )
		{	
			// Clear existing graph if re-import
			if (sig)
				$scope.clearGraph(false);

			// Getting the uploaded file
			graphName = file.name;
			var parts = graphName.split(".");
			var extension = parts[parts.length - 1];

			// Process only gxl files
			if (extension == 'gxl') {

				// Use FileReader API
				var reader = new FileReader();

				reader.addEventListener('load', function() {

					// Get content of the file
					var content = reader.result;

					// Read content as json graph
					var jsonGraph = $scope.gxl2json(content);

					// Debug
					//console.log(jsonGraph);

					// Load as sigmajs graph
					currentGraph = JSON.parse(jsonGraph);
					sig.graph.read(currentGraph);

					// Init the visualisation
					$scope.init();

					// Display the graph
					$scope.display();

				}, false);
			
			// Reading the file after setting the event listener because of asynchronous reading
			reader.readAsText(file);

				
			}
		    else {
		   		alert('Error: Please only import *.gxl file.');
		    }	
		}
	}


	/** 
	 * Function to layout the graph using Fruchterman-Reingolg algorithm
	 **/
	$scope.layoutGraph = function()
	{

		// Configure the Fruchterman-Reingold algorithm:
		var frListener = sigma.layouts.fruchtermanReingold.configure(sig, {
		  iterations: 1000, 
		  easing: 'quadraticInOut',
		  duration: 10000
		});
		
		// Start the Fruchterman-Reingold algorithm:
		sigma.layouts.fruchtermanReingold.start(sig);
	}


	/** 
	 * Function to layout the graph using Fruchterman-Reingolg algorithm
	 **/
	$scope.exportGraph = function()
	{
		// Convert to gxl
		var exportedGraph = $scope.json2gxl(sig);

		// Compute outfile name
		var filename = graphName + "_layout.gxl";
		
		// Save the file
		var blob = new Blob([exportedGraph], {type: "text/plain;charset=utf-8"});
		saveAs(blob, filename);
	}


	/** 
	 * Function to save as png image
	 **/
	$scope.saveImage = function()
	{

		// Get renderer
		var myRenderer = sig.renderers[0];
		
		// Download the rendered graph as an image
		myRenderer.snapshot({
		  format: 'png',
		  background: 'white',
		  labels: false,
		  download : true,
		  filename : graphName.replace(".gxl",".png")
		});

	}


	/** 
	 * Function to clear the graph
	 **/
	$scope.clearGraph = function(clear_io)
	{
		/* Resetting the displaying */
		sig.graph.clear();

		// Refresh the view
		sig.refresh();

		// Clear IO related elements
		if (clear_io)
			document.getElementById("import").value = "";

		// Reset globals
		currentGraph = null;
		graphName = "";
	}


	/* Function to display the About overlay */
	$scope.openAbout = function()
	{
   	 	document.getElementById("about").style.width = "100%";
	}

	/* Close when someone clicks on the "x" symbol inside the overlay */
	$scope.closeAbout = function()
	{
    	document.getElementById("about").style.width = "0%";
	}



	/* ---------------------------- */
	/* IMPORT/EXPORT FUNCTIONS      */
	/* ---------------------------- */

	/** 
	 * Function that convert a gxl string to json
	 **/
	$scope.gxl2json = function(gxl)
	{
		// Get DOM parser
		var parser = new window.DOMParser();
		var xmlDoc = parser.parseFromString(gxl, "text/xml");

		// JSON header
		var exportedGraph = "{";
		exportedGraph += "\n\t" + "\"directed\": false,";
		exportedGraph += "\n\t" + "\"graph\": [],";
		exportedGraph += "\n\t" + "\"multigraph\": false,";

		// Getting the <graph>
		var XMLnodes = xmlDoc.firstElementChild.childNodes;
		var indexOfGraph = 0;
		while ((indexOfGraph < XMLnodes.length) && (XMLnodes[indexOfGraph].nodeName != "graph"))
		{						
			indexOfGraph++;
		}
		var graphNode = XMLnodes[indexOfGraph].childNodes;

		// Getting nodes and edges
		var nodes = [];
		var edges = [];
		var i = 0;
		while ( i < graphNode.length)
		{
			if (graphNode[i].nodeName == "node")
				nodes.push(graphNode[i]);
			else if (graphNode[i].nodeName == "edge")
				edges.push(graphNode[i]);
			i++;
		}

		// Getting the informations from the nodes 
		exportedGraph = "{\n\t\"nodes\": [";
		for (i = 0 ; i < nodes.length ; i++)
		{
			if (nodes[i].nodeName == "node")
			{
				var attributes = nodes[i].attributes;
				var data = nodes[i].childNodes;

				
				
				// Getting the id of the node
				exportedGraph += "\n\t\t{\n";
				exportedGraph += "\t\t\t\"id\": \"" + attributes.getNamedItem("id").value + "\",\n";

				// Getting the attributes of the node 
				var label = "";
				var attrs = "";
				var x_ = "";
				var y_ = "";
				for (j = 0 ; j < data.length; j++)
				{
					if(data[j].nodeName == "attr")
					{
						if ( data[j].attributes.getNamedItem("name").value == "x" )
						{
							x_ = data[j].firstElementChild.textContent;
						}
						else if ( data[j].attributes.getNamedItem("name").value == "y" )
						{
							y_ = data[j].firstElementChild.textContent;
						}
						else
						{
							exportedGraph += "\t\t\t\"" + data[j].attributes.getNamedItem("name").value + "\": \"" + data[j].firstElementChild.textContent + "\",\n";
							label += data[j].attributes.getNamedItem("name").value + " = " + data[j].firstElementChild.textContent + " | ";
						}
					}
				}

				// Reassign label if specified in the input file
				if (attributes.getNamedItem("label"))
					label = graph_prefix + attributes.getNamedItem("label").value;

				exportedGraph += "\t\t\t\"label\": \"" + attrs + "\",\n";

				// Assign default position if not specified ni the input file
				if (x_ == "")
					x_ = Math.random() * 50;
				if (y_ == "")
					y_ = Math.random() * 50;

				// Default values (x and y coordinates, size, color,  and image representative)
				exportedGraph += "\t\t\t\"x\": " + x_ + ",\n";
				exportedGraph += "\t\t\t\"y\": " + y_ + ",\n";
				exportedGraph += "\t\t\t\"size\": " + "1" + ",\n";
				exportedGraph += "\t\t\t\"color\": \"" + "#000000" + "\"\n";
				//exportedGraph += "\t\t\t\"representative\": \"" + "protein-structure.png" + "\"";

				// Close node
				exportedGraph += "\n\t\t},";
			}
		}
		exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);


		// Getting the informations from the edges 
		exportedGraph += "\n\t],\n\t\"edges\": [";
		var nbEdges = 0;
		for (i = 0 ; i < edges.length ; i++)
		{
			if (edges[i].nodeName == "edge")
			{
				var attributes = edges[i].attributes; 
				var data = edges[i].childNodes;
				
				exportedGraph += "\n\t\t{\n";
				exportedGraph += "\t\t\t\"id\": \"" + "e" + nbEdges + "\",\n";
				exportedGraph += "\t\t\t\"label\": \"" + "e" + nbEdges + "\",\n";
				exportedGraph += "\t\t\t\"source\": \"" + attributes.getNamedItem("from").value + "\",\n";
				exportedGraph += "\t\t\t\"target\": \"" + attributes.getNamedItem("to").value + "\",\n";
				exportedGraph += "\t\t\t\"weight\": \"1\",\n";
				exportedGraph += "\t\t\t\"color\": \"" + "#000000" + "\",\n";
				exportedGraph += "\t\t\t\"size\": \"" + "1" + "\",\n";

				// Getting the attributes of the edge
				for (j = 0 ; j < data.length ; j++)
					if(data[j].nodeName == "attr")
						exportedGraph += "\t\t\t\"" + data[j].attributes.getNamedItem("name").value + "\": \"" + data[j].firstElementChild.textContent + "\",\n";
				
				exportedGraph = exportedGraph.substring(0, exportedGraph.length - 2);
				exportedGraph += "\n\t\t},";
				
				nbEdges++;
			}
		}
		exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);
		
		// Finalizing the JSON string 
		exportedGraph += "\n\t]\n}";
		return exportedGraph;
	}


	/** 
	 * Function that convert a json string to gxl
	 **/
	$scope.json2gxl = function(sig)
	{
		// GXL header
		var exportedGraph = "<?xml version=\"1.0\"?>\n";
		exportedGraph += "<!DOCTYPE gxl SYSTEM \"http://www.gupro.de/GXL/gxl-1.0.dtd\">\n";
		exportedGraph += "<gxl>\n";
		exportedGraph += "\t<graph>\n";

		// Export nodes
		sig.graph.nodes().forEach(function(n) 
		{
			exportedGraph += "\t\t<node id=\"" + "node_id" + "\">\n";

			// TODO
			// get attributes
			exportedGraph += "\t\t</node>\n";
		});

		// Export edges
		sig.graph.edges().forEach(function(e) 
		{
			exportedGraph += "\t\t<edge id=\"" + "edge_id" + "\">\n";

			// TODO
			// get attributes
			exportedGraph += "\t\t</edge>\n";
		});

		// Finalise the GXL string 
		exportedGraph += "\t</graph>\n";
		exportedGraph += "</gxl>";

		return exportedGraph;


	}


	/* ---------------------------- */
	/* GRAPH UI FUNCTIONS           */
	/* ---------------------------- */

	/** Function to initialize the graph **/
	$scope.init = function()
	{

		/* Preprocessing each node */
		sig.graph.nodes().forEach(function(n) {

			// Set the shape of the node as square
			n.type = "square";	
			
			// Save original attributes
			n.originalColor = (n.color)? n.color : sig.settings('defaultNodeColor');
			n.originalSize = (n.size)? n.size : sig.settings('minNodeSize');
			n.originalLabel = (n.label)? n.label : "";
		});
				
		/* Preprocessing each edge*/
		sig.graph.edges().forEach(function(e) {
		
			// Save original attributes
			e.originalColor = (e.color)? e.color : sig.settings('defaultEdgeColor');
			e.originalSize = (e.size)? e.size : sig.settings('minNodeSize');
			e.originalLabel = (e.label)? e.label : "";

		});

		// SET LISTENERS
		// When the background is left clicked, not for dragging
		sig.bind('clickStage', function(e) {
			if (!e.data.captor.isDragging){
				// Deselecting the node
				$scope.deselectNode();
				
				// Resetting the camera
				sigma.misc.animation.camera(
					sig.camera, 
					{
						x: 0, 
						y: 0,
						ratio: 1
					}, 
					{duration: 300}
				);
			}
		});
		
	};


	/** Function that display a graph that has been load by sigma **/
	$scope.display = function()
	{
		// Resetting the displaying
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: 0, 
				y: 0,
				ratio: 1
			}, 
			{duration: 1}
		);

		// Displaying the graph
		sig.refresh();
	}


}]);