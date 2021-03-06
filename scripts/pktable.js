// var PKCONST = {
//     hotelList: [],
//     kwList: []
// }

var TEMPLATE = {
    "CommentLi": ""
}

function generatePkTable(){
    $.get(chrome.extension.getURL('view/pktable.html'), function(data) {
        // $($.parseHTML(data)).appendTo('body');
    });
}

function commentPopupInit(){
    $.get(chrome.extension.getURL('view/popup-comment.html'), function(data) {
        $($.parseHTML(data)).appendTo('.pkoverall');
        TEMPLATE.CommentLi = $(".popup-contanier li:first-child").empty().clone(true);
    });

    console.log('popup init');
}

function setCommentPopup(obj, type, getX, getY){
    // var type = "pros"; // "pros" or "cons"
    console.log('obj', obj)
    var id = obj.closest("section").attr("id"),
        kw = [ obj.parent().parent().attr("class") ],
        hasContent = false;

    $(".popup-contanier ul").empty();
    lib.getHotelKeywordReviews(id, kw, function(data){
        var comments = data.data[kw][type];
        comments.forEach( function(ele, index) {
            hasContent = true;
            if (index > 5) {
                return;
            }
            var tmpcn = TEMPLATE.CommentLi.clone(true);
            var comment = ele.text;
            
            tmpcn.append('<i class="fa fa-comment-o fa-lg faComment" aria-hidden="true"></i>' + comment);
            $(".popup-contanier ul").append(tmpcn);
        });
    });

    if (hasContent) {
        $(".popup-contanier").css({
            'display': 'block',
            'position': 'fixed',
            'z-index': 300,
            'left': getX,
            'top': getY
        }).show();
    } else {
        $(".popup-contanier").hide();
    }
}


function giveMedal(winHotels, getKeywordList){
    getKeywordList.forEach( function(ele, ind) {
        var id = winHotels[ele].hotel;
        if (id != 0) {
            var img = chrome.extension.getURL("images/medal.png");
            var medal = "<img src='" + img + "' class='medal' width='30'>";

            if ($("#" + id)) {
                $("#" + id + " ." + ele).prepend(medal);
            }
        }
    });
}
