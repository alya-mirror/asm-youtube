const UserService = require('../endpointsServices/UserService');
const UserSchema = require('../../data-model/User');

class UserController {

  constructor(config, router) {
    this.userService = new UserService(UserSchema);

    this.config = config;
    this.basePath = '/user';

    router.post(this.basePath + "/", this.create.bind(this));

    router.get(this.basePath + "/logout/:id", this.signOut.bind(this));

    router.post(this.basePath + "/login", this.signIn.bind(this));

  }

  signOut(req, res) {
    const method = 'UserController.signOut';
    const path = 'GET ' + this.basePath + '/';
    console.info(method, 'Access to', path);



  }


  create(req, res) {
    const method = 'UserController.create ';
    const path = 'POST ' + this.basePath + '/';
    console.info(method, 'Access to', path);

    const body = req.body;
    const firstName = body.firstName;
    const email = body.email;
    const password = body.password;

    const newUser = new UserSchema({
      email: email,
      password: password,
      firstName: firstName,
      faceId: ""
    });
    this.userService.insert(newUser).then(() => {
      res.sendStatus(201);
    }).catch((err) => {
      if (err.code == 11000) {
        res.status(400).send('user already exist');
      }
      else {
        res.status(500).send(err);
      }
    });

  };


  signIn(req, res) {
    const method = 'UserController.signIn ';
    const path = 'POST ' + this.basePath + '/';
    console.info(method, 'Access to', path);

    const body = req.body;
    const email = body.email;
    const password = body.password;

    this.userService.signIn(email, password).then(() => {
      res.sendStatus(200);
    }).catch((statusCode) => {
      res.sendStatus(statusCode);
    });
  }
}


module.exports = UserController;