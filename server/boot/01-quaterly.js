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
    ninetyDays = moment().subtract(90, 'days'),
    mthly = [];


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
        setRequirement(empl,mthly);


        function getNewHires (empl){
          empl.forEach(function(e){
            if (e.hire_date <= ninetyDays){
              mthly.push(e.id);
            }
          })
        }
        function getInjuriesAndAccidents (inj,acc){
          inj.forEach((i)=>{
            mthly.push(i.employee_id)
          });
          acc.forEach((a)=>{
            mthly.push(a.employee_id)
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
        function setRequirement(empl,mthly){
          empl.forEach((e)=>{
            let id = e.id,
              r = (isInAry(id,mthly))?3:1;

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
