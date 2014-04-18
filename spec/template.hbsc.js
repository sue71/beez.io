define(['beez'], function(beez) {
  var Handlebars = beez.vendor.Handlebars;
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<button class = \"button\" data-method = \"create\">create</button>\n<button class = \"button\" data-method = \"read\">read</button>\n<button class = \"button\" data-method = \"delete\">delete</button>\n<div id = \"message-area\">\n</div>";
  });
    return templates['template'];});