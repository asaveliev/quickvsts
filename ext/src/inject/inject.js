//chrome.extension.sendMessage({}, function(response) {
(function(){
	var extractDashboardId = function (url){
		let dashboardRx = /https:\/\/.*\.visualstudio.com\/.*\/_dashboards\/.*([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}).*/i;
		var matches = url.match(dashboardRx);
		if (matches){
		  return matches[1];
		}
		else {
		  return null;
		}
	}
	
	var extractBoardName = function(url){
		let boardRx = /https:\/\/.*\.visualstudio.com\/.*\/_boards\/board\/.+\/(.+)/i; // project/_boards/board/teamname/boardname
		let matches = url.match(boardRx);
		if (matches){
		  return matches[1];
		}
		else {
		  return null;
		}
	}
	
	var extractQueryId = function(url){
		let dashboardRx = /https:\/\/.*\.visualstudio.com\/.*\/_queries\/query\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}).*/i;
		let matches = url.match(dashboardRx);
		if (matches){
		  return matches[1];
		}
		else {
		  return null;
		}
	  }	

	var styleInjected = false;

	var dashboardId = extractDashboardId(document.location.href);
	var boardName = extractBoardName(document.location.href);
	var queryId = extractQueryId(document.location.href);
	if (!(!!dashboardId || !!boardName || !!queryId)) return;

	if (document.location.href.indexOf("#quickvsts=true") < 0 ) 
	{
		return;
	}
	else {
		window.history.replaceState({}, document.title, document.location.href.replace("#quickvsts=true",""));

		window.addEventListener('click',function(e){
			var link = e.target.closest("a");
			if(link && link.href){
				chrome.runtime.sendMessage( { action:"newTab", url:link.href } );
				e.stopPropagation();
				return false;
			}
		});


		let readyStateCheckInterval = setInterval(function() {
	
		let grid = document.getElementById("widgets-container");
		let boards = document.getElementsByClassName("board-view-container");
		let board = null;
		if (boards.length > 0){
			board = boards[0];
		}

		if (document.documentElement && !styleInjected){
			let path = chrome.extension.getURL('src/inject/inject.css');
			let link = document.createElement("link");
			link.setAttribute("rel","stylesheet");
			link.setAttribute("type","text/css");
			link.setAttribute("href",path);
			document.documentElement.appendChild(link);
			styleInjected = true;
		}

		if (document.body){
			if (!document.body.classList.contains("quick")){
				document.body.style.visibility = "visible";
				document.body.classList.add("quick");
			}
		}

		if (grid || board){
			clearInterval(readyStateCheckInterval);
		}

		if (grid) {
			clearInterval(readyStateCheckInterval);

			let log = "";


			let map = [];

			for(let i = 0;i<51;i++){
				map.push([]);
			}

			// Build map of widgets in space
			for(let i=0;i<grid.children.length;i++){
				let child = grid.children[i];
				let row = parseInt(child.getAttribute("data-row"));
				let column = parseInt(child.getAttribute("data-col"));
				map[row][column] = child;
			}
			
			let nextPosition = {column:1,row:1};
			let tallestInRow = 0;
			let previousFit = false;

			for(let i=0;i<map.length;i++){
				
				nextPosition.column = 1;
				nextPosition.row += tallestInRow;
				tallestInRow = 0;

				for(let j=0;j<map[i].length;j++){
					if (map[i][j]){
						let child = map[i][j];
						let height = parseInt(child.getAttribute("data-sizey"));
						let width = parseInt(child.getAttribute("data-sizex"));
						let row = i;
						let column = j;
						log += `Widget at ${column},${row} (${width}x${height}) : `

						log += `Widget at ${column},${row} `;

					
						if (column + width < 6){
							log += ` fits horizontally moving to row ${nextPosition.row}.`;
							row = nextPosition.row;
							nextPosition.column += width;
							previousFit = true;
						}
						else {
							if (nextPosition.column + width > 5 || previousFit){
								// Ran out of space for the row, moving to next one
								nextPosition.column = 1;
								nextPosition.row += tallestInRow;
								tallestInRow = height;
								log += ` doesn't fit horizontally (previousFit ${previousFit}) moving cursor to ${nextPosition.column},${nextPosition.row} `;
							} 
							previousFit = false;

							row = nextPosition.row;
							column = nextPosition.column;
							log += ` , overflows so moving to ${nextPosition.column},${nextPosition.row} `;

							nextPosition.column += width;
						}

						if (height > tallestInRow){
							tallestInRow = height;
							log += ` (new tallest widget in this row at ${tallestInRow}) `;
						}

					
						child.setAttribute("data-row", row);
						child.setAttribute("data-col", column);
						//console.log(log);
						log = "";
					}
				}
			}		

			let contentArea = document.getElementsByClassName("dashboard-hub-content")[0];
			setTimeout(function(){
				contentArea.scrollTo(0,700);
			},10);
			setTimeout(function(){
				contentArea.scrollTo(0,0);
			},20);
		}
	}, 10);
	}



})();
  