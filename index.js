var readingStack = '"Georgia", "AmericanTypewriter", "Garamond", serif';
var newsSources = []

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
    getNewsSource(function(source) {
      updateNewsSourceInfoText(source);
    })
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
  getNewsSource(function (source) {
    if (source && source.hasOwnProperty('id')) {
      const url = 'https://newsapi.org/v1/articles?source='+source.id+'&apiKey=6c312d86d5b94c768f39049f27b85696'
      httpGetAsync(url, function (response) {
        const newsResponse = JSON.parse(response)
        renderNewsItems(newsResponse);
      })
    }
    else {
      const url = 'https://newsapi.org/v1/articles?source=the-new-york-times&apiKey=6c312d86d5b94c768f39049f27b85696'
      httpGetAsync(url, function (response) {
        const newsResponse = JSON.parse(response)
        renderNewsItems(newsResponse);
      })
    }
  });
}

function renderNewsItems(response) {
  var newsItemsList = document.getElementById('newsItemsList');
  var newsHtml = '';
  // check resposne status
  if (response.hasOwnProperty('articles') && response.articles.length > 0) {
    const articles = response.articles
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
  }
  if (newsItemsList) {
    newsItemsList.innerHTML = newsHtml;
  }
}


function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}



// customize news sources
function setNewsSource(source) {
  chrome.storage.local.set({'newsSource': source}, function () {
    updateNewsSourceInfoText(source);
    renderSelectedSourceInList(source);
    fetchAndRenderNewsItems();
  });
}

function renderSelectedSourceInList(source) {

}

function updateNewsSourceInfoText(source) {
  var newsSourceInfoText = document.getElementById('newsSourceInfoText');
  if (newsSourceInfoText && source && source.hasOwnProperty('name')) {
    newsSourceInfoText.innerHTML = 'getting news from <a href="#" class="highlighted" id="newsSourceInfoTextName">' + source.name + '</a>';
  }
  else if (newsSourceInfoText) {
    newsSourceInfoText.innerHTML = '<a href="#" class="highlighted" id="newsSourceInfoTextName">Customize your news source</a>';
  }
}

function getNewsSource(callback) {
  chrome.storage.local.get('newsSource', function(result) {
    callback(result.newsSource)
  })
}

function fetchAndRenderListOfSources(callback) {
  const url = 'https://newsapi.org/v1/sources?language=en'
  httpGetAsync(url, function (response) {
    const sourcesResponse = JSON.parse(response)
    console.log(sourcesResponse);
    if (sourcesResponse.hasOwnProperty('sources')) {
      renderListOfSources(sourcesResponse.sources);
    }
  })
}

function renderListOfSources(sources) {
  var newsSourcesList = document.getElementById('newsSourcesList');
  var sourceListHtml = '';
  console.log(sources);
  for (var i=0; i<sources.length; i++) {
    const source = sources[i];
    sourceListHtml +='<li class="newsSourcesListItem">'+ source.name +'</li>'
  }
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
      console.log('hideing')
      hideSettings();
    })
  }
}

function sourceSelected(source) {
  console.log('selected source id ' + source.id);
  setNewsSource(source);
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
  console.log(date.getDate());
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
