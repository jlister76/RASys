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
    mo = moment().month(),
    thirtyDays = moment().subtract(30,'days'),
    sixtyDays = moment().subtract(60,'days'),
    ninetyDays = moment().subtract(90, 'days'),
    duo =[],
    tribus = [];


  if (mo === 0 || mo === 3 || mo === 6 || mo === 9){
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
              duo.push(i.employee_id);
            }else if (i.date > thirtyDays) { //within 30 days
              tribus.push(i.employee_id);
            }
          });
          acc.forEach((a)=>{
            if(a.date < thirtyDays && a.date >= sixtyDays ){ //more than 30 & not more than 60 days
              duo.push(a.employee_id);
            }else if (i.date > thirtyDays){ //within 30 days
              tribus.push(a.employee_id);
            }
          })
        }
        function createQtlyInstances (r,id){

          app.models.quarterly.create({
            "created_on": moment(),
            "qtr": moment().quarter(),
            "yr": moment().year(),
            "required_count": r,
            "completed_count": 0,
            "requirement_met": 0,
            "met_requirement": null,
            "employee_id": id
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
            let id = e.id,
                r;
              if(isInAry(id,duo)){
                r = 2;
              }else if(isInAry(id,tribus)){
                r = 3;
              }else {
                r =1;
              }

            createQtlyInstances(r,id);

            function isInAry (v,ary){
              return ary.indexOf(v) > -1;
            }

          });
        }


      })
      .catch((err)=>{ console.log("Error.", err)})


  }else{
    console.log("Quarterly requirement is only set in the first month of the quarter. This is the "+ mo + " month of the " + moment().quarter() + " quarter of " + moment().year() +".")
  }


};
