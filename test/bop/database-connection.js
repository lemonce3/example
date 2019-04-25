const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'mysql',
  host: "my.server.tld",
  port: 9821,
});

exports.User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING
  }
});

exports.Task = sequelize.define('task', {
  id: {
    type: Sequelize.NUMBER,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING
  },
  detail: {
		type: Sequelize.STRING
  }
});