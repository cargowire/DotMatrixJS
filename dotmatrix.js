/*  Info
------------------------------------------------------------------------------------------------------------------*/
/*  JS for creating dot matrix style outputs from image sources
    By Craig Rowe (Cargowire) - http://cargowire.net
------------------------------------------------------------------------------------------------------------------*/
var dotmatrix = (function(){
	var black = { red: 0, blue: 0, green: 0};
	var white = { red: 255, blue: 255, green: 255 };
	
	var canvas;
	var canvas2d;
 	var result;
	var resultData;
	var resultAvg = black;
	var aspectRatio = 1;
	
	var config = {
	  canvasSelector: '#csImage',
	  formSelector: '#image-picker',
	  imageSrcSelector: '#image',
	  resultContainerSelector: '#result',
	  imageSrcPrefix: 'data:image/jpeg;base64,',
	  imageProxy: 'http://dimd.co.uk/base64/',
	  imageRetrieved: undefined,
	  columns: 8,
	  rows: 8,
	  mono: true,
	  maintain_aspect: false,
	  threshold: 200
	};
	
	var total = function(colour){
		return colour.red + colour.blue + colour.green;
	}
	
	return {
		init: function(options) {
			$.extend(config, options);
			
			canvas  = $(config.canvasSelector).get(0);
			canvas2d = canvas.getContext('2d');
			result = $(config.resultContainerSelector);
			$(config.formSelector).on('submit', function(e){
				var remoteimage = new Image();
				$.ajax({
					url: config.imageProxy + $(config.imageSrcSelector).val(),
				  	success: function(data) {
						remoteimage.onload = function(){
					    	canvas.width = remoteimage.width;
							canvas.height = remoteimage.height;
							canvas2d.drawImage(remoteimage, 0, 0);
						};
						remoteimage.src = config.imageSrcPrefix + data;
						aspectRatio = remoteimage.width / remoteimage.height;
						if(typeof(config.imageRetrieved) == "function")
							config.imageRetrieved({ image: remoteimage });
				  }
				});
				e.preventDefault();
			});
		},
		processImage: function(options, callback){
			$.extend(config, options);
			
			if(config.maintain_aspect){
				config.rows = Math.round(config.columns / aspectRatio);
			}
			
			var colWidth = canvas.width / config.columns;
			var rowWidth = canvas.height / config.rows;
			
			resultData = new Array(config.rows);
			
			result.empty();
			var totesR = 0, totesG = 0, totesB = 0;
			for(row = 0; row < config.rows; row++){
				resultData[row] = new Array(config.columns);
				for(col = 0; col < config.columns; col++){
					var imgd = canvas2d.getImageData(col*colWidth, row*rowWidth, colWidth, rowWidth).data;
					// RGBA for each pixel
					var r = 0, g = 0, b = 0, count = 0;
					for(p = 0; p < imgd.length; p+=4){
						r += imgd[p], g += imgd[p+1], b += imgd[p+2];
						totesR += r, totesG += g, totesB += b;
						count++;
					}
					var avg = { red: Math.round(r/count), green: Math.round(g/count), blue: Math.round(b/count) };
					resultData[row][col] = avg
				}
			}
			resultAvg = { red: Math.round(totesR/count), green: Math.round(totesG/count), blue: Math.round(totesB/count)}
			if(typeof(callback) == 'function')
				callback();
		},
		createDotMatrix: function(options){
			$.extend(config, options);
			
			result.empty();
			for(row = 0; row < resultData.length; row++){
				var displayRow = $('<div/>');
				result.append(displayRow);
				for(col = 0; col < resultData[row].length; col++){
					var colour = resultData[row][col];
					if(config.mono){
						colour = total(colour) > config.threshold ? white : black;
					}
					displayRow.append('<div class="dot" style="display:inline-block;background-color:rgba('+ colour.red +','+ colour.green +','+ colour.blue + ',1);border-radius: 5px;height: 10px; width: 10px;"/>')
				}
			}
		}
	};
})();