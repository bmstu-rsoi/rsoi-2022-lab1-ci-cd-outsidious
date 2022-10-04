const express = require("express");
const pg = require("pg");

const app = express();
const conString =
  process.env.DATABASE_URL ||
  "postgres://zrnbftzzkkxdnk:ca64f3e6bbe7722050974df2dba7c614a328d9171ce01801c8302e71f83a123d@ec2-52-212-228-71.eu-west-1.compute.amazonaws.com:5432/dbp66bf0s5o43f";

const client = new pg.Client({
  connectionString: conString,
  ssl: {
    rejectUnauthorized: false,
  },
});
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
      res.status(200).json(dbRes.rows[0]);
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
    const dbQuery = `INSERT INTO persons(id, name, age, address, work) VALUES (DEFAULT, '${name}', ${age}, '${address}', '${work}') RETURNING id;`;
    client.query(dbQuery, (err, dbRes) => {
      if (err) res.status(400).json(null);
      else
        res
          .status(201)
          .header("Location", `/api/v1/persons/${dbRes.rows[0].id}`)
          .json("");
    });
  });
});

app.patch(`${baseUrl}/persons/:id`, (req, res) => {
  const id = req.params.id;
  loadBody(req, function (body) {
    const { name, age, address, work } = JSON.parse(body);
    let flag = false;
    let dbQuery = `UPDATE persons SET `;
    if (name) {
      dbQuery += (flag ? ", " : "") + `name='${name}'`;
      flag = true;
    }
    if (age) {
      dbQuery += (flag ? ", " : "") + `age='${age}'`;
      flag = true;
    }
    if (address) {
      dbQuery += (flag ? ", " : "") + `address='${address}'`;
      flag = true;
    }
    if (work) {
      dbQuery += (flag ? ", " : "") + `work='${work}'`;
      flag = true;
    }
    dbQuery += ` WHERE id=${id} RETURNING *;`;
    console.log(dbQuery);
    if (flag) {
      client.query(dbQuery, (err, dbRes) => {
        if (err) res.status(400).json(null);
        else res.status(200).json(dbRes.rows[0]);
      });
    } else {
      res.status(400).json(null);
    }
  });
});

app.delete(`${baseUrl}/persons/:id`, (req, res) => {
  const id = req.params.id;
  const dbQuery = `DELETE FROM persons where id=${id};`;
  client.query(dbQuery, (err, dbRes) => {
    res.status(204).json(null);
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log("App was started");
});
