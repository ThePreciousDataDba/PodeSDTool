function copyLinkToClipboard(passedElement) {
	var range = document.createRange();
	range.selectNode(passedElement);
	console.log(passedElement);
	window.getSelection().removeAllRanges(); // clear current selection
	window.getSelection().addRange(range); // to select text
	document.execCommand("copy");
	window.getSelection().removeAllRanges();// to deselect
}

function parseDescriptionHTML(htmlString,uniqueID){
	return (htmlString).replace(/<\s*blockquote[^>]*>/gi,'<blockquote class="font-italic fw-sm bg-faded border border-top-0 border-right-0 border-bottom-0 p-3">')
			.replace(/(<\/b><br \/><\/div>)/gi,'</b></div>')
			.replace(/(<div><br \/><\/div>){2,2}/gi,'<br>')
			.replace(/(?<=\/WorkOrder\/)\d{5}/gi,requestData.request.id)
			.replace(/<p><\/p>/gi,"")
			.replace(/((<div[^>]*>)(Category : ).*)/gi,"<div class='accordion accordion-outline' id='unique_accordion_id'><div class='card'><div class='card-header'><a href='javascript:void(0);' class='card-title' data-toggle='collapse' data-target='#unique_accordion_id-a' aria-expanded='false'><i class='fal fa-file-medical-alt width-2 fs-xl'></i>Previous replies in this post...<span class='ml-auto'><span class='collapsed-reveal'><i class='fal fa-minus fs-xl'></i></span><span class='collapsed-hidden'><i class='fal fa-plus fs-xl'></i></span></span></a></div><div id='unique_accordion_id-a' class='collapse' data-parent='#unique_accordion_id'><div class='card-body'>$1</div></div></div></div>")
			.replace(/unique_accordion_id/gi,"accordion_"+uniqueID);
}

var substringMatcher = function(adObjects) {
	return function findMatches(searchTerm, cb) {
		var matches, substrRegex;

		matches = [];

		var searchTermArray = searchTerm.trim().split(RegExp('[, _\-]{1,2}'),2);
		if(searchTermArray.length > 1) {
			substrRegex = new RegExp(searchTermArray[0]+"([ ,_]*).*"+searchTermArray[1], 'i');
		}else{
			substrRegex = new RegExp(searchTerm.trim(), 'i');
		}

		$.each(adObjects, function(i, adObj) {
			if (
					substrRegex.test(adObj.Name) ||
					substrRegex.test(adObj.Displayname) ||
					substrRegex.test(adObj.EmployeeID) ||
					substrRegex.test(adObj.Email) ||
					substrRegex.test(adObj.FirstName + adObj.LastName) ||
					substrRegex.test(adObj.LastName + adObj.FirstName) ||
					substrRegex.test(adObj.LogonName)
				){
				matches.push(adObj);
			}
		});

		cb(matches);
	};
};

function getUserID(searchTerm) {
	var userID = "";

	function callReturn(matches){
		if(matches.length == 0){
			console.log("getUserID for "+searchTerm+" returned no results.");
			return "";
		}

		if(matches.length > 1){
			console.log("getUserID for "+searchTerm+" returned more than 1 result. Selecting first result.");
			console.log(matches);
		}

		userID = matches[0].LogonName;
	};

	substringMatcher(adCacheUsers)(searchTerm, callReturn);
	return userID;
}

function setupQuickSearch (){
	$('#mainUserSearch').typeahead({
		highlight: true,
		hint: false,
		minLength: 2
	}, {
		name: 'value',
		displayKey: 'LogonName',
		source: substringMatcher(adCacheUsers),
		templates: {
			empty: [
				'<div class="dropdown-item">',
				'Unable to find user in AD',
				'</div>'
			].join('\n'),
			suggestion: function(data){
				return userSearchDD_template(data);
			}
		}
	});
};

function removeOnClick(passedElement){
	$(passedElement).removeAttr('onclick');
}

function initializeNotes(storageName,divID){
	//$('#summernote').summernote('focus');
	var interval;
	var timer = function(){
		interval = setInterval(function(){
			saveToLocal();
			clearInterval(interval);
		}, 200);
	};

	storageName = "summernoteData-"+storageName;

	var saveToLocal = function(){
		localStorage.setItem(storageName, $('#'+divID).summernote("code"));
	}

	var removeFromLocal = function(){
		localStorage.removeItem(storageName);
		$('#'+divID).summernote('reset');
	}

	$(document).ready(function(){
		$('.js-summernote').summernote({
			height: 200,
			tabsize: 4,
			placeholder: "Type notes here...",
			dialogsFade: true,
			toolbar: [
				['style', ['style']],
				['font', ['strikethrough', 'superscript', 'subscript']],
				['font', ['bold', 'italic', 'underline', 'clear']],
				['fontsize', ['fontsize']],
				['fontname', ['fontname']],
				['color', ['color']],
				['para', ['ul', 'ol', 'paragraph']],
				['height', ['height']],
				['table', ['table']],
				['insert', ['link', 'picture', 'video']],
				['view', ['fullscreen', 'codeview', 'help']]
			],
			hint:{
				mentions: substringMatcher(adCacheUsers),
				match: /\B@(\w.{2,})$/,
				search: function(keyword, callback){
					this.mentions(keyword,callback);
				},
				content: function(item){
					return $('<span><a href="#page_profile.html?userID='+item["LogonName"]+'" class="text-info">@'+item["FirstName"]+' '+item["LastName"]+'</a>&nbsp;</span>')[0];
				}
			},
			callbacks:{
				onInit: function(e){
					$('.js-summernote').summernote("code", localStorage.getItem(storageName));
				},
				onChange: function(contents, $editable){
					clearInterval(interval);
					timer();
				}
			}
		});
	});
}
