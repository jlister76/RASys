'use strict';

module.exports = (app)=>{
  let ds = app.dataSources.mssqldb,
    modelsAry = [
      'quarterlyStatus',
      'monthlyStatus',
      'employee',
      'injury',
      'vehicle-collision'
    ];
  ds.automigrate(['quarterlyStatus','monthlyStatus']);
  //ds.autoupdate(['employee','quarterly','monthly']);
};
