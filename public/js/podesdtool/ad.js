var adCacheGroups = {};
var adCacheComputers = {};
var adCacheUsers = {};

function loadADCache(){
	$.ajax({
		url: 'api/Cached_ADUsers.json',
		async: false,
		cache: true,
		dataType: 'json',
		success: function (response) {
			adCacheUsers = response;
		}
	});

	$.ajax({
		url: 'api/Cached_ADGroups.json',
		async: false,
		cache: true,
		dataType: 'json',
		success: function (response) {
			adCacheGroups = response;
		}
	});

	$.ajax({
		url: 'api/Cached_ADComputers.json',
		async: false,
		cache: true,
		dataType: 'json',
		success: function (response) {
			adCacheComputers = response;
		}
	});
}

function refreshCache(){
	toastr["info"]("AD Cache is a locally stored file that allows for live searches of Active Directory objects. Should be refreshed once a day or when needed.", "Refreshing AD Cache");
	toastr.options = {
	  "closeButton": false,
	  "debug": false,
	  "newestOnTop": true,
	  "progressBar": true,
	  "positionClass": "toast-top-right",
	  "preventDuplicates": true,
	  "onclick": null,
	  "showDuration": 300,
	  "hideDuration": 200,
	  "timeOut": 25000,
	  "extendedTimeOut": 5000,
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
	};

	$.ajax({
		url: 'api/adp/refreshCache',
		success : function(response) {
			toastr.options = {
				"closeButton": false,
				"debug": false,
				"newestOnTop": true,
				"progressBar": true,
				"positionClass": "toast-top-right",
				"preventDuplicates": true,
				"onclick": null,
				"showDuration": 300,
				"hideDuration": 200,
				"timeOut": 5000,
				"extendedTimeOut": 3000,
				"showEasing": "swing",
				"hideEasing": "linear",
				"showMethod": "fadeIn",
				"hideMethod": "fadeOut"
			};

			$.ajax({
				url: 'api/Cached_ADUsers.json',
				dataType: 'json',
				success: function (response) {
					setupQuickSearch();
					adCacheUsers = response;
					toastr["success"]("The AD Cache users file has been refreshed.", "AD Cache Complete")
				},
				error : function(request,error){
					toastr["warning"]("Failed to load AD Cache users file.", "AD Cache Error")
				}
			});

			$.ajax({
				url: 'api/Cached_ADGroups.json',
				async: false,
				dataType: 'json',
				success: function (response) {
					adCacheGroups = response;
					toastr["success"]("The AD Cache groups file has been refreshed.", "AD Cache Complete")
				},
				error : function(request,error){
					toastr["warning"]("Failed to load AD Cache groups file.", "AD Cache Error")
				}
			});

			$.ajax({
				url: 'api/Cached_ADComputers.json',
				async: false,
				dataType: 'json',
				success: function (response) {
					adCacheComputers = response;
					toastr["success"]("The AD Cache compuers file has been refreshed.", "AD Cache Complete")
				},
				error : function(request,error){
					toastr["warning"]("Failed to load AD Cache compuers file.", "AD Cache Error")
				}
			});
		},
		error : function(request,error){
			toastr["error"](("The Refresh AD Cache function has encountered an error. ... "+request.responseText), "AD Cache Error")

			toastr.options = {
			  "closeButton": false,
			  "debug": false,
			  "newestOnTop": true,
			  "progressBar": true,
			  "positionClass": "toast-top-right",
			  "preventDuplicates": true,
			  "onclick": null,
			  "showDuration": 300,
			  "hideDuration": 200,
			  "timeOut": 10000,
			  "extendedTimeOut": 5000,
			  "showEasing": "swing",
			  "hideEasing": "linear",
			  "showMethod": "fadeIn",
			  "hideMethod": "fadeOut"
			}
		}
	});

}

