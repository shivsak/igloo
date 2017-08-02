var readingStack = '"Georgia", "AmericanTypewriter", "Garamond", serif';
var newsSources = []
const error = {
  noInternetError: 'NO_INTERNET',
  fetchNewsFailedError: 'FETCH_NEWS_FAILED'
}
const newsSourcesKey = 'newsSources'
var sources = [];

function addToDo() {
    console.log('adding to do')
    chrome.storage.local.get('toDo', function(result) {
        if (result) {
            const itemTextInput = document.getElementById('itemTextInput');
            const itemText = itemTextInput.value;
            if (itemText.length <= 0) return;
            var toDo = [];
            if (result.hasOwnProperty('toDo')) {
                if(isEmpty(result.toDo)) {
                    toDo = []
                }
                else {
                    toDo = result.toDo;
                }
            }

            toDo.push(itemText);
            chrome.storage.local.set({'toDo': toDo}, function() {
                itemTextInput.value = "";
                fetchAndRenderToDoListItems();
            });
        }
        else {
            console.error('no stored to do');
        }
    });
}

function removeToDo(index) {
    console.log('removing to do ' + index)
    chrome.storage.local.get('toDo', function(result) {
        if (result) {
            var toDo = [];
            if (result.hasOwnProperty('toDo')) {
                if(isEmpty(result.toDo)) {
                    toDo = []
                }
                else {
                    toDo = result.toDo;
                }
            }

            toDo.splice(toDo.length - index - 1, 1);
            chrome.storage.local.set({'toDo': toDo}, function() {
                itemTextInput.value = "";
                fetchAndRenderToDoListItems();
            });
        }
        else {
            console.error('no stored to do');
        }
    });
}


function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function (event) {
    setDate();
    fetchAndRenderToDoListItems();
    fetchAndRenderNewsItems();
    fetchAndRenderListOfSources();
    addEventListeners();

    var toDoForm = document.getElementById('toDoForm');
    toDoForm.addEventListener('submit', function(event) {
        addToDo();
    });

    var toDoInput = document.getElementById('addToDoInput');
    document.addEventListener('keypress', function (e) {
        if (toDoInput === document.activeElement) {
            var key = e.which || e.keyCode;
            if (key === 13) {
                // code for enter key pressed
                addToDo();
            }
        }
    });

});

function addHideItemEventListeners() {
    var hideItemButtons = document.getElementsByClassName('hideItemButton');
    for (var j=0; j<hideItemButtons.length; j++) {
        hideItemButtons[j].addEventListener('click', function(event) {
            var id = event.target.id.split("-")[1];
            removeToDo(id);
        });
    };
}

function fetchAndRenderToDoListItems() {
    fetchToDoListItems(function (listItems) {
        renderToDoListItems(listItems);
    })
}

function fetchToDoListItems(callback) {
    chrome.storage.local.get('toDo', function (result) {
        callback(result.toDo)
    });
}

function renderToDoListItems(listItems) {
  if (listItems) {
    var reversedList = listItems.reverse();
    var toDoListHtml = "";
    for (var i=0; i<reversedList.length; i++) {
        toDoListHtml +=
            '<li class="box compact toDoItem"> ' +
            '   <span class="toDoItemText">' +
            '   ' + reversedList[i] +
            '   </span> ' +
            '   <a class="hideItemButton" id="hideItemButton-' + i + '">' +
            '       x' +
            '   </a> ' +
            '</li>';
    }
    document.getElementById('toDoList').innerHTML = toDoListHtml
    addHideItemEventListeners()
  }
}

function hideItem() {
    chrome.storage.local.get('toDo', function(result) {
        renderToDoListItems(result.toDo);
    });
}

function clearChromeStorage() {
    chrome.storage.local.clear(function () {
        // console.log('cleared storage');
    })
}



// News
function fetchAndRenderNewsItems() {
  getNewsSources(function (result) {
    var articles = []
    for (var i=0; i<sources.length; i++) {
      const source = sources[i];
      if (source) {
        const url = 'https://newsapi.org/v1/articles?source='+source+'&apiKey=6c312d86d5b94c768f39049f27b85696'
        httpGetAsync(url, function (response) {
          const newsResponse = JSON.parse(response)
          if (newsResponse.hasOwnProperty('articles') && newsResponse.articles.length > 0) {
            articles = articles.concat(newsResponse.articles)
          }
          renderNewsItems(articles);
          hideErrorDiv();
        }, function (failureStatus) {
          renderErrorMessage(error.fetchNewsFailedError)
        })
      }
      else {
        const url = 'https://newsapi.org/v1/articles?source=the-new-york-times&apiKey=6c312d86d5b94c768f39049f27b85696'
        httpGetAsync(url, function (response) {
          const newsResponse = JSON.parse(response)
          renderNewsItems(newsResponse);
        })
      }
    }
  });
}

