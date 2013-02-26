var express = require('express'),
	driver = require('couchbase'),
	routes = require('./routes'),
	appVersion = "1.1"
	;



dbConfiguration = {
	"hosts": ["localhost:8091"],
	"bucket": "ideas"
};


driver.connect(dbConfiguration, function(err, cb) {
	if (err) {
		throw (err)
	}


    function initApplication() {
		console.log("-- Init Application ---")
		cb.get("app.version", function(err, doc, meta) {
			if (!doc || doc.version != appVersion) {
				console.log("\t Installing views for application version "+ appVersion);

				var ddoc = {
					"views": {
						"by_title": {
							"map": "function (doc, meta) { \n"
							+"  if (doc.type == \"idea\") { \n"
							+"    emit(doc.title); \n"
							+"  }\n"
							+"}\n"
						},
						"votes_by_idea" : {
							"map" : "function (doc, meta) { \n"
							+"  switch (doc.type){ \n"
							+"    case \"idea\" : \n"
							+"      emit([meta.id,0, doc.title],0); \n"
							+"      break; \n"
							+"    case \"vote\" : \n"
							+"      emit([doc.idea_id,1], (doc.rating)?doc.rating:2 ); \n"
							+"      break; \n"
							+"  } \n"  
							+"} \n",
							"reduce" : "_sum"
						},
						"votes_details_by_idea" : {
							"map" : "function (doc, meta) { \n"
							+"  if (doc.type == \"vote\") { \n"
							+"    // bad practice to emit the doc \n"
							+"    // use to work around my nodejs 'inexperience' \n"
							+"    emit( doc.idea_id , doc ); \n"
							+"  } \n"
							+"} \n"
						}
					}
				};
				cb.createDesignDoc('test-design', ddoc, function(err, resp, data) { 
					if (err) { 
						console.log(err)
					} else {
						cb.set("app.version",{"type" : "AppVersion", "version" : "1.1"}, function(err, meta) {});
					} 
				});
			}
		});
    }

	initApplication();


	var app = module.exports = express();
	// Configuration
	app.configure(function() {
		app.set('views', __dirname + '/views');
		app.engine('.html', require('ejs').renderFile);
		app.set('view engine', 'html');
		app.set('view options', {
			layout: false
		});
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser());
		app.use(express.session({
			secret: 'cb-community-support'
		}));
		app.use(app.router);
		app.use(express.static(__dirname + '/public'));
	});


	
	// *** routes
	app.get('/', routes.index);
	app.get('/partials/:name', routes.partials);



	// *** API and Couchbase access ****
	
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
				if ( docType != "vote" ) {
					cb.incr("counter:"+req.body.type, function(err, value, meta) {
						id = req.body.type + ":" + value;
						req.body.id = id;
						cb.set(id, req.body, function(err, meta) {
							res.send(200);
						});
					});
				} else {
					id = req.body.type + ":" + req.body.user_id +"-"+ req.body.idea_id;
					req.body.id = id;
					cb.set(id, req.body, function(err, meta) {
						var endureOpts = {
				            persisted: 1,
				            replicated: 0
				        };
						cb.endure(id, endureOpts, function(err, meta) {
							res.send(200);
						});						
					});
				}
				
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
	

	app.get('/api/votes/:id?', function(req, res) {
		var queryParams = {
			stale : false,
			include_docs : true
		};
		if (req.params.id != null) {
		 	queryParams.startkey = req.params.id;
		 	queryParams.endkey = req.params.id +"zz";
		}
		
		cb.view("dev_ideas", "votes_details_by_idea", queryParams, function(err, view) {
			res.send(view);
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

	// Delete vote document
	app.delete('/api/vote/:id', function(req, res) {
		// Todo test the type
       	cb.remove(req.params.id, function (err, meta) {
			res.send(200);
		});
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
