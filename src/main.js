const express = require("express");
const pg = require("pg");

const app = express();
const conString = "postgres://program:test@localhost:5432/persons";

app.use(function (req, res, next) {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.contentType("application/json");
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new pg.Client(conString);
client.connect();

function loadBody(request, callback) {
  let body = [];
  request
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", () => {
      body = Buffer.concat(body).toString();
      callback(body);
    });
}

const baseUrl = "/api/v1";

app.get(`${baseUrl}/persons/:id`, (req, res) => {
  const id = req.params.id;
  const dbQuery = `SELECT * FROM persons where id=${id};`;
  client.query(dbQuery, (err, dbRes) => {
    if (dbRes.rowCount > 0) {
      res.status(200).json(JSON.stringify(dbRes.rows[0]));
    } else {
      res.status(404).json(null);
    }
  });
});

app.get(`${baseUrl}/persons`, (req, res) => {
  const dbQuery = "SELECT * FROM persons;";
  client.query(dbQuery, (err, dbRes) => {
    res.status(200).json(dbRes.rows);
  });
});

app.post(`${baseUrl}/persons`, (req, res) => {
  loadBody(req, function (body) {
    const { name, age, address, work } = JSON.parse(body);
    const dbQuery = `INSERT INTO persons(id, name, age, address, work) VALUES (DEFAULT, ${name}, ${age}, ${address}, ${work});`;
    client.query(dbQuery, (err, dbRes) => {
      if (err) res.status(400).json(null);
      else res.status(201).json(null);
    });
  });
});

app.patch(`${baseUrl}/persons/:id`, (req, res) => {
  const id = req.params.id;
  loadBody(req, function (body) {
    const { name, age, address, work } = JSON.parse(body);
    const dbQuery = `UPDATE persons SET name=${name}, age=${age}, address=${address}, work=${work}) WHERE id=${id};`;
    client.query(dbQuery, (err, dbRes) => {
      if (err) res.status(400).json(null);
      else res.status(200).json(null);
    });
  });
});

app.delete(`${baseUrl}/persons/:id`, (req, res) => {
  const id = req.params.id;
  const dbQuery = `DELETE FROM persons where id=${id};`;
  client.query(dbQuery, (err, dbRes) => {
    res.status(204).json(null);
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
