const config = require('../../config/config.default');
const SocketServer = require('../utils/SocketServer');
const UserSchema = require('../../data-model/User');
const UserAddonSchema = require('../../data-model/UserAddon');

class RecognitionService {

  initialize(socketIo, awsIotClient) {
    this.awsIotClient = awsIotClient;
    this.mqttCallbacks = {
      "matrix-recognition-train": this.finishedTraining,
      "matrix-recognition-recognize": this.recognize
    };
    this.awsIotClient.onDifferentMessages(this.mqttCallbacks, this);

    this.socketServer = new SocketServer();
    this.socketCallbacks = {"start_training": this.startTraining};
    this.socketServer.connect(socketIo).then(() => {
      this.socketServer.onMessage(this.socketCallbacks, this);
    })
  }

  startTraining(message, caller) {
    try {
      message = message.toString();
      message = JSON.parse(message);
    }
    catch (err) {
      console.log('error in the json format ' + err);
      return;
    }
    let userId = message.data.userId;
    caller.awsIotClient.publish(config.topics.COMMAND_TOPIC, {
      "commandType": "matrix-recognition-train",
      "tag": {"userId": userId}
    }, {}).then(() => {

    }).catch((err) => {
      console.log(err);
    });
  }

  finishedTraining(topic, message, caller) {
    let success = message.success;
    if (topic !== config.topics.DATA_TOPIC || !success) {
      return;
    }
    let userId = message.data.userId;
    let faceId = message.data.faceId;
    UserSchema.findOneAndUpdate({_id: userId}, {$set: {faceId: faceId}}, function (err, user) {
      if (err || !user) {

        console.log(err + userId);
        return;
      }
      let sentMessage = {"data": {"userId": userId}};
      caller.socketServer.emitEvent("finished_training", JSON.stringify(sentMessage)).then(() => {
      });
    });
  }

  recognize(topic, message, caller) {
    let success = message.success;
    if (topic !== config.topics.DATA_TOPIC || !success) {
      return;
    }
    let faceId = message.data.faceId;

    UserSchema.findOne({
      faceId: faceId
    }, function (err, user) {
      if (err || !user) {

        return;
      }
      let userId = user._id;
      UserAddonSchema.find({userId: userId}, function (err, userAddons) {
        if (err) {
          console.log(err);
          return;
        }
        let message = {"data": {"userAddons": userAddons}};
        caller.socketServer.emitEvent("show_addons", JSON.stringify(message)).then(() => {
        });
      })
    });
  }
}

module.exports = RecognitionService;
