var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);

var database = module.exports = {}

database.getIndexedNodes = function (index, property, value, callback) {
    console.log('hi');
    db.getNodesFromLegacyIndex(index, property, value, function (err, nodes) {
        if (err) return callback(err);
        callback(null, nodes);
    });
};
 
database.getNodeById = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, node);
    });
};

database.queryNodeIndex = function (index, query, callback) {
    db.queryNodeIndex(index, query, function (err, nodes) {
        if (err) return callback(err);
        callback(null, nodes);
    });
};

database.query = function (query, params, callback) {
    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}