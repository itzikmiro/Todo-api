var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var app = express();
var db = require('./db.js');



var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;



app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

const Op = db.Sequelize.Op;
// GET /todos?comleted=true&q=work
app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};
	console.log(query);
	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		if (process.env.NODE_ENV) {
			where.description =
				//{ [Op.like] : '%' + query.q + '%'};
				{
					$iLike: '%' + query.q + '%'
				};
		} else {
			where.description =
				//{ [Op.like] : '%' + query.q + '%'};
				{
					$like: '%' + query.q + '%'
				};
		}


	}

	console.log(where);
	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send(e);
	});

});


// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function(todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send(e);
	});

});

// POST /todos
app.post('/todos', function(req, res) {

	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.status(400).send(e);
	}).catch(function(e) {
		res.status(400).send(e);
	});
});


// delete 
app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);


	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				"error": "no todo found with that id"
			});
		} else {
			res.status(204).send();
		}
	}, function(e) {
		res.status(500).send(e);
	});

});

// PUT  /todos/:id
app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}
	
	db.todo.findById(todoId).then(function(todo) {
		
		if (todo) {
			return todo.update(attributes).then(function(todo) {
				console.log(todo);
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
});

// POST /users
app.post('/users', function(req, res) {

	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(400).send(e);
	}).catch(function(e) {
		res.status(400).send(e);
	});
});

db.sequelize.sync(/*{force: true}*/).then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + '!');
	});
});