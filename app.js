// Default Chrome Extension script
(function(window, document) {
	// Verify if jQuery is defined
	if(!window.jQuery) throw "jQuery is undefined. Please include jQuery framework."
	var $ = window.jQuery, self = this;
	
	self.log = function(txt, type) {
		return console[type || 'info'](txt)
	}
	
	self.log('All is Fine!');
	
}(window, document))