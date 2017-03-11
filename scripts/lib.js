function BDCLib(){
    var _store = {
        cache: {},
        favorite: {},
        cmpWords: {
            'breakfast': true,
            'parking': true,
            'bathroom': true
        }
    };
    var _getCache = function(url){
        if(_store.cache[url]){
            return _store.cache[url];
        }
        return null;
    };
    var _putCache = function(url, content){
        if(content){
            _store.cache[url] = content;
        }
    };
    var _debug = function(){
        var arr = Array.prototype.slice.call(arguments);
        arr.unshift('libDebug');
        console.log.apply(null, arr);
    };

    var exports = {};
    exports.requestBookingDotCom = function(method, params, cb){
        var url = 'https://distribution-xml.booking.com/json/bookings.' + method + '?';
        params = Object.assign({
            languagecode: 'en',
            rows: '1000'
        }, params);
        for(var key in params){
            url += key + '=' + encodeURIComponent(params[key]) + '&';
        }
        
        _debug('curl', url, $.ajax);
    
        var cacheData = _getCache(url);
        if(cacheData){
            _debug('use cache');
            cb(cacheData);
            return;
        }
    
        $.ajax({
            url: url,
            dataType: "json",
            beforeSend: function(xhr){
                xhr.setRequestHeader("Authorization", "Basic " + btoa("hacker234:8hqNW6HtfU"));
            }
        }).done(function(data){
            _putCache(url, data);
            cb(data);
        });
    }
    
    exports.getHotelInfo = function(hotelId, cb){
        exports.requestBookingDotCom('getHotels',
            {
                hotel_ids: hotelId,
                show_facilities: '1',
                show_hotel_center: '1',
                show_hotel_themes: '1',
                show_languages_spoken: '1',
                show_review_score_word: '1',
                show_timezone: '1'
            }, function(data){
                if(data[0]){
                    exports.requestBookingDotCom('getHotelDescriptionPhotos', {
                        hotel_ids: hotelId
                    }, function(photoData){
                        data[0].photos = photoData;
                        cb(data);
                    });
                }
            });
    };
    
    exports.getHotelReviews = function(hotelId, cb){
        exports.requestBookingDotCom('getBookingcomReviews',
            {
                hotel_ids: hotelId,
                show_review_score_word: '1'
            }, cb);
    };

    exports.getHotelKeywordReviews = function(hotelId, queryArray, cb){
        exports.getHotelReviews(hotelId, function(reviews){
            var results = {
                hotelId: hotelId,
                data: []
            };
            var getKeywordReview = function(query){
                var result = {
                    score: 0,
                    pros: [],
                    cons: []
                };
                var fieldProfile = {
                    pros: 1,
                    cons: -1
                };
                var isMatchKeyword = function(text, query){
                    // simple version
                    //var re = new RegExp(query, 'i');
                    //return !!text.match(re);
                    
                    // apply Porter stemming algorithm
                    var textTokens = text.split(/[^\w]/).filter(function(s){return s;}).map(function(s){return stemmer(s);});
                    var queryTokens = query.split(/[^\w]/).filter(function(s){return s;}).map(function(s){return stemmer(s);});
                    for(var i = 0; i < textTokens.length; i++){
                        for(var j = 0; j < queryTokens.length; j++){
                            if(textTokens[i] === queryTokens[j]){
                                return true;
                            }
                        }
                    }
                    return false;
                };
                var review;
                var ageYears;
                var ageMs;
                var now = new Date();
                var matchedReviewCount = 0;
                for(var i = 0; i < reviews.length; i++){
                    review = reviews[i];
                    for(var field in fieldProfile){
                        if(review[field] && isMatchKeyword(review[field], query)){
                            matchedReviewCount++;
                            result[field].push({
                                text: review[field],
                                date: review.date,
                                title: review.headline,
                                author: review.author
                            });
                            ageMs = now.getTime() - (new Date(review.date)).getTime();
                            ageYears = (ageMs === 0 ? 1 : ageMs) / (86400000 * 365);
                            result.score += fieldProfile[field] / ageYears;
                        }
                    }
                }
                if(matchedReviewCount !== 0){
                    result.score /= matchedReviewCount;
                }
                else{
                    result.score = false;
                }
                return result;
            };
            if(typeof queryArray === 'string'){
                queryArray = [queryArray];
            }
            var review;
            for(var i = 0; i < queryArray.length; i++){
                review = getKeywordReview(queryArray[i]);
                review.query = queryArray[i];
                results.data.push(review);
            }
            cb(results);
        });
    };
    
    exports.debug = function(){
        //exports.getHotelInfo('725241', function(data){_debug('get info', data)});
        //exports.getHotelReviews('725241', function(data){_debug('get reviews', data)});

        // cache test
        //setTimeout(function(){
        //    exports.getHotelInfo('725241', function(data){_debug('get info', data)});
        //    exports.getHotelReviews('725241', function(data){_debug('get reviews', data)});
        //}, 5000);
        //
        
        // favorite hotel test
        //exports.addFavoriteHotel('725241', function(){
        //    _debug('favorite list:', exports.getFavoriteHotels());
        //    exports.removeFavoriteHotel('725241');
        //    _debug('favorite list:', exports.getFavoriteHotels());
        //});

        //exports.getHotelKeywordReviews('725241', 'breakfast', function(data){_debug('keyword review', data);});

        //福華
        //exports.getHotelKeywordReviews('270817', 'breakfast', function(data){_debug('keyword review', data);});
        //喜來登
        //exports.getHotelKeywordReviews('334583', 'breakfast', function(data){_debug('keyword review', data);});
        //exports.getHotelKeywordReviews('334583', ['breakfast', 'dinner', 'bed'], function(data){_debug('keyword review', data);});
        //
        // Burj Al Arab Jumeirah（阿拉伯塔朱美拉酒店）
        exports.getHotelKeywordReviews('73052', ['breakfast', 'dinner', 'bed', 'parking', 'staff', 'restaurants', 'location', 'facilities', 'waiting', 'spa', 'swimming', 'cost', 'bathroom', 'wi-fi', 'coffee', 'atmosphere', 'air-conditioning'], function(data){_debug('keyword review', data);});

        // stemmer 
        // Porter stemming algorithm. https://www.npmjs.com/package/stemmer
        //_debug(stemmer('considerations'));

        // Canal House Suites at Sofitel Legend The Grand Amsterdam 
        //exports.getHotelKeywordReviews('1279339', 'breakfast', function(data){_debug('keyword review', data);});
        // Crane Hotel Faralda
        //exports.getHotelKeywordReviews('1139273', 'breakfast', function(data){_debug('keyword review', data);});
    
        // keywords test    
        //exports.addComparisonKeyword('breakfast');
        //exports.addComparisonKeyword('kerker');
        //exports.addComparisonKeyword('sound');
        //exports.removeComparisonKeyword('kerker');
        //_debug('keyword', exports.getComparisonKeywords());
    };

    exports.addFavoriteHotel = function(hotelId, done){
        if(_store.favorite[hotelId]){
            _debug('warning: duplicate favorite hotel ID ' + hotelId);
            return false;
        }
        _store.favorite[hotelId] = true;
        exports.getHotelInfo(hotelId, function(data){
            _store.favorite[hotelId] = data;
            if(done){
                done(data);
            }
        });
        return true;
    };
    
    exports.removeFavoriteHotel = function(hotelId){
        if(!_store.favorite[hotelId]){
            _debug('warning: not found favorite hotel ID ' + hotelId);
            return false;
        }
        delete _store.favorite[hotelId];
        return true;
    };
    
    exports.getFavoriteHotels = function(){
        return _store.favorite;
    };
    
    exports.addComparisonKeyword = function(keyword){
        if(_store.cmpWords[keyword]){
            _debug('warning: duplicate cmpWords ' + keyword);
            return false;
        }
        _store.cmpWords[keyword] = true;
        return true;
    };
    
    exports.removeComparisonKeyword = function(keyword){
        if(!_store.cmpWords[keyword]){
            _debug('warning: not found cmpWords ' + keyword);
            return false;
        }
        delete _store.cmpWords[keyword];
        return true;
    };
    
    exports.getComparisonKeywords = function(){
        return Object.keys(_store.cmpWords);
    };
    
    return exports;
};
