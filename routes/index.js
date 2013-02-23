/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index',{title:"Couchbase Ideas"});
};

exports.login = function(req, res){
    res.render('login');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};