const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API-1 Get all states
const convertDBStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
        SELECT
            *
        FROM
            state;
    `;
  const allStatesArray = await db.all(getAllStatesQuery);
  response.send(
    allStatesArray.map((eachState) =>
      convertDBStateObjectToResponseObject(eachState)
    )
  );
});

//API-2 Get a State
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAStateQuery = `
        SELECT
            *
        FROM
            state
        WHERE
            state_id = ${stateId};
    `;
  const stateQuery = await db.get(getAStateQuery);
  response.send(convertDBStateObjectToResponseObject(stateQuery));
});

//API-3 Add a district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addADistrictQuery = `
        INSERT INTO
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES (
            "${districtName}",
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );
    `;
  const addDistrict = await db.run(addADistrictQuery);
  const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});

//API-4 Get a district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getADistrictQuery = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id = ${districtId};
    `;
  const districtDetails = await db.get(getADistrictQuery);
  response.send({
    districtId: districtDetails.district_id,
    districtName: districtDetails.district_name,
    stateId: districtDetails.state_id,
    cases: districtDetails.cases,
    cured: districtDetails.cured,
    active: districtDetails.active,
    deaths: districtDetails.deaths,
  });
});

//API-5 Delete a district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteADistrict = `
        DELETE
        FROM
            district
        WHERE
            district_id = ${districtId};
    `;
  await db.run(deleteADistrict);
  response.send("District Removed");
});

//API-6 Update a district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateADistrictQuery = `
        UPDATE
            district
        SET
            district_name = "${districtName}",
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId};
    `;
  await db.run(updateADistrictQuery);
  response.send("District Details Updated");
});

//API-7 Get a state stats
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStats = `
        SELECT
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM
            district
        WHERE
            state_id = ${stateId};
    `;
  const stateStatsArray = await db.get(getStateStats);
  response.send(stateStatsArray);
});

//API-8 Get a State Name By District Id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getAStateName = `
        SELECT
            state_name
        FROM
            state
            JOIN district
            ON state.state_id == district.state_id
        WHERE
            district_id = ${districtId};
    `;
  const stateNameFromDistrict = await db.get(getAStateName);
  response.send({
    stateName: stateNameFromDistrict.state_name,
  });
});

module.exports = app;
