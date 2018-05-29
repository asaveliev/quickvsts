
function removeSecurityHeader(details) {
      console.log(details);
      
      for (let i = 0; i < details.responseHeaders.length; i++) {
        if (details.responseHeaders[i].name.toLowerCase() === 'x-frame-options') {
          details.responseHeaders.splice(i, 1);
        }

        if (details.responseHeaders[i].name.toLowerCase() === 'referrer') {
          details.responseHeaders.splice(i, 1);
        }
      }

      return { responseHeaders: details.responseHeaders };
}

function registerPage(){
  chrome.tabs.getSelected(null,function(tab) {
    let url = tab.url;
    chrome.storage.sync.get('pages', function(currentPages) {
      let pages = [];
      if (currentPages.pages) {
        pages = currentPages.pages;
      }

      if (url.indexOf("?") > 0){
        url = url.substring(0,url.indexOf("?")-1);
      }
      let dashboardId = extractDashboardId(url);
      let boardName = extractBoardName(url);
      let queryId = extractQueryId(url);
      if (dashboardId || boardName || queryId){
        let key = dashboardId || queryId || url; // either use dashboard guid, query ID or full board URL as key
        let existingItem = pages.find(function (page) { return page.id === key; });

        let pageType = "";
        if (dashboardId) {pageType = "dashboard";} else if (queryId) { pageType="query"} else {pageType = "board"};

        if (!existingItem) {
          pages.push({id:key,url:url,title:tab.title,pagetype:pageType});
        }
        else {
          existingItem.url = url;
          existingItem.title = tab.title;
          existingItem.pagetype = pageType;
        }
        
        chrome.storage.sync.set({"pages": pages},function(){
        });
      }
    });
  });
}

function extractDashboardId(url){
  let dashboardRx = /https:\/\/.*\.visualstudio.com\/.*\/_dashboards\/.*([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}).*/i;
  let matches = url.match(dashboardRx);
  if (matches){
    return matches[1];
  }
  else {
    return null;
  }
}

function extractQueryId(url){
  let dashboardRx = /https:\/\/.*\.visualstudio.com\/.*\/_queries\/query\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}).*/i;
  let matches = url.match(dashboardRx);
  if (matches){
    return matches[1];
  }
  else {
    return null;
  }
}

function extractBoardName(url){
  let boardRx = /https:\/\/.*\.visualstudio.com\/.*\/_boards\/board\/.+\/(.+)/i; // project/_boards/board/teamname/boardname
  let matches = url.match(boardRx);
  if (matches){
    return matches[1];
  }
  else {
    return null;
  }
}

let targetPage = "https://*.visualstudio.com/*";

chrome.webRequest.onHeadersReceived.addListener(
  removeSecurityHeader,
  {
    urls: [targetPage],
    types: [ 'sub_frame' ]
  },
  ["blocking","responseHeaders"]
);

// For future page action (in addition to right click menu below)
// function checkForValidUrl(tabId, changeInfo, tab) {
//   if (/https:\/\/.*\.visualstudio.com\/.*\/_dashboards\/.*/,tab.url) {
//     chrome.pageAction.show(tabId);
//   }
//   else {
//     chrome.pageAction.hide(tabId);
//   }
// };
// chrome.tabs.onUpdated.addListener(checkForValidUrl);


chrome.contextMenus.create({
  title: "Add to QuickVSTS",
  contexts:["page"],  // ContextType
  onclick: registerPage, // A callback function,
  "documentUrlPatterns": [
    "https://*.visualstudio.com/*/_boards/board/*", // Matches project/_boards/board/boardname
    "https://*.visualstudio.com/*/_dashboards/*/*", // Matches project/_dashboards/team/dashboardguid
    "https://*.visualstudio.com/*/_queries/query/*"
  ]
 });


chrome.runtime.onMessage.addListener(function(message){
  if (message && message.action && message.action == "newTab"){
      chrome.tabs.create({ url: message.url });
  }
});

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest)
  {
    chrome.storage.sync.get('pages', function(currentPages) {
      if (currentPages.pages){
        let suggestions = [];
        for(let page of currentPages.pages){
          if (page.title.toLowerCase().indexOf(text.toLowerCase())>-1){
            suggestions.push(
              {
                content: page.url,
                description: page.title
              }
            );
          }
        }

        suggest(suggestions);
      }
    });
  }
);

chrome.omnibox.onInputEntered.addListener(
  function(text)
  {
      chrome.tabs.getSelected(null, function(tab)
      {
          chrome.tabs.update(tab.id, {url: text});
      });
  }
);