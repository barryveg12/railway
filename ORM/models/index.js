'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      connectTimeout: 60000
    }
  });
} else if (process.env.MYSQLHOST || process.env.DB_HOST) {
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  const username = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway';

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      connectTimeout: 60000
    }
  });
} else if (config && config.use_env_variable && process.env[config.use_env_variable]) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else if (config) {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
} else {
  sequelize = new Sequelize('biblioteca', 'root', '1234', {
    host: '127.0.0.1',
    dialect: 'mysql'
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
