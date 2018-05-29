window.onload = function(){
    chrome.storage.sync.get('pages', function(data) {
        if (data.pages && Array.isArray(data.pages)) {

            let container = document.getElementById("pagesList");


            for(let page of data.pages){
                let element = document.createElement("div");
                element.classList.add("page");
 
                let icon = "";
                if (page.pagetype == "dashboard"){
                    icon = "📊";
                }
                else if (page.pagetype == "query"){
                    icon = "🔎";
                }
                else {
                    icon = "🏭";
                }
                let iconElement = document.createElement("span");
                iconElement.classList.add("icon");
                iconElement.innerText = icon;
                element.appendChild(iconElement);


                let link = document.createElement("a");
                link.setAttribute("href",appendFullscreen(page.url));
                link.innerText = page.title;
                link.setAttribute("target","pageContainer");
                link.setAttribute("title",page.title);
                element.appendChild(link);

                let deleteElement = document.createElement("span");
                deleteElement.classList.add("delete");
                deleteElement.setAttribute("data-id",page.id);
                deleteElement.innerText = "❌";
                //deleteElement.setAttribute("onclick","deleteElement(this)");
                deleteElement.addEventListener("click",deletePage);
                element.appendChild(deleteElement);
                
                
                container.appendChild(element);
            }

            if (data.pages.length > 0) {
                document.getElementById("pageContainer").setAttribute("src",appendFullscreen(data.pages[0].url));
            }
        }
    });  
}

function deletePage(event){
    let id = event.target.getAttribute("data-id");
    chrome.storage.sync.get('pages', function(data) {
        for(let i = 0; i < data.pages.length; i++) {
            if(data.pages[i].id === id) {
                data.pages.splice(i, 1);
                event.target.closest(".page").remove();
                chrome.storage.sync.set({"pages": data.pages});                

                break;
            }
        }
    });
}

function appendFullscreen(url){
    if (url.indexOf("?") < 0) url += "?";
    url += "__rt=chromeless#quickvsts=true";
    return url;
}