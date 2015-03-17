// user.js
// User model logic.

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);
var bcrypt   = require('bcrypt-nodejs');

// private constructor:

var User = module.exports = function User(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

Object.defineProperty(User.prototype, 'id', {
    get: function () { return this._node._id; }
});

Object.defineProperty(User.prototype, 'name', {
    get: function () {
        return this._node.properties['name'];
    }
});

// public instance methods:

User.prototype.save = function (data, callback) {
    var qp = {
        query: [
            'MATCH (user:User)',
            'WHERE id(user) = {userId}',
            'SET user.name = {userName}',
            'RETURN user',
        ].join('\n'),
        params: {
            userId: data.id,
            userName: data.name
        }
    }

    db.cypher(qp, function (err) {
        callback(err);
    });
};

User.prototype.del = function (callback) {
    // use a Cypher query to delete both this user and his/her following
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var qp = {
        query: [
            'MATCH (user:User)',
            'WHERE ID(user) = {userId}',
            'DELETE user',
            'WITH user',
            'MATCH (user) -[rel:follows]- (other)',
            'DELETE rel',
        ].join('\n'),
        params: {
            userId: this.id
        }
    }

    db.cypher(qp, function (err) {
        callback(err);
    });
};

User.prototype.follow = function (other, callback) {
    var qp = {
        query: [
            'MATCH (user:User),(other:User)',
            'WHERE ID(user) = {userId} AND ID(other) = {otherId}',
            'CREATE (user)-[rel:follows]->(other)',
            'RETURN rel'
        ].join('\n'),
        params: {
            userId: this.id,
            otherId: other.id
        }
    }

    db.cypher(qp, function (err) {
        callback(err);
    });
};

User.prototype.unfollow = function (other, callback) {
    var qp = {
        query: [
            'MATCH (user:User) -[rel:follows]-> (other:User)',
            'WHERE ID(user) = {userId} AND ID(other) = {otherId}',
            'DELETE rel',
        ].join('\n'),
        params: {
            userId: this.id,
            otherId: other.id
        }
    }

    db.cypher(qp, function (err) {
        callback(err);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// users this user follows, and others is all other users minus him/herself.
User.prototype.getFollowingAndOthers = function (callback) {
    // query all users and whether we follow each one or not:
    var qp = {
        query: [
            'MATCH (user:User), (other:User)',
            'OPTIONAL MATCH (user) -[rel:follows]-> (other)',
            'WHERE ID(user) = {userId}',
            'RETURN other, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
        ].join('\n'),
        params: {
            userId: this.id
        }
    }

    var user = this;
    db.cypher(qp, function (err, results) {
        if (err) return callback(err);

        var following = [];
        var others = [];

        for (var i = 0; i < results.length; i++) {
            var other = new User(results[i]['other']);
            var follows = results[i]['COUNT(rel)'];

            if (user.id === other.id) {
                continue;
            } else if (follows) {
                following.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, following, others);
    });
};

// static methods:

User.get = function (id, callback) {
    console.log('User.get id: ' + id);
    var qp = {
        query: [
            'MATCH (user:User)',
            'WHERE ID(user) = {userId}',
            'RETURN user',
        ].join('\n'),
        params: {
            userId: parseInt(id)
        }
    }

    db.cypher(qp, function (err, result) {
        console.log(result);
        if (err) return callback(err);
        //var user = new User(result[0]['user']);
        callback(null, result[0]['user']);
    });
};

User.getBy = function (field, value, callback) {
    console.log('User.getBy field:' + field + ' value: ' + value);
    console.log(value);
    var qp = {
        query: [
            'MATCH (user:User)',
            'WHERE user.email = {value}',
            'RETURN user',
        ].join('\n'),
        params: {
            field: field,
            value: value
        }
    }

    db.cypher(qp, function (err, result) {
        console.log('result: ');
        console.log(result);
        if (err) return callback(err);
        if (!result[0]) {
            callback(null, null);
        } else {
            var user = new User(result[0]['user']);
            console.log('user: ');
            console.log(user);
            callback(null, user);
        }
    });
}

User.getAll = function (callback) {
    var qp = {
        query: [
            'MATCH (user:User)',
            'RETURN user',
        ].join('\n')
    }

    db.cypher(qp, function (err, results) {
        if (err) return callback(err);
        var users = results.map(function (result) {
            return new User(result['user']);
        });
        callback(null, users);
    });
}

// creates the user and persists (saves) it to the db, incl. indexing it:
User.create = function (data, callback) {
    console.log('User.create');
    // construct a new instance of our class with the data, so it can
    // validate and extend it, etc., if we choose to do that in the future:
    //var node = db.createNode(data);
    //var user = new User(node);

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var qp = {
        query: [
            'CREATE (user:User {data})',
            'RETURN user',
        ].join('\n'),
        params: {
            data: data
        }
    }

    db.cypher(qp, function (err, results) {
        if (err) return callback(err);
        console.log('results');
        console.log(results);
        console.log('results[0][user]');
        console.log(results[0]['user']);
        //var user = new User(results[0]['user']);
        callback(null, results[0]['user']);
    });
};

// generating a hash
User.generateHash = function(password, next) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null, next);
};

// checking if password is valid
User.validPassword = function(password, pass, next) {
    return bcrypt.compareSync(password, pass, next);
};
