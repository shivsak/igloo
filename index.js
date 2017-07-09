var readingStack = '"Georgia", "AmericanTypewriter", "Garamond", serif';

function addToDo() {
    console.log('adding to do')
    chrome.storage.local.get('toDo', function(result) {
        if (result) {
            var itemTextInput = document.getElementById('itemTextInput');
            var itemText = itemTextInput.value;
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
    fetchAndRenderToDoListItems();
    fetchAndRenderNewsItems();

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
  const source = 'the-next-web';
  console.log('getting from ' + source);
  const url = 'https://newsapi.org/v1/articles?source=the-next-web&sortBy=latest&apiKey=6c312d86d5b94c768f39049f27b85696'
  httpGetAsync(url, function (response) {
    console.log('heres the news');
    const newsResponse = JSON.parse(response)
    console.log(newsResponse);
    renderNewsItems(newsResponse);
  })
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


      console.log(article)
      const newsItem = '<li class="box newsItem">' +
          '<a href="'+url+'" class="newsItemLink" target="_blank">' +
              '<div class="newsItemLinkImageDiv">' +
                  '<img src="'+ imageUrl +'" class="newsItemLinkImage" />' +
              '</div>' +
              '<div class="newsItemLinkContent">' +
                  '<p class="newsItemLinkSource">' + url + '</p>' +
                  '<h4 class="newsItemLinkTitle">' + title + '</h4>' +
                  '<p class="newsItemLinkDescription">' +
                      description +
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
