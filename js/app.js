// Setup variables

let numOfResults = 6;
let numOfHistoryResults = 5;

// Variables declaration

let totalResults = 0;
let lastInputValue = "";
let isPlaying = false;

// UI declaration

let listViewButton = document.querySelector('#listView');
let gridViewButton = document.querySelector('#gridView');
let goButton = document.querySelector('#go');
let clearButton = document.querySelector('#clearHistory');
let nextButton = document.querySelector('#next');
let viewButton = document.querySelector('.scp-list-view');

let inputBox = document.querySelector('#searchItem');

let resultsContainer = document.querySelector('.scp-list#searchResults');
let historyContainer = document.querySelector('.scp-list#recentSearches');

let scpPlayer = document.querySelector('.scp-player');
let scpPlayerImg = scpPlayer.querySelector('img');
let thePlayer = document.getElementById('scp-player');

thePlayer.onplaying = function(){isPlaying = true};
thePlayer.onpause = function(){isPlaying = false};

// Functions

function printResults(data){
    // if (data.length < numOfResults) {
    //
    // } else if (data.length === numOfResults) {
    //
    // }
    resultsContainer.innerHTML = "";
    console.log(data);
    data.collection.map(function(item){
        let tempLi = createChildLi(item.title);
        tempLi.addEventListener('click',function(){
            scpPlayer.querySelector('img').src = item.artwork_url;
            thePlayer.src = item.stream_url + '?client_id=ggX0UomnLs0VmW7qZnCzw'
            thePlayer.play();
        });
        resultsContainer.append(tempLi);
    });
    viewButton.classList.remove('hide');
    nextButton.classList.remove('hide');
    localStorage.setItem('next_href',data.next_href)
}

function getResults(url) {
    fetch(url)
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }
                response.json().then(function(data) {
                    printResults(data);
                });
            }
        )
        .catch(function(err) {
            console.log('Error: ', err);
        });
}

function returnHistory(){
    tempArray = [];
    Array.from(historyContainer.querySelectorAll('li')).map(function(item){
        tempArray.push(item.innerText)
    });
    return JSON.stringify(tempArray);
}

function processHistory(elem) {
    historyLength = Array.from(historyContainer.querySelectorAll('li')).length

    if (historyLength > 4) {
        historyContainer.removeChild(historyContainer.lastChild)
        historyContainer.insertBefore(elem, historyContainer.firstChild);
    } else {
        historyContainer.insertBefore(elem, historyContainer.firstChild);
    }
    localStorage.setItem('scp-history', returnHistory());
}

function processChild(childData) {
    let tempLi = createChildLi(childData);
    tempLi.addEventListener('click', function(){newSearch(undefined, childData)});
    processHistory(tempLi);
    getResults('http://api.soundcloud.com/tracks.json?client_id=ggX0UomnLs0VmW7qZnCzw&q=' + childData+ '&limit='+ numOfResults +'&linked_partitioning=1');
}

function createChildLi(content) {
    let tempLiChild = document.createElement('li');
    tempLiChild.innerHTML = content;
    return tempLiChild;
}

function newSearch(inputBoxItem,historyItem) {
    if (inputBoxItem) {
        if (inputBoxItem !== lastInputValue) processChild(inputBoxItem)
    }
    if (historyItem) {
        inputBox.value = historyItem;
        processChild(historyItem);
    }
}

// init

if (localStorage.getItem('scp-history')) {
   historyContainer.innerHTML = "";
   let tempArray = JSON.parse(localStorage.getItem('scp-history'));
   tempArray.map(function(item){
      let tempLi = createChildLi(item);
       tempLi.addEventListener('click', function(){newSearch(undefined, item)})
       historyContainer.append(tempLi);
   })
}

// Events

scpPlayerImg.addEventListener('click',function(){
        if (isPlaying) {
            thePlayer.pause()
        } else {
            thePlayer.play();
        }
});

listViewButton.addEventListener('click',function(){
    resultsContainer.classList.add('listView');
    resultsContainer.classList.remove('gridView')
});

gridViewButton.addEventListener(    'click',function(){
    resultsContainer.classList.remove('listView')
    resultsContainer.classList.add('gridView')
});

goButton.addEventListener('click',function() {
 newSearch(inputBox.value,undefined)
});

nextButton.addEventListener('click',function(){
    getResults(localStorage.getItem('next_href'));
});

clearButton.addEventListener('click',function(){
    localStorage.removeItem('scp-history');
    historyContainer.innerHTML = "";
});
