$(function() {
    var updateFilters = function (url){
        var queryArray = url.split("=")[1].split(",");
        var queryObjArray = [];
        if(queryArray.length > 0){
            for(var index in queryArray){
                var obj = queryArray[index];
                var queryObj = {};
                var queryObjValue = [];
                queryObj.queryKey = obj.split(":")[0].split('\"').join('');
                if(obj.indexOf("(") > -1){
                    var newObj = obj.split(":")[1].split('\"').join('').replace("(", "").replace(")", "");
                    queryObjValue = newObj.split("OR");
                } else {
                    if(obj.indexOf(":") > -1){
                        queryObjValue.push(obj.split(":")[1].split('\"').join(''));
                    }
                }
                queryObj.queryValue = queryObjValue;
                queryObjArray.push(queryObj);
            }


            for(var i in queryObjArray){
                $('#categorization :checkbox').each(function() {
                    var $this = $(this);
                    if($this.attr('name') == queryObjArray[i].queryKey){
                        for(var k in queryObjArray[i].queryValue){
                            if($this.attr('value') == queryObjArray[i].queryValue[k].trim()){
                                $this.attr('checked', true);
                                $("#"+$this.attr('name')).collapse('show');
                                var icon = $("#"+$this.attr('name')).prev().find('.status').children();
                                icon.removeClass('fw-down');
                                icon.addClass('fw-up');
                            }
                        }
                    }
                });
            }
        }
    };

    var search = function (searchQuery, data, isRemove) {
        var url;

        var encodedQueryString = getEncodedQueryString(searchQuery);
        currentPage = 1;
        if (store.asset) {
            if(window.location.href.indexOf("q=") > -1){
                if(!isRemove){
                    if(window.location.href.split("=")[1] !== ""){
                        if(window.location.href.indexOf(searchQuery.split(":")[0]) > -1){
                            url = removeURLParameter(decodeURIComponent(window.location.href),
                                data, true);
                            if(url.split("q=")[1] !== ""){
                                url = url + "%2C" + encodedQueryString;
                            } else {
                                url = url + encodedQueryString;
                            }
                        } else {
                            url = window.location.href + "%2C" + encodedQueryString;
                        }
                    } else {
                        url = window.location.href + encodedQueryString;
                    }
                } else {
                    url = removeURLParameter(decodeURIComponent(window.location.href), data, false);
                }

            } else {
                url = caramel.tenantedUrl('/assets/' + store.asset.type + '/list?' + buildParams(encodedQueryString));
            }

            loadAssets(url);
        }

        $('.search-bar h2').find('.page').text(' / Search: "' + searchQuery + '"');
    };

    var buildParams = function (query) {
        return 'q=' + query;
    };

    var getEncodedQueryString = function (searchQuery) {
        var q = {};
        var output = '';
        if(searchQuery !== ''){
            q = parseUsedDefinedQuery(searchQuery);
            q = JSON.stringify(q);
            q = q.replace('{','').replace('}', '');
            q = encodeURIComponent(q);
            output =q;
        }
        return output;
    };

    var triggerEvent = function (data, isRemove){
        var searchQueryString = data.parent + ":" + data.text;

        if((window.location.href.indexOf(data.parent) > -1) && !isRemove){
            searchQueryString = updateORQuery(window.location.href, data);
        }
        search(searchQueryString, data, isRemove);
    };

    var updateORQuery = function (url, data) {
        var value = getParamValue(url, data.parent).trim();
        var updatedQuery = "";
        if(value.indexOf("(") > -1){
            updatedQuery = data.parent + ":(" + value.substring(value.indexOf("\"(")+2, value.indexOf(")\"")) + " OR "
                + data.text + ")";
        } else {
            value = "\"" + value.split("\"").join("").trim() + "\"";
            updatedQuery = data.parent + ":(" + value.replace("\"", "").replace("\"", "") + " OR " + data.text + ")";
        }
        return updatedQuery;
    };

    var removeURLParameter = function(sourceURL, data, removeWhole) {
        var rtn = sourceURL.split("?")[0],
            param,
            params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[1];
                var innerParams = param.split(",");
                for(var j= innerParams.length -1; j >= 0; j -= 1){
                    if(innerParams[j].indexOf(data.parent) > -1){
                        if((innerParams[j].indexOf("OR") > -1) && !removeWhole){
                            var currValues = innerParams[j].substring(innerParams[j].indexOf("\"(")+2,
                                innerParams[j].indexOf(")\"")).split("OR");
                            for(var n in currValues){
                                if(data.text == currValues[n].trim()){
                                    currValues.splice(n, 1);
                                }
                            }
                            if(currValues.length > 1){
                                innerParams[j] = "\"" + data.parent + "\":\"(" +
                                    currValues.map(Function.prototype.call, String.prototype.trim).join(" OR ").trim()
                                    + ")\"";
                            } else {
                                innerParams[j] = "\"" + data.parent + "\":\"" + currValues.join("").trim() + "\"";
                            }

                        } else {
                            innerParams.splice(j, 1);
                        }
                    }
                }
                params_arr[i] = params_arr[i].split("=")[0] + "=" + encodeURIComponent(innerParams.join(","));
            }
            rtn = rtn + "?" + params_arr.join("&");
        }
        return rtn;
    };

    var getParamValue = function(sourceURL, key) {
        var param,
            params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[1];

                var innerParams;
                if(param.indexOf(",") > -1){
                    innerParams = param.split(",");
                } else {
                    innerParams = param.split("%2C");
                }
                for(var j= innerParams.length -1; j >= 0; j -= 1){
                    if(innerParams[j].indexOf(key) > -1){
                        return decodeURIComponent(innerParams[j]).split(":")[1];
                    }
                }
            }
        }
    };

    var formatSearchQuery = function(query){
        var searchQuery = "";
        var qjson = JSON.parse('{' + query + '}');
        var searchKeys = Object.keys(qjson);
        if ((searchKeys.length === 1) && (searchKeys.indexOf("name") >= 0)) {
            searchQuery += qjson[searchKeys.pop()];
        }
        else {
            for (var keyIndex in searchKeys) {
                var key = searchKeys[keyIndex];
                var value = qjson[key];
                searchQuery += key + ":" + value + " ";
            }
        }
        searchQuery = searchQuery.trim();
        return searchQuery;
    };

    var loadAssets = function(url){
        $('.assets-container section .ctrl-wr-asset').remove();
        history.pushState("", "", url);
        resetPageAttributes();
        store.infiniteScroll.addItemsToPage();

        var searchQuery =  url.split("q=")[1];
        $('#search').val(formatSearchQuery(decodeURIComponent(searchQuery)));
    };

    var resetPageAttributes = function(){
        store.rows_added = 0;
        store.last_to = 0;
        store.items_per_row = 0;
        store.doPagination = true;
        store.firstRun = false;
        store.infiniteScroll.recalculateRowsAdded();
    };

    $('#categorization :checkbox').click(function() {
        var $this = $(this);
        var data = {};
        data.parent = $this.attr('name');
        data.text = $this.attr('value');
        // $this will contain a reference to the checkbox
        if ($this.is(':checked')) {
            // the checkbox was checked
            triggerEvent(data, false);
        } else {
            // the checkbox was unchecked
            triggerEvent(data, true);
        }
    });

    $('div[data-toggle="collapse"]').on('click',function(){
        var objectID=$(this).attr('href');
        var icon = $(objectID).prev().find('.status').children();

        if($(objectID).hasClass('in'))
        {
            $(objectID).collapse('hide');
            icon.removeClass('fw-up');
            icon.addClass('fw-down');
        }

        else{
            $(objectID).collapse('show');
            icon.removeClass('fw-down');
            icon.addClass('fw-up');
        }
    });

    var url = decodeURIComponent(window.location.href);
    if(url.indexOf("=") > -1){
        var query = url.split("=");
        if(query[1] !== ""){
            updateFilters(url);
        }
    }

});
