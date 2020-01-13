var inq = require("inquirer");
var mysql = require("mysql");
var conTab = require("console.table");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "i guess it really is mySQL",
    database: "company_db"
});

function missionSelect() {
    inq.prompt({
        type: "rawlist",
        name: "stage",
        message: "Welcome to the CompanyName archive, what would you like to do?",
        choices: ["Add to archive", "View archived information", "Update employee roles", "Remove company asset"]
    }).then(reason => {
        if (reason.stage === "Add to archive") {
            addition();
        }
        else if (reason.stage === "View archived information") {
            display();
        }
        else if (reason.stage === "Update employee roles") {
            update();
        }
        else {
            subtract();
        }
    });
}

missionSelect();

function addition() {
    inq.prompt({
        type: "list",
        name: "table",
        message: "Create a new:",
        choices: ["department", "role", "employee"]
    }).then(datum => {
        if (datum.table === "department") {
            var newDep;
            inq.prompt({
                type: "input",
                name: "name",
                message: "Name of the new department?"
            }).then(info => {
                newDep = info.name;
            })
            // rewrite this to connect.query inside the .then, will save space later
            connection.query("INSERT INTO department SET ?", {
                name: newDep
            }, (err, res) => {
                if (err) throw err;
                console.log(`New department "${depName}" created.`)
                missionSelect();
            })
        }
        else if (datum.table === "role") {
            inq.prompt([{
                type: "input",
                name: "pos",
                message: "Name of the new position:"
            },
            {
                type: "number",
                name: "sal",
                message: "Base salary:"
            },
            {
                type: "number",
                name: "dep",
                message: "ID of department:"
            }]).then(info => {
                connection.query("INSERT INTO role SET ?", {
                    position: info.pos,
                    salary: info.sal,
                    department_id: info.dep
                }, (err, res) => {
                    if (err) throw err;
                    console.log(`new position "${info.pos}" created.`);
                    missionSelect();
                });
            });
        }
        else if (datum.table === "employee") {
            inq.prompt([{
                type: "input",
                name: "F",
                message: "Employee's first name:"
            },
            {
                type: "input",
                name: "L",
                message: "Employee's last name:"
            }, {
                type: "number",
                name: "job",
                message: "Employee's role ID:"
            }, {
                type: "number",
                name: "boss",
                message: "Employee's manager's ID:"
            }]).then(data => {
                connection.query("INSERT INTO employees SET ?",
                    {
                        first_name: data.F,
                        last_name: data.L,
                        role_id: data.job,
                        manager_id: data.boss,
                    }, (err, res) => {
                        if (err) throw err;
                        console.log(`New employee record "${data.F} ${data.L}" created`);
                        missionSelect();
                    })
            })
        }
    });

}

function display() {
    inq.prompt({
        type: "rawlist",
        name: "show",
        message: "What would you like to see?",
        choices: ["Employee records", "Departments", "Roles"]
    }).then(info => {
        if (info.show === "Employee records") {
            var query = "SELECT employees.id, employees.first_name, employees.last_name, role.position, role.salary ";
            query += "FROM employees INNER JOIN role ON (employees.role_id = role.id)";
            connection.query(query, (err, res) => {
                if (err) throw err;
                console.table(res);
            });
            missionSelect();
        }
        else if (info.show === "Departments") {
            connection.query("SELECT * FROM department", (err, res)=>{
                if (err) throw err;
                console.table(res);
            });
        }
        else if (info.show === "Roles") {
            var query = "SELECT role.position, department.department FROM role ";
            query += "INNER JOIN department ON (department.id = role.department_id)";
            connection.query(query, (err, res)=>{
                if (err) throw err;
                console.table(res);
            })
        }
    })
}

function update() {

}

function subtract() {

}

