"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class reactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  reactions.init(
    {
      number_of_likes: DataTypes.INTEGER,
      postId: DataTypes.INTEGER,
      reactions: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "Reactions",
      tableName: "reactions",
    }
  );
  return reactions;
};
