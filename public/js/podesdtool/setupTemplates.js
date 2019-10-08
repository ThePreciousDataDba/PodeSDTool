Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

$.ajax({
	type: "GET",
	dataType: 'html',
	cache:true,
	async:false,
	url: "js/podesdtool/templateSources.html",
	success : function(data) {
		$("#jsHandlebarTemplates").html(data);
	},
	error : function(request,error){
		console.log(request);
	}
});

//user search drop down template - index
var userSearchDD_source = document.getElementById("userSearchDropDown_template").innerHTML;
var userSearchDD_template = Handlebars.compile(userSearchDD_source);

var modalCardTemplateSource = document.getElementById("modalCardTemplate").innerHTML;
var modalCardTemplate = Handlebars.compile(modalCardTemplateSource);

var userCardTemplateSource = document.getElementById("userCardTemplate").innerHTML;
var userCardTemplate = Handlebars.compile(userCardTemplateSource);

var objectListTemplateSource = document.getElementById("objectListTemplate").innerHTML;
var objectListTemplate = Handlebars.compile(objectListTemplateSource);

var template_mainPost_source = document.getElementById("ticketView_mainPost").innerHTML;
var template_mainPost = Handlebars.compile(template_mainPost_source);

var template_header_source = document.getElementById("ticketView_Header").innerHTML;
var template_header = Handlebars.compile(template_header_source);

var ticketListTemplateSource = document.getElementById("ticketListTemplate").innerHTML;
var ticketListTemplate = Handlebars.compile(ticketListTemplateSource);

var ticketListMiniTemplateSource = document.getElementById("ticketListMiniTemplate").innerHTML;
var ticketListMiniTemplate = Handlebars.compile(ticketListMiniTemplateSource);

var viewCategoryTemplateSource = document.getElementById("viewCategoryTemplate").innerHTML;
var viewCategoryTemplate = Handlebars.compile(viewCategoryTemplateSource);

var template_messageSource = document.getElementById("ticketView_messagePost").innerHTML;
var templateMessage = Handlebars.compile(template_messageSource);

var nestItemTemplateSource = document.getElementById("nestItemTemplate").innerHTML;
var nestItemTemplate = Handlebars.compile(nestItemTemplateSource);

