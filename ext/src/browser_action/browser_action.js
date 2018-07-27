

window.onload = function(){

    let _AnalyticsCode = 'UA-120142459-1';

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        
        ga('create', _AnalyticsCode, 'auto');
        ga('set', 'checkProtocolTask', function(){ /* nothing */ });
        ga('send', {'hitType':'pageview', 'page': '/browser_action.html'});
    

    chrome.storage.sync.get('pages', function(data) {
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {

            let container = document.getElementById("pagesList");

            let firstRow = true;

            for(let page of data.pages){
                let element = document.createElement("div");
                element.classList.add("page");
                element.setAttribute("draggable","true");
                element.addEventListener("dragenter",dragEnter);
                element.addEventListener("dragstart",dragStart);
                element.addEventListener("dragend",dragEnd);
                element.setAttribute("data-id",page.id);

                if (firstRow){
                    firstRow = false;
                    element.classList.add("active");
                }

                let icon = "";
                if (page.pagetype == "dashboard"){
                    icon = "📊";
                }
                else if (page.pagetype == "query"){
                    icon = "🔎";
                }
                else if (page.pagetype == "pullrequests"){
                    icon = "😵";
                }
                else {
                    icon = "🏭";
                }
                let iconElement = document.createElement("span");
                iconElement.classList.add("icon");
                iconElement.innerText = icon;
                iconElement.setAttribute("draggable","false");
                element.appendChild(iconElement);


                let link = document.createElement("a");
                link.setAttribute("href",appendFullscreen(page));
                link.innerText = page.title;
                link.setAttribute("target","pageContainer");
                link.setAttribute("title",page.title);
                link.addEventListener("click",activatePage);
                link.setAttribute("draggable","false");
                element.appendChild(link);


                let deleteElement = document.createElement("span");
                deleteElement.classList.add("delete");
                deleteElement.setAttribute("data-id",page.id);
                deleteElement.innerText = "❌";
                deleteElement.addEventListener("click",deletePage);
                deleteElement.setAttribute("draggable","false");
                element.appendChild(deleteElement);
                
                
                container.appendChild(element);
            }

            document.getElementById("pageContainer").setAttribute("src",appendFullscreen(data.pages[0]));
        }
        else {
            document.getElementById("pagesList").style.display = "none";
            document.getElementById("pageContainer").style.display = "none";
            document.getElementById("emptyExperience").style.display = "block";
        }
    });  
}

let draggedElement;

function dragStart(event) {
    draggedElement = event.target;
    event.dataTransfer.effectAllowed = 'move';
}

function dragEnter(event){
    let targetPage = event.target.closest(".page");
    if (isTargetBefore(draggedElement, targetPage)) {
        targetPage.parentNode.insertBefore(draggedElement, targetPage);
    }
    else {
        targetPage.parentNode.insertBefore(draggedElement, targetPage.nextSibling);
    }
}

function dragEnd(){
    let pages = document.getElementById("pagesList");
    chrome.storage.sync.get('pages', function(data) {
        let newPages = [];
        for(let page of pages.children){
            let id = page.getAttribute("data-id");
            for(let i = 0; i < data.pages.length; i++) {
                if(data.pages[i].id === id) {
                    newPages.push(data.pages[i]);
                }
            }
            chrome.storage.sync.set({"pages": newPages});                
        }
    });
}

function isTargetBefore(source, destination) {
    if (source.parentNode === destination.parentNode) { // Make sure both have same parent, so you don't drag it out
        let element = source; 
        while(true)
        {
            // Keep going to previous sibling until we reach empty of ourselves
            if (!element) break;
            if (element === destination) { 
                return true;
            }
            element = element.previousSibling; 
        }
    }
    return false;
} 

function activatePage(event){
    let pages = document.getElementsByClassName("page");
    for(let page of pages){
        page.classList.remove("active");
    }
    event.target.closest(".page").classList.add("active");

    ga('send', 'event', 'Page', 'navigate');
}

function deletePage(event){
    let id = event.target.getAttribute("data-id");
    chrome.storage.sync.get('pages', function(data) {
        for(let i = 0; i < data.pages.length; i++) {
            if(data.pages[i].id === id) {
                ga('send', 'event', 'Page', 'delete');

                data.pages.splice(i, 1);
                event.target.closest(".page").remove();
                chrome.storage.sync.set({"pages": data.pages});                

                break;
            }
        }
    });
}

function appendFullscreen(page){
    let url = page.url;
    if (url.indexOf("?") < 0)url += "?";
    if (page.pagetype == "board"){
        url += "fullScreen=true";
    }
    else if (page.pagetype == "dashboard" || page.pagetype == "pullrequests"){
        url += "__rt=chromeless";
    }
    else if (page.pagetype == "query"){
        url += "fullScreen=true";
    }
    url += "#quickvsts=true";
    return url;
}