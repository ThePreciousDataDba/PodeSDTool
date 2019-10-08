function urlPM(url) {
  this.search = url.split('?')[1];
  if(!this.search){this.search = ""}
  this.params = {};
  this.search && this.search.split('&').forEach(pair => {
	const split = pair.split('=');
	this.params[split[0]] = split[1];
  });
}

urlPM.prototype.getParam = function (param, defaultVal) {
  if(!this.params[param]){
	  return defaultVal;
  }
  return this.params[param];
}

urlPM.prototype.setParam = function (param, value) {
  if (!param) {
	return this.toSearch();
  }
  delete this.params[param];
  if (!value) {
	return this.toSearch();
  }
  this.params[param] = value;
  return this.toSearch();
}

urlPM.prototype.toSearch = function () {
  if(!Object.keys(this.params).length){
	return '';
  };

  return '?' + Object.keys(this.params)
	.map(param => `${param}=${this.params[param]}`)
	.join('&');
}

urlPM.prototype.load = function () {
	window.history.pushState('Test', 'Title', ('#'+window.location.href.split('#')[1].split('?')[0]+this.toSearch()));
}
