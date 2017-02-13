'use strict';
const moment = require('moment'),
  _ = require('lodash');

module.exports = (app)=>{
  /*
   * The `app` object provides access to a letiety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */
  let empl = app.models.employee,
    i = app.models.injury,
    v = app.models.VehicleCollision,
    currentMonth = moment().format('MMMM'),
    mo = 0,
    thirtyDays = moment().subtract(30,'days'),
    sixtyDays = moment().subtract(60,'days'),
    ninetyDays = moment().subtract(90, 'days'),
    duo =[],
    tribus = [];


  if (mo === 0 || mo === 3 || mo === 6 || mo === 9){//first month of each quarter
    Promise.all([
      empl.find(), //return all employees
      i.find({"where":{"date":{"gte": ninetyDays}}}), //return all injuries within 90 days
      v.find({"where":{"date":{"gte": ninetyDays}}}) //return all vehicle accidents within 90 days
    ])
      .then((data)=> {
        empl = data[0];
        i = data[1];
        v = data[2];

        getNewHires(empl);
        getInjuriesAndAccidents(i,v);
        setRequirement(empl,duo,tribus);


        function getNewHires (empl){
          empl.forEach((e)=>{
            if (e.hire_date <= ninetyDays){
              tribus.push(e.id);
            }
          })
        }
        function getInjuriesAndAccidents (inj,acc){
          inj.forEach((i)=>{
            if(i.date < thirtyDays && i.date >= sixtyDays){ //more than 30 & not more than 60 days
              duo.push(i.employeeId);
            }else if (i.date > thirtyDays) { //within 30 days
              tribus.push(i.employeeId);
            }
          });
          acc.forEach((a)=>{
            if(a.date < thirtyDays && a.date >= sixtyDays ){ //more than 30 & not more than 60 days
              duo.push(a.employeeId);
            }else if (i.date > thirtyDays){ //within 30 days
              tribus.push(a.employeeId);
            }
          })
        }
        function createQtlyInstances (r,id,regionId,divisionId,projectId,groupId){
          //console.log("creating instance ",regionId,divisionId,projectId,groupId);
          app.models.quarterlyStatus.create({
            "created_on": moment(),
            "qtr": moment().quarter(),
            "yr": moment().year(),
            "required_count": r,
            "completed_count": 0,
            "requirement_met": 0,
            "met_requirement": null,
            "employeeId": id,
            "regionId": regionId,
            "divisionId": divisionId,
            "projectId": projectId,
            "groupId": groupId
          })
            .then((o)=>{
              //console.log(o);
            })
            .catch((err)=>{
              console.log(err);
            })

        }
        function setRequirement(empl,duo,tribus){
          /*
          * The required amount of risk assesments is three if an incident occurred
          * in the past 30 days OR if an employee is a new hire. The required amount
          * of risk assessments is set to two if an incident occurred between the past
          * thirty-one and sixty days. Otherwise, the requirement is set to 1.
          */
          empl.forEach((e)=>{
            console.log(e);
            let id = e.id,
              regionId = e.regionId,
              divisionId = e.divisionId,
              projectId = e.projectId,
              groupId = e.groupId,
              r;
              if(isInAry(id,tribus)){
                r = 3;
              }else if(isInAry(id,duo)){
                r = 2;
              }else {
                r = 1;
              }
              console.log(regionId,divisionId,projectId,groupId);
            createQtlyInstances(r,id,regionId,divisionId,projectId,groupId);

            function isInAry (v,ary){
              return ary.indexOf(v) > -1;
            }

          });
        }


      })
      .catch((err)=>{ console.log("Error.", err)})


  }else{
    console.log("Quarterly requirement is only set in the first month of the quarter. We are currently in "+ currentMonth + " of the " + moment().quarter() + " quarter of " + moment().year() +".")
  }


};