function loadUserData(userName){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		cache:true,
		async:false,
		url: "api/adp/user",
		data:JSON.stringify({
			user: userName,
			mode: "loginID"
		}),
		success : function(response) {
			// Format/change/create new properties from the fetched AD data.
			response["accountStatus"] = (response["userAccountControl"] == 512) ? "Yes" : "No";
			const dateValues = ["whenChanged","whenCreated","PasswordLastSet","LastLogonDate"];

			dateValues.forEach(adDate => {
				if(response[adDate] != null){
					var date = new Date(parseInt((response[adDate].substring(6, 19))));
					response[adDate] = (date.toDateString());
				}
			});

			$("#userCard_"+userName+" .card-body").html(userCardTemplate(response));
			//$("#ticket_rightColumn").append();
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function groupMembership(userID){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: "api/adp/userGroupsRecursive",
		data:JSON.stringify({
			user: userID,
			rngDontCacheMeBro: Math.random()
		}),
		success: function(response) {
			var nestedGroupsHTML = "";

			function GetGroupNames(parentGroup,titleText,searchableData){
				var objectTitle = {
					"title": titleText,
					"searchStrings": searchableData.toLowerCase()
				};
				nestedGroupsHTML += nestItemTemplate(objectTitle);
				if(Object.keys(parentGroup).length > 0){
					nestedGroupsHTML += "<ul>";
					Object.keys(parentGroup).sort().forEach(function(selectedObject){
						GetGroupNames(parentGroup[selectedObject],selectedObject,(searchableData + " " + selectedObject));
					});
					nestedGroupsHTML += "</ul>";
				}else{
					nestedGroupsHTML += "</li>";
				};
			};

			Object.keys(response).sort().forEach(function(selectedObject){
				GetGroupNames(response[selectedObject],selectedObject, selectedObject);
			});

			$("#"+userID+"_list").html(nestedGroupsHTML);
			initApp.listFilter($("#"+userID+"_list"), $("#"+userID+"_list_filter"));
			initApp.buildNavigation($("#"+userID+"_list"));
		},
		error: function(request,error){
			console.log(request);
		}
	});
};

function fetchADUser(userName,searchMethod){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		cache:false,
		url: "api/adp/user",
		data:JSON.stringify({
			user: decodeURIComponent(userName),
			mode: searchMethod,
			rngDontCacheMeBro: Math.random()
		}),
		success : function(response) {
			userData = response;
			// Format/change/create new properties from the fetched AD data.
			userData["accountStatus"] = (userData["userAccountControl"] == 512) ? "Yes" : "No";
			const dateValues = ["whenChanged","whenCreated","PasswordLastSet","LastLogonDate"];
			loginID = userData["displayName"];
			displayName = userData["displayName"];

			dateValues.forEach(adDate => {
				if(response[adDate] != null){
					var date = new Date(parseInt((response[adDate].substring(6, 19))));
					response[adDate] = (date.toDateString());
				}
			});

			document.getElementById("debugResponse").value = JSON.stringify(userData, null, 2);

			$("#profileLeftCard").html(leftCardTemplate(userData));

			$("#userProperties").html(propertiesTemplate(userData));

			initializeNotes();
			groupMembership();//Get recursive group membership
			userTickets();//Load the recent user tickets
		},
		error : function(request,error){
			console.log(request);
			$("#js-page-content").html(request.responseText);
		}
	});
};


function openUserCardModal(userName){
	var cardID = "userCard_"+userName;

	if($("#modalCards > div").closest('#'+cardID).length === 0) {
		var cardDetails = {
			id: cardID,
			index: $("#modalCards > div").length,
			userID: userName
		};

		$("#modalCards").append(modalCardTemplate(cardDetails));
		$("#js-msgr-listfilter").append(objectListTemplate(cardDetails));

		$('#'+cardID).modal({
			backdrop: false,
			show: true
		});

		$('#'+cardID).on('shown.bs.modal', function() {
			$(document).off('focusin.modal');
		});

		$('.multiModal').draggable({
			handle: ".card-header",
			stack: ".multiModal",
			//containment: "#modalCards",
			scroll: false
		});

		loadUserData(userName);
	}else{
		$("#modalCards > div").closest('#'+cardID).modal({
			backdrop: false,
			show: true
		});
	}

	$('body').removeClass('modal-open');
	$('body').removeAttr('style');
}
