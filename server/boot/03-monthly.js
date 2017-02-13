'use strict';
const moment = require('moment'),
  _ = require('lodash');
module.exports = (app)=> {
  /*
   * The `app` object provides access to a letiety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */
  let empl = app.models.Employee,
    i = app.models.Injury,
    v = app.models.VehicleCollision,
    mo = moment().month(),
    ninetyDays = moment().subtract(90, 'days'),
    mthly = [],
    status;

  Promise.all([
    empl.find(), //return all employees
    i.find({"where":{"date":{"gte": ninetyDays}}}), //return all injuries within 90 days
    v.find({"where":{"date":{"gte": ninetyDays}}}) //return all vehicle accidents within 90 days
  ])
    .then((data)=>{
      empl = data[0];
      i = data[1];
      v = data[2];
      //console.log(empl);
      getNewHires(empl);
      getInjuriesAndAccidents(i,v);
      setMthlyStatus(empl,mthly);

      function getNewHires (empl){
        empl.forEach((e)=>{
          console.log(e.id, e.hire_date);
          if (e.hire_date >= ninetyDays){

            mthly.push(e.id);
          }
        })
      }
      function getInjuriesAndAccidents (inj,acc){
        inj.forEach((i)=>{
          mthly.push(i.employeeId)
        });
        acc.forEach((a)=>{
          mthly.push(a.employeeId)
        })
      }
      function createMthlyInstance (s,id,regionId,divisionId,projectId,groupId,qs){
        //console.log("instances ",id, "qtrly ", qs);
        app.models.monthlyStatus.create({
          "created_on": moment(),
          "qtr": moment().quarter(),
          "yr": moment().year(),
          "mo": moment().month(),
          "status": s,
          "met_requirement": null,
          "employeeId": id,
          "regionId": regionId,
          "divisionId": divisionId,
          "projectId": projectId,
          "groupId": groupId,
          "riskAssessmentId": null,
          "quarterlyStatusId": qs
        })
          .then((o)=>{
            //console.log(o);
          })
          .catch((err)=>{
            console.log(err);
          })

      }
      function setMthlyStatus(empl,mthly){

        empl.forEach((e)=>{
          app.models.quarterlyStatus.findOne({"where": {"employeeId": e.id,"yr":moment().year(),"qtr":moment().quarter()}})
            .then((qs)=>{
            /*
            * Employees are set to complete once the quarterly requirement has been met.
            * Otherwise, monthly employees or quarterly employees in the third month are required.
            * Quarterly employees in the first and second month are set to optional.
            */
              if(isInAry(e.id,mthly)){
                status = "required";
              }else if(mo === 0 || mo === 3 || mo === 6 || mo === 9 && !isInAry(e.id,mthly)){
                status = "optional";
              }else if(mo === 1 || mo === 4 || mo === 7 || mo === 10 && !isInAry(e.id,mthly) && !qs.requirement_met){
                status = "optional";
              }else if(mo === 1 || mo === 4 || mo === 7 || mo === 10 && !isInAry(e.id,mthly) && qs.requirement_met){
                status = "complete";
              }else if(mo === 2 || mo === 5 || mo === 8 || mo === 11 && !isInAry(e.id,mthly) && !qs.requirement_met){
                status = "required";
              }else if(mo === 2 || mo === 5 || mo === 8 || mo === 11 && !isInAry(e.id,mthly) && qs.requirement_met){
                status = "complete";
              }
              //console.log("creating instance ", e.id, "qtrly id ", qs.id);
              createMthlyInstance(status,e.id,e.regionId,e.divisionId,e.projectId,e.groupId,qs.id);

            })
            .catch((err)=>{console.error(err)});
        });


        function isInAry(v,ary){
          return ary.indexOf(v) > -1;
        }
      }
    })
    .catch(function(err){
      console.error(err);
    })



};
