var DataTypes = require("sequelize").DataTypes;
var _message = require("./message");

function initModels(sequelize) {
  var message = _message(sequelize, DataTypes);


  return {
    message,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