function renderNewsItems(articles) {
  var newsItemsList = document.getElementById('newsItemsList');
  var newsHtml = '';
  // check resposne status
  for (var i=0; i<articles.length; i++) {
    const article = articles[i];
    // image
    var imageUrl = ''
    if (article.hasOwnProperty('urlToImage')) {
      imageUrl = article.urlToImage;
    }

    // url
    var url = ''
    if (article.hasOwnProperty('url')) {
      url = article.url;
    }

    // title
    var title = ''
    if (article.hasOwnProperty('title')) {
      title = article.title;
    }

    // description
    var description = ''
    const maxLength = 100;
    if (article.hasOwnProperty('description')) {
      if (article.description.length > maxLength) {
        description = article.description.substring(0, maxLength);
      } else {
        description = article.description;
      }
    }

    const newsItem = '<li class="box columns newsItem">' +
        '<a href="'+url+'" class="newsItemLink" target="_blank">' +
            '<div class="newsItemLinkImageDiv">' +
                '<img src="'+ imageUrl +'" class="newsItemLinkImage" />' +
            '</div>' +
            '<div class="newsItemLinkContent">' +
                '<p class="newsItemLinkSource">' + url + '</p>' +
                '<h4 class="newsItemLinkTitle">' + title + '</h4>' +
                '<p class="newsItemLinkDescription">' +
                    description + '...' +
                '</p>' +
            '</div>' +
        '</a>' +
    '</li>'
    newsHtml += newsItem
    // console.log(newsItem)
  }
  if (newsItemsList) {
    newsItemsList.innerHTML = newsHtml;
  }
}


function httpGetAsync(theUrl, successCallback, failureCallback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
          if (xmlHttp.status == 200) successCallback(xmlHttp.responseText);
          else if (failureCallback) failureCallback(xmlHttp.status)
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function newsSourcesUpdated() {
  updateNewsSourceInfoText();
  renderSelectedSourcesInList();
  fetchAndRenderNewsItems();
}

// customize news sources
function setNewsSource(source) {
    sources.push(source.id);
    chrome.storage.local.set({'newsSources': sources}, function() {
      newsSourcesUpdated();
    })
}

function renderSelectedSourcesInList() {

}

function updateNewsSourceInfoText() {
  console.log('updating news source info ttext')
  chrome.storage.local.get('newsSources', function(obj) {
    const sources = obj.newsSources
    const sourcesText = newsSources.filter(ns => {
      return sources.indexOf(ns.id) >= 0
    }).map(ns => ns.name).join(', ');
    console.log('sourcesText: ', sourcesText)
    var newsSourceInfoText = document.getElementById('newsSourceInfoText');
    if (newsSourceInfoText && sources.length > 0) {
      newsSourceInfoText.innerHTML = 'getting news from <a href="#" class="highlighted" id="newsSourceInfoTextName">' + sourcesText + '</a>';
    }
    else if (newsSourceInfoText) {
      newsSourceInfoText.innerHTML = '<a href="#" class="highlighted" id="newsSourceInfoTextName">Customize your news source</a>';
    }
  })
  
}

function getNewsSources(callback) {
  // chrome.storage.local.clear()
  chrome.storage.local.get('newsSources', function(result) {
    if (result.hasOwnProperty('newsSources')) {
      sources = getUniqueArray(result.newsSources);
    }
    callback(result)
  })
}

function getUniqueArray(arr) {
	var n = []; 
	for(var i = 0; i < arr.length; i++) 
	{
		if (n.indexOf(arr[i]) == -1) n.push(arr[i]);
  }
	return n;
}

function fetchAndRenderListOfSources(callback) {
  const url = 'https://newsapi.org/v1/sources?language=en'
  httpGetAsync(url, function (response) {
    const sourcesResponse = JSON.parse(response)
    if (sourcesResponse.hasOwnProperty('sources')) {
      newsSources = sourcesResponse.sources
      renderListOfSources(newsSources);
      updateNewsSourceInfoText()
    }
  })
}

function renderListOfSources(sources) {
  var newsSourcesList = document.getElementById('newsSourcesList');
  var sourceListHtml = '';
  for (var i=0; i<sources.length; i++) {
    const source = sources[i];
    sourceListHtml +='<li class="newsSourcesListItem">'+ source.name +'</li>'
  }
  sourceListHtml +='<li class="newsSourcesListItem"> </li>'
  sourceListHtml +='<li class="newsSourcesListItem"> </li>'
  if (newsSourcesList) {
    newsSourcesList.innerHTML = sourceListHtml;
  }

  addSourcesClickEventListeners(sources)
}

function addSourcesClickEventListeners(sources) {
  var sourceElems = document.getElementsByClassName('newsSourcesListItem');
  if (sourceElems && sourceElems.length > 0) {
    for (var i=0; i<sources.length; i++) {
      const sourceElem = sourceElems[i];
      const source = sources[i]
      sourceElem.addEventListener('click', function (i) {
        sourceSelected(source)
      })
    }
  }
}

function addEventListeners() {
  addShowSettingsTextEventListeners();
  addHideSettingsTextEventListeners();
  addEscapeKeyEventListener();
}

function addShowSettingsTextEventListeners() {
  var newsSourceInfoText = document.getElementById('newsSourceInfoText');
  if (newsSourceInfoText) {
    newsSourceInfoText.addEventListener('click', function () {
      showSettings();
    })
  }
}

function addHideSettingsTextEventListeners() {
  var settingsHideButton = document.getElementById('settingsHideButton');
  if (settingsHideButton) {
    settingsHideButton.addEventListener('click', function () {
      hideSettings();
    })
  }
}

function addEscapeKeyEventListener() {
  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        hideSettings();
    }
};
}

