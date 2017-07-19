const co = require('co');
const ba = require('blockapps-rest');
const rest = ba.rest;
const common = ba.common;
const config = common.config;
const util = common.util;
const path = require('path');
const serverPath = './server';
const dapp = require(`${path.join(process.cwd(), serverPath)}/dapp/dapp.js`)(config.contractsPath);
const ProjectState = ba.rest.getEnums(`${config.libPath}/project/contracts/ProjectState.sol`).ProjectState;
const ProjectEvent = ba.rest.getEnums(`${config.libPath}/project/contracts/ProjectEvent.sol`).ProjectEvent;

const projectsController = {
  create: function(req, res) {
    const deploy = req.app.get('deploy');
    const projectArgs = req.body;

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const result = yield dapp.createProject(deploy.admin, AI.subContracts['ProjectManager'], projectArgs);
      util.response.status200(res, {
        project: result,
      });
    }).catch(err => {
      console.log('Create Project Error:', err);
      util.response.status500(res, 'Unable to create project');
    });
  },

  get: function(req, res) {
    const deploy = req.app.get('deploy');
    const projectName = decodeURI(req.params['name']);

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const result = yield dapp.getProject(deploy.admin, AI.subContracts['ProjectManager'], projectName);
      util.response.status200(res, {
        project: result,
      });
    }).catch(err => {
      console.log('Get Projects Error:', err);
      util.response.status500(res, 'Cannot fetch projects');
    });
  },

  list: function(req, res) {
    const deploy = req.app.get('deploy');

    let listCallback, listParam;
    switch (req.query['filter']) {
      case 'buyer':
        listCallback = 'getProjectsByBuyer';
        listParam = req.query['buyer'];
        break;
      case 'state':
        listCallback = 'getProjectsByState';
        listParam = req.query['state'];
        break;
      case 'supplier':
        listCallback = 'getProjectsBySupplier';
        listParam = req.query['supplier'];
        break;
      default:
        listCallback = 'getProjects'
    }

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const projects = yield dapp[listCallback](deploy.admin, AI.subContracts['ProjectManager'], listParam);
      util.response.status200(res, {
        projects: projects,
      });
    }).catch(err => {
      console.log('List Projects Error', err);
      util.response.status500(res, 'Error occurred while trying to list projects');
    });
  },

  bid: function(req, res) {
    const deploy = req.app.get('deploy');

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const bid = yield dapp.createBid(deploy.admin, AI.subContracts['ProjectManager'],
        req.params.name,
        req.body.supplier,
        req.body.amount);
      util.response.status200(res, {
        bid: bid,
      });
    }).catch(err => {
      console.log('Bid Error:', err);
      util.response.status500(res, 'Error occurred while trying to submit bid');
    });
  },

  getBids: function(req, res) {
    const deploy = req.app.get('deploy');

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const bids = yield dapp.getBids(deploy.admin, AI, req.params.name);
      util.response.status200(res, {
        bids: bids,
      });
    }).catch(err => {
      console.log('Get Bids Error:', err);
      util.response.status500(res, 'Error occurred while trying to fetch bids');
    });

    // dapp.setScope()
    //   .then(dapp.setAdmin(deploy.adminName, deploy.adminPassword, deploy.AdminInterface.address, deploy.adminAddress))
    //   .then(dapp.getBids(deploy.adminName, req.params.name))
    //   .then(scope => {
    //     util.response.status200(res, {
    //       bids: scope.result
    //     })
    //   })
    //   .catch(err => {
    //     console.log('Get Bids Error:', err);
    //     util.response.status500(res, 'Error occurred while trying to fetch bids');
    //   })
  },

// <<<<<<< HEAD
//   acceptBid: function(req, res) {
//     const deploy = req.app.get('deploy');
//     const username = req.body.username;
//     // TODO: password should ideally be supplied by the user
//     dapp.setScope()
//       .then(dapp.setAdmin(deploy.adminName, deploy.adminPassword, deploy.AdminInterface.address, deploy.adminAddress))
//       .then(function(scope){
//         scope.users[username] = {
//           password: deploy.users.filter(function(user) {
//             return user.username === username;
//           })[0].password
//         };
//         return scope;
//       })
//       .then(
//         dapp.acceptBid(
//           deploy.adminName,
//           username,
//           req.params.id,
//           req.params.name
//         )
//       )
//       .then(scope => {
//         util.response.status200(res, {
//           bid: scope.result
//         })
//       })
//       .catch(err => {
//         util.response.status500(res, err);
//       })
//   },
//
// =======
// >>>>>>> develop
  handleEvent: function(req, res) {
    const deploy = req.app.get('deploy');
    const username = req.body.username;

    co(function* () {
      const AI = yield dapp.getAdminInterface(deploy.AdminInterface.address);
      const object = {
        password: deploy.users.filter(function(user) {
          return user.username === username;
        })[0].password
      };

      const args = {
        projectEvent: req.body.projectEvent,
        projectName: req.params.name,
        username : req.body.username,
        password: object.password,
      };

      if(req.body.projectEvent == ProjectEvent.ACCEPT) {
        args.bidId = req.body.bidId;
      }

      const result = yield dapp.handleEvent(deploy.admin, AI, args);
      // got it
      util.response.status200(res, {
        bid: result,
        state: result,
      });
    }).catch(err => {
      console.log('Handle Event Error:', err);
      util.response.status500(res, 'Error while trying to submit event');
    });
    //
    //
    //
    // dapp.setScope()
    //   .then(dapp.setAdmin(deploy.adminName, deploy.adminPassword, deploy.AdminInterface.address))
    //   .then(function(scope){
    //     scope.users[username] = {
    //       password: deploy.users.filter(function(user) {
    //         return user.username === username;
    //       })[0].password
    //     };
    //     return scope;
    //   })
    //
    //   // .then(
    //   //   dapp.handleEvent(
    //   //     deploy.adminName,
    //   //     req.params.name,
    //   //     req.body.projectEvent,
    //   //     req.body.username,
    //   //     deploy.users.filter(function(user){
    //   //       return user.username == username;
    //   //     })[0].password
    //   //   )
    //
    //   .then(function(scope) {
    //     const args = {
    //       projectEvent: req.body.projectEvent,
    //       name: req.params.name,
    //       username : req.body.username
    //     }
    //
    //     if(req.body.projectEvent == ProjectEvent.ACCEPT) {
    //       args.bidId = req.body.bidId;
    //     }
    //
    //     return dapp.handleEvent(
    //       deploy.adminName,
    //       args
    //     )(scope);
    //   })
    //   .then(scope => {
    //     util.response.status200(res, {
    //       bid: scope.result
    //     })
    //   })
    //   .catch(err => {
    //     console.log('Handle Event Error:', err);
    //     util.response.status500(res, 'Error while trying to submit event');
    //   })
  },

};

module.exports = projectsController;
