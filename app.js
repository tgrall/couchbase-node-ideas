var express = require('express'),
	driver = require('couchbase');

dbConfiguration = {
	"hosts": ["localhost:8091"],
	"bucket": "ideas"
};


driver.connect(dbConfiguration, function(err, cb) {
	if (err) {
		throw (err)
	}


	var app = module.exports = express();
	// Configuration
	app.configure(function() {
		app.use(express.bodyParser());
	});

	function get(req, res, docType) {
		cb.get(req.params.id, function(err, doc, meta) {
			if (doc != null && doc.type) {
				if (doc.type == docType) {
					res.send(doc);
				} else {
					res.send(404);
				}
			} else {
				res.send(404);
			}
		});
	};



	function upsert(req, res, docType) {
		// check if the body contains a know type, if not error
		if (req.body != null && req.body.type == docType) {
			var id = req.body.id;
			if (id == null) {
				// increment the sequence and save the doc
				cb.incr("counter:"+req.body.type, function(err, value, meta) {
					id = req.body.type + ":" + value;
					req.body.id = id;
					cb.set(id, req.body, function(err, meta) {
						res.send(200);
					});
				});
			} else {
				cb.set(id, req.body, function(err, meta) {
					res.send(200);
				});
			}
		} else {
			res.send(403);
		}
	}
	
	
	app.get('/api/results/:id?', function(req, res) {
		var queryParams = {
			stale: false,
			group_level : 3
		};
		if (req.params.id != null) {
			queryParams.startkey = [req.params.id,0];
			queryParams.endkey = [req.params.id,2];
		}

		cb.view("dev_ideas", "votes_by_idea", queryParams, function(err, view) {
			var result = new Array();
			var idx = -1;
			var currentKey = null;
			for (var i = 0; i < view.length; i++) {
				key = view[i].key[0];
				if (currentKey == null || currentKey != key ) {
					idx = idx +1;
					currentKey = key;
					result[idx] = { id : key, title : view[i].key[2], value : 0 };
				} else {
					result[idx].value = view[i].value;
				}
			}
			res.send(result);
		});		
	});
	
	
	// get document
	app.get('/api/:type/:id', function(req, res) {
		if (req.params.type == 'idea' || req.params.type == 'vote' || req.params.type == 'user') {
			get(req, res, req.params.type);
		} else {
			res.send(400);
		}
	});


	// create new document
	app.post('/api/:type', function(req, res) {
		if (req.params.type == 'idea' || req.params.type == 'vote' || req.params.type == 'user') {
			upsert(req, res, req.params.type);
		} else {
			res.send(400);
		}
	});

	
	app.get('/api/idea', function(req, res) {
		cb.view("dev_ideas", "by_title", {
			stale: false
		}, function(err, view) {
			var keys = new Array();
			for (var i = 0; i < view.length; i++) {
				keys.push(view[i].id);
			}
			cb.get(keys, null, function(errs, docs, metas) {
				res.send(docs);
			});
		});		
	});
	
	
	appServer = app.listen(3000, function() {
		console.log("Express server listening on port %d in %s mode", appServer.address().port, app.settings.env);
	});

});
