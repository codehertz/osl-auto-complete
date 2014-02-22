/*
$.oslAutoComplete({
    "element" : $("#input"),              //required
    "relatived" : $("#input").parent(),   //required
    "realm" : ["city","university","landlord","property"], //required ["city","university","landlord","property"]
    "showNum" : true,                     //default true
    "includingZero" : false,              //default false
    "clicked" : function(element) {},     //
    "cleared" : function() {},            //
    "top" : 30,                           //default 30 (px)
    "left" : 0,                           //default 0
    "width" : 300,                        //default same as element
    "delay" : 500,                        //default 500 (ms)
    "before" : function(xhr){},           //invoked before ajax post
    "after" : function(){}                //invoked after ajax success
});
*/

(function($){
    $.oslAutoComplete = function(options){
        var timeoutId, ul, cursorId=-1;

        options.element.keydown(function(e){

            clearTimeout(timeoutId);

            if (ul != undefined && ul.css("display") != "none" && (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 27)) {
                e.preventDefault();

                if (e.keyCode == 27) {
                    clearUl();
                    return true;
                }

                var originalId = cursorId;
                if (e.keyCode == 38) {
                    cursorId -= 1;
                } else if (e.keyCode == 40) {
                    cursorId += 1;
                }

                var children = ul.children("li.ac-row");

                if (e.keyCode == 13) {
                    $(children[originalId]).trigger("click");
                    return true;
                }

                var childrenLength = children.length;

                if (cursorId < 0) {
                    cursorId = 0;
                } else if (cursorId > (childrenLength - 1)) {
                    cursorId = childrenLength - 1;
                }

                if (children[originalId] != undefined) {
                    $(children[originalId]).removeClass("ac-row-hover");
                }
                $(children[cursorId]).addClass("ac-row-hover");

                return true;
            }

            timeoutId = setTimeout(search, (options.delay == undefined ? 500 : options.delay));
        });

        function search() {

            var query = options.element.val();
            if (query.length == 0) {
                clearUl();
                return true;
            }

            $.ajax({
                "url" : "/ajax/searchsuggestion",
                "type" : "post",
                "dataType" : "json",
                "data" : {
                    "q" : query,
                    "f" : options.realm.join(","),
                    "e" : !options.includingZero
                },
                "success" : searchSuccess,
                "beforeSend" : (typeof options.before == "function") ? options.before : function(xhr){}
            });
        }

        function searchSuccess(responseJSON) {
            if (responseJSON.status != "ok") {
                return true;
            }

            ul = $(".osl-ac-rows", options.relatived);
            if (ul.length == 0) {
                ul = $("<ul/>");
                ul.addClass("osl-ac-rows");
                ul.css({"position" : "absolute"});
                options.relatived.append(ul);
            } else {
                ul.html("");
            }

            ul.css({
                "width" : (options.width == undefined ? options.element.outerWidth() + "px" : options.width + "px"),
            	"top" : (options.top == undefined ? "30px" : options.top + "px"),
                "left" : (options.left == undefined ? "0" : options.left + "px")
            })

            options.realm.forEach(function(realm){
                buildUl(realm, responseJSON);
            });

            ul.scrollTop(0).show();

            if (typeof options.after == "function") {
                options.after();
            }
        }

        function buildUl(realm, responseJSON) {

            if (realm == "property") {
                var propertyLength = responseJSON.result.property.length;
                if (propertyLength > 0) {
                    var caption = createLiCaption("Property");
                    caption.addClass("ac-row-landlords");
                    ul.append(caption);

                    for (var i=0;i<propertyLength;i++) {
                        var ob = responseJSON.result.property[i];
                        var li = createLi(ob.name, undefined, "property", ob.id, ob.href);
                        ul.append(li);
                    }
                }
            } else if (realm == "city") {
                var cityLength = responseJSON.result.city.length;
                if (cityLength > 0) {
                    var caption = createLiCaption("Cities");
                    caption.addClass("ac-row-cities");
                    ul.append(caption);

                    for (var i=0;i<cityLength;i++) {
                        var ob = responseJSON.result.city[i];
                        var li = createLi(ob.name, ob.num, "city", ob.id, ob.href);
                        ul.append(li);
                    }
                }
            } else if (realm == "university") {
                var universityLength = responseJSON.result.university.length;
                if (universityLength > 0) {
                    var caption = createLiCaption("Universities");
                    caption.addClass("ac-row-universities");
                    ul.append(caption);

                    for (var i=0;i<universityLength;i++) {
                        var ob = responseJSON.result.university[i];
                        var li = createLi(ob.name, ob.num, "university", ob.id, ob.href);
                        ul.append(li);
                    }
                }
            } else if (realm == "landlord") {
                var landlordLength = responseJSON.result.landlord.length;
                if (landlordLength > 0) {
                    var caption = createLiCaption("Landlords");
                    caption.addClass("ac-row-landlords");
                    ul.append(caption);

                    for (var i=0;i<landlordLength;i++) {
                        var ob = responseJSON.result.landlord[i];
                        var li = createLi(ob.name, ob.num, "landlord", ob.id, null);
                        ul.append(li);
                    }
                }
            }
        }

        function createLiCaption(name) {
            var li = $("<li/>");
            li.addClass("ac-row-label");
            li.append("<span class=\"icon\"/>");
            li.append("<span class=\"name\">"+name+"</span>");
            return li;
        }

        function createLi(name, num, caption, id, href) {
            var li = $("<li/>");
            li.attr({
                "data-caption" : caption,
                "data-id" : id,
                "data-href" : href
            });
            li.addClass("ac-row");
            li.append("<span class=\"name\">"+name+"</span>");
            if (options.showNum && num != undefined) {
                li.append("<span class=\"num\">"+num+"</span>");
            }
            li.click(function(e){
                e.preventDefault();
                options.element.val(name);
                if (typeof options.clicked == "function") {
                    options.clicked($(this));
                }
                clearUl();
            });
            return li;
        }

        function clearUl() {
            if (ul != undefined) ul.scrollTop(0).hide();
            if (typeof options.cleared == "function")  {
                options.cleared();
            }
        }
    };
}(jQuery));