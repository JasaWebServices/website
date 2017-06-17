var loc = window.location;
var retro = window.XDomainRequest && !window.atob;
var namespace = '.w-form';
var emailField = /e(-)?mail/i;
var emailValue = /^\S+@\S+$/;
var chimpRegex = /list-manage[1-9]?.com/i;

var disconnected = function() {
  __.dialogs.alert('Oops! This page has improperly configured forms. Please contact your website administrator to fix this issue.');
}

// Reset data common to all submit handlers
function reset(self) {
  var btn = self.btn = self.el.querySelector('[type="submit"]');
  self.success = false;
  btn.disabled=false
  self.label && (btn.textContent=self.label)
}

// Disable submit button
function disableBtn(self) {
  var btn = self.btn;
  btn.disabled=true
  // Show wait text and store previous label
  var wait = self.deps.wait
  if (wait) {
	self.label = btn.textContent;
	btn.textContent=wait;
  }
}

// Find form fields, validate, and set value pairs
function findFields(form, result) {
  var status = null;
  result = result || {};

  // The ":input" selector is a jQuery shortcut to select all inputs, selects, textareas
  form.querySelectorAll('select,textarea,button:not([type="submit"]),input:not([type="submit"])').forEach(function(field, i) {
	var name = field.dataset.name || field.name || ('Field ' + (i + 1));
	var value = field.value;

	switch(field.type){
	case 'checkbox':
		value=field.isChecked
		break
	case 'radio':
	  // Radio group value already processed
	  if (result[name] === null || typeof result[name] === 'string') {
		return;
	  }

	  value = form.querySelector('input[name="' + field.name + '"]:checked').val() || null;
	  break
	}

	if (typeof value === 'string') value = value.trim()
	result[name] = value;
	status = status || getStatus(field, field.type, name, value);
  });

  return status;
}

function getStatus(field, type, name, value) {
  var status = null;

  if (type === 'password') {
	status = 'Passwords cannot be submitted.';
  } else if (field.required) {
	if (!value) {
	  status = 'Please fill out the required field: ' + name;
	} else if (emailField.test(name) || emailField.test(type)) {
	  if (!emailValue.test(value)) status = 'Please enter a valid email address for: ' + name;
	}
  }

  return status;
}

// Submit form to Custom site
function submitCustom() {
	reset(this);

	preventDefault(this);

	var payload={}
  var status = findFields(this.form, payload);
  if (status) return __.dialogs.alert(status);

	// Disable submit button
	disableBtn(this);
var self=this
	// {'Content-Type':'application/x-www-form-urlencoded'}
	__.ajax('POST',this.form.action,__.querystring(payload),{headers:{'Content-Type':'application/x-www-form-urlencoded'}}, function(err,code){
		if (4 !== code) return
		self.success=!err
		afterSubmit(self)
	})
}

// Submit form to Webflow
function submitWebflow() {
  reset(this);

  var form = this.form;
  var payload = {
	name: form.dataset.name || form.name || 'Untitled Form',
	source: loc.href,
	fields: {},
	dolphin: /pass[\s-_]?(word|code)|secret|login|credentials/i.test(form.html())
  };

  preventDefault(this);

  // Find & populate all fields
  var status = findFields(form, payload.fields);
  if (status) return __.dialogs.alert(status);

  // Disable submit button
  disableBtn(this);

  // Read site ID
  // NOTE: If this site is exported, the HTML tag must retain the data-wf-site attribute for forms to work
  if (!this.deps.siteId) { afterSubmit(this); return; }
  var url = "https://webflow.com" + '/api/v1/form/' + this.deps.siteId;

  // Work around same-protocol IE XDR limitation - without this IE9 and below forms won't submit
  if (retro && url.indexOf("https://webflow.com") >= 0) {
	url = url.replace("https://webflow.com", "http://formdata.webflow.com");
  }
var self=this
	__.ajax('POST',url,payload,{'data-type':'application/json'}, function(err,code){
		if (4 !== code) return
		self.success=!err
		afterSubmit(self)
	})
}

// Submit form to MailChimp
function submitMailChimp() {
  reset(this);

  var form = this.form;
  var payload = {};

  // Skip Ajax submission if http/s mismatch, fallback to POST instead
  if (/^https/.test(loc.href) && !/^https/.test(this.action)) {
	form.attr('method', 'post');
	return;
  }

  preventDefault(this);

  // Find & populate all fields
  var status = findFields(form, payload);
  if (status) return alert(status);

  // Disable submit button
  disableBtn(this);

  // Use special format for MailChimp params
  var fullName;
  _.each(payload, function(value, key) {
	if (emailField.test(key)) payload.EMAIL = value;
	if (/^((full[ _-]?)?name)$/i.test(key)) fullName = value;
	if (/^(first[ _-]?name)$/i.test(key)) payload.FNAME = value;
	if (/^(last[ _-]?name)$/i.test(key)) payload.LNAME = value;
  });

  if (fullName && !payload.FNAME) {
	fullName = fullName.split(' ');
	payload.FNAME = fullName[0];
	payload.LNAME = payload.LNAME || fullName[1];
  }

  // Use the (undocumented) MailChimp jsonp api
  var url = this.form.action.replace('/post?', '/post-json?') + '&c=?';
  // Add special param to prevent bot signups
  var userId = url.indexOf('u=') + 2;
  userId = url.substring(userId, url.indexOf('&', userId));
  var listId = url.indexOf('id=') + 3;
  listId = url.substring(listId, url.indexOf('&', listId));
  payload['b_' + userId + '_' + listId] = '';
var self=this
	__.ajax('POST',url,payload,{'data-type':'application/json'}, function(err,code,json){
		if (4 !== code) return
		if (!err){
			try{var resp=JSON.parse(json)}
			catch(ex){}
		}
		self.success = !err && (resp.result === 'success' || /already/.test(resp.msg));
		if (!self.success) console.info('MailChimp error: ' + resp.msg);
		afterSubmit(self);
	})
}

function showhide(el,show){
	if (show) return el.style.display='block'
	el.style.display='none'
}

// Common callback which runs after all Ajax submissions
function afterSubmit(self) {
  var redirect = self.redirect;
  var success = self.success;

  // Redirect to a success url if defined
  if (success && redirect) {
	Webflow.location(redirect);
	return;
  }

  // Show or hide status divs
  showhide(self.done,success)
  showhide(self.fail,!success)

  // Hide form on success
  showhide(self.form,!success)

  // Reset data and enable submit button
  reset(self);
}

function preventDefault(self) {
  self.evt && self.evt.preventDefault();
  self.evt = null;
}

return {
	deps:{
		siteId:'text',
		redirect:'text',
		wait:['text','Please wait...']
	},
	create(deps,params){
		this.super.create.call(this, deps, params)

		reset(this)
		var wrap = this.el.querySelector('div.w-form');
		this.form = wrap.querySelector('.form');
		this.done = wrap.querySelector('.w-form-done');
		this.fail = wrap.querySelector('.w-form-fail');

		var action = this.action = this.form.getAttribute('action');
		this.handler = null;
		this.redirect = deps.redirect

		// MailChimp form
		if (chimpRegex.test(action)) return this.handler = submitMailChimp

		// Custom form action
		if (action) return this.handler = submitCustom

		// Webflow form
		if (deps.siteId) return this.handler = submitWebflow

		// Alert for disconnected Webflow forms
		disconnected();
	},
	events:{
		'submit form':function(e, target){
			if (this.handler){
				this.evt=e
				this.handler()
			}
		}
	}
}
