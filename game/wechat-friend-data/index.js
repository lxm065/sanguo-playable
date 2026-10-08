'use strict';
const {createController}=require('./rank-controller.js');
createController(wx,wx.getSharedCanvas(),require('./config.js'));
