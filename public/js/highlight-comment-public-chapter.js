$(function () {
	
		//console.log(highlight_vars);
		var myHighlighter;
		$(".entry-content").attr('id', 'highlighter_content');
		var my_content = document.getElementById('highlighter_content');

		//not correctly loading data on page forward or backwards TODO improve
		if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
			console.warn('Got here using the browser "Back" or "Forward" button.');
			location.reload();
		}
	
		$(document).ready(function () {
			if (highlight_vars.settings.indexOf("false") != -1) {
				console.log("highlighter deactivated");
				return;
			}

			setupHighlighter();

			//add invidible marker div
			$(".entry-content").append("<div id='highlight_marker'><img src='" + highlight_vars.media_url + "marker-icon.png" + "'></div>");

			$("#highlight_marker").click(function (e) {
				e.preventDefault();
				myHighlighter.doHighlight();
				$("#highlight_marker").hide();
				return false;
			});
            
            
            //scroll to highlight reference
            if(getUrlParameter('highlight_ref') != undefined){
                console.log("scroll to highlight");
                var scroll_highlight = $("[data-timestamp='"+getUrlParameter('highlight_ref')+"']")[0];
                
                
                window.location.hash = "test";
                //var subchapter_id = 
                
                $('html, body').animate({
                    scrollTop: $(scroll_highlight).offset().top
                }, 500);
            }
            
		});

		function setupHighlighter() {


			myHighlighter = new TextHighlighter(my_content, {
				onAfterHighlight: function (arr, element) {
					afterHighlight(arr, element);
				}
			});

			my_content.addEventListener("mouseup", newSelectionDesktop);
			my_content.addEventListener("touchend", newSelectionMobil);

			loadStoredHighlights();
		}

		function newSelectionDesktop(event) {
			//console.log("newSelection");

			var selection = getSelectionRange();
			//event.which = 1 for left button
			if (selection.rangeCount > 0 && event.which == 1) {
				var range = selection.getRangeAt(0);

				if (range.startOffset != range.endOffset || range.startContainer != range.endContainer) {
					var height = $("#highlight_marker").height();
					var width = $("#highlight_marker").width();

					var left = (event.clientX - width / 2) + "px";
					var top = (event.clientY - height / 2) + "px";

					$("#highlight_marker").css({
						'top': top,
						'left': left
					});
					$("#highlight_marker").show();

					event.stopPropagation();
					return;
				}
			}
			$("#highlight_marker").hide();
		}

		function newSelectionMobil() {
			myHighlighter.doHighlight();
		}

		function getSelectionRange() {
			var range = null;
			if (window.getSelection) {
				range = window.getSelection();
			} else if (document.selection && document.selection.type != "Control") {
				range = document.selection.createRange();
			}
			return range;
		}

		function afterHighlight(arr, element) {
			//console.log(element);
			var respectiveTimestamp = element[0].outerHTML.split("data-timestamp=")[1].split("\"")[1];
            
            var subchapter_id = $(element).parent().prev('.in-list').attr('id');
            
            $(element).data('subchapter', subchapter_id);

			doMarkup(respectiveTimestamp);

			storeHighlights();
		}

		function removeHighlight(timestamp) {
			$("span[data-timestamp='" + timestamp + "']").find("a.delete_highlight").remove();
			$("span[data-timestamp='" + timestamp + "']").contents().unwrap();
			storeHighlights();
		}

		function loadStoredHighlights() {
			//console.log(highlight_vars.highlight_data);
			myHighlighter.deserializeHighlights(highlight_vars.highlight_data);

			var all_timestamps = Array();
			$("span.highlighted").each(function (i, element) {
				if ($.inArray($(element).data("timestamp"), all_timestamps) == -1) {
					all_timestamps.push($(element).data("timestamp"));
				}
			});

			$.each(all_timestamps, function (i, value) {
				doMarkup(value);
			});

		}

		function storeHighlights() {
			//replace escapted \" because php removes those
			var serializedHighlights = myHighlighter.serializeHighlights().replace(/\\"/g, "'");

			//console.log(serializedHighlights);

			var data = {
				'action': 'highlight_save_highlights',
				'progNonce': highlight_vars.ajax_nonce,
				'book_id': highlight_vars.book_id,
				'chapter_id': highlight_vars.chapter_id,
				'highlight_data': serializedHighlights
			};

			//console.log(data);

			jQuery.post(highlight_vars.ajax_url, data, function (response) {
				//console.log(response);
				if (response <= 0) {
					console.warn("failed to save");
					console.log(data);
					console.log(response);
				}
			});
		}

		function doMarkup(timestamp) {
			$("span[data-timestamp='" + timestamp + "']").hover(function () {
				$("span[data-timestamp='" + timestamp + "']").addClass("hover");
				$("span[data-timestamp='" + timestamp + "'] a.delete_highlight").removeClass("hidden");
			}, function () {
				$("span[data-timestamp='" + timestamp + "']").removeClass("hover");
				$("span[data-timestamp='" + timestamp + "'] a.delete_highlight").addClass("hidden");
			});

			$("span[data-timestamp='" + timestamp + "'] a.delete_highlight").remove();

			$("span[data-timestamp='" + timestamp + "']").last().append("<a class='delete_highlight hidden' alt='Delete'><div><img src='" + highlight_vars.media_url + "minus.png" + "'></div></a>");

			$("span[data-timestamp='" + timestamp + "']").last().find("a.delete_highlight").click(function (e) {
				e.preventDefault();
				removeHighlight(timestamp);
				return false;
			});
		}

		//helper functions 
		Array.prototype.last = function () {
			return this[this.length - 1];
		}
        
        function getUrlParameter(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        };
});
