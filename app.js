const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const DbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

//initialize connection between database and server
const InitializeDbandServer = async () => {
  try {
    db = await open({
      filename: DbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`Database Error is ${e.message}`);
  }
};
InitializeDbandServer();

//convert response object of state
const ConvertToObjState = (eachstate) => {
  return {
    stateId: eachstate.state_id,
    stateName: eachstate.state_name,
    population: eachstate.population,
  };
};

//convert response object of District
const ConvertToObjDestrict = (eachstate) => {
  return {
    districtId: eachstate.district_id,
    districtName: eachstate.district_name,
    stateId: eachstate.state_id,
    cases: eachstate.cases,
    cured: eachstate.cured,
    active: eachstate.active,
    deaths: eachstate.deaths,
  };
};

//API1 getting all state
app.get("/states/", async (request, response) => {
  const Query = `SELECT * FROM state`;
  const AllState = await db.all(Query);
  response.send(
    AllState.map((eachstate) => {
      return {
        stateId: eachstate.state_id,
        stateName: eachstate.state_name,
        population: eachstate.population,
      };
    })
  );
});

//API 2 getting state detail on stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const Query = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const StateDetail = await db.get(Query);
  response.send(ConvertToObjState(StateDetail));
});

// API 3 post details on district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const Query = `INSERT INTO district (district_name,state_id,cases,cured, active, deaths)
  values('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;
  const DbResponse = await db.run(Query);
  response.send("District Successfully Added");
});

//API 4 Getting district detail from district id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const Query = `SELECT * FROM district WHERE district_id='${districtId}'`;
  const districtRes = await db.get(Query);
  response.send(ConvertToObjDestrict(districtRes));
});

//API 5 Deleting district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const Query = `DELETE FROM district WHERE district_id=${districtId}`;
  const DBresponse = await db.run(Query);
  response.send("District Removed");
});

//API 6 update on district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const Query = `UPDATE district 
  SET district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'
  WHERE district_id=${districtId}`;
  const DBResponse = await db.run(Query);
  response.send("District Details Updated");
});

//API 7 get Sum of case and all

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const Query = `SELECT 
                SUM(cases),
                SUM(cured),
                SUM(active),
                SUM(deaths)
                FROM district
                WHERE state_id=${stateId}`;
  const Details = await db.get(Query);
  response.send({
    totalCases: Details["SUM(cases)"],
    totalCured: Details["SUM(cured)"],
    totalActive: Details["SUM(active)"],
    totalDeaths: Details["SUM(deaths)"],
  });
});

//API 8 getting details

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const FirstQuery = `SELECT state_id FROM district Where district_id=${districtId}`;
  const GetStateId = await db.get(FirstQuery);
  const StateId = GetStateId.state_id;
  const SecondQuery = `Select state_name from state Where state_id=${StateId}`;
  const GetStateName = await db.get(SecondQuery);
  response.send({
    stateName: GetStateName.state_name,
  });
});

module.exports = app;