function sourceSelected(source) {
  getNewsSources(function(obj) {
    const sources = obj.newsSources
    if (sources && sources.length > 5) {
      const err = 'You cannot select more than 6 news sources.';
      console.error(err);
      alert(err);
    }
    else if (sources && sources.indexOf(source.id) >= 0) {
      const err = 'You have already selected this news source.';
      console.error(err);
      alert(err);
    }
    else {
      setNewsSource(source);
    }
  })
}

function showSettings() {
  var settings = document.getElementById('settings');
  if (settings) {
    settings.classList.add('animated');
    settings.classList.add('fadeInRight');
    settings.classList.add('show');
  }
}

function hideSettings() {
  var settings = document.getElementById('settings');
  if (settings) {
    settings.classList.remove('animated');
    settings.classList.remove('fadeInRight');
    settings.classList.remove('show');
  }
}


// set date
function setDate() {
  var date = new Date();
  var dateElem = document.getElementById('date');
  if (dateElem) {
    dateElem.innerHTML= getFormattedMonth(date) + ' <a href="http://calendar.google.com" class="date">'+getFormattedDate(date)+'</a>'
  }
}

function getFormattedDate (dateObject) {
  const date = dateObject.getDate();
  const paddedDate = ("00" + date).slice(-2)
  return paddedDate
}

function getFormattedMonth (dateObject) {
  const monthNumber = dateObject.getMonth();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber];
}

function renderErrorMessage(errorType) {
  if (errorType === error.noInternetError) renderNoInternetError()
  else if (errorType === error.fetchNewsFailedError) renderFetchNewsFailedError()
}

function renderNoInternetError() {
  console.error('NO INTERNET')
}

function renderFetchNewsFailedError() {
  console.error('News fetch failed')
  const errorDiv = document.querySelector('#errorDiv');
  const errorDivContainer = document.querySelector('#errorDivContainer');
  if (errorDiv && errorDivContainer) {
    errorDivContainer.style.display = 'block';
    errorDiv.innerHTML = "Couldn't fetch news. Are you sure you have a working internet connection?"
  }
}

function hideErrorDiv() {
  const errorDiv = document.querySelector('#errorDiv');
  const errorDivContainer = document.querySelector('#errorDivContainer');
  if (errorDiv && errorDivContainer) {
    errorDivContainer.style.display = 'none';
    errorDiv.innerHTML = "Couldn't fetch news. Are you sure you have a working internet connection?"
  }
}

Array.prototype.unique = function()
{
	var n = []; 
	for(var i = 0; i < this.length; i++) 
	{
		if (n.indexOf(this[i]) == -1) n.push(this[i]);
	}
	return n;
}