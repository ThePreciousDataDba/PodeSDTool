var SDPViews = {};
var SDPDetails = {};

function manageEngineSDPInit() {
	$.ajax({
		url: 'servlet/AJaxServlet?action=GetHeaderDetails',
		async: false,
		cache: true,
		contentType: "application/json",
		success: function (response) {
			SDPDetails = response;
			$('#meSDPUser').html(SDPDetails.user_details.USERNAME+"<br>"+SDPDetails.user_details.USERTYPE);
		},
		error : function(request,error){
			console.log(request);
		}
	});

	$.ajax({
		type: "GET",
		async: false,
		cache: true,
		contentType: "application/json",
		url: "servlet/HdClientUtilServlet?command=getFilteredViews&module=requests",
		success : function(response) {
			SDPViews = response.show_all_filters.reverse();
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function getRequests(page, filterView){
	$.ajax({
	  type: "POST",
	  contentType: "application/json",
	  url: "api/v3/requests",
	  data: JSON.stringify({
		list_info:{
			row_count: 15,
			start_index: ((page-1) * 15),
			get_total_count: true,
			fields_required: ["id","priority","requester","created_by","is_overdue","group","short_description","status","subject","created_time","on_behalf_of"],
			filter_by: {
				name: filterView
			}
		}
	  }),
	  success : function(response) {
		var responseStatus = response.response_status[0];

		if(responseStatus.status_code != 2000) {
			console.log("API Error - " + responseStatus.status + "(" + responseStatus.status_code + ")");
			return;
		}

		var tableHTML = '';
		var requests = response.requests;
		var listInfo = response.list_info;

		$.each(requests, function(requestIndex, requestData){
			$.each(requestData, function(index, value){
				if(value === null){
					requestData[index] = {
						name:''
					};
				}
			});

			tableHTML += ticketListTemplate(requestData);
		 });

		$("#ticketList").html(tableHTML);

		$('body').tooltip({
		  selector: '.has-tooltip'
		});
	  },
	  error : function(request,error){
		console.log(request);
		}
	});
};

function loadNotes(id){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		async: false,
		url: "api/v3/requests/"+id+"/notes",
		data: JSON.stringify({
			list_info:{
				fields_required: ["id","description","created_by","created_time","show_to_requester"]
			}
		}),
		success : function(response) {
			//console.log(response);
			requestData["notes"] = response.notes;
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function getAllConversations(id){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		async: false,
		url: "api/v3/requests/"+id+"/conversations",
		data: JSON.stringify({
			list_info:{
				sort_field: "sent_time",
				sort_order: "desc",
				start_index: "1"
			}
		}),
		success : function(response) {
			requestData["conversations"] = [];
			response.conversations.forEach(function(conv) {
				getConversationDetails(conv.content_url);
			});
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function getConversationDetails(fetchURL){
	$.ajax({
		type: "GET",
		contentType: "application/json",
		async: false,
		url: fetchURL,
		success : function(response) {
			//console.log(response);
			requestData.conversations.push(response.notification);
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function loadSummary(id){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: "api/v3/requests/"+id+"/summary",
		data: JSON.stringify({
			list_info:{
				fields_required: ["task_completed_count","task_total_count","dependency_count","note_count","link_request_count"]
			}
		}),
		success : function(response) {
			//console.log(response);
		},
		error : function(request,error){
			console.log(request);
		}
	});
}

function userTickets(displayName, userID){

	if(displayName.indexOf(' (') > -1) {
		displayName = displayName.substr(0, displayName.indexOf(' ('));
	}

	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: "api/v3/requests",
		data: JSON.stringify({
			"list_info": {
				"row_count": 10,
				"get_total_count": true,
				"fields_required": ["id","priority","requester","created_by","is_overdue","group","short_description","status","subject","created_time","on_behalf_of","requester.email_id"],
				"search_criteria": [
					{
						"field": "requester.name",
						"condition": "starts with",
						"value": displayName,
					},
					{
						"field": "on_behalf_of.name",
						"condition": "starts with",
						"value": displayName,
						"logical_operator": "or"
					},
					{
						"field": "created_by.name",
						"condition": "starts with",
						"value": displayName,
						"logical_operator": "or"
					},
					{
						"field": "subject",
						"condition": "contains",
						"value": displayName,
						"logical_operator": "or"
					}
				]
			}
		}),
		success: function(response) {
			var responseStatus = response.response_status[0];

			if(responseStatus.status_code != 2000) {
				console.log("API Error - " + responseStatus.status + "(" + responseStatus.status_code + ")");
				return;
			}

			var tableHTML = '';
			var requests = response.requests;
			var listInfo = response.list_info;

			$.each(requests, function(requestIndex, requestData){
				$.each(requestData, function(index, value){
					if(value === null){
						requestData[index] = {
							name:''
						};
					}
				});

				tableHTML += ticketListMiniTemplate(requestData);
			 });

			 $("#"+userID+"_requestList").html(tableHTML);
		},
		error: function(request,error){
			console.log(request);
		}
	});
};

function getRequestData(id){
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: "api/v3/requests/"+id,

		success : function(response) {
			//console.log(response);

			var responseStatus = response.response_status;

			if(responseStatus.status_code != 2000) {
				console.log("API Error - " + responseStatus.status + "(" + responseStatus.status_code + ")");
				return;
			}

			requestData["request"] = response.request;

			if(requestData.request.has_notes){
				loadNotes(id);
			}

			if(requestData.request.has_conversation){
				getAllConversations(id);
			}

			processRequestData();
		},
		error : function(request,error){
			console.log(request);
		}
	});
};

function processRequestData(){
	var mainPost = parseDescriptionHTML(requestData.request.description,requestData.request.id);
	console.log(requestData);

	$("#ticket_mainPost").html(template_mainPost(requestData.request));
	$("#mainPost_"+requestData.request.id).html(mainPost);


	$("#ticket_header").html(template_header(requestData.request));

	var allMessages = [];

	if(requestData.notes) {
		requestData.notes.forEach(function(note) {
			allMessages.push({
				type: "note",
				id: note.id,
				created_time: note.created_time,
				created_by: note.created_by,
				description: parseDescriptionHTML(note.description,note.id),
				show_to_requester: note.show_to_requester
			});
		});
	}

	if(requestData.conversations) {
		requestData.conversations.forEach(function(convo) {
			allMessages.push ({
				type: convo.type,
				id: convo.id,
				created_time: convo.sent_time,
				created_by: convo.from,
				description: parseDescriptionHTML(convo.description,convo.id),
				show_to_requester: convo.show_to_requester,
				has_attachments: convo.has_attachments,
				attachments: convo.attachments,
				sent_to: convo.to,
				sent_cc: convo.cc
			});
		});
	}

	function sortByTime(a, b) {
		return b.created_time.value - a.created_time.value;
	}

	allMessages.sort(sortByTime);
	console.log(allMessages);

	allMessages.forEach(function(message) {
		$("#ticket_messages").append(templateMessage(message));
		$("#"+message.type+"_"+message.id).html(message.description);
	});



	openUserCardModal(getUserID(requestData.request.requester.email_id));

	if(requestData.request.on_behalf_of != null) {
		openUserCardModal(getUserID(requestData.request.requester.email_id));
	}

	if(requestData.request.created_by.email_id != requestData.request.requester.email_id){
		openUserCardModal(getUserID(requestData.request.requester.email_id));
	}
}


