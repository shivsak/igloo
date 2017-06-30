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
            chrome.storage.local.set({'toDo': toDo});
        }
        else {
            console.error('no stored to do');
        }
    });

    return false;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function (event) {
    chrome.storage.local.get('toDo', function(result) {
        console.log('loaded DOM: getting toDoZ');
        console.log(result);
        renderToDoListItems(result.toDo);
    });

    var toDoForm = document.getElementById('toDoForm');
    console.log('todoform is' + toDoForm);
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
    // chrome.storage.local.clear(function () {
    //     console.log('cleared storage');
    // })


});

function renderToDoListItems(listItems) {
for (var i=0; i<listItems.length; i++) {
    var a = '<li class="toDoItem"> <span class="toDoItemText">' + listItems[i] + '</span> </li>';
    document.getElementById('toDoList').innerHTML +=
        a
}
}