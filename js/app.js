// Setup variables

let numOfResults = 6,
    playerID = "ggX0UomnLs0VmW7qZnCzw";

// Variables declaration

let lastInputValue = "",
    isPlaying = false;

// UI declaration

let scpUser = document.querySelector('.scp-user'),
    listViewButton = document.querySelector('#listView'),
    gridViewButton = document.querySelector('#gridView'),
    goButton = document.querySelector('#go'),
    clearButton = document.querySelector('#clearHistory'),
    nextButton = document.querySelector('#next'),
    viewButton = document.querySelector('.scp-list-view'),
    inputBox = document.querySelector('#searchItem'),
    infoText = document.querySelector('.songInfo > span'),
    resultsContainer = document.querySelector('.scp-list#searchResults'),
    historyContainer = document.querySelector('.scp-list#recentSearches'),
    scpPlayer = document.querySelector('.scp-player'),
    scpPlayerImg = scpPlayer.querySelector('img'),
    thePlayer = document.getElementById('scp-player'),
    msgBoard = document.querySelector('.infoBoard');

// Templates
let templates =
    {
        simpleSpan: '<span>{title}</span>',
        searchResult: '<span data-imgsrc="{artwork_url}">{title}</span>'
    };

// Functions
let create = {
    template(template, data) {
        let tempData = template.match(/{([^}]+)}/g);
        tempData.map(function (item) {
            template = template.replace(item, data[item.slice(1, -1)])
        });
        return template
    },
    child(template) {
        let tempLiChild = document.createElement('li');
        tempLiChild.innerHTML = template;
        return tempLiChild;
    }
};
let results = {
    printList(data, searchTerm) {
        resultsContainer.innerHTML = "";
        if (searchTerm !== lastInputValue) history.save(searchTerm);
        // print results
        let isGrid = resultsContainer.classList.contains('gridView');
        data.collection.map(function (item) {
            let tempLi = create.child(create.template(templates.searchResult, item) + "");
            if (isGrid) {
                let spanImgSrc = tempLi.querySelector('span').dataset.imgsrc;
                if (spanImgSrc === "null") {
                    spanImgSrc = "./assets/scp-thumb.png";
                }
                tempLi.style.backgroundImage = "url(" + spanImgSrc + ")";
            }
            tempLi.addEventListener('click', function () {
                results.animateAndPlay(tempLi, item)
            });
            tempLi.onmouseover = function () {
                if (utils.checkOverFlow(this)) tempLi.querySelector('span').classList.add('marquee');
            };
            tempLi.onmouseout = function () {
                tempLi.querySelector('span').classList.remove('marquee');
            };
            resultsContainer.append(tempLi);
        });
        viewButton.classList.remove('disable');
        nextButton.classList.remove('disable');
        if (data.next_href) localStorage.setItem('next_href', data.next_href);
        lastInputValue = searchTerm;
        //
    },
    get(url, searchTerm) {
        fetch(url)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.error(response.status);
                        return;
                    }
                    response.json().then(function (data) {
                        if (data.collection.length === 0) {
                            msgBoard.innerText = "No results :("
                        } else {
                            results.printList(data, searchTerm);
                        }
                    });
                }
            )
            .catch(function (err) {
                console.error('Error: ', err);
            });
    },
    animateAndPlay(elem, item) {
        //elem = elem.querySelector('span');
        let ghostElem = document.createElement('div');
        ghostElem.innerHTML = elem.innerHTML;
        ghostElem.classList.add('scp-ghostElement');
        ghostElem.style.width = elem.clientWidth + 'px';
        ghostElem.style.top = elem.offsetTop + 'px';
        ghostElem.style.left = elem.offsetLeft + 'px';
        resultsContainer.append(ghostElem);
        //
        let step1, step2, step3;
        step1 = ghostElem.animate({
            left: [elem.offsetLeft + 'px', (scpPlayerImg.offsetLeft - scpPlayerImg.offsetWidth / 2) + 'px'],
            top: [elem.offsetTop + 'px', (scpPlayerImg.offsetTop - scpPlayerImg.offsetHeight / 2) + 'px'],
            transform: ['scale(1)', 'scale(0)'],
            opacity: [1, 0]
        }, {
            duration: 500,
            iterations: 1
        });

        //
        step1.onfinish = function () {
            ghostElem.remove();
            step2 = scpPlayerImg.animate({
                transform: ['scale(1)', 'scale(0)']
            }, {
                duration: 250,
                iterations: 1
            });
            step2.onfinish = function () {
                if (item.artwork_url !== null) scpPlayer.querySelector('img').src = item.artwork_url;
                step3 = scpPlayerImg.animate({
                    transform: ['scale(0)', 'scale(1)']
                }, {
                    duration: 250,
                    iterations: 1
                });
                step3.onfinish = function () {
                    thePlayer.src = item.stream_url + '?client_id=' + playerID;
                    thePlayer.play();
                    infoText.innerText = 'playing';
                    ghostElem.remove();
                }
            };
        };
    }
};
let history = {
    returnRemoteState() {
        historyContainer.innerHTML = "";
        let tempArray = JSON.parse(localStorage.getItem('scp-history'));
        tempArray.map(function (item) {
            let tempLi = create.child(create.template(templates.simpleSpan, {title: item}));
            tempLi.addEventListener('click', function () {
                inputBox.value = item;
                results.get('http://api.soundcloud.com/tracks.json?client_id=' + playerID + '&q=' + item + '&limit=' + numOfResults + '&linked_partitioning=1', item);
            });
            historyContainer.append(tempLi);
        })
    },
    returnLocalState() {
        let tempArray = [];
        Array.from(historyContainer.querySelectorAll('li')).map(function (item) {
            tempArray.push(item.querySelector('span').innerHTML);
        });
        return JSON.stringify(tempArray);
    },
    save(searchTerm) {
        let historyLength = Array.from(historyContainer.querySelectorAll('li')).length;
        if (historyLength > 4) {
            historyContainer.removeChild(historyContainer.lastChild)
        }
        let tempLi = create.child(create.template(templates.simpleSpan, {title: searchTerm}));
        tempLi.addEventListener('click', function () {
            inputBox.value = searchTerm;
            results.get('http://api.soundcloud.com/tracks.json?client_id=' + playerID + '&q=' + searchTerm + '&limit=' + numOfResults + '&linked_partitioning=1', searchTerm);
        });
        historyContainer.insertBefore(tempLi, historyContainer.firstChild);
        localStorage.setItem('scp-history', this.returnLocalState());
    }
};
let user = {
    retrieve() {
        fetch("http://api.soundcloud.com/users/3207?client_id=" + playerID)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.error(response.status);
                        return;
                    }
                    response.json().then(function (data) {
                        scpUser.innerText = data.username;
                    });
                }
            )
            .catch(function (err) {
                console.error('Error: ', err);
            });
    }
};
let utils = {
    // checkOverFlow =>credit to: https://stackoverflow.com/users/811/shog9
    checkOverFlow(el) {
        let curOverflow = el.style.overflow;
        if (!curOverflow || curOverflow === "visible")
            el.style.overflow = "hidden";
        let isOverflowing = el.clientWidth < el.scrollWidth
            || el.clientHeight < el.scrollHeight;
        el.style.overflow = curOverflow;
        return isOverflowing;
    },
    ready(fn) {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
};

// Events
thePlayer.onplaying = function () {
    isPlaying = true;
    infoText.innerText = 'playing';
};
thePlayer.onpause = function () {
    isPlaying = false;
    infoText.innerText = 'paused';
};
scpPlayerImg.addEventListener('click', function () {
    if (isPlaying) {
        thePlayer.pause()
    } else {
        thePlayer.play();
    }
});
listViewButton.addEventListener('click', function () {
    localStorage.setItem('scp-grid', "false");
    resultsContainer.classList.add('listView');
    Array.from(resultsContainer.querySelectorAll('li')).map(function (item) {
        item.style.backgroundImage = "none";
    });
    resultsContainer.classList.remove('gridView')
});
gridViewButton.addEventListener('click', function () {
    localStorage.setItem('scp-grid', "true");
    resultsContainer.classList.remove('listView');
    Array.from(resultsContainer.querySelectorAll('li')).map(function (item) {
        let spanImgSrc = item.querySelector('span').dataset.imgsrc;
        if (spanImgSrc === "null") {
            spanImgSrc = "./assets/scp-thumb.png";
        }
        item.style.backgroundImage = "url(" + spanImgSrc + ")";
    });
    resultsContainer.classList.add('gridView');
});
goButton.addEventListener('click', function () {
    results.get('http://api.soundcloud.com/tracks.json?client_id=' + playerID + '&q=' + inputBox.value + '&limit=' + numOfResults + '&linked_partitioning=1', inputBox.value);
});
nextButton.addEventListener('click', function () {
    results.get(localStorage.getItem('next_href'), inputBox.value);
});
clearButton.addEventListener('click', function () {
    localStorage.removeItem('scp-history');
    historyContainer.innerHTML = "";
});
inputBox.addEventListener('keyup', function (e) {
    e.preventDefault();
    if (e.keyCode === 13) {
        results.get('http://api.soundcloud.com/tracks.json?client_id=' + playerID + '&q=' + inputBox.value + '&limit=' + numOfResults + '&linked_partitioning=1', inputBox.value);
    }
});

// init
utils.ready(function(){
    user.retrieve();
    inputBox.focus();
    if (localStorage.getItem('scp-grid') === "true") {
        resultsContainer.classList.remove('listView');
        resultsContainer.classList.add('gridView');
    }
    if (localStorage.getItem('scp-history') !== null) history.returnRemoteState();

});



